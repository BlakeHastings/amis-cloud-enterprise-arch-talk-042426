terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "aws" {
  region = "us-east-1"
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  app_dir   = "${path.module}/../../../demos/blog"
  domain    = "sallyscloud.com"
  subdomain = "azure-blog.sallyscloud.com"
}

# ── Route 53 lookup ───────────────────────────────────────────────────────────

data "aws_route53_zone" "main" {
  name = local.domain
}

# ── Resource Group + Storage ──────────────────────────────────────────────────

resource "azurerm_resource_group" "blog" {
  name     = "rg-sallys-blog"
  location = var.location
}

resource "azurerm_storage_account" "blog" {
  name                     = "sallysblog${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.blog.name
  location                 = azurerm_resource_group.blog.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }
}

resource "azurerm_storage_blob" "index" {
  name                   = "index.html"
  storage_account_name   = azurerm_storage_account.blog.name
  storage_container_name = "$web"
  type                   = "Block"
  source                 = "${local.app_dir}/index.html"
  content_type           = "text/html"
  content_md5            = filemd5("${local.app_dir}/index.html")
}

resource "azurerm_storage_blob" "style" {
  name                   = "style.css"
  storage_account_name   = azurerm_storage_account.blog.name
  storage_container_name = "$web"
  type                   = "Block"
  source                 = "${local.app_dir}/style.css"
  content_type           = "text/css"
  content_md5            = filemd5("${local.app_dir}/style.css")
}

resource "azurerm_storage_blob" "app_js" {
  name                   = "app.js"
  storage_account_name   = azurerm_storage_account.blog.name
  storage_container_name = "$web"
  type                   = "Block"
  source                 = "${local.app_dir}/app.js"
  content_type           = "application/javascript"
  content_md5            = filemd5("${local.app_dir}/app.js")
}

# ── Azure Front Door Standard ────────────────────────────────────────────────
# Classic Azure CDN (Microsoft) no longer accepts new profile creation as of
# Sept 2024. Front Door Standard is the modern successor.

resource "azurerm_cdn_frontdoor_profile" "blog" {
  name                = "sallys-blog-fd-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.blog.name
  sku_name            = "Standard_AzureFrontDoor"
}

resource "azurerm_cdn_frontdoor_endpoint" "blog" {
  name                     = "azure-blog-${random_string.suffix.result}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.blog.id
}

resource "azurerm_cdn_frontdoor_origin_group" "blog" {
  name                     = "storage-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.blog.id
  session_affinity_enabled = false

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    path                = "/"
    protocol            = "Https"
    interval_in_seconds = 120
    request_type        = "HEAD"
  }
}

resource "azurerm_cdn_frontdoor_origin" "blog" {
  name                          = "storage-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.blog.id

  enabled                        = true
  host_name                      = azurerm_storage_account.blog.primary_web_host
  origin_host_header             = azurerm_storage_account.blog.primary_web_host
  http_port                      = 80
  https_port                     = 443
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

# ── Custom domain + DNS validation ───────────────────────────────────────────
# Front Door validates ownership via a TXT record at _dnsauth.{subdomain}

resource "azurerm_cdn_frontdoor_custom_domain" "blog" {
  name                     = "azure-blog-${random_string.suffix.result}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.blog.id
  host_name                = local.subdomain

  tls {
    certificate_type    = "ManagedCertificate"
    minimum_tls_version = "TLS12"
  }
}

resource "aws_route53_record" "azure_blog_validation" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "_dnsauth.${local.subdomain}"
  type    = "TXT"
  ttl     = 300
  records = [azurerm_cdn_frontdoor_custom_domain.blog.validation_token]
}

resource "aws_route53_record" "azure_blog" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.subdomain
  type    = "CNAME"
  ttl     = 300
  records = [azurerm_cdn_frontdoor_endpoint.blog.host_name]
}

# ── Route ────────────────────────────────────────────────────────────────────

resource "azurerm_cdn_frontdoor_route" "blog" {
  name                          = "default-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.blog.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.blog.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.blog.id]
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]

  cdn_frontdoor_custom_domain_ids = [azurerm_cdn_frontdoor_custom_domain.blog.id]
  link_to_default_domain          = true

  depends_on = [aws_route53_record.azure_blog_validation]
}

# ── Front Door cache purge ───────────────────────────────────────────────────
# Fires only when a blog file actually changes

resource "null_resource" "purge_azure_cdn" {
  triggers = {
    index  = azurerm_storage_blob.index.content_md5
    style  = azurerm_storage_blob.style.content_md5
    app_js = azurerm_storage_blob.app_js.content_md5
  }

  provisioner "local-exec" {
    command = "az afd endpoint purge --no-wait --resource-group ${azurerm_resource_group.blog.name} --profile-name ${azurerm_cdn_frontdoor_profile.blog.name} --endpoint-name ${azurerm_cdn_frontdoor_endpoint.blog.name} --content-paths /index.html /style.css /app.js"
  }

  depends_on = [azurerm_cdn_frontdoor_route.blog]
}
