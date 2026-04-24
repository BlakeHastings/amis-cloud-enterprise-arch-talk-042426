output "blog_url" {
  description = "Sally's Blog — Azure"
  value       = "https://azure-blog.sallyscloud.com"
}

output "cdn_endpoint" {
  description = "Raw CDN endpoint (usable before DNS propagates)"
  value       = "https://${azurerm_cdn_endpoint.blog.name}.azureedge.net"
}
