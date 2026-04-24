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
  }
}

# Untagged provider exists only to create the AppRegistry application itself,
# which would otherwise form a cycle with default_tags below.
provider "aws" {
  alias  = "bootstrap"
  region = var.aws_region
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = aws_servicecatalogappregistry_application.shop.application_tag
  }
}

# ── myApplications ────────────────────────────────────────────────────────────
# Groups every resource in this stack under a single Application entry in the
# AWS console. The application_tag is applied to all resources via default_tags.

resource "aws_servicecatalogappregistry_application" "shop" {
  provider    = aws.bootstrap
  name        = "sallys-tech-shop"
  description = "Sally's Tech Shop — VPC + EC2 + RDS MySQL + Route 53"
}

resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name      = "sallys-shop-${random_id.suffix.hex}"
  db_name   = "sallys_shop"
  db_user   = "shopuser"
  repo      = "https://github.com/BlakeHastings/amis-cloud-enterprise-arch-talk-042426.git"
  domain    = "sallyscloud.com"
  subdomain = "shop.sallyscloud.com"
}

# ── Route 53 ─────────────────────────────────────────────────────────────────

data "aws_route53_zone" "main" {
  name = local.domain
}

resource "aws_route53_record" "shop" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.subdomain
  type    = "A"
  ttl     = 300
  records = [aws_eip.web.public_ip]
}

# ── VPC ──────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = local.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = local.name }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = { Name = "${local.name}-public-a" }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
  tags              = { Name = "${local.name}-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
  tags              = { Name = "${local.name}-private-b" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${local.name}-public" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

# ── Security Groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "web" {
  name   = "${local.name}-web"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH (restrict to your IP in production)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "db" {
  name   = "${local.name}-db"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── RDS MySQL ─────────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnet"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_db_instance" "mysql" {
  identifier             = local.name
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = local.db_name
  username               = local.db_user
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  skip_final_snapshot    = true
  deletion_protection    = false
  publicly_accessible    = false

  tags = { Name = local.name }
}

# ── EC2 + Elastic IP ──────────────────────────────────────────────────────────

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_name != "" ? var.key_name : null

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    repo_url    = local.repo
    db_host     = aws_db_instance.mysql.address
    db_user     = local.db_user
    db_password = var.db_password
    db_name     = local.db_name
  }))

  depends_on = [aws_db_instance.mysql]

  tags = { Name = local.name }
}

resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"
  tags     = { Name = local.name }
}
