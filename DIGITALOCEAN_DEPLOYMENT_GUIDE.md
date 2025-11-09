# 🚀 Phoenix Application - DigitalOcean Deployment Guide

Complete guide to deploying the Phoenix Test Tracking Application on DigitalOcean with $10 budget.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- [x] DigitalOcean account (get $200 free credit: https://try.digitalocean.com/freetrialoffer/)
- [x] Domain name (optional but recommended)
- [x] SSH key generated (`ssh-keygen -t ed25519 -C "your_email@example.com"`)
- [x] Git installed locally

---

## 💰 Cost Breakdown

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Basic Droplet (1GB RAM) | $6/month | Enough for small-medium usage |
| Backups (optional) | $1.20/month | Automated weekly backups |
| **Total** | **~$7/month** | Your $10 lasts ~1.5 months |

**With $200 free credit**: Run for **28+ months free!**

---

## 🎯 Step-by-Step Deployment

### Step 1: Create a Droplet

1. **Log into DigitalOcean** → Click "Create" → "Droplets"

2. **Choose Region**: Select closest to your users
   - New York (US East)
   - San Francisco (US West)
   - London, Frankfurt, etc.

3. **Choose Image**:
   - **Ubuntu 22.04 LTS** (recommended)

4. **Choose Size**:
   - **Basic plan**: $6/month
   - **CPU options**: Regular (shared CPU)
   - **1 GB RAM / 1 CPU / 25 GB SSD** ← Select this

5. **Authentication**:
   - Select "SSH keys" (more secure than password)
   - Click "New SSH Key" and paste your public key (`cat ~/.ssh/id_ed25519.pub`)

6. **Finalize**:
   - Hostname: `phoenix-app` (or your choice)
   - Enable backups: Optional (+$1.20/month)
   - Click "Create Droplet"

7. **Wait 60 seconds** for droplet creation
   - Note the IP address (e.g., `165.227.123.45`)

---

### Step 2: Initial Server Setup

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Update system packages
apt update && apt upgrade -y

# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install PM2 (process manager)
npm install -g pm2

# Install nginx (reverse proxy)
apt install -y nginx

# Install UFW firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

### Step 3: Deploy Application

```bash
# Create application directory
mkdir -p /var/www/phoenix
cd /var/www/phoenix

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/Phoenix.git .

# Install dependencies
npm install
cd client && npm install && cd ..

# Build React frontend
cd client
npm run build
cd ..

# Run all database migrations
cd server/db
node run-all-migrations.js
cd ../..
```

---

### Step 4: Environment Configuration

```bash
# Create production .env file
nano server/.env
```

**Paste this configuration** (update values):

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret - GENERATE A STRONG RANDOM STRING!
# Run: openssl rand -base64 32
JWT_SECRET=YOUR_GENERATED_SECRET_HERE

# JWT Expiration
JWT_EXPIRES_IN=7d

# Default Admin Credentials
# Leave PASSWORD blank to auto-generate secure password
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
# DEFAULT_ADMIN_PASSWORD=  # Auto-generated on first run

# CORS Origins - UPDATE TO YOUR DOMAIN!
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database Path (optional - defaults to server/db/testtracking.db)
DB_PATH=/var/www/phoenix/server/db/testtracking.db

# File Upload Limits (50MB in bytes)
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

**Save and exit**: `Ctrl+X` → `Y` → `Enter`

---

### Step 5: Configure PM2

```bash
# Start application with PM2
cd /var/www/phoenix
pm2 start server/index.js --name phoenix

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Copy and run the command it outputs

# Check application status
pm2 status
pm2 logs phoenix  # View logs

# Important: SAVE THE AUTO-GENERATED ADMIN PASSWORD!
# It will be shown in the logs on first startup
pm2 logs phoenix --lines 50 | grep -A 5 "DEFAULT ADMIN"
```

**Save the admin password immediately** - it won't be shown again!

---

### Step 6: Configure Nginx Reverse Proxy

```bash
# Create nginx configuration
nano /etc/nginx/sites-available/phoenix
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Increase client body size for file uploads (50MB)
    client_max_body_size 50M;

    # Serve React build files
    root /var/www/phoenix/client/build;
    index index.html;

    # API requests to Node.js backend
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

        # Increase timeout for long-running requests
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

    # React Router - all other requests serve index.html
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

**Enable the site:**
```bash
# Create symlink
ln -s /etc/nginx/sites-available/phoenix /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx
```

---

### Step 7: SSL Certificate (HTTPS) - FREE with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)

# Auto-renewal is configured automatically
# Test renewal:
certbot renew --dry-run
```

**If using IP address instead of domain:**
- Skip SSL setup for now
- Access via `http://YOUR_IP`
- SSL requires a domain name

---

### Step 8: Configure Uploads Directory

```bash
# Create upload directories
mkdir -p /var/www/phoenix/server/uploads/{calibrations,reports,tests}

# Set correct permissions
chown -R www-data:www-data /var/www/phoenix/server/uploads
chmod -R 755 /var/www/phoenix/server/uploads

# Set correct ownership for database
chown -R www-data:www-data /var/www/phoenix/server/db
chmod 644 /var/www/phoenix/server/db/testtracking.db
```

---

### Step 9: Setup Database Backups

```bash
# Create backup script
nano /usr/local/bin/backup-phoenix-db.sh
```

**Paste this script:**

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/phoenix"
DB_PATH="/var/www/phoenix/server/db/testtracking.db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/testtracking_$DATE.db"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "testtracking_*.db" -mtime +7 -delete

echo "Backup completed: testtracking_$DATE.db"
```

**Make executable and schedule:**

```bash
chmod +x /usr/local/bin/backup-phoenix-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-phoenix-db.sh >> /var/log/phoenix-backup.log 2>&1
```

---

## ✅ Post-Deployment Checklist

### Security
- [ ] Changed default admin password (via app UI)
- [ ] JWT_SECRET is strong random string (min 32 chars)
- [ ] CORS_ORIGINS set to your domain (not localhost)
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall (UFW) enabled with only necessary ports
- [ ] Server packages updated: `apt update && apt upgrade`

### Application
- [ ] All database migrations ran successfully
- [ ] Admin login works: `https://yourdomain.com`
- [ ] File uploads work (test calibration PDFs)
- [ ] Reports download correctly
- [ ] WebSocket streaming works (if using OBS)

### Monitoring
- [ ] PM2 running: `pm2 status`
- [ ] Nginx running: `systemctl status nginx`
- [ ] Database backups scheduled: `crontab -l`
- [ ] Check logs: `pm2 logs phoenix`
- [ ] Check nginx logs: `tail -f /var/log/nginx/error.log`

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

# View app status
pm2 status

# Monitor in real-time
pm2 monit
```

### Deployment Updates
```bash
cd /var/www/phoenix

# Pull latest code
git pull origin main

# Install new dependencies
npm install
cd client && npm install && cd ..

# Rebuild frontend
cd client && npm run build && cd ..

# Run new migrations
cd server/db && node run-all-migrations.js && cd ../..

# Restart app
pm2 restart phoenix
```

### Nginx
```bash
# Test config
nginx -t

# Reload config
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# View error logs
tail -f /var/log/nginx/error.log
```

### Database
```bash
# Backup database manually
cp /var/www/phoenix/server/db/testtracking.db /root/backup_$(date +%F).db

# View database
apt install sqlite3
sqlite3 /var/www/phoenix/server/db/testtracking.db
# SQLite commands: .tables, .schema users, SELECT * FROM users;
```

---

## 🚨 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs phoenix --lines 100

# Check if port 5000 is in use
netstat -tulpn | grep 5000

# Check environment variables
cat /var/www/phoenix/server/.env
```

### "502 Bad Gateway" error
```bash
# Check if Node app is running
pm2 status

# Restart Node app
pm2 restart phoenix

# Check nginx error logs
tail -f /var/log/nginx/error.log
```

### File upload fails
```bash
# Check upload directory permissions
ls -la /var/www/phoenix/server/uploads

# Fix permissions
chown -R www-data:www-data /var/www/phoenix/server/uploads
chmod -R 755 /var/www/phoenix/server/uploads
```

### Database locked error
```bash
# Stop app
pm2 stop phoenix

# Check for locks
lsof /var/www/phoenix/server/db/testtracking.db

# Fix permissions
chown www-data:www-data /var/www/phoenix/server/db/testtracking.db
chmod 644 /var/www/phoenix/server/db/testtracking.db

# Restart app
pm2 restart phoenix
```

---

## 📊 Monitoring & Maintenance

### Setup Uptime Monitoring (Free)
1. **UptimeRobot**: https://uptimerobot.com
   - Monitor: `https://yourdomain.com/api/health`
   - Check interval: 5 minutes
   - Get email alerts on downtime

### Log Rotation
```bash
# Install logrotate for PM2
pm2 install pm2-logrotate

# Configure (optional)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Server Resource Monitoring
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
top

# PM2 monitoring
pm2 monit
```

---

## 🔐 Security Best Practices

1. **Regular Updates**
   ```bash
   # Weekly security updates
   apt update && apt upgrade -y
   pm2 restart phoenix
   ```

2. **SSH Hardening**
   ```bash
   # Disable root login
   nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   # Set: PasswordAuthentication no
   systemctl restart sshd
   ```

3. **Fail2Ban** (block brute force attacks)
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

4. **Regular Backups**
   - Database: Automated daily (via cron)
   - Uploads: Weekly manual backup recommended
   - Store offsite (DigitalOcean Spaces or S3)

---

## 💡 Optimization Tips

### Enable Node.js Production Mode
Already configured via `NODE_ENV=production` in .env

### Database Optimization
```bash
# Vacuum database (reclaim space)
sqlite3 /var/www/phoenix/server/db/testtracking.db "VACUUM;"
```

### Nginx Caching (for static files)
Already configured in nginx config with `expires 30d`

---

## 📞 Support

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Community**: https://www.digitalocean.com/community
- **Support Tickets**: Available with paid account

---

## 🎉 You're Done!

Your Phoenix application is now:
- ✅ Running on DigitalOcean
- ✅ Secured with HTTPS (if domain configured)
- ✅ Monitored with PM2
- ✅ Backed up daily
- ✅ Production-ready!

**Access your app**: `https://yourdomain.com` or `http://YOUR_DROPLET_IP`

**Login with**: Username from logs (default: admin) + auto-generated password

**Cost**: ~$6-7/month (or free for 28 months with $200 credit!)

---

**🎯 Need Help?** Check the troubleshooting section or DigitalOcean community forums.
