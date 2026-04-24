output "shop_url" {
  description = "Sally's Tech Shop URL"
  value       = "http://${aws_instance.web.public_ip}"
}

output "ec2_public_ip" {
  value = aws_instance.web.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.mysql.address
}
