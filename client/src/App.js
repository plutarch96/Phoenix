import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Home,
  TestTube,
  Settings,
  Users,
  Video,
  Flame,
  LogOut,
  User as UserIcon
} from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetail from './pages/TestDetail';
import Calibrations from './pages/Calibrations';
import Clients from './pages/Clients';
import StreamViewer from './pages/StreamViewer';
import GlobalSearch from './components/GlobalSearch';
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
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/tests', icon: TestTube, label: 'Tests' },
    { path: '/calibrations', icon: Settings, label: 'Calibrations' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/stream', icon: Video, label: 'Live Stream' },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Flame size={32} />
        <h1>FRA Lab</h1>
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

      {/* User Info and Logout */}
      {user && (
        <div style={{
          marginTop: 'auto',
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
        <div style={{
          padding: '1rem 2rem',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, color: '#1e293b' }}>
            Fire & Risk Alliance Laboratory
          </h3>
          <GlobalSearch />
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/:id" element={<TestDetail />} />
          <Route path="/calibrations" element={<Calibrations />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/stream" element={<StreamViewer />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
