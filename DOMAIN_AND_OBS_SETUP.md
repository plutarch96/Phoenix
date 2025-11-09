# Domain Setup and OBS Streaming Instructions

This guide covers:
1. Setting up frard.com domain
2. Using OBS streaming for live tests

---

## Part 1: Domain Setup (frard.com)

### Step 1: Configure DNS at Your Domain Registrar

1. Log into your domain registrar (where you bought frard.com)
2. Find DNS settings or DNS management
3. Add the following DNS records:

**Root Domain (frard.com):**
- Type: `A`
- Name: `@` (or leave blank)
- Value: `35.222.220.204`
- TTL: `3600` (or Auto)

**WWW Subdomain (www.frard.com):**
- Type: `A`
- Name: `www`
- Value: `35.222.220.204`
- TTL: `3600` (or Auto)

4. Save the DNS changes
5. Wait 5-30 minutes for DNS propagation

### Step 2: Deploy Domain Configuration to Server

SSH into your GCP VM:

```bash
gcloud compute ssh instance-20251109-053443 --zone=us-central1-a
```

Pull the latest code and run the domain setup script:

```bash
cd /var/www/phoenix
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr
sudo bash deployment/setup-domain.sh
```

The script will:
- Update nginx configuration to handle frard.com
- Update CORS settings in .env
- Restart nginx and PM2
- Verify everything is working

### Step 3: Test Domain Access

After DNS propagates (5-30 minutes), test access:

```bash
# Test root domain
curl -I http://frard.com

# Test www subdomain
curl -I http://www.frard.com

# Test from browser
# Visit: http://frard.com
```

You should see the Phoenix application!

### Step 4: Optional - Set Up HTTPS (Recommended)

For secure HTTPS access, install and run Certbot:

```bash
# Install Certbot (if not already installed)
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates and auto-configure nginx
sudo certbot --nginx -d frard.com -d www.frard.com

# Follow the prompts:
# - Enter your email for renewal notifications
# - Agree to terms of service
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

Certbot will:
- Obtain SSL certificates from Let's Encrypt (free)
- Automatically configure nginx for HTTPS
- Set up auto-renewal

After setup, your site will be accessible at:
- https://frard.com (secure)
- https://www.frard.com (secure)
- http://frard.com (redirects to HTTPS)
- http://35.222.220.204 (still works on IP)

---

## Part 2: OBS Streaming Setup

### How It Works

1. **Staff/Admin** sets up OBS on their computer to stream to a specific test
2. Stream goes to the server via WebSocket
3. **Only the assigned client** for that test can view the stream
4. Stream appears in the "Live Stream" tab of the test detail page

### For Staff/Project Managers/Admins

#### Where to Find Instructions

1. Log in to Phoenix
2. Navigate to any test
3. Click the **"Live Stream"** tab
4. You'll see a blue box: **"OBS Live Stream Setup"**
5. Click to expand full instructions

#### Quick Setup Steps

The instructions shown in the app will include:

1. **Server URL** - Automatically generated and ready to copy
   - Example: `ws://frard.com/ws?test_id=123`
   - Or: `wss://frard.com/ws?test_id=123` (if using HTTPS)

2. **One-Click Copy** - Click the "Copy" button to copy the WebSocket URL

3. **Step-by-Step Guide** - Follow the detailed instructions in the app

#### OBS Configuration Summary

In OBS Studio:
1. **Settings** → **Stream**
2. **Service:** Custom...
3. **Server:** (paste the copied WebSocket URL)
4. **Stream Key:** (leave empty)
5. Click **Apply** and **OK**
6. Set up your scene (camera, screen capture, etc.)
7. Click **Start Streaming**

#### Recommended OBS Settings

- **Encoder:** x264
- **Video Bitrate:** 2500 Kbps
- **Audio Bitrate:** 128 Kbps
- **Resolution:** 1920x1080
- **FPS:** 30

*(Adjust based on your internet speed)*

### For Clients

Clients automatically see the stream when:
1. They log in to their account
2. Navigate to their test
3. Click the "Live Stream" tab

They do **NOT** see the OBS setup instructions - those are hidden from clients.

### Security & Privacy

- Each stream is tied to a specific test ID
- Only the client assigned to that test can view it
- Staff cannot accidentally stream to the wrong client
- WebSocket URL includes the test ID for automatic routing

### Troubleshooting

Common issues and solutions are included in the expandable instructions within the app. Quick fixes:

**Stream won't start?**
- Verify Server URL is copied correctly
- Ensure Stream Key is empty
- Check internet connection
- Restart OBS

**Poor quality/buffering?**
- Lower video bitrate to 1500-2000 Kbps
- Reduce resolution to 1280x720
- Lower FPS to 24-25
- Close other bandwidth-heavy apps

---

## Complete Deployment Checklist

Use this checklist to deploy everything:

### Database Migrations (If Not Done Yet)

```bash
cd /var/www/phoenix
bash fix-deployment.sh
```

This runs migrations and fixes:
- ✅ Analytics dashboard errors
- ✅ Project claiming/joining
- ✅ User creation
- ✅ All audit logging

### Domain Setup

```bash
# 1. Configure DNS at registrar
#    - Add A record: @ → 35.222.220.204
#    - Add A record: www → 35.222.220.204

# 2. Pull latest code
cd /var/www/phoenix
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr

# 3. Run domain setup
sudo bash deployment/setup-domain.sh

# 4. Wait for DNS propagation (5-30 min)
# 5. Test: http://frard.com

# 6. Optional: Set up HTTPS
sudo certbot --nginx -d frard.com -d www.frard.com
```

### UI Fixes (Already in Latest Code)

The following are already fixed in the code you'll pull:
- ✅ Dates display as mm/dd/yyyy
- ✅ "Equipment" instead of "Calibration Equipment"
- ✅ "Fire & Risk Alliance Lab" instead of "Laboratory"
- ✅ OBS streaming instructions visible to staff

### Rebuild and Deploy

```bash
cd /var/www/phoenix

# Pull latest code (if not done above)
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr

# Rebuild React app
cd client
npm run build

# Restart server
cd ..
pm2 restart all

# Check status
pm2 status
pm2 logs --lines 20
```

---

## Testing Everything

### 1. Test Domain Access

```bash
# From browser:
http://frard.com
https://frard.com  # if HTTPS set up
```

### 2. Test Basic Features

- ✅ Login as admin
- ✅ Check dates are mm/dd/yyyy format
- ✅ Equipment page shows "Equipment" header
- ✅ Main header says "Fire & Risk Alliance Lab"

### 3. Test Database Features

- ✅ Dashboard "Recent Activity" loads without errors
- ✅ Claim a project (Admin/PM)
- ✅ Join a project (Staff)
- ✅ Create a new user
- ✅ View "My Stuff" page

### 4. Test OBS Streaming

As **Staff/Admin:**
1. Navigate to any test
2. Click "Live Stream" tab
3. Verify OBS instructions are visible
4. Click to expand instructions
5. Copy the WebSocket URL
6. Set up OBS (if available)
7. Try streaming

As **Client:**
1. Navigate to your test
2. Click "Live Stream" tab
3. Verify OBS instructions are NOT visible
4. Should only see stream viewer

---

## Summary

After completing this guide:

✅ **Domain:** frard.com points to your app
✅ **HTTPS:** (Optional but recommended) Secure access
✅ **OBS:** Staff can easily stream to specific tests
✅ **Privacy:** Only assigned clients see their streams
✅ **UI:** Clean, consistent formatting
✅ **Features:** All claiming, joining, and user management working

---

## Questions?

If you encounter issues:

1. Check PM2 logs: `pm2 logs --lines 50`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS propagation: `nslookup frard.com`
4. Test direct IP still works: `http://35.222.220.204`

---

**Note:** The IP address `35.222.220.204` will continue to work even after setting up the domain. Both will be accessible.
