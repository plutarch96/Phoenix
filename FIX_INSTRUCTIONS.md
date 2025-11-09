# Fix Deployment Issues - Instructions

## Problem Summary

The application has three main issues that need to be fixed:

1. **Analytics Recent Activity Error**: Database missing `project_id` column in tests table
2. **Claiming Projects Not Working**: Missing database tables and columns for project claiming
3. **Joining Projects Not Working**: Missing database tables for project membership

**Root Cause**: Database migrations were never run on the production server after deployment.

---

## Solution

Run the database migrations on your GCP VM to add all missing tables and columns.

---

## Steps to Fix

### 1. SSH into your GCP VM

```bash
gcloud compute ssh instance-20251109-053443 --zone=us-central1-a
```

Or use the SSH button in the Google Cloud Console.

### 2. Navigate to the application directory

```bash
cd /var/www/phoenix
```

### 3. Pull the latest code with the fix script

```bash
git pull origin claude/google-deployment-guide-011CUwnSx3H43M8v2HMQZNwr
```

### 4. Make the fix script executable and run it

```bash
chmod +x fix-deployment.sh
bash fix-deployment.sh
```

### 5. Verify the fix

The script will:
- Run all 12 database migrations
- Add missing tables: `projects`, `project_members`, `audit_logs`, etc.
- Add missing columns: `project_id`, `test_number`, `claimed_by`, etc.
- Verify the database schema
- Restart the PM2 server

You should see output like:

```
╔════════════════════════════════════════════════════════════╗
║     PHOENIX APPLICATION - COMPLETE DATABASE MIGRATION      ║
╚════════════════════════════════════════════════════════════╝

[1/12] Base Tests Table
    ✅ COMPLETED

[2/12] Project Hierarchy
    ✅ COMPLETED

...

✅ Successful: 12/12
❌ Failed: 0/12

🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!
```

---

## What Gets Fixed

After running the migrations, these features will work:

### ✓ Analytics Dashboard
- Recent activity will load without errors
- Shows tests, projects, and calibrations together

### ✓ Project Claiming (Admin/Project Manager)
- Click "Claim Project" button on any project
- Claimed projects appear in "My Stuff" under "Claimed Projects" tab
- Only one PM can claim a project at a time

### ✓ Project Joining (Staff)
- Click "Join Project" button on any project
- Joined projects appear in "My Stuff" under "Joined Projects" tab
- Multiple staff can join the same project

### ✓ User Creation (Admin)
- Create users with all roles (admin, project_manager, staff, client)
- Assign client users to specific clients

### ✓ Audit Logging
- All user actions are now logged
- View logs in the Audit Log page (admin only)

---

## Testing After Fix

1. **Visit**: http://35.222.220.204
2. **Login** with admin credentials
3. **Test Claiming**:
   - Go to Projects page
   - Click "Claim Project" on any project
   - Go to "My Stuff" → see it under "Claimed Projects"
4. **Test Joining**:
   - Create/login as a staff user
   - Go to Projects page
   - Click "Join Project" on any project
   - Go to "My Stuff" → see it under "Joined Projects"
5. **Test User Creation**:
   - Go to Users page
   - Click "Add User"
   - Fill in the form and submit
6. **Test Analytics**:
   - Go to Dashboard
   - Check "Recent Activity" section (should load without errors)

---

## Troubleshooting

### If migrations fail:

1. Check PM2 logs:
   ```bash
   pm2 logs phoenix-server
   ```

2. Verify database file permissions:
   ```bash
   ls -la /var/www/phoenix/server/db/testtracking.db
   ```

3. Check if database is locked:
   ```bash
   pm2 stop phoenix-server
   bash fix-deployment.sh
   pm2 start phoenix-server
   ```

### If features still don't work after migration:

1. **Clear browser cache** and reload the page
2. **Check browser console** (F12) for any errors
3. **Check PM2 logs** for server errors:
   ```bash
   pm2 logs phoenix-server --lines 50
   ```

---

## Database Schema Changes

The migrations will create/modify:

**New Tables:**
- `projects` - Project hierarchy (Client → Project → Test)
- `project_members` - Staff members joined to projects
- `user_project_tags` - "Mark as Mine" functionality
- `test_members` - Test-level team assignments
- `audit_logs` - Complete audit trail

**New Columns in `tests`:**
- `project_id` - Link to parent project
- `test_number` - Test number within project
- `updated_at` - Last update timestamp

**New Columns in `projects`:**
- `claimed_by` - Project Manager who claimed it
- `updated_at` - Last update timestamp

**New Columns in `calibrations`:**
- `serial_number` - Equipment serial number
- `is_active` - Whether calibration is current
- `superseded_by` - Points to newer calibration version
- `updated_at` - Last update timestamp

---

## Questions?

If you encounter any issues:
1. Check the error messages in the migration output
2. Review PM2 logs
3. Verify database file exists and is writable
4. Ensure you're running the script on the correct VM (35.222.220.204)

---

**Note**: This fix is safe to run multiple times. If a table/column already exists, the migration will skip it.
