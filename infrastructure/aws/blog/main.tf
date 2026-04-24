terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  bucket_name = "sallys-blog-${random_id.suffix.hex}"
  app_dir     = "${path.module}/../../../demos/blog"
  domain      = "sallyscloud.com"
  subdomain   = "blog.sallyscloud.com"
}

# ── Route 53 ─────────────────────────────────────────────────────────────────

data "aws_route53_zone" "main" {
  name = local.domain
}

# ── ACM Certificate ───────────────────────────────────────────────────────────

resource "aws_acm_certificate" "blog" {
  domain_name       = local.subdomain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.blog.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "blog" {
  certificate_arn         = aws_acm_certificate.blog.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# ── S3 ────────────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "blog" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "blog" {
  bucket                  = aws_s3_bucket.blog.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── CloudFront ────────────────────────────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "blog" {
  name                              = "sallys-blog-oac-${random_id.suffix.hex}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "blog" {
  origin {
    domain_name              = aws_s3_bucket.blog.bucket_regional_domain_name
    origin_id                = "s3-${local.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.blog.id
  }

  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  aliases             = [local.subdomain]

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-${local.bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.blog.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

resource "aws_s3_bucket_policy" "blog" {
  bucket = aws_s3_bucket.blog.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFront"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.blog.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.blog.arn }
      }
    }]
  })
}

# ── Route 53 alias → CloudFront ───────────────────────────────────────────────

resource "aws_route53_record" "blog" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.subdomain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.blog.domain_name
    zone_id                = aws_cloudfront_distribution.blog.hosted_zone_id
    evaluate_target_health = false
  }
}

# ── S3 objects ────────────────────────────────────────────────────────────────

resource "aws_s3_object" "index" {
  bucket       = aws_s3_bucket.blog.id
  key          = "index.html"
  source       = "${local.app_dir}/index.html"
  content_type = "text/html"
  etag         = filemd5("${local.app_dir}/index.html")
}

resource "aws_s3_object" "style" {
  bucket       = aws_s3_bucket.blog.id
  key          = "style.css"
  source       = "${local.app_dir}/style.css"
  content_type = "text/css"
  etag         = filemd5("${local.app_dir}/style.css")
}

resource "aws_s3_object" "app_js" {
  bucket       = aws_s3_bucket.blog.id
  key          = "app.js"
  source       = "${local.app_dir}/app.js"
  content_type = "application/javascript"
  etag         = filemd5("${local.app_dir}/app.js")
}

# ── CloudFront invalidation ──────────────────────────────────────────────────
# Fires only when a blog file actually changes

resource "null_resource" "invalidate_cloudfront" {
  triggers = {
    index  = aws_s3_object.index.etag
    style  = aws_s3_object.style.etag
    app_js = aws_s3_object.app_js.etag
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.blog.id} --paths \"/*\""
  }
}
