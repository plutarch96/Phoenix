import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, FileText, Upload, Download, Trash2, Edit2, Search, Mail, Phone, User, Users, ChevronDown, ChevronRight, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectsAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportProjects, printPage } from '../utils/exportUtils';

function Projects() {
  const { user, isClient, isFRAEmployee, canManageProjects } = useAuth();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [projectsByClient, setProjectsByClient] = useState({});
  const [expandedClients, setExpandedClients] = useState({});
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
      const [clientsRes, projectsRes] = await Promise.all([
        clientsAPI.getAll(),
        isClient() && user.client_id
          ? projectsAPI.getAll({ client_id: user.client_id, include_tests: true })
          : projectsAPI.getAll({ include_tests: true })
      ]);

      setClients(clientsRes.data);

      // Group projects by client
      const grouped = {};
      projectsRes.data.forEach(project => {
        if (!grouped[project.client_id]) {
          grouped[project.client_id] = [];
        }
        grouped[project.client_id].push(project);
      });
      setProjectsByClient(grouped);

      // Auto-expand first client for client users
      if (isClient() && clientsRes.data.length > 0) {
        setExpandedClients({ [clientsRes.data[0].id]: true });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load projects');
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

  const openNewProjectModal = (client = null) => {
    setSelectedProject(null);
    setSelectedClient(client);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    const client = clients.find(c => c.id === project.client_id);
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
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    // Check if client matches
    if (client.name?.toLowerCase().includes(query) || client.client_number?.toLowerCase().includes(query)) {
      return true;
    }

    // Check if any of the client's projects match
    const clientProjects = projectsByClient[client.id] || [];
    return clientProjects.some(project =>
      project.project_name?.toLowerCase().includes(query) ||
      project.project_number?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  // Get all projects for export
  const allProjects = Object.values(projectsByClient).flat();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Projects</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => exportProjects(allProjects)} title="Export to CSV">
            <Download size={20} />
            Export
          </button>
          <button className="btn btn-secondary" onClick={printPage} title="Print">
            <Printer size={20} />
            Print
          </button>
          {isFRAEmployee() && (
            <button className="btn btn-primary" onClick={() => openNewProjectModal()}>
              <Plus size={20} />
              Add Project
            </button>
          )}
        </div>
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
            {searchQuery ? `Found ${filteredClients.length} client(s)` : `All Clients (${clients.length})`}
          </h3>
        </div>
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : filteredClients.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredClients.map(client => {
              const clientProjects = projectsByClient[client.id] || [];
              const projectCount = clientProjects.length;

              return (
              <div key={client.id} className="card" style={{ margin: 0 }}>
                {/* Client Header */}
                <div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', cursor: 'pointer' }}
                    onClick={() => toggleClient(client.id)}
                  >
                    <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      {expandedClients[client.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                      <Users size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0 }}>{client.name}</h3>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Client #{client.client_number} • {projectCount} project(s)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Client Projects */}
                {expandedClients[client.id] && (
                  <div style={{ marginTop: '1.5rem', marginLeft: '44px', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        Projects ({projectCount})
                      </h4>
                      {canManageProjects() && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openNewProjectModal(client)}
                        >
                          <Plus size={16} />
                          Add Project
                        </button>
                      )}
                    </div>

                    {clientProjects.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {clientProjects.map(project => (
                          <div key={project.id} style={{
                            padding: '1rem',
                            background: 'var(--bg-tertiary)',
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
                            {project.description && (
                              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {project.description}
                              </p>
                            )}

                            {/* Project actions */}
                            {canManageProjects() && (
                              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditProjectModal(project)}
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
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>No projects for this client yet</p>
                        {canManageProjects() && (
                          <button className="btn btn-primary btn-sm" onClick={() => openNewProjectModal(client)} style={{ marginTop: '1rem' }}>
                            <Plus size={16} />
                            Create Project
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              {searchQuery ? <Search size={48} /> : <Users size={48} />}
            </div>
            <p>{searchQuery ? `No clients found for "${searchQuery}"` : 'No clients yet'}</p>
            {searchQuery && (
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
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
