import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Home,
  TestTube,
  Settings,
  Users,
  Video,
  BarChart3,
  FileText,
  Flame
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestDetail from './pages/TestDetail';
import Calibrations from './pages/Calibrations';
import Clients from './pages/Clients';
import StreamViewer from './pages/StreamViewer';
import GlobalSearch from './components/GlobalSearch';
import './App.css';

function Navigation() {
  const location = useLocation();

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
        <h1>Fire Lab</h1>
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
    </nav>
  );
}

function App() {
  return (
    <Router>
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
              FRA Lab - Fire Research & Analysis
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
    </Router>
  );
}

export default App;
