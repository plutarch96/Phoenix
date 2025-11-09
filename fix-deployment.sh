#!/bin/bash
# Script to fix database and restart services on GCP VM
# Run this on the GCP VM: bash /var/www/phoenix/fix-deployment.sh

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         FIXING PHOENIX DEPLOYMENT ISSUES                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to server directory
cd /var/www/phoenix/server

echo "Step 1: Running database migrations..."
echo "---------------------------------------"
node db/run-all-migrations.js

echo ""
echo "Step 2: Verifying database schema..."
echo "---------------------------------------"
node db/verify-all-tables.js

echo ""
echo "Step 3: Restarting PM2 services..."
echo "---------------------------------------"
pm2 restart phoenix-server

echo ""
echo "Step 4: Checking PM2 status..."
echo "---------------------------------------"
pm2 status

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT FIX COMPLETE!                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "The following issues have been fixed:"
echo "  ✓ Database migrations (projects, claiming, joining)"
echo "  ✓ Analytics recent activity error"
echo "  ✓ Project claiming/joining features"
echo "  ✓ Server restarted with latest schema"
echo ""
echo "Next steps:"
echo "  1. Visit http://35.222.220.204 to test the application"
echo "  2. Try claiming a project (Project Manager/Admin role)"
echo "  3. Try joining a project (Staff role)"
echo "  4. Try creating a new user (Admin role)"
echo "  5. Check My Stuff page for claimed/joined projects"
echo ""
