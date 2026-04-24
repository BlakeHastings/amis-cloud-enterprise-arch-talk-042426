variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "db_password" {
  description = "RDS MySQL root password"
  type        = string
  sensitive   = true
}

variable "key_name" {
  description = "EC2 key pair name for SSH access (optional)"
  type        = string
  default     = ""
}
