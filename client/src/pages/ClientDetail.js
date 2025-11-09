import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users, Mail, Phone, MapPin, Edit2, Trash2, Plus,
  FolderOpen, FileText, Activity as ActivityIcon, File
} from 'lucide-react';
import { clientsAPI, projectsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Breadcrumb from '../components/Breadcrumb';
import ClientModal from '../components/ClientModal';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isFRAEmployee, canManageProjects } = useAuth();
  const toast = useToast();

  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [projectMembers, setProjectMembers] = useState({});

  useEffect(() => {
    loadClient();
  }, [id]);

  useEffect(() => {
    if (projects.length > 0) {
      loadProjectMembers();
    }
  }, [projects]);

  const loadClient = async () => {
    try {
      const [clientRes, projectsRes, activityRes] = await Promise.all([
        clientsAPI.getById(id),
        projectsAPI.getAll({ client_id: id, include_tests: true }),
        analyticsAPI.getRecentActivity(20)
      ]);

      setClient(clientRes.data);
      setProjects(projectsRes.data);
      // Filter activity for this client
      setRecentActivity(activityRes.data.filter(a => a.client_id == id));
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Failed to load client details');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    try {
      const membersPromises = projects.map(project =>
        projectsAPI.getMembers(project.id).then(res => ({ projectId: project.id, data: res.data }))
      );
      const membersResults = await Promise.all(membersPromises);
      const membersMap = {};
      membersResults.forEach(({ projectId, data }) => {
        membersMap[projectId] = data;
      });
      setProjectMembers(membersMap);
    } catch (error) {
      console.error('Error loading project members:', error);
    }
  };

  const handleClientUpdated = () => {
    setShowClientModal(false);
    loadClient();
    toast.success('Client updated successfully');
  };

  const handleProjectSaved = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
    loadClient();
    toast.success(selectedProject ? 'Project updated successfully' : 'Project created successfully');
  };

  const handleDeleteClient = () => {
    setConfirmDialog({
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client? This will also delete all associated projects and tests.',
      onConfirm: async () => {
        try {
          await clientsAPI.delete(id);
          toast.success('Client deleted successfully');
          navigate('/clients');
        } catch (error) {
          console.error('Error deleting client:', error);
          toast.error('Failed to delete client');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDeleteProject = (projectId) => {
    setConfirmDialog({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await projectsAPI.delete(projectId);
          loadClient();
          toast.success('Project deleted successfully');
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error(error.response?.data?.error || 'Failed to delete project');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const getTestId = (project, test) => {
    const clientNum = client.client_number || '###';
    const projectNum = project.project_number || '###';
    const testNum = test.test_number || '###';
    return `${clientNum}-${projectNum}-${testNum}`;
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
    return <div className="page"><div className="loading">Loading client details...</div></div>;
  }

  if (!client) {
    return <div className="page"><div className="empty-state">Client not found</div></div>;
  }

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: 'Clients', path: '/clients' },
          { label: client.name }
        ]}
      />

      {/* CLIENT HEADER */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="stat-icon blue" style={{ width: '56px', height: '56px' }}>
              <Users size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, marginBottom: '0.25rem' }}>{client.name}</h2>
              {client.client_number && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Client #{client.client_number}
                </div>
              )}
            </div>
          </div>
          {canManageProjects() && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowClientModal(true)}>
                <Edit2 size={16} />
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteClient}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{projects.length}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Projects</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {projects.reduce((sum, p) => sum + (p.test_count || 0), 0)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Tests</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {projects.filter(p => p.status === 'active').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Projects</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'projects', label: 'Projects', icon: FolderOpen },
            { id: 'documents', label: 'Documents', icon: File },
            { id: 'overview', label: 'Contact', icon: Users },
            { id: 'activity', label: 'Recent Activity', icon: ActivityIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab.id ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                marginBottom: '-2px'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Client Information</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {client.contact_email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email</div>
                      <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6', fontWeight: 500 }}>
                        {client.contact_email}
                      </a>
                    </div>
                  </div>
                )}

                {client.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone</div>
                      <span style={{ fontWeight: 500 }}>{client.contact_phone}</span>
                    </div>
                  </div>
                )}

                {(client.address || client.city || client.state || client.zip_code) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Address</div>
                      <div style={{ fontWeight: 500 }}>
                        {client.address && <div>{client.address}</div>}
                        {(client.city || client.state || client.zip_code) && (
                          <div>
                            {[client.city, client.state, client.zip_code].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!client.contact_email && !client.contact_phone && !client.address && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <p>No contact information available</p>
                    {canManageProjects() && (
                      <button className="btn btn-primary btn-sm" onClick={() => setShowClientModal(true)} style={{ marginTop: '1rem' }}>
                        <Edit2 size={16} />
                        Add Contact Info
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Projects ({projects.length})</h3>
                {canManageProjects() && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowProjectModal(true)}>
                    <Plus size={16} />
                    Add Project
                  </button>
                )}
              </div>

              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {projects.map(project => {
                    const members = projectMembers[project.id] || { claimed_by: null, members: [] };

                    return (
                      <div key={project.id} style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <FolderOpen size={18} color="#3b82f6" />
                          <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
                              {project.project_name}
                            </h4>
                          </Link>
                          <span className={`badge badge-${project.status === 'active' ? 'success' : 'secondary'}`}>
                            {project.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          Project #{client.client_number}-{project.project_number} • {project.test_count || 0} test(s)
                        </div>
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          <strong>PM:</strong> {members.claimed_by ? members.claimed_by.username : 'None'}
                        </div>
                        {project.description && (
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {project.description}
                          </p>
                        )}
                        {members.members.length > 0 && (
                          <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                            <strong>Staff:</strong> {members.members.map(m => m.username).join(', ')}
                          </div>
                        )}

                        {/* Project actions */}
                        {canManageProjects() && (
                          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedProject(project);
                                setShowProjectModal(true);
                              }}
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <FolderOpen size={48} style={{ opacity: 0.5 }} />
                  <p>No projects yet</p>
                  {canManageProjects() && (
                    <button className="btn btn-primary" onClick={() => setShowProjectModal(true)}>
                      <Plus size={20} />
                      Create First Project
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
              {recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentActivity.map((activity, index) => (
                    <div key={index} style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                        <ActivityIcon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{activity.description || 'Activity'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {formatDate(activity.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <ActivityIcon size={48} style={{ opacity: 0.5 }} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="empty-state">
              <File size={48} style={{ opacity: 0.5 }} />
              <p>Client document management coming soon</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Upload contracts, agreements, and other client-related documents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showClientModal && (
        <ClientModal
          client={client}
          onClose={() => setShowClientModal(false)}
          onSuccess={handleClientUpdated}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={selectedProject}
          client={client}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          onSuccess={handleProjectSaved}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}

export default ClientDetail;
