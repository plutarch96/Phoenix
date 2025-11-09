#!/bin/bash
# Setup frard.com domain on the server

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         SETTING UP FRARD.COM DOMAIN                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

echo "Step 1: Backing up current nginx configuration..."
cp /etc/nginx/sites-available/phoenix /etc/nginx/sites-available/phoenix.backup
echo "  ✓ Backup created at /etc/nginx/sites-available/phoenix.backup"

echo ""
echo "Step 2: Installing new nginx configuration..."
cp /var/www/phoenix/deployment/nginx-domain.conf /etc/nginx/sites-available/phoenix
echo "  ✓ Configuration updated"

echo ""
echo "Step 3: Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "  ✓ Nginx configuration is valid"
else
    echo "  ✗ Nginx configuration has errors"
    echo "  Restoring backup..."
    cp /etc/nginx/sites-available/phoenix.backup /etc/nginx/sites-available/phoenix
    exit 1
fi

echo ""
echo "Step 4: Reloading nginx..."
systemctl reload nginx
echo "  ✓ Nginx reloaded"

echo ""
echo "Step 5: Updating environment variables..."
cd /var/www/phoenix/server

# Update .env file with new CORS origin
if grep -q "CORS_ORIGINS=" .env; then
    sed -i 's|CORS_ORIGINS=.*|CORS_ORIGINS=http://frard.com,https://frard.com,http://www.frard.com,https://www.frard.com,http://35.222.220.204|' .env
    echo "  ✓ CORS_ORIGINS updated"
else
    echo "CORS_ORIGINS=http://frard.com,https://frard.com,http://www.frard.com,https://www.frard.com,http://35.222.220.204" >> .env
    echo "  ✓ CORS_ORIGINS added"
fi

echo ""
echo "Step 6: Restarting PM2 server..."
pm2 restart all
echo "  ✓ Server restarted"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  DOMAIN SETUP COMPLETE!                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Your application is now accessible at:"
echo "  • http://frard.com"
echo "  • http://www.frard.com"
echo "  • http://35.222.220.204 (still works)"
echo ""
echo "Next steps:"
echo "  1. Make sure DNS is configured (A record pointing to 35.222.220.204)"
echo "  2. Wait for DNS propagation (5-30 minutes)"
echo "  3. Test: http://frard.com"
echo "  4. Optional: Set up SSL/HTTPS with Let's Encrypt (recommended)"
echo ""
echo "To set up HTTPS (recommended):"
echo "  sudo certbot --nginx -d frard.com -d www.frard.com"
echo ""
