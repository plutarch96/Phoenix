# Test Tracking Dashboard

A comprehensive web application for tracking test data, managing calibration equipment, and streaming video from OBS to clients. Built with Node.js, Express, SQLite, and React.

## Features

### 📊 Dashboard
- Real-time statistics overview
- Test status tracking
- Calibration alerts and expiration warnings
- Recent activity feed

### 🧪 Test Management
- Create and manage tests with detailed information
- Tag tests for easy categorization and analytics
- Associate tests with clients
- Track test status (pending, in-progress, completed, failed)
- Link calibrated equipment to tests
- Upload and manage test media (images, videos, data files)

### ⚙️ Calibration Equipment Database
- Track calibration certificates with expiration dates
- Upload and store calibration PDFs
- Automatic expiration status tracking
- Equipment search and filtering
- Link equipment to specific tests

### 📁 Media Management
- Upload images, videos, and data files
- Organize media by test
- Support for multiple file types
- Image and video preview
- File download capabilities

### 📹 OBS Video Streaming
- Real-time video streaming interface
- Socket.IO-based communication
- Stream viewer with live status indicators
- Ready for WebRTC or RTMP integration

### 👥 Client Management
- Track client contacts and information
- Associate tests with specific clients
- Client statistics and test history

### 📈 Analytics
- Test trends and statistics
- Popular tags analysis
- Client activity reports
- Media file analytics

## Technology Stack

**Backend:**
- Node.js + Express
- SQLite3 database
- Socket.IO for real-time streaming
- Multer for file uploads

**Frontend:**
- React 18
- React Router for navigation
- Axios for API calls
- Lucide React for icons
- Custom CSS styling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Install Dependencies

Install root dependencies:
```bash
npm install
```

Install client dependencies:
```bash
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### Step 2: Start the Application

**Option 1: Run both server and client together (recommended)**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 - Start the backend server:
```bash
npm run server
```

Terminal 2 - Start the React frontend:
```bash
npm run client
```

### Step 3: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health

## Usage Guide

### Creating a Test

1. Navigate to the **Tests** page
2. Click **New Test** button
3. Fill in the test details:
   - Title (required)
   - Description
   - Client
   - Test date
   - Status
   - Tags (comma-separated)
4. Click **Create**

### Adding Calibration Equipment

1. Navigate to the **Calibrations** page
2. Click **Add Calibration**
3. Fill in the equipment details:
   - Equipment name
   - Equipment ID (unique)
   - Calibration date
   - Expiration date
   - Calibrated by
   - Notes
   - Upload calibration certificate PDF
4. Click **Add Calibration**

### Uploading Test Media

1. Open a test detail page
2. In the **Media Files** section, click **Upload Media**
3. Select one or more files
4. Choose media type (or let it auto-detect)
5. Add an optional description
6. Click **Upload**

### Linking Calibration to a Test

1. Open a test detail page
2. In the **Calibration Equipment** section, click **Add Equipment**
3. Search for and select the calibration equipment
4. Click **Add to Test**

### Managing Clients

1. Navigate to the **Clients** page
2. Click **Add Client**
3. Enter client details:
   - Name
   - Contact email
   - Contact phone
4. Click **Add Client**

### OBS Video Streaming

The application includes a basic streaming interface. To stream from OBS:

1. Navigate to the **Live Stream** page
2. In OBS Studio:
   - Go to Settings → Stream
   - Select "Custom" as the service
   - Enter server URL: `http://localhost:5000`
3. For production use, implement WebRTC or RTMP streaming

**Note:** The current implementation provides the Socket.IO infrastructure. For full video streaming, consider integrating:
- **node-media-server** for RTMP/HLS streaming
- **mediasoup** or **kurento** for WebRTC
- **Jitsi** for full video conferencing

## Project Structure

```
test-tracking-dashboard/
├── server/                 # Backend server
│   ├── db/                # Database setup
│   │   └── database.js    # SQLite schema
│   ├── routes/            # API routes
│   │   ├── tests.js       # Test endpoints
│   │   ├── calibrations.js
│   │   ├── clients.js
│   │   ├── media.js
│   │   └── analytics.js
│   ├── uploads/           # File storage
│   │   ├── tests/         # Test media files
│   │   └── calibrations/  # Calibration PDFs
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── TestModal.js
│   │   │   ├── CalibrationModal.js
│   │   │   ├── ClientModal.js
│   │   │   ├── MediaUpload.js
│   │   │   └── CalibrationSelector.js
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Tests.js
│   │   │   ├── TestDetail.js
│   │   │   ├── Calibrations.js
│   │   │   ├── Clients.js
│   │   │   └── StreamViewer.js
│   │   ├── services/      # API services
│   │   │   └── api.js
│   │   ├── App.js         # Main app component
│   │   ├── App.css        # Styles
│   │   └── index.js       # React entry point
│   └── package.json
├── package.json           # Root package file
└── README.md             # This file
```

## API Endpoints

### Tests
- `GET /api/tests` - Get all tests (with optional filters)
- `GET /api/tests/:id` - Get test details
- `POST /api/tests` - Create new test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test
- `POST /api/tests/:id/calibrations` - Link calibration to test
- `DELETE /api/tests/:id/calibrations/:calibration_id` - Unlink calibration

### Calibrations
- `GET /api/calibrations` - Get all calibrations
- `GET /api/calibrations/:id` - Get calibration details
- `POST /api/calibrations` - Create new calibration (with PDF upload)
- `PUT /api/calibrations/:id` - Update calibration
- `DELETE /api/calibrations/:id` - Delete calibration

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Media
- `GET /api/media/test/:test_id` - Get all media for a test
- `POST /api/media/upload` - Upload media files
- `PUT /api/media/:id` - Update media description
- `DELETE /api/media/:id` - Delete media

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/trends/tests` - Get test trends
- `GET /api/analytics/tags` - Get all tags
- `GET /api/analytics/tags/popular` - Get popular tags
- `GET /api/analytics/clients/stats` - Get client statistics
- `GET /api/analytics/activity/recent` - Get recent activity

## Database Schema

The application uses SQLite with the following tables:

- **tests** - Test records with title, description, status, dates
- **test_tags** - Tags associated with tests
- **calibrations** - Calibration equipment records
- **test_calibrations** - Many-to-many relationship between tests and calibrations
- **clients** - Client contact information
- **test_media** - Media files associated with tests

## Development

### Running in Development Mode

The application is configured to run in development mode with hot-reloading:

```bash
npm run dev
```

This will start both the backend and frontend concurrently.

### Building for Production

Build the React frontend:
```bash
npm run build
```

This creates an optimized production build in `client/build/`.

## Customization

### Port Configuration

Default ports:
- Backend: 5000
- Frontend: 3000

To change the backend port, set the `PORT` environment variable:
```bash
PORT=8000 npm run server
```

### Database Location

The SQLite database is stored at `server/db/testtracking.db`. To change the location, modify `server/db/database.js`.

### File Upload Limits

Current limits:
- Calibration PDFs: 10MB
- Test media: 500MB per file

Modify these in the respective route files (`server/routes/calibrations.js` and `server/routes/media.js`).

## Troubleshooting

### Port Already in Use

If you get an error that port 5000 or 3000 is already in use:

1. Kill the process using the port
2. Or change the port as described above

### Database Errors

If you encounter database errors:

1. Delete the database file: `server/db/testtracking.db`
2. Restart the server - it will recreate the database

### File Upload Issues

If file uploads fail:

1. Check that the `server/uploads` directory exists and is writable
2. Verify file size limits
3. Check file type restrictions

## Future Enhancements

- [ ] Full WebRTC or RTMP video streaming implementation
- [ ] User authentication and authorization
- [ ] Export reports to PDF/Excel
- [ ] Advanced analytics and charts
- [ ] Email notifications for calibration expirations
- [ ] Barcode/QR code scanning for equipment
- [ ] Mobile responsive improvements
- [ ] Dark mode theme

## License

This project is open source and available for use and modification.

## Support

For issues, questions, or contributions, please refer to the project repository.
