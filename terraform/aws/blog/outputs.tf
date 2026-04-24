output "blog_url" {
  description = "Sally's Blog URL"
  value       = "https://${aws_cloudfront_distribution.blog.domain_name}"
}

output "s3_bucket" {
  value = aws_s3_bucket.blog.id
}
