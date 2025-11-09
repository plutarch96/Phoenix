# 🚀 Phoenix Application - Google Cloud Platform Deployment Guide

Complete guide to deploying the Phoenix Test Tracking Application on Google Cloud Platform (GCP) with $10 budget.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- [x] Google account
- [x] Credit/debit card (for verification - won't be charged with free tier)
- [x] Git installed locally
- [x] Your domain name (optional but recommended)

---

## 💰 Cost Breakdown & Free Credits

### Google Cloud Free Tier Benefits:
1. **$300 free credit** for 90 days (new customers)
2. **Always Free tier** includes:
   - 1 f1-micro VM instance (0.6GB RAM) - **FREE FOREVER**
   - 30GB standard persistent disk
   - 1GB outbound data transfer per month
   - Cloud Storage (5GB)

### Pricing Options:

| Instance Type | Monthly Cost | RAM | Storage | Your $10 Lasts |
|--------------|--------------|-----|---------|----------------|
| **f1-micro (Free)** | **$0** | 0.6GB | 30GB | **Forever!** |
| e2-micro | ~$7/month | 1GB | 10GB | 1.4 months |
| e2-small | ~$14/month | 2GB | 10GB | N/A (over budget) |

**Recommendation**: Use **f1-micro** (Always Free) - **$0/month forever!**
- Sufficient for low-medium traffic (100-500 users/day)
- Persistent disk included
- Your $10 can be saved or used for backups/storage

---

## 🎯 Deployment Options

Google Cloud offers multiple deployment methods:

### Option A: Compute Engine (VM) ⭐ **RECOMMENDED**
- **Cost**: FREE (f1-micro Always Free tier)
- **Control**: Full server access
- **Best for**: Long-term hosting, full control
- **Complexity**: Medium
- **Time**: 30-45 minutes

### Option B: Cloud Run (Serverless)
- **Cost**: Pay per request (~$1-5/month for light use)
- **Control**: Limited (container-based)
- **Best for**: Auto-scaling, variable traffic
- **Complexity**: High (requires Docker)
- **Time**: 60+ minutes

### Option C: App Engine (PaaS)
- **Cost**: ~$8-15/month (no free tier for standard env)
- **Control**: Moderate
- **Best for**: Quick deployment
- **Complexity**: Low
- **Time**: 20-30 minutes

**This guide covers Option A (Compute Engine) - FREE and most cost-effective!**

---

## 🚀 Step-by-Step: Compute Engine Deployment

### Step 1: Create Google Cloud Account

1. Go to https://cloud.google.com/
2. Click "Get started for free"
3. Sign in with Google account
4. Enter credit card (for verification - won't be charged)
5. **Claim $300 free credit** (valid 90 days)

---

### Step 2: Create a Project

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Click project dropdown (top bar) → **New Project**
3. Name: `phoenix-app` (or your choice)
4. Click **Create**
5. Wait for project creation (~30 seconds)
6. Select the new project from dropdown

---

### Step 3: Enable Required APIs

```bash
# Go to APIs & Services → Enable APIs and Services
# Or use Cloud Shell and run:
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

---

### Step 4: Create VM Instance (f1-micro - FREE)

#### Via Console (GUI):

1. **Navigate**: Compute Engine → VM Instances
2. Click **Create Instance**
3. **Configuration**:
   - Name: `phoenix-server`
   - Region: `us-central1` (Iowa) - **Required for Always Free**
   - Zone: `us-central1-a`
   - **Machine configuration**:
     - Series: **E2** or **N1**
     - Machine type: **f1-micro** (0.6 GB RAM) ⚠️ **Select this for FREE tier**
   - **Boot disk**:
     - Operating System: **Ubuntu**
     - Version: **Ubuntu 22.04 LTS**
     - Boot disk type: **Standard persistent disk**
     - Size: **30 GB** (free tier limit)
   - **Firewall**:
     - ✅ Allow HTTP traffic
     - ✅ Allow HTTPS traffic
   - Click **Create**

#### Via gcloud CLI (faster):

```bash
# Open Cloud Shell (top right icon in console)
gcloud compute instances create phoenix-server \
  --zone=us-central1-a \
  --machine-type=f1-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --tags=http-server,https-server
```

**Wait 1-2 minutes** for instance creation.

---

### Step 5: Configure Firewall Rules

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server

# Allow HTTPS traffic
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags https-server

# Allow Node.js port (temporary - for testing)
gcloud compute firewall-rules create allow-nodejs \
  --allow tcp:5000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

---

### Step 6: SSH into Your Instance

#### Via Console (easiest):
1. Go to **Compute Engine → VM Instances**
2. Find `phoenix-server`
3. Click **SSH** button
4. Browser SSH window opens

#### Via gcloud CLI:
```bash
gcloud compute ssh phoenix-server --zone=us-central1-a
```

#### Via standard SSH (if you have SSH key):
```bash
ssh YOUR_USERNAME@EXTERNAL_IP
```

---

### Step 7: Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Install build tools (for some npm packages)
sudo apt install -y build-essential
```

---

### Step 8: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/phoenix
sudo chown $USER:$USER /var/www/phoenix

# Clone repository
cd /var/www/phoenix
git clone https://github.com/YOUR_USERNAME/Phoenix.git .

# Install dependencies
npm install

# Install client dependencies and build
cd client
npm install
npm run build
cd ..

# Run database migrations
cd server/db
node run-all-migrations.js
cd ../..
```

---

### Step 9: Configure Environment Variables

```bash
# Create production .env file
nano server/.env
```

**Paste this configuration** (update YOUR_DOMAIN):

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret - GENERATE A STRONG SECRET!
# Generate with: openssl rand -base64 32
JWT_SECRET=PASTE_YOUR_GENERATED_SECRET_HERE

# JWT Expiration
JWT_EXPIRES_IN=7d

# Default Admin Credentials
# Password will be auto-generated on first start
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
# DEFAULT_ADMIN_PASSWORD=  # Leave blank for auto-generation

# CORS Origins - UPDATE TO YOUR DOMAIN OR EXTERNAL IP!
CORS_ORIGINS=http://YOUR_EXTERNAL_IP,https://yourdomain.com

# Database Path
DB_PATH=/var/www/phoenix/server/db/testtracking.db

# File Upload Limits (50MB)
MAX_FILE_SIZE=52428800

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
# Copy output and paste as JWT_SECRET value
```

**Get your External IP:**
```bash
curl ifconfig.me
# Use this for CORS_ORIGINS if you don't have a domain
```

**Save**: `Ctrl+X` → `Y` → `Enter`

---

### Step 10: Start Application with PM2

```bash
# Navigate to app directory
cd /var/www/phoenix

# Start with PM2
pm2 start server/index.js --name phoenix

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs (starts with 'sudo env...')

# Check status
pm2 status

# View logs and SAVE THE AUTO-GENERATED PASSWORD!
pm2 logs phoenix --lines 50 | grep -A 10 "ADMIN"
```

**⚠️ IMPORTANT**: Save the auto-generated admin password immediately!

---

### Step 11: Configure Nginx Reverse Proxy

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/phoenix
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_EXTERNAL_IP_OR_DOMAIN;

    # Increase client body size for uploads
    client_max_body_size 50M;

    # Serve React frontend
    root /var/www/phoenix/client/build;
    index index.html;

    # API proxy to Node.js
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # WebSocket for OBS streaming
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /var/www/phoenix/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # React Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
```

**Enable site:**
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/phoenix /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

### Step 12: Setup Upload Directories

```bash
# Create directories
sudo mkdir -p /var/www/phoenix/server/uploads/{calibrations,reports,tests}

# Set permissions
sudo chown -R www-data:www-data /var/www/phoenix/server/uploads
sudo chmod -R 755 /var/www/phoenix/server/uploads

# Database permissions
sudo chown -R www-data:www-data /var/www/phoenix/server/db
sudo chmod 644 /var/www/phoenix/server/db/testtracking.db
```

---

### Step 13: Configure Custom Domain (Optional)

#### If you have a domain:

1. **In Google Cloud Console**:
   - Compute Engine → VM Instances
   - Note your **External IP** (e.g., `34.123.45.67`)

2. **In your domain registrar** (Namecheap, GoDaddy, etc.):
   - Add **A Record**:
     - Host: `@` (or your subdomain like `phoenix`)
     - Value: `YOUR_EXTERNAL_IP`
     - TTL: `3600`
   - Add **A Record** for www:
     - Host: `www`
     - Value: `YOUR_EXTERNAL_IP`
     - TTL: `3600`

3. **Wait 10-60 minutes** for DNS propagation

4. **Update nginx config**:
   ```bash
   sudo nano /etc/nginx/sites-available/phoenix
   # Change: server_name YOUR_EXTERNAL_IP_OR_DOMAIN;
   # To:     server_name yourdomain.com www.yourdomain.com;
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Step 14: SSL Certificate (HTTPS) - FREE

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)

# Auto-renewal is configured automatically
# Test:
sudo certbot renew --dry-run
```

**If using IP address**: Skip SSL for now (requires domain)

---

### Step 15: Setup Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-phoenix.sh
```

**Paste:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/phoenix"
DB_PATH="/var/www/phoenix/server/db/testtracking.db"
UPLOADS_PATH="/var/www/phoenix/server/uploads"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH "$BACKUP_DIR/db_$DATE.db"

# Backup uploads (compress)
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /var/www/phoenix/server uploads

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.db" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Schedule daily backups:**
```bash
sudo chmod +x /usr/local/bin/backup-phoenix.sh

# Add to crontab
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-phoenix.sh >> /var/log/phoenix-backup.log 2>&1
```

---

### Step 16: Reserve Static IP (Optional but Recommended)

By default, your external IP changes if you stop/start the VM.

```bash
# Get current external IP
gcloud compute addresses list

# Reserve it as static
gcloud compute addresses create phoenix-ip \
  --addresses YOUR_CURRENT_EXTERNAL_IP \
  --region us-central1

# Assign to instance
gcloud compute instances delete-access-config phoenix-server --zone=us-central1-a
gcloud compute instances add-access-config phoenix-server \
  --zone=us-central1-a \
  --address=YOUR_RESERVED_IP
```

**Cost**: Static IP is **FREE** if attached to a running instance!

---

## ✅ Post-Deployment Checklist

### Security
- [ ] Changed admin password in app
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS_ORIGINS set to your domain/IP
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall rules configured
- [ ] System packages updated

### Application
- [ ] All migrations ran successfully
- [ ] Admin login works
- [ ] File uploads work
- [ ] Reports generate correctly
- [ ] WebSocket works (if using OBS)

### Monitoring
- [ ] PM2 running: `pm2 status`
- [ ] Nginx running: `systemctl status nginx`
- [ ] Backups scheduled: `sudo crontab -l`
- [ ] Can access app at your IP/domain

---

## 🔧 Common Commands

### Application Management
```bash
# View logs
pm2 logs phoenix

# Restart app
pm2 restart phoenix

# Stop app
pm2 stop phoenix

# Check status
pm2 status

# Monitor resources
pm2 monit
```

### Deployment Updates
```bash
cd /var/www/phoenix
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
cd server/db && node run-all-migrations.js && cd ../..
pm2 restart phoenix
```

### System Management
```bash
# Check memory
free -h

# Check disk space
df -h

# Check CPU
top

# Restart nginx
sudo systemctl restart nginx

# View system logs
sudo journalctl -xe
```

---

## 🚨 Troubleshooting

### Out of Memory Errors (f1-micro has only 0.6GB RAM)

**Create swap file:**
```bash
# Create 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
```

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs phoenix --lines 100

# Check environment
cat /var/www/phoenix/server/.env

# Check port
sudo netstat -tulpn | grep 5000
```

### 502 Bad Gateway
```bash
# Restart Node app
pm2 restart phoenix

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Locked
```bash
pm2 stop phoenix
sudo chown www-data:www-data /var/www/phoenix/server/db/testtracking.db
sudo chmod 644 /var/www/phoenix/server/db/testtracking.db
pm2 restart phoenix
```

---

## 💰 Cost Management

### Always Free Tier Limits (per month):
- **1 f1-micro VM** in us-central1, us-west1, or us-east1
- **30 GB standard persistent disk**
- **1 GB outbound data** (to internet)
- **5 GB Cloud Storage**

### To Stay FREE Forever:
1. ✅ Use **f1-micro** instance
2. ✅ Keep it in **us-central1, us-west1, or us-east1**
3. ✅ Stay under **30GB disk**
4. ✅ Stay under **1GB outbound/month** (~30-50 users/day)
5. ⚠️ Don't add paid services (Cloud SQL, Load Balancer, etc.)

### Monitor Costs:
- **Billing Dashboard**: https://console.cloud.google.com/billing
- Set **Budget Alerts**: Billing → Budgets & alerts → Create budget
  - Set budget: $5
  - Get email when 50%, 90%, 100% spent

---

## 📊 Monitoring & Maintenance

### Setup Uptime Monitoring (Free)
- **Google Cloud Monitoring**: Already included
- Or use **UptimeRobot**: https://uptimerobot.com

### Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Weekly Maintenance
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Restart app
pm2 restart phoenix

# Check disk space
df -h

# Check backups
ls -lh /var/backups/phoenix/
```

---

## 🎉 Success!

Your Phoenix app is now running on Google Cloud **FREE tier**!

**Access your app**:
- `http://YOUR_EXTERNAL_IP` or
- `https://yourdomain.com` (if configured)

**Login**:
- Username: admin
- Password: (from PM2 logs on first start)

**Cost**: **$0/month** on Always Free tier! 🎊

Your $10 can be saved or used for:
- Domain name (~$12/year)
- Cloud Storage backups
- Future scaling

---

## 📞 Support Resources

- **GCP Documentation**: https://cloud.google.com/docs
- **Community**: https://googlecloudcommunity.com/
- **Stack Overflow**: Tag `google-cloud-platform`
- **Free Tier Details**: https://cloud.google.com/free

---

**🎯 Need help?** Check troubleshooting section or GCP documentation!
