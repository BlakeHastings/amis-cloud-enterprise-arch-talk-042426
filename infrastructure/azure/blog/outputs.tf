output "blog_url" {
  description = "Sally's Blog — Azure"
  value       = "https://azure-blog.sallyscloud.com"
}

output "cdn_endpoint" {
  description = "Raw Front Door endpoint (usable before DNS propagates)"
  value       = "https://${azurerm_cdn_frontdoor_endpoint.blog.host_name}"
}
