#!/bin/bash

echo "🔒 Setting up SSL for Traefik..."

# Create letsencrypt directory with proper permissions
mkdir -p ./letsencrypt
chmod 600 ./letsencrypt

# Create acme.json file with proper permissions
touch ./letsencrypt/acme.json
chmod 600 ./letsencrypt/acme.json

echo "✅ SSL setup complete!"
echo ""
echo "To use SSL:"
echo "1. Set your domain: export DOMAIN_NAME=your-domain.com"
echo "2. Set your email: export ACME_EMAIL=your-email@domain.com"
echo "3. Run: docker-compose up -d"
echo ""
echo "For AWS EC2, make sure:"
echo "- Security Group allows ports 80 and 443"
echo "- Domain DNS points to your EC2 public IP"