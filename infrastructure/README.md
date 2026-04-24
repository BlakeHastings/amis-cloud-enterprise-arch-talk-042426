# Infrastructure

Terraform code that provisions the demos on AWS and Azure. Each folder is an independent stack you can deploy and tear down independently.

```
infrastructure/
├── aws/
│   ├── blog/        S3 bucket + CloudFront CDN
│   └── ecommerce/   VPC, EC2 instance, RDS MySQL database
└── azure/
    ├── blog/        Storage Account with static website hosting
    └── ecommerce/   Virtual Network, Linux VM, MySQL Flexible Server
```

## Prerequisites
- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- AWS CLI configured (`aws configure`)
- Azure CLI logged in (`az login`)

## Running it

From the repo root:

```bash
# set passwords for the ecommerce stacks (one-time)
export TF_VAR_db_password='YourPassword123!'
export TF_VAR_admin_password='YourPassword123!'

make aws-blog-up        # deploy
make aws-blog-down      # tear down
make aws-shop-up
make azure-blog-up
# etc — run `make help` for the full list
```
