import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Home,
  TestTube,
  Settings,
  Users,
  Flame,
  LogOut,
  User as UserIcon,
  Activity,
  Tag,
  FolderOpen
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import MyTests from './pages/MyTests';
import TestDetail from './pages/TestDetail';
import Calibrations from './pages/Calibrations';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import UsersPage from './pages/Users';
import AuditLog from './pages/AuditLog';
import SearchResults from './pages/SearchResults';
import GlobalSearch from './components/GlobalSearch';
import ThemeToggle from './components/ThemeToggle';
import Toast from './components/Toast';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function Navigation() {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  // Base navigation items (visible to all)
  const baseNavItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/calibrations', icon: Settings, label: 'Calibrations' },
    { path: '/clients', icon: Users, label: 'Clients' },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { path: '/users', icon: UserIcon, label: 'User Management' },
    { path: '/audit', icon: Activity, label: 'Audit Log' },
  ];

  // Combine navigation items based on role
  const navItems = isAdmin() ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  // My Stuff - shown at bottom
  const myTestsItem = { path: '/my-tests', icon: Tag, label: 'My Stuff' };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Flame size={32} />
        <h1>FRA Lab</h1>
        <ThemeToggle />
      </div>
      <ul className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* My Stuff - at bottom above user info */}
      {user && (
        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
          <Link
            to={myTestsItem.path}
            className={`nav-item ${location.pathname === myTestsItem.path ? 'active' : ''}`}
            style={{
              marginLeft: '1.5rem',
              marginRight: '1.5rem',
              marginBottom: '1rem'
            }}
          >
            <Tag size={20} />
            <span>{myTestsItem.label}</span>
          </Link>
        </div>
      )}

      {/* User Info and Logout */}
      {user && (
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem'
          }}>
            <UserIcon size={16} />
            <div>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {user.role === 'admin' ? 'Administrator' :
                 user.role === 'project_manager' ? 'Project Manager' :
                 user.role === 'staff' ? 'Staff' :
                 user.role === 'employee' ? 'FRA Employee' : 'Client'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="nav-item"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              cursor: 'pointer',
              padding: '0.75rem',
              borderRadius: '6px'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}

function MainApp() {
  const { user } = useAuth();

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <div className="top-header">
          <h3 style={{ margin: 0 }}>
            Fire & Risk Alliance Laboratory
          </h3>
          <GlobalSearch />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/my-tests" element={<MyTests />} />
          <Route path="/tests/:id" element={<TestDetail />} />
          <Route path="/calibrations" element={<Calibrations />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <PrivateRoute>
                  <MainApp />
                </PrivateRoute>
              } />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
