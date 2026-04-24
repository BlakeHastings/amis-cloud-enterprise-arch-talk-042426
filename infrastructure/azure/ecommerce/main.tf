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
  name      = "sallys-shop-${random_string.suffix.result}"
  db_name   = "sallys_shop"
  repo      = "https://github.com/BlakeHastings/amis-cloud-enterprise-arch-talk-042426.git"
  domain    = "sallyscloud.com"
  subdomain = "azure-shop.sallyscloud.com"
}

# ── Route 53 ─────────────────────────────────────────────────────────────────

data "aws_route53_zone" "main" {
  name = local.domain
}

resource "aws_route53_record" "azure_shop" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.subdomain
  type    = "A"
  ttl     = 300
  records = [azurerm_public_ip.web.ip_address]
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "shop" {
  name     = "rg-sallys-shop"
  location = var.location
}

# ── Networking ────────────────────────────────────────────────────────────────

resource "azurerm_virtual_network" "main" {
  name                = "${local.name}-vnet"
  location            = azurerm_resource_group.shop.location
  resource_group_name = azurerm_resource_group.shop.name
  address_space       = ["10.1.0.0/16"]
}

resource "azurerm_subnet" "web" {
  name                 = "web-subnet"
  resource_group_name  = azurerm_resource_group.shop.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.1.0/24"]
}

resource "azurerm_subnet" "db" {
  name                 = "db-subnet"
  resource_group_name  = azurerm_resource_group.shop.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.1.10.0/24"]

  delegation {
    name = "mysql-delegation"
    service_delegation {
      name    = "Microsoft.DBforMySQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_network_security_group" "web" {
  name                = "${local.name}-nsg"
  location            = azurerm_resource_group.shop.location
  resource_group_name = azurerm_resource_group.shop.name

  security_rule {
    name                       = "allow-http"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-ssh"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "web" {
  subnet_id                 = azurerm_subnet.web.id
  network_security_group_id = azurerm_network_security_group.web.id
}

# ── Public IP + NIC ───────────────────────────────────────────────────────────

resource "azurerm_public_ip" "web" {
  name                = "${local.name}-pip"
  location            = azurerm_resource_group.shop.location
  resource_group_name = azurerm_resource_group.shop.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_interface" "web" {
  name                = "${local.name}-nic"
  location            = azurerm_resource_group.shop.location
  resource_group_name = azurerm_resource_group.shop.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.web.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.web.id
  }
}

# ── Azure MySQL Flexible Server ───────────────────────────────────────────────

resource "azurerm_private_dns_zone" "mysql" {
  name                = "sallysshop.mysql.database.azure.com"
  resource_group_name = azurerm_resource_group.shop.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "mysql" {
  name                  = "${local.name}-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.mysql.name
  resource_group_name   = azurerm_resource_group.shop.name
  virtual_network_id    = azurerm_virtual_network.main.id
}

resource "azurerm_mysql_flexible_server" "main" {
  name                   = "${local.name}-mysql"
  resource_group_name    = azurerm_resource_group.shop.name
  location               = azurerm_resource_group.shop.location
  administrator_login    = var.admin_username
  administrator_password = var.admin_password
  sku_name               = "B_Standard_B1ms"
  version                = "8.0.21"

  delegated_subnet_id = azurerm_subnet.db.id
  private_dns_zone_id = azurerm_private_dns_zone.mysql.id

  backup_retention_days = 1

  depends_on = [azurerm_private_dns_zone_virtual_network_link.mysql]
}

resource "azurerm_mysql_flexible_database" "shop" {
  name                = local.db_name
  resource_group_name = azurerm_resource_group.shop.name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}

# ── VM ────────────────────────────────────────────────────────────────────────

resource "azurerm_linux_virtual_machine" "web" {
  name                  = "${local.name}-vm"
  resource_group_name   = azurerm_resource_group.shop.name
  location              = azurerm_resource_group.shop.location
  size                  = "Standard_B1s"
  admin_username        = var.admin_username
  network_interface_ids = [azurerm_network_interface.web.id]

  admin_password                  = var.admin_password
  disable_password_authentication = false

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud_init.yaml", {
    repo_url    = local.repo
    db_host     = azurerm_mysql_flexible_server.main.fqdn
    db_user     = var.admin_username
    db_password = var.admin_password
    db_name     = local.db_name
  }))

  depends_on = [azurerm_mysql_flexible_database.shop]
}
