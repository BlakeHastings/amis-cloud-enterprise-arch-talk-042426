output "shop_url" {
  description = "Sally's Tech Shop — Azure"
  value       = "http://azure-shop.sallyscloud.com"
}

output "vm_public_ip" {
  description = "VM public IP (usable before DNS propagates)"
  value       = azurerm_public_ip.web.ip_address
}

output "mysql_host" {
  value = azurerm_mysql_flexible_server.main.fqdn
}
