import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Eye, FolderOpen, User, Users, UserPlus, Briefcase } from 'lucide-react';
import { testsAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function MyTests() {
  const { user, isProjectManager, isStaff } = useAuth();
  const toast = useToast();
  const [myTests, setMyTests] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [claimedProjects, setClaimedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  // Default to 'claimed' for PMs, 'joined' for staff, otherwise 'tests'
  const getDefaultTab = () => {
    if (isProjectManager()) return 'claimed';
    if (isStaff()) return 'joined';
    return 'tests';
  };
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  useEffect(() => {
    if (user) {
      loadMyItems();
    }
  }, [user]);

  const loadMyItems = async () => {
    try {
      setLoading(true);
      const promises = [
        testsAPI.getTaggedByUser(user.id),
        projectsAPI.getTaggedByUser(user.id)
      ];

      // Add claimed projects for project managers
      if (isProjectManager()) {
        promises.push(projectsAPI.getClaimedByUser(user.id));
      }

      // Add joined projects for staff
      if (isStaff()) {
        promises.push(projectsAPI.getJoinedByUser(user.id));
      }

      const results = await Promise.all(promises);
      setMyTests(results[0].data);
      setMyProjects(results[1].data);

      if (isProjectManager()) {
        setClaimedProjects(results[2].data);
      }
      if (isStaff()) {
        const idx = isProjectManager() ? 3 : 2;
        setJoinedProjects(results[idx]?.data || []);
      }
    } catch (error) {
      console.error('Error loading my items:', error);
      toast.error('Failed to load your items');
    } finally {
      setLoading(false);
    }
  };

  const handleUntagTest = async (testId) => {
    try {
      await testsAPI.untagTest(testId, user.id);
      toast.success('Test removed from My Tests');
      loadMyItems();
    } catch (error) {
      console.error('Error untagging test:', error);
      toast.error('Failed to remove test');
    }
  };

  const handleUntagProject = async (projectId) => {
    try {
      await projectsAPI.untagProject(projectId, user.id);
      toast.success('Project removed from My Projects');
      loadMyItems();
    } catch (error) {
      console.error('Error untagging project:', error);
      toast.error('Failed to remove project');
    }
  };

  const handleUnclaimProject = async (projectId) => {
    try {
      await projectsAPI.unclaimProject(projectId, user.id);
      toast.success('Project unclaimed');
      loadMyItems();
    } catch (error) {
      console.error('Error unclaiming project:', error);
      toast.error('Failed to unclaim project');
    }
  };

  const handleLeaveProject = async (projectId) => {
    try {
      await projectsAPI.leaveProject(projectId, user.id);
      toast.success('Left project');
      loadMyItems();
    } catch (error) {
      console.error('Error leaving project:', error);
      toast.error('Failed to leave project');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Proposed': 'badge-secondary',
      'Planning': 'badge-warning',
      'Complete': 'badge-success',
      'Cancelled': 'badge-danger',
      'active': 'badge-success',
      'completed': 'badge-secondary',
      'on-hold': 'badge-warning',
      'cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading your items...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>
            <Star size={28} style={{ display: 'inline', marginRight: '0.5rem' }} />
            My Items
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Tests and projects you've marked as yours
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)'
        }}>
          {isProjectManager() && (
            <button
              onClick={() => setActiveTab('claimed')}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'claimed' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'claimed' ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: activeTab === 'claimed' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              <Briefcase size={18} />
              Claimed Projects ({claimedProjects.length})
            </button>
          )}
          {isStaff() && (
            <button
              onClick={() => setActiveTab('joined')}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'joined' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'joined' ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: activeTab === 'joined' ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              <UserPlus size={18} />
              Joined Projects ({joinedProjects.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('tests')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'tests' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'tests' ? '#3b82f6' : 'var(--text-secondary)',
              fontWeight: activeTab === 'tests' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            <Eye size={18} />
            My Tests ({myTests.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '1rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'projects' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'projects' ? '#3b82f6' : 'var(--text-secondary)',
              fontWeight: activeTab === 'projects' ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              marginBottom: '-2px'
            }}
          >
            <FolderOpen size={18} />
            My Projects ({myProjects.length})
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* MY TESTS TAB */}
          {activeTab === 'tests' && (
            <div>
              {myTests.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Test ID</th>
                        <th>Title</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Test Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTests.map(test => (
                        <tr key={test.id}>
                          <td>
                            <Link to={`/tests/${test.id}`} style={{ color: '#3b82f6', fontWeight: 500 }}>
                              {test.test_number || `#${test.id}`}
                            </Link>
                          </td>
                          <td>{test.title}</td>
                          <td>{test.client_name}</td>
                          <td>{test.test_type}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(test.status)}`}>
                              {test.status}
                            </span>
                          </td>
                          <td>{formatDate(test.test_date)}</td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUntagTest(test.id)}
                              title="Remove from My Tests"
                            >
                              <Star size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Eye size={48} style={{ opacity: 0.5 }} />
                  <p>No tests marked as yours yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Mark tests as "Mine" to see them here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MY PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              {myProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myProjects.map(project => (
                    <div key={project.id} className="card" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <FolderOpen size={18} color="#3b82f6" />
                            <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
                                {project.project_name}
                              </h4>
                            </Link>
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {project.client_name} • {project.client_number}-{project.project_number} • {project.test_count} test(s)
                          </div>
                          {project.description && (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {project.description}
                            </p>
                          )}
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUntagProject(project.id)}
                          title="Remove from My Projects"
                          style={{ marginLeft: '1rem' }}
                        >
                          <Star size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FolderOpen size={48} style={{ opacity: 0.5 }} />
                  <p>No projects marked as yours yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Mark projects as "Mine" to see them here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CLAIMED PROJECTS TAB (Project Managers) */}
          {activeTab === 'claimed' && isProjectManager() && (
            <div>
              {claimedProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {claimedProjects.map(project => (
                    <div key={project.id} className="card" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Briefcase size={18} color="#3b82f6" />
                            <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
                                {project.project_name}
                              </h4>
                            </Link>
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {project.client_name} • {project.client_number}-{project.project_number} • {project.test_count} test(s)
                          </div>
                          {project.description && (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {project.description}
                            </p>
                          )}
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleUnclaimProject(project.id)}
                          title="Unclaim this project"
                          style={{ marginLeft: '1rem' }}
                        >
                          <Briefcase size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Briefcase size={48} style={{ opacity: 0.5 }} />
                  <p>No claimed projects yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Claim projects to see them here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* JOINED PROJECTS TAB (Staff) */}
          {activeTab === 'joined' && isStaff() && (
            <div>
              {joinedProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {joinedProjects.map(project => (
                    <div key={project.id} className="card" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <UserPlus size={18} color="#3b82f6" />
                            <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
                                {project.project_name}
                              </h4>
                            </Link>
                            <span className={`badge ${getStatusBadge(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            {project.client_name} • {project.client_number}-{project.project_number} • {project.test_count} test(s)
                          </div>
                          {project.description && (
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              {project.description}
                            </p>
                          )}
                        </div>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleLeaveProject(project.id)}
                          title="Leave this project"
                          style={{ marginLeft: '1rem' }}
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <UserPlus size={48} style={{ opacity: 0.5 }} />
                  <p>No joined projects yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Join projects to see them here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyTests;
