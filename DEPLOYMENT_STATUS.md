# Deployment Status & Next Steps

## ✅ Completed Changes

### 1. Date Format Fixed
- All dates now display as mm/dd/yyyy consistently
- Files affected: All pages with date displays

### 2. UI Text Updates
- Changed "Calibration Equipment" → "Equipment"
- Changed "Fire & Risk Alliance Laboratory" → "Fire & Risk Alliance Lab"
- Changed "Mark as Mine" → "Follow/Unfollow"

### 3. Domain Setup (frard.com)
- nginx configuration created
- Automated setup script ready
- **Requires DNS configuration** (see DOMAIN_AND_OBS_SETUP.md)

### 4. OBS Streaming Instructions
- Component created with step-by-step guide
- Visible only to staff and above
- Includes one-click copy of WebSocket URL
- Built-in troubleshooting

### 5. Team Members Display
- Project Manager and Staff shown in project title cards
- Project Manager shown in test summary cards
- Visual indicators with icons and colors

### 6. Overview Tab Enhancement
- Interactive count cards for all content types
- Clickable cards link to respective tabs
- Shows: Test Data, Images, Videos, Equipment, Docs, Reports (Draft/Final)

### 7. Database Schema Updates
- Backend now includes project and PM info in test queries
- Joins projects table and users table for complete data

---

## ⚠️ Known Issue: Claimed Projects Not Showing

**Problem:** User reports claiming a project but it's not appearing in "My Stuff" → "Claimed Projects" tab

**Possible Causes:**
1. Database migrations not run yet on server
2. Caching issue in browser
3. Backend query not working correctly

**To Debug:**
1. Run database migrations: `bash fix-deployment.sh`
2. Check PM2 logs: `pm2 logs --lines 50`
3. Test claiming endpoint directly
4. Clear browser cache and reload

---

## 🚀 Deployment Instructions

### On Your GCP Server (SSH in):

```bash
# 1. Navigate to app directory
cd /var/www/phoenix

# 2. Pull latest code
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr

# 3. Run database migrations (IMPORTANT!)
bash fix-deployment.sh
```

This will:
- Run all 12 database migrations
- Add missing tables (projects, project_members, audit_logs, etc.)
- Add missing columns (project_id, test_number, claimed_by, etc.)
- Rebuild React frontend
- Restart PM2

### After Deployment, Test:

1. **Claimed Projects**:
   - Claim a project as admin/PM
   - Go to "My Stuff" → "Claimed Projects" tab
   - Verify it appears

2. **UI Changes**:
   - Check dates are mm/dd/yyyy
   - Verify "Equipment" header (not "Calibration Equipment")
   - Verify "Fire & Risk Alliance Lab" header
   - Check "Follow" buttons work

3. **Overview Tab**:
   - Open any test
   - View Overview tab
   - Click on count cards to navigate

4. **OBS Instructions**:
   - Login as staff/admin
   - Go to test → Live Stream tab
   - Verify OBS instructions appear

---

## 🌐 Domain Setup (Optional)

See `DOMAIN_AND_OBS_SETUP.md` for complete guide.

**Quick Steps:**
1. Configure DNS A record: frard.com → 35.222.220.204
2. Run: `sudo bash deployment/setup-domain.sh`
3. Wait 5-30 min for DNS propagation
4. Test: http://frard.com
5. Optional HTTPS: `sudo certbot --nginx -d frard.com -d www.frard.com`

---

## 📊 Testing Checklist

After deployment, verify:

- [ ] Claimed project appears in My Stuff
- [ ] Dates show as mm/dd/yyyy
- [ ] "Equipment" page header correct
- [ ] Main header says "Fire & Risk Alliance Lab"
- [ ] Follow/Unfollow buttons work
- [ ] PM shows in project cards
- [ ] PM shows in test summary
- [ ] Overview tab displays counts correctly
- [ ] Clicking count cards navigates to tabs
- [ ] OBS instructions visible to staff
- [ ] OBS instructions hidden from clients
- [ ] Database migrations completed successfully

---

## 🐛 Troubleshooting

### Claimed Projects Not Showing

```bash
# Check if migrations ran
pm2 logs --lines 100 | grep -i "migration\|project"

# Verify database schema
cd /var/www/phoenix/server
node db/verify-all-tables.js

# Test claiming manually
# 1. Claim a project
# 2. Check database:
sqlite3 db/testtracking.db "SELECT * FROM projects WHERE claimed_by IS NOT NULL;"
```

### UI Not Updating

```bash
# Rebuild frontend
cd /var/www/phoenix/client
npm run build

# Restart server
pm2 restart all

# Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
```

### PM2 Errors

```bash
# View logs
pm2 logs --lines 50

# Check status
pm2 status

# Restart if needed
pm2 restart all
```

---

## 📝 Summary of Files Changed

**Frontend:**
- `client/src/App.js` - Header text
- `client/src/pages/Calibrations.js` - Equipment header, dates
- `client/src/pages/ProjectDetail.js` - Follow button, PM/staff display
- `client/src/pages/TestDetail.js` - PM in summary, overview tab
- `client/src/pages/Tests.js` - Date formatting
- `client/src/pages/MyTests.js` - Date formatting
- `client/src/pages/ClientDetail.js` - Date formatting
- `client/src/pages/Clients.js` - Date formatting
- `client/src/components/CalibrationSelector.js` - Date formatting
- `client/src/components/OBSInstructions.js` - NEW component
- `client/src/utils/exportUtils.js` - formatDate function

**Backend:**
- `server/routes/tests.js` - Project/PM joins in query
- `deployment/nginx-domain.conf` - Domain config
- `deployment/setup-domain.sh` - Domain setup script

**Documentation:**
- `DOMAIN_AND_OBS_SETUP.md` - Complete setup guide
- `DEPLOYMENT_STATUS.md` - This file
- `FIX_INSTRUCTIONS.md` - Migration instructions

---

## 🎯 Priority Next Steps

1. **Run migrations on server** (if not done)
2. **Test claimed projects** functionality
3. **Configure domain** (if desired)
4. **Set up HTTPS** (recommended for production)

---

Last Updated: 2025-01-09
Branch: claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr
