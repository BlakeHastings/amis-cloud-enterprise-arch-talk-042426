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

# ── Azure CDN ─────────────────────────────────────────────────────────────────

resource "azurerm_cdn_profile" "blog" {
  name                = "sallys-blog-cdn-${random_string.suffix.result}"
  location            = "global"
  resource_group_name = azurerm_resource_group.blog.name
  sku                 = "Standard_Microsoft"
}

resource "azurerm_cdn_endpoint" "blog" {
  name                = "azure-blog-${random_string.suffix.result}"
  profile_name        = azurerm_cdn_profile.blog.name
  location            = "global"
  resource_group_name = azurerm_resource_group.blog.name

  origin_host_header = azurerm_storage_account.blog.primary_web_host

  origin {
    name      = "storage"
    host_name = azurerm_storage_account.blog.primary_web_host
  }
}

# ── Route 53 CNAME → CDN endpoint ────────────────────────────────────────────
# Must exist before Azure can validate the custom domain

resource "aws_route53_record" "azure_blog" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.subdomain
  type    = "CNAME"
  ttl     = 300
  records = ["${azurerm_cdn_endpoint.blog.name}.azureedge.net"]
}

# ── CDN custom domain + managed HTTPS ────────────────────────────────────────

resource "azurerm_cdn_endpoint_custom_domain" "blog" {
  name            = "azure-blog"
  cdn_endpoint_id = azurerm_cdn_endpoint.blog.id
  host_name       = local.subdomain

  cdn_managed_https {
    certificate_type = "Dedicated"
    protocol_type    = "ServerNameIndication"
    tls_version      = "TLS12"
  }

  depends_on = [aws_route53_record.azure_blog]

  timeouts {
    create = "60m"
    update = "60m"
  }
}
