# 🚀 Quick Start Guide - Fire & Risk Alliance Lab

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### Step 2: Start the Application
```bash
# This runs both backend and frontend
npm run dev
```

The application will start:
- **Backend API:** http://localhost:5000
- **Frontend:** http://localhost:3000

### Step 3: Login
1. Open http://localhost:3000 in your browser
2. You'll be redirected to the login page
3. Use default credentials:
   - **Username:** `admin`
   - **Password:** `changeme123`
4. Click "Sign In"

## ✅ You're Ready!

Once logged in, you can:

### 🧪 **Create Tests**
1. Click "Tests" in the sidebar
2. Click "New Test"
3. Fill in:
   - Title (required)
   - Test Type (e.g., "Fire Resistance Test")
   - Governing Standard (e.g., "ASTM E119")
   - Location (e.g., "Lab A")
   - Client
   - Date and Status
   - Tags (comma-separated)
4. Click "Create"

### ⚙️ **Add Calibrated Equipment**
1. Click "Calibrations" in the sidebar
2. Click "Add Calibration"
3. Select Equipment Type (e.g., "Heat Flux Gauge")
4. Click the magic wand ✨ to auto-generate ID (HFG-01, HFG-02, etc.)
5. Enter equipment name and dates
6. Upload PDF certificate
7. Click "Add Calibration"

### 🔗 **Link Equipment to Tests**
1. Open any test
2. In the "Calibration Equipment" section
3. Click "Add Equipment"
4. Select equipment from the list
5. Click "Add to Test"

The system automatically creates a snapshot of the calibration at that moment, preserving it forever!

### 👥 **Add Clients**
1. Click "Clients" in the sidebar
2. Click "Add Client"
3. Enter client name
4. Click "Add Client"

### 🔍 **Search Everything**
Use the search bar at the top to find:
- Tests by name or standard
- Equipment by ID or type
- Results appear instantly

## 🔐 User Roles

**Admin (you are here):**
- Full access to everything
- Can create users
- Can manage all data

**FRA Employee:**
- Full access to tests and equipment
- Cannot create users

**Client:**
- Only sees their own tests
- Read-only access

## 📸 Testing the System

Try this workflow:

1. **Create a client** (Clients → Add Client → "Test Company")
2. **Add equipment** (Calibrations → Add → Heat Flux Gauge → Auto-generate HFG-01)
3. **Create a test** (Tests → New → Fill form → Assign to "Test Company")
4. **Link equipment** (Open test → Add Equipment → Select HFG-01)
5. **Upload media** (In test → Upload Media → Select files)
6. **Search** (Top search bar → Type "HFG" → See results)

## 🎯 Available Equipment Types

Auto-ID generation works for:
- **HFG** - Heat Flux Gauge
- **TCM** - TC Mod
- **CRM** - Current Mod
- **VLM** - Voltage Mod
- **SRM** - Serial Mod
- **MM** - Multimeter
- **RH** - Relative Humidity Sensor
- **ANM** - Anemometer
- **SW** - Stop Watch
- **TM** - Tape Measure

## 🛡️ Security Features Working

- ✅ JWT authentication
- ✅ Role-based access
- ✅ Password hashing
- ✅ Rate limiting (100 req/15min)
- ✅ Security headers
- ✅ Protected routes
- ✅ Session management

## 📊 Database Location

Your data is stored in:
```
server/db/testtracking.db
```

To reset everything (CAUTION - deletes all data):
```bash
rm server/db/testtracking.db
# Restart the server - it will recreate with default admin
```

## 🐛 Troubleshooting

**Can't login?**
- Make sure backend is running (npm run dev)
- Check console for errors
- Try username: `admin` password: `changeme123`

**Equipment ID not generating?**
- Select equipment type first
- Then click the wand button
- It auto-increments (HFG-01, HFG-02, etc.)

**Changes not saving?**
- Check browser console (F12)
- Ensure backend is running on port 5000
- Check for CORS errors

## 🎨 User Interface

- **Red theme** - Fire & Risk Alliance branding
- **Sidebar** - Main navigation
- **Search bar** - Global search (top right)
- **User menu** - Bottom of sidebar (username, role, logout)

## 📱 Next Steps

After testing, you can:

1. **Create more users** (need Postman/API tool)
2. **Customize equipment types** (add more types in database.js)
3. **Add client contacts** (coming soon)
4. **Enable dark mode** (coming soon)
5. **Configure client portals** (coming soon)

## 🔧 Development

**Backend:** http://localhost:5000
- Express server with SQLite
- JWT authentication
- Security middleware

**Frontend:** http://localhost:3000
- React application
- Material-inspired design
- Real-time updates

**API Documentation:** See SETUP.md

## ✨ Features Working Now

✅ Full authentication system
✅ Create/edit tests with location
✅ Equipment auto-ID generation
✅ Search tests and equipment
✅ Upload media files
✅ Link equipment to tests
✅ Client management
✅ Role-based access
✅ User info in sidebar
✅ Logout functionality

---

**Need Help?** Check SETUP.md for detailed documentation.

**Ready to test?** Just run `npm run dev` and visit http://localhost:3000!
