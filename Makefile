.PHONY: help \
        aws-blog-up aws-blog-down \
        aws-shop-up aws-shop-down \
        azure-blog-up azure-blog-down \
        azure-shop-up azure-shop-down \
        all-up all-down

TF_AWS_BLOG     := infrastructure/aws/blog
TF_AWS_SHOP     := infrastructure/aws/ecommerce
TF_AZURE_BLOG   := infrastructure/azure/blog
TF_AZURE_SHOP   := infrastructure/azure/ecommerce

help:
	@echo ""
	@echo "Sally's Demo – deploy/teardown commands"
	@echo "────────────────────────────────────────────────────────────────"
	@echo "  make aws-blog-up          Deploy blog to AWS (S3 + CloudFront)"
	@echo "  make aws-blog-down        Tear down AWS blog"
	@echo "  make aws-shop-up          Deploy ecommerce to AWS (EC2 + RDS)"
	@echo "  make aws-shop-down        Tear down AWS ecommerce"
	@echo "  make azure-blog-up        Deploy blog to Azure (Storage static)"
	@echo "  make azure-blog-down      Tear down Azure blog"
	@echo "  make azure-shop-up        Deploy ecommerce to Azure (VM + MySQL)"
	@echo "  make azure-shop-down      Tear down Azure ecommerce"
	@echo "  make all-up               Deploy everything"
	@echo "  make all-down             Tear down everything"
	@echo ""
	@echo "Required env vars before running ecommerce stacks:"
	@echo "  AWS:   export TF_VAR_db_password='YourPassword123!'"
	@echo "  Azure: export TF_VAR_admin_password='YourPassword123!'"
	@echo ""

# ── AWS Blog ──────────────────────────────────────────────────────────────────

aws-blog-up:
	cd $(TF_AWS_BLOG) && terraform init -input=false && \
	  terraform apply -target=aws_servicecatalogappregistry_application.blog -auto-approve && \
	  terraform apply -auto-approve && \
	  echo "" && echo "✅  Blog URL: $$(terraform output -raw blog_url)"

aws-blog-down:
	cd $(TF_AWS_BLOG) && terraform destroy -auto-approve

# ── AWS Ecommerce ─────────────────────────────────────────────────────────────

aws-shop-up:
	@test -n "$(TF_VAR_db_password)" || (echo "❌  Set TF_VAR_db_password first" && exit 1)
	cd $(TF_AWS_SHOP) && terraform init -input=false && \
	  terraform apply -target=aws_servicecatalogappregistry_application.shop -auto-approve && \
	  terraform apply -auto-approve && \
	  echo "" && echo "✅  Shop URL: $$(terraform output -raw shop_url)" && \
	  echo "    (allow ~3 min for EC2 user_data to finish bootstrapping)"

aws-shop-down:
	cd $(TF_AWS_SHOP) && terraform destroy -auto-approve

# ── Azure Blog ────────────────────────────────────────────────────────────────

azure-blog-up:
	cd $(TF_AZURE_BLOG) && terraform init -input=false && \
	  terraform apply -auto-approve && \
	  echo "" && echo "✅  Blog URL: $$(terraform output -raw blog_url)"

azure-blog-down:
	cd $(TF_AZURE_BLOG) && terraform destroy -auto-approve

# ── Azure Ecommerce ───────────────────────────────────────────────────────────

azure-shop-up:
	@test -n "$(TF_VAR_admin_password)" || (echo "❌  Set TF_VAR_admin_password first" && exit 1)
	cd $(TF_AZURE_SHOP) && terraform init -input=false && \
	  terraform apply -auto-approve && \
	  echo "" && echo "✅  Shop URL: $$(terraform output -raw shop_url)" && \
	  echo "    (allow ~5 min for VM cloud-init to finish bootstrapping)"

azure-shop-down:
	cd $(TF_AZURE_SHOP) && terraform destroy -auto-approve

# ── Combined ──────────────────────────────────────────────────────────────────

all-up: aws-blog-up azure-blog-up aws-shop-up azure-shop-up

all-down: aws-blog-down azure-blog-down aws-shop-down azure-shop-down
