output "blog_url" {
  description = "Sally's Blog URL (Azure Static Website)"
  value       = azurerm_storage_account.blog.primary_web_endpoint
}

output "storage_account_name" {
  value = azurerm_storage_account.blog.name
}
