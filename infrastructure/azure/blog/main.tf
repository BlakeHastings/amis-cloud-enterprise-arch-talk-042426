terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
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

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  app_dir = "${path.module}/../../../demos/blog"
}

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
