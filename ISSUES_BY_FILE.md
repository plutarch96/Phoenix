# Dark Mode Contrast Issues - Organized by File

## CRITICAL ISSUE: Badge-Info (Proposed Tag - Blue on Black)

### Problem Location
**File**: `/home/user/Phoenix/client/src/App.css`
**Lines**: 464-473

**Current Code**:
```css
464: .badge-info {
465:   background: var(--badge-bg-info);
466:   color: #3b82f6;
467:   border-color: #3b82f6;
468: }
469:
470: .dark-mode .badge-info {
471:   color: #60a5fa;              // Light blue text
472:   border-color: #60a5fa;
473: }
```

**CSS Variable Reference** (Lines 66, 1):
```css
66:   --badge-bg-info: #1e3a8a;     // Dark blue background
```

**Issue**: Light blue (#60a5fa) text on dark blue (#1e3a8a) = ~2.5:1 contrast (WCAG FAIL)

**Used For These Statuses**:
- `/home/user/Phoenix/client/src/pages/TestDetail.js:152-156` - "in-progress" status
- `/home/user/Phoenix/client/src/pages/Users.js:104` - "staff" role badge
- `/home/user/Phoenix/client/src/pages/AuditLog.js:63-69` - audit log actions

---

## MISSING CLASS: Badge-Secondary (Proposed Status)

### Missing Definition
**File**: `/home/user/Phoenix/client/src/App.css`
**Issue**: Class `.badge-secondary` is used in code but NOT DEFINED in CSS

### Files Using badge-secondary (in order of severity):

1. **Tests.js:63** - "Proposed" status
   ```javascript
   'Proposed': 'badge-secondary',
   ```

2. **MyTests.js:107** - "Proposed" status  
   ```javascript
   'Proposed': 'badge-secondary',
   ```

3. **MyTests.js:112** - "completed" status
   ```javascript
   'completed': 'badge-secondary',
   ```

4. **Dashboard.js:195** - "Proposed" status
   ```javascript
   test.status === 'Proposed' ? 'badge-secondary' : 'badge-danger'
   ```

5. **Users.js:107** - Fallback badge for roles
   ```javascript
   return badges[role] || 'badge-secondary';
   ```

6. **SearchResults.js:405** - Tag overflow badge
   ```javascript
   <span className="badge badge-secondary">+{test.tags.length - 3}</span>
   ```

7. **SearchResults.js:410** - Status fallback
   ```javascript
   'secondary'` : 'secondary'
   ```

8. **Projects.js:325** - Inactive project status
   ```javascript
   'badge-secondary'}`
   ```

9. **ProjectDetail.js:314** - Inactive project status
   ```javascript
   'badge-secondary'}`
   ```

10. **ClientDetail.js:319** - Inactive project status
    ```javascript
    'badge-secondary'}`
    ```

11. **Clients.js:402** - Inactive project status
    ```javascript
    'badge-secondary'}`
    ```

---

## HARDCODED BLUE COLORS (#3b82f6) - Won't Adapt to Dark Mode

### Breadcrumb.js

**File**: `/home/user/Phoenix/client/src/components/Breadcrumb.js`

**Lines 32, 53**:
```javascript
32:        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
53:                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
```
**Issue**: Blue hardcoded - should use `var(--icon-blue)`

---

### MyTests.js

**File**: `/home/user/Phoenix/client/src/pages/MyTests.js`

**Line 160** - Tab active color:
```javascript
160:              color: activeTab === 'tests' ? '#3b82f6' : 'var(--text-secondary)',
```

**Line 180** - Tab active color:
```javascript
180:              color: activeTab === 'projects' ? '#3b82f6' : 'var(--text-secondary)',
```

**Line 201** - Tab active color:
```javascript
201:                color: activeTab === 'claimed' ? '#3b82f6' : 'var(--text-secondary)',
```

**Line 223** - Tab active color:
```javascript
223:                color: activeTab === 'joined' ? '#3b82f6' : 'var(--text-secondary)',
```

**Line 261** - Test link color:
```javascript
261:                            <Link to={`/tests/${test.id}`} style={{ color: '#3b82f6', fontWeight: 500 }}>
```

**Lines 310, 312** - Project heading:
```javascript
310:                            <FolderOpen size={18} color="#3b82f6" />
312:                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

**Lines 363, 365** - Project heading:
```javascript
363:                            <Briefcase size={18} color="#3b82f6" />
365:                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

**Lines 416, 418** - Project heading:
```javascript
416:                            <UserPlus size={18} color="#3b82f6" />
418:                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

---

### ClientDetail.js

**File**: `/home/user/Phoenix/client/src/pages/ClientDetail.js`

**Line 169** - Project count:
```javascript
169:            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{projects.length}</div>
```

**Line 208** - Tab active color:
```javascript
208:                color: activeTab === tab.id ? '#3b82f6' : 'var(--text-secondary)',
```

**Line 237** - Email link:
```javascript
237:                      <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6', fontWeight: 500 }}>
```

**Lines 313, 315** - Project heading:
```javascript
313:                        <FolderOpen size={18} color="#3b82f6" />
315:                          <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

---

### Clients.js

**File**: `/home/user/Phoenix/client/src/pages/Clients.js`

**Line 311** - Email link:
```javascript
311:                      <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6' }}>
```

**Lines 352, 386** - Project heading:
```javascript
352:                              <FolderOpen size={18} color="#3b82f6" />
386:                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

**Line 442** - Member count:
```javascript
442:                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6' }}>
```

---

### ProjectDetail.js

**File**: `/home/user/Phoenix/client/src/pages/ProjectDetail.js`

**Line 405** - Email link:
```javascript
405:                <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6' }}>
```

**Line 464** - Member count:
```javascript
464:                      <span style={{ fontWeight: 600, color: '#3b82f6', fontSize: '1rem' }}>
```

---

### Projects.js

**File**: `/home/user/Phoenix/client/src/pages/Projects.js`

**Lines 319, 321** - Project heading:
```javascript
319:                                <FolderOpen size={18} color="#3b82f6" />
321:                                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
```

**Line 343** - Member count:
```javascript
343:                                      <Briefcase size={14} color="#3b82f6" />
```

---

## HARDCODED DARK BLUE (#1e40af) - Won't Adapt to Dark Mode

### Users.js

**File**: `/home/user/Phoenix/client/src/pages/Users.js`

**Line 254** - Staff role heading:
```javascript
254:              <strong style={{ color: '#1e40af' }}>Staff</strong>
```

**Lines 157-166** - Table headers (all use #64748b):
```javascript
158:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>User</th>
159:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Email</th>
160:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Role</th>
161:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Client</th>
162:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status</th>
163:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Created</th>
164:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Last Login</th>
165:                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Actions</th>
```

---

### StreamViewer.js

**File**: `/home/user/Phoenix/client/src/pages/StreamViewer.js`

**Line 137** - Note text:
```javascript
137:            <strong style={{ color: '#1e40af' }}>Note:</strong>
```

**Line 138** - Note text:
```javascript
138:            <p style={{ margin: '0.5rem 0 0 0', color: '#1e3a8a' }}>
```

---

## ROLE EXPLANATION BOXES - Light Theme Only (Won't Work in Dark Mode)

### Users.js

**File**: `/home/user/Phoenix/client/src/pages/Users.js`
**Lines**: 231-269

**Admin Box (231-238)**:
```javascript
231: <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
234:   <strong style={{ color: '#991b1b' }}>Admin</strong>
236:   <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
```

**Project Manager Box (241-248)**:
```javascript
241: <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
244:   <strong style={{ color: '#92400e' }}>Project Manager</strong>
246:   <p style={{ fontSize: '0.875rem', color: '#78350f', margin: 0 }}>
```

**Staff Box (251-259)** - CRITICAL in dark mode:
```javascript
251: <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
253:   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
254:     <Briefcase size={20} color="#3b82f6" />
255:     <strong style={{ color: '#1e40af' }}>Staff</strong>
256:   </div>
257:   <p style={{ fontSize: '0.875rem', color: '#1e3a8a', margin: 0 }}>
```

**Client Box (261-268)**:
```javascript
261: <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
264:   <strong style={{ color: '#065f46' }}>Client</strong>
266:   <p style={{ fontSize: '0.875rem', color: '#064e3b', margin: 0 }}>
```

---

## STREAMVIEWER HARDCODED COLORS - Light Theme Only

### StreamViewer.js

**File**: `/home/user/Phoenix/client/src/pages/StreamViewer.js`
**Lines**: 125-142

**Light gray background (125)**:
```javascript
125: <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
```

**Code block background (132)**:
```javascript
132:            <li>Enter the server URL: <code style={{ background: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
```

**Note box (136)** - Critical:
```javascript
136:          <div style={{ marginTop: '1rem', padding: '1rem', background: '#dbeafe', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
137:            <strong style={{ color: '#1e40af' }}>Note:</strong>
138:            <p style={{ margin: '0.5rem 0 0 0', color: '#1e3a8a' }}>
```

---

## SUMMARY TABLE - All Issues by Severity

| File | Type | Issue | Severity | Lines |
|------|------|-------|----------|-------|
| App.css | CSS | Missing .badge-secondary | HIGH | N/A |
| App.css | CSS | badge-info contrast fail | CRITICAL | 464-473 |
| Breadcrumb.js | Color | Hardcoded #3b82f6 | HIGH | 32, 53 |
| MyTests.js | Color | Hardcoded #3b82f6 (5 places) | HIGH | 160,180,201,223,261,310,312,363,365,416,418 |
| ClientDetail.js | Color | Hardcoded #3b82f6 | HIGH | 169,208,237,313,315 |
| Clients.js | Color | Hardcoded #3b82f6 | HIGH | 311,352,386,442 |
| ProjectDetail.js | Color | Hardcoded #3b82f6 | HIGH | 405,464 |
| Projects.js | Color | Hardcoded #3b82f6 | HIGH | 319,321,343 |
| Users.js | Color | Hardcoded #1e40af, #64748b | HIGH | 157-166,254 |
| Users.js | Styling | Role boxes light-only | HIGH | 231-269 |
| StreamViewer.js | Styling | Hardcoded light colors | HIGH | 125-142 |

