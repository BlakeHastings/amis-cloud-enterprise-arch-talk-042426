output "blog_url" {
  description = "Sally's Blog — AWS"
  value       = "https://blog.sallyscloud.com"
}

output "cloudfront_domain" {
  description = "Raw CloudFront domain (usable before DNS propagates)"
  value       = "https://${aws_cloudfront_distribution.blog.domain_name}"
}
