# Deploy Latest Changes to frard.com

This guide covers deploying all the recent UI changes to your production server.

## Prerequisites

- GCP VM: `instance-20251109-053443` (IP: 35.222.220.204)
- Domain: frard.com
- Branch: `claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr`

---

## Step 1: SSH into Your Server

```bash
gcloud compute ssh instance-20251109-053443 --zone=us-central1-a
```

---

## Step 2: Navigate to Application Directory

```bash
cd /var/www/phoenix
```

---

## Step 3: Pull Latest Changes

```bash
# Pull the latest code from your branch
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr
```

---

## Step 4: Rebuild React Client

```bash
# Navigate to client directory
cd client

# Install any new dependencies (if needed)
npm install

# Build the production React app
npm run build

# Go back to root directory
cd ..
```

---

## Step 5: Restart PM2 Server

```bash
# Restart the Node.js backend
pm2 restart all

# Check status to ensure it's running
pm2 status

# View logs to check for any errors
pm2 logs --lines 20
```

---

## Step 6: Set Up Domain (frard.com)

### A. Configure DNS at Your Domain Registrar

1. **Log into your domain registrar** (where you purchased frard.com)
2. **Find DNS settings** (usually called "DNS Management" or "DNS Settings")
3. **Add these A records**:

   | Type | Name/Host | Value/Points To | TTL  |
   |------|-----------|----------------|------|
   | A    | @         | 35.222.220.204 | 3600 |
   | A    | www       | 35.222.220.204 | 3600 |

4. **Save changes**
5. **Wait 5-30 minutes** for DNS propagation

### B. Apply Domain Configuration on Server

Once DNS is configured and propagated:

```bash
# Run the domain setup script
sudo bash deployment/setup-domain.sh
```

This script will:
- Update nginx to handle frard.com
- Update CORS settings in .env
- Restart nginx and PM2
- Verify everything is working

### C. Test Domain Access

After DNS propagates:

```bash
# Test from command line
curl -I http://frard.com
curl -I http://www.frard.com

# Or open in browser:
# http://frard.com
```

---

## Step 7: Set Up HTTPS (Recommended)

For secure HTTPS access with SSL certificates:

```bash
# Install Certbot (if not already installed)
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates and auto-configure nginx
sudo certbot --nginx -d frard.com -d www.frard.com
```

**Follow the prompts:**
- Enter your email for renewal notifications
- Agree to terms of service
- Choose to redirect HTTP to HTTPS (recommended: yes)

After setup, your site will be accessible at:
- **https://frard.com** (secure)
- **https://www.frard.com** (secure)
- http://frard.com (redirects to HTTPS)

---

## Step 8: Verify Deployment

### Test UI Changes

1. **Login** to the application
2. **Check the following changes:**
   - ✅ Header shows "Fire Research Lab"
   - ✅ Sidebar shows "FRL Lab"
   - ✅ Dates display as mm/dd/yyyy
   - ✅ Equipment page header shows "Equipment" (not "Calibration Equipment")
   - ✅ Client numbers show without "Client #" prefix (just "001")
   - ✅ Project numbers show without "Project #" prefix (just "001-002")
   - ✅ Projects page shows PM and Staff on top right of cards
   - ✅ Test detail page has two-column summary layout
   - ✅ Project detail page shows PM above description
   - ✅ Client page projects show PM and Staff info
   - ✅ Print buttons removed from Clients and Projects pages
   - ✅ Project export CSV includes Client Name as first column

### Test OBS Streaming (If Using)

1. **As Staff/Admin:**
   - Navigate to any test
   - Click "Live Stream" tab
   - Verify OBS instructions are visible
   - Copy WebSocket URL

2. **As Client:**
   - Navigate to your test
   - Click "Live Stream" tab
   - Verify OBS instructions are NOT visible

---

## Troubleshooting

### Issue: Code didn't update

```bash
# Force pull (warning: this will overwrite local changes)
cd /var/www/phoenix
git fetch origin
git reset --hard origin/claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr
```

### Issue: PM2 won't restart

```bash
# Check PM2 status
pm2 status

# Delete and restart
pm2 delete all
pm2 start server/index.js --name phoenix

# Save PM2 config
pm2 save
```

### Issue: Build fails

```bash
# Clear node_modules and rebuild
cd /var/www/phoenix/client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Domain not accessible

```bash
# Check DNS propagation
nslookup frard.com

# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Issue: HTTPS not working

```bash
# Check certbot status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

---

## Quick Reference Commands

### View Application Logs

```bash
# PM2 logs
pm2 logs --lines 50

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Check Application Status

```bash
# PM2 status
pm2 status

# Nginx status
sudo systemctl status nginx

# Port usage
sudo lsof -i :5000  # Backend
sudo lsof -i :80    # HTTP
sudo lsof -i :443   # HTTPS
```

### Restart Services

```bash
# Restart PM2
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Restart both
pm2 restart all && sudo systemctl restart nginx
```

---

## Summary of Recent Changes

### UI Updates
- Changed "Fire & Risk Alliance Lab" → "Fire Research Lab"
- Changed "FRA Lab" → "FRL Lab"
- Removed "Client #" and "Project #" prefixes
- Updated date format to mm/dd/yyyy throughout
- Changed "Calibration Equipment" → "Equipment"

### Layout Improvements
- Test summary: Two-column layout (left: details, right: location/client/tags)
- Projects page: PM and Staff moved to top right of cards
- Project detail: PM shown above description, Staff at bottom right
- Client page: Projects show PM and Staff info

### Feature Additions
- Removed print buttons from Clients and Projects pages
- Added Client Name as first column in project export CSV
- Added PM display on project cards
- OBS streaming instructions (for staff only)

### Sorting
- Projects: Most recently created first
- Calibrations: Closest to expiration first

---

## Need Help?

If you encounter any issues:

1. Check PM2 logs: `pm2 logs --lines 50`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup frard.com`
4. Test IP directly: `http://35.222.220.204`

---

**Note:** The IP address `35.222.220.204` will continue to work even after setting up the domain.
