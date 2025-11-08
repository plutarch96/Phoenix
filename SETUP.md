# FRA Lab Test Tracking System - Setup Guide

## ✅ What's Been Implemented

### 🔐 **Authentication & Security (COMPLETE)**
- JWT-based authentication system
- Role-based access control (Admin, Employee, Client)
- Password hashing with bcrypt
- Security headers with Helmet
- Rate limiting for DDoS protection
- Environment-based configuration
- Default admin user auto-creation

### 🗄️ **Database Schema (COMPLETE)**
- **Users** - Authentication with roles
- **Clients** - Enhanced with client_number, full address
- **Client Contacts** - Multiple contacts per client
- **Tests** - With test_type, governing_standard, location
- **Calibrations** - With equipment_type for auto-ID generation
- **Calibration Snapshots** - Historical preservation when linked to tests
- **Test Calibrations** - Many-to-many with timestamps
- **Equipment Types** - FRA Lab specific types pre-loaded

### 🔧 **Equipment Types (COMPLETE)**
Pre-configured for FRA Lab:
- HFG - Heat Flux Gauge
- TCM - TC Mod
- CRM - Current Mod
- VLM - Voltage Mod
- SRM - Serial Mod
- MM - Multimeter
- RH - Relative Humidity Sensor
- ANM - Anemometer
- SW - Stop Watch
- TM - Tape Measure

### 🎨 **Branding (COMPLETE)**
- FRA Lab name and branding
- Red fire-testing color scheme
- Flame icon in sidebar
- Professional interface

## 🚧 What Still Needs Implementation

### 1. **Frontend Authentication Integration** (HIGH PRIORITY)
You need to:
- Create Login/Register pages
- Add authentication context/provider
- Store JWT token in localStorage
- Add token to all API requests
- Implement protected routes
- Show/hide features based on user role

**Files to create:**
- `client/src/context/AuthContext.js`
- `client/src/pages/Login.js`
- `client/src/pages/Register.js` (admin only)
- `client/src/components/PrivateRoute.js`

### 2. **Client Portal** (HIGH PRIORITY)
- Client-specific dashboard showing only their tests
- Client login page with restricted access
- Test filtering by logged-in client
- Media viewing restricted to client's tests

### 3. **Client Management Enhancement**
Update client forms and pages to include:
- Client Number (auto-generated or manual)
- Full Address (address, city, state, zip)
- Multiple Contacts management
  - Add/Edit/Delete contacts
  - Mark primary contact
  - Contact details (name, title, email, phone)

**Files to update:**
- `client/src/components/ClientModal.js`
- `client/src/pages/Clients.js`
- Create `client/src/components/ContactModal.js`

### 4. **Test Enhancements**
- Add Location field to test forms
- Update test routes to handle location
- Show location in test details

**Files to update:**
- `client/src/components/TestModal.js` (add location field)
- `server/routes/tests.js` (update to include location in queries)

### 5. **Calibration Snapshot System**
When equipment is linked to a test, create a snapshot:
- Copy current calibration data to calibration_snapshots table
- Copy PDF file to test-specific folder
- Display historical calibration data even if equipment is updated

**Files to update:**
- `server/routes/tests.js` (modify addCalibration endpoint)

### 6. **Dark Mode** (MEDIUM PRIORITY)
- Add dark mode toggle
- Store preference in localStorage
- CSS variables for easy theme switching
- Dark mode styles

**Files to create/update:**
- `client/src/context/ThemeContext.js`
- `client/src/App.css` (add dark mode variables)

### 7. **Client-Specific Live Streaming**
- Authenticate stream viewers
- Only show streams for client's tests
- Stream access control via JWT

### 8. **Route Protection** (HIGH PRIORITY)
Add authentication middleware to all routes:
```javascript
// Example for tests route
const { verifyToken, requireFRAEmployee } = require('../middleware/auth');

// FRA employees only
router.post('/', verifyToken, requireFRAEmployee, async (req, res) => {
  // Create test
});

// Client can view their own tests
router.get('/:id', verifyToken, requireTestAccess(), async (req, res) => {
  // Get test
});
```

## 📋 Step-by-Step Setup Instructions

### Step 1: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### Step 2: Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env and change these values:
# - JWT_SECRET (use a long random string)
# - DEFAULT_ADMIN_PASSWORD (change from default)
# - Add any other configuration
```

### Step 3: Start the Application
```bash
# Run both server and client
npm run dev
```

### Step 4: First Login
1. Navigate to http://localhost:3000
2. Login with default credentials:
   - **Username:** admin (or value from .env)
   - **Password:** changeme123 (or value from .env)
3. **⚠️ IMMEDIATELY CHANGE THE PASSWORD!**

### Step 5: Create Users
Use the authentication API to create users:

**Create FRA Employee:**
```bash
POST /api/auth/register
{
  "username": "john.doe",
  "email": "john@fralab.com",
  "password": "securepass123",
  "role": "employee"
}
```

**Create Client User:**
```bash
POST /api/auth/register
{
  "username": "client1",
  "email": "contact@clientcompany.com",
  "password": "clientpass123",
  "role": "client",
  "client_id": 1  // Must match a client in the clients table
}
```

## 🔒 Security Best Practices

### In Production:
1. **Change all default passwords immediately**
2. **Use strong JWT_SECRET** (at least 32 random characters)
3. **Enable HTTPS** (use nginx or similar as reverse proxy)
4. **Configure CSP properly** in helmet settings
5. **Set secure cookie options** for JWT storage
6. **Regular database backups**
7. **Monitor rate limiting logs**
8. **Keep dependencies updated**

### Password Requirements:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers
- Consider adding special characters requirement

## 📊 Database Migrations Needed

If you have existing data, you'll need to migrate:

1. **Add columns to clients table:**
```sql
ALTER TABLE clients ADD COLUMN client_number TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN address TEXT;
ALTER TABLE clients ADD COLUMN city TEXT;
ALTER TABLE clients ADD COLUMN state TEXT;
ALTER TABLE clients ADD COLUMN zip_code TEXT;
```

2. **Add location to tests:**
```sql
ALTER TABLE tests ADD COLUMN location TEXT;
```

3. **Run migrations for new tables** (users, client_contacts, calibration_snapshots)
   - The database.js will create these automatically on first run

## 🎯 Next Development Priorities

1. ✅ **Implement frontend authentication** - Users can't login yet!
2. **Add client portal** - Clients need their own view
3. **Implement calibration snapshots** - Preserve history
4. **Add client contacts management** - Multiple contacts per client
5. **Dark mode** - Better user experience
6. **Protected routes** - Secure all endpoints
7. **Client-specific streaming** - Secure stream access

## 🐛 Testing Checklist

- [ ] Can create admin user
- [ ] Can login as admin
- [ ] Can create employee users
- [ ] Can create client users
- [ ] Clients can only see their own data
- [ ] FRA employees can see all data
- [ ] Equipment IDs auto-generate (HFG-01, TCM-02, etc.)
- [ ] Calibrations link to tests
- [ ] Tests have location field
- [ ] Rate limiting works (test with 100+ requests)
- [ ] JWT tokens expire correctly
- [ ] Password change works
- [ ] Search works for both tests and equipment

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - List all users (admin only)

### Protected Routes
All routes except login require JWT token:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 🆘 Troubleshooting

### "Database is locked" error
- Close all database connections
- Delete testtracking.db and restart (will recreate)

### "Invalid token" error
- Token may have expired (default 7 days)
- Login again to get new token

### Equipment IDs not auto-generating
- Check that equipment_types table has data
- Verify type_code matches dropdown selection

### Can't see other clients' data
- This is by design! Clients should only see their own data
- Login as admin/employee to see all data

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review error logs in console
3. Check database schema matches expected structure
4. Verify environment variables are set correctly

---

**Current Version:** 2.0.0
**Last Updated:** 2025
**Branch:** claude/test-tracking-dashboard-011CUuTcbejaMzcgmffbvGi7
