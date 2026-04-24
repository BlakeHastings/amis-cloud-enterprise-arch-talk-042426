output "shop_url" {
  description = "Sally's Tech Shop URL"
  value       = "http://${azurerm_public_ip.web.ip_address}"
}

output "vm_public_ip" {
  value = azurerm_public_ip.web.ip_address
}

output "mysql_host" {
  value = azurerm_mysql_flexible_server.main.fqdn
}
