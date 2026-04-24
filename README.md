# AMIS — Cloud Platform & Enterprise Architecture
**University of Memphis · April 24, 2026**

Two demo apps ("Sally's Blog" and "Sally's Tech Shop") deployable to AWS and Azure on demand.

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.6
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) + credentials
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) + subscription

---

## 1 — Credential Setup

### AWS
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, region (us-east-1), output (json)
```
Verify: `aws sts get-caller-identity`

### Azure
```bash
az login
az account show   # confirm the right subscription is active
```

---

## 2 — Set passwords (ecommerce stacks only)

```bash
# AWS ecommerce (RDS MySQL)
export TF_VAR_db_password='SallyShop2026!'

# Azure ecommerce (VM + MySQL) — must have upper+lower+digit+special, ≥12 chars
export TF_VAR_admin_password='SallyShop2026!'
```

---

## 3 — Deploy & Teardown

```bash
# Individual stacks
make aws-blog-up          # Sally's Blog → S3 + CloudFront
make aws-blog-down

make aws-shop-up          # Sally's Tech Shop → VPC + EC2 + RDS MySQL
make aws-shop-down

make azure-blog-up        # Sally's Blog → Azure Storage static website
make azure-blog-down

make azure-shop-up        # Sally's Tech Shop → VNet + VM + Azure MySQL
make azure-shop-down

# Everything at once
make all-up
make all-down
```

Each `*-up` command prints the live URL when provisioning completes.  
Ecommerce stacks: allow **3–5 minutes** for the VM/EC2 bootstrap to finish after the URL appears.

---

## Architecture

### Blog (static)
| | AWS | Azure |
|---|---|---|
| Storage | S3 | Storage Account (`$web` container) |
| CDN | CloudFront | Primary web endpoint (HTTPS) |
| Cost | ~$0.01/mo | ~$0.01/mo |

### Ecommerce (multi-tier)
| | AWS | Azure |
|---|---|---|
| Network | VPC + public/private subnets | VNet + subnets |
| Compute | EC2 t3.micro (nginx + Node.js) | Ubuntu VM B1s (nginx + Node.js) |
| Database | RDS MySQL 8.0 db.t3.micro | Azure MySQL Flexible Server B1ms |
| Cost (running) | ~$0.03/hr | ~$0.02/hr |

---

## App Overview

| App | Description |
|---|---|
| `apps/blog/` | Sally's personal blog — static HTML/CSS/JS, SPA with hash routing |
| `apps/ecommerce/` | Sally's Tech Shop — product listing, cart, checkout UI + Node.js/Express API |
| `apps/ecommerce/server/` | Express + mysql2 API server; seeds DB on first start |

---

## Repo Structure

```
├── apps/
│   ├── blog/               Static blog (HTML/CSS/JS)
│   └── ecommerce/
│       ├── index.html      Shop frontend
│       ├── style.css
│       ├── app.js
│       └── server/         Node.js API (Express + MySQL)
├── terraform/
│   ├── aws/
│   │   ├── blog/           S3 + CloudFront
│   │   └── ecommerce/      VPC + EC2 + RDS
│   └── azure/
│       ├── blog/           Storage Account static website
│       └── ecommerce/      VNet + VM + MySQL Flexible Server
├── Makefile
└── README.md
```
