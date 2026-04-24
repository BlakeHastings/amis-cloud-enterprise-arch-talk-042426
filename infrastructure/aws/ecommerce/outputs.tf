output "shop_url" {
  description = "Sally's Tech Shop — AWS"
  value       = "http://shop.sallyscloud.com"
}

output "elastic_ip" {
  description = "Elastic IP (usable before DNS propagates)"
  value       = aws_eip.web.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.address
}
