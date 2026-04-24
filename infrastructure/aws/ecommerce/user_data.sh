#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log) 2>&1

echo "=== Sally's Ecommerce Bootstrap ==="

# System update + deps
dnf update -y
dnf install -y git nginx

# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# Clone app
git clone ${repo_url} /tmp/sallys-app

# Static frontend → nginx root
mkdir -p /var/www/ecommerce
cp -r /tmp/sallys-app/apps/ecommerce/index.html \
       /tmp/sallys-app/apps/ecommerce/style.css \
       /tmp/sallys-app/apps/ecommerce/app.js \
       /var/www/ecommerce/

# Node backend
mkdir -p /opt/sallys-shop
cp -r /tmp/sallys-app/apps/ecommerce/server/* /opt/sallys-shop/
cd /opt/sallys-shop && npm install --omit=dev

# Environment
cat > /opt/sallys-shop/.env <<'ENVEOF'
DB_HOST=${db_host}
DB_PORT=3306
DB_USER=${db_user}
DB_PASSWORD=${db_password}
DB_NAME=${db_name}
PORT=3000
ENVEOF

# nginx config
cat > /etc/nginx/conf.d/sallys-shop.conf <<'NGINXEOF'
server {
    listen 80 default_server;
    root /var/www/ecommerce;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

rm -f /etc/nginx/conf.d/default.conf

# PM2 for process management
npm install -g pm2
cd /opt/sallys-shop
pm2 start index.js --name sallys-shop
pm2 startup systemd -u root --hp /root
pm2 save

# Enable + start nginx
systemctl enable --now nginx

echo "=== Bootstrap complete ==="
