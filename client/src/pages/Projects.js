import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, FileText, Upload, Download, Trash2, Edit2, Search, Mail, Phone, User, ChevronDown, ChevronRight, Users as UsersIcon, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectsAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';

function Projects() {
  const { user, isClient, isFRAEmployee } = useAuth();
  const toast = useToast();
  const [clientsWithProjects, setClientsWithProjects] = useState([]);
  const [expandedClients, setExpandedClients] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadClientsAndProjects();
  }, []);

  const loadClientsAndProjects = async () => {
    try {
      // Load clients
      const clientsRes = await clientsAPI.getAll();
      let clients = clientsRes.data;

      // If user is a client, filter to only their client
      if (isClient() && user.client_id) {
        clients = clients.filter(c => c.id === user.client_id);
      }

      // Load projects for each client
      const clientsWithProjectsData = await Promise.all(
        clients.map(async (client) => {
          try {
            const projectsRes = await projectsAPI.getAll({ client_id: client.id, include_tests: true });
            return {
              ...client,
              projects: projectsRes.data
            };
          } catch (error) {
            console.error(`Error loading projects for client ${client.id}:`, error);
            return {
              ...client,
              projects: []
            };
          }
        })
      );

      setClientsWithProjects(clientsWithProjectsData);

      // Auto-expand first client for client users
      if (isClient() && clientsWithProjectsData.length > 0) {
        setExpandedClients({ [clientsWithProjectsData[0].id]: true });
      }
    } catch (error) {
      console.error('Error loading clients and projects:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleDeleteProject = (projectId) => {
    setConfirmDialog({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await projectsAPI.delete(projectId);
          toast.success('Project deleted successfully');
          loadClientsAndProjects();
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error(error.response?.data?.error || 'Failed to delete project');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleProjectSaved = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
    setSelectedClient(null);
    loadClientsAndProjects();
  };

  const openNewProjectModal = () => {
    setSelectedProject(null);
    setSelectedClient(null);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    const client = clientsWithProjects.find(c => c.id === project.client_id);
    setSelectedProject(project);
    setSelectedClient(client);
    setShowProjectModal(true);
  };

  const getTestId = (project, test) => {
    const clientNum = project.client_number || '###';
    const projectNum = project.project_number || '###';
    const testNum = test.test_number || '###';
    return `${clientNum}-${projectNum}-${testNum}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  // Filter clients and projects based on search query
  const filteredClientsWithProjects = clientsWithProjects.map(client => {
    const query = searchQuery.toLowerCase();
    if (!query) return client;

    // Filter projects within this client
    const filteredProjects = client.projects.filter(project =>
      project.project_name?.toLowerCase().includes(query) ||
      project.project_number?.toLowerCase().includes(query) ||
      client.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );

    return {
      ...client,
      projects: filteredProjects
    };
  }).filter(client => {
    // Only include clients that have matching projects or matching client name
    if (!searchQuery) return true;
    return client.projects.length > 0 || client.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Count total projects
  const totalProjects = clientsWithProjects.reduce((sum, client) => sum + client.projects.length, 0);
  const filteredProjectCount = filteredClientsWithProjects.reduce((sum, client) => sum + client.projects.length, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
        </div>
        {isFRAEmployee() && (
          <button className="btn btn-primary" onClick={openNewProjectModal}>
            <Plus size={20} />
            Add Project
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)'
          }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search projects by name, number, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {searchQuery ? `Found ${filteredProjectCount} project(s)` : `All Projects (${totalProjects})`}
          </h3>
        </div>
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : filteredClientsWithProjects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredClientsWithProjects.map(client => (
              <div key={client.id} className="card" style={{ margin: 0, background: 'var(--bg-secondary)' }}>
                {/* Client Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '1rem' }}
                  onClick={() => toggleClient(client.id)}
                >
                  <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    {expandedClients[client.id] ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </button>
                  <div className="stat-icon green" style={{ width: '48px', height: '48px' }}>
                    <Building size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{client.name}</h3>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Client #{client.client_number} • {client.projects.length} project(s)
                    </div>
                  </div>
                </div>

                {/* Expanded Client - Projects */}
                {expandedClients[client.id] && (
                  <div style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem' }}>
                    {client.projects.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {client.projects.map(project => (
                          <div key={project.id} className="card" style={{ margin: 0 }}>
                            {/* Project Header */}
                            <div>
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer' }}
                                onClick={() => toggleProject(project.id)}
                              >
                                <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                                  {expandedProjects[project.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>
                                <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                                  <FolderOpen size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                                      <h4 style={{ margin: 0, color: '#3b82f6', cursor: 'pointer' }}>{project.project_name}</h4>
                                    </Link>
                                    <span className={`badge badge-${project.status === 'active' ? 'success' : 'secondary'}`}>
                                      {project.status}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Project #{client.client_number}-{project.project_number} • {project.test_count || 0} test(s)
                                  </div>
                                </div>
                              </div>

                              {project.description && (
                                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '44px' }}>
                                  {project.description}
                                </p>
                              )}
                            </div>

                            {/* Expanded Project Details */}
                            {expandedProjects[project.id] && (
                              <div style={{ marginTop: '1.5rem', marginLeft: '44px', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                                {/* Tests Section */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                  <h4 style={{ margin: 0, marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
                                    Tests ({project.tests?.length || 0})
                                  </h4>
                                  {project.tests && project.tests.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      {project.tests.map(test => (
                                        <Link
                                          key={test.id}
                                          to={`/tests/${test.id}`}
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                            padding: '0.75rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: '4px',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            border: '1px solid var(--border-color)',
                                            transition: 'all 0.2s'
                                          }}
                                          className="hover-lift"
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={14} style={{ color: 'var(--text-secondary)' }} />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b82f6' }}>
                                              {getTestId(project, test)}
                                            </span>
                                            <span className={`badge badge-${
                                              test.status === 'Complete' ? 'success' :
                                              test.status === 'Planning' ? 'warning' :
                                              test.status === 'Cancelled' ? 'danger' : 'secondary'
                                            }`} style={{ marginLeft: 'auto' }}>
                                              {test.status}
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            {test.title}
                                          </div>
                                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {test.test_type && (
                                              <span>Type: {test.test_type}</span>
                                            )}
                                            {test.test_date && (
                                              <span>Date: {formatDate(test.test_date)}</span>
                                            )}
                                            {test.governing_standard && (
                                              <span>Standard: {test.governing_standard}</span>
                                            )}
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                      <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                      <p style={{ margin: 0, fontSize: '0.875rem' }}>No tests in this project yet</p>
                                    </div>
                                  )}
                                </div>

                                {/* Project Documents Section */}
                                <div style={{ marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                      Project Documents
                                    </h4>
                                    {isFRAEmployee() && (
                                      <button className="btn btn-primary btn-sm">
                                        <Upload size={16} />
                                        Upload Document
                                      </button>
                                    )}
                                  </div>
                                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <FileText size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                                      Document management coming soon
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                      Upload proposals, test plans, and client documents
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Project Actions */}
                            {isFRAEmployee() && (
                              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditProjectModal(project)}
                                >
                                  <Edit2 size={14} />
                                  Edit Project
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteProject(project.id)}
                                >
                                  <Trash2 size={14} />
                                  Delete Project
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', borderRadius: '8px', marginTop: '1rem' }}>
                        <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>No projects for this client yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              {searchQuery ? <Search size={48} /> : <FolderOpen size={48} />}
            </div>
            <p>{searchQuery ? `No results found for "${searchQuery}"` : 'No projects yet'}</p>
            {searchQuery ? (
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            ) : isFRAEmployee() && (
              <button className="btn btn-primary" onClick={openNewProjectModal}>
                Add Your First Project
              </button>
            )}
          </div>
        )}
      </div>

      {showProjectModal && (
        <ProjectModal
          project={selectedProject}
          client={selectedClient}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
            setSelectedClient(null);
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

export default Projects;
