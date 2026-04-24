variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "admin_password" {
  description = "VM and MySQL admin password (min 12 chars, upper+lower+digit+special)"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "VM and MySQL admin username"
  type        = string
  default     = "sallyshop"
}
