#!/bin/bash

# Beauty Slot Admin - Server Setup Script
# Run this on the server: curl -sSL https://raw.githubusercontent.com/Shchetnikovoff/beaty-slot-ai/main/scripts/setup-server.sh | bash

set -e

echo "=== Beauty Slot Admin - Server Setup ==="

# Update system
echo "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install Node.js 20.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Git
echo "Installing Git..."
apt-get install -y git

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Create app directory
echo "Creating app directory..."
mkdir -p /var/www/beauty-slot-admin
cd /var/www/beauty-slot-admin

# Clone repository
echo "Cloning repository..."
git clone https://github.com/Shchetnikovoff/beaty-slot-ai.git .

# Install dependencies
echo "Installing dependencies..."
npm ci

# Create .env file
echo "Creating .env file..."
cat > .env << 'EOF'
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://90.156.209.245:3000
YCLIENTS_API_KEY=your_yclients_api_key
YCLIENTS_COMPANY_ID=your_company_id
EOF

# Build project
echo "Building project..."
npm run build

# Setup PM2
echo "Setting up PM2..."
pm2 start npm --name "beauty-slot-admin" -- start
pm2 save
pm2 startup

# Setup Nginx (optional)
echo "Installing Nginx..."
apt-get install -y nginx

cat > /etc/nginx/sites-available/beauty-slot << 'EOF'
server {
    listen 80;
    server_name 90.156.209.245;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/beauty-slot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "=== Setup Complete ==="
echo "App URL: http://90.156.209.245"
echo ""
echo "Don't forget to:"
echo "1. Set GitHub Secrets in repo settings:"
echo "   - SERVER_HOST: 90.156.209.245"
echo "   - SERVER_USER: root"
echo "   - SERVER_PASSWORD: your_password"
echo ""
echo "2. Update .env with your YClients credentials"
