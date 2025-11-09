import React, { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon, Mail, Phone, Trash2, ChevronDown, ChevronRight, FolderOpen, FileText, Edit2, Search, ExternalLink, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clientsAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ClientModal from '../components/ClientModal';
import ProjectModal from '../components/ProjectModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { exportClients, printPage } from '../utils/exportUtils';

function Clients() {
  const { user, isClient, isFRAEmployee, isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState({});
  const [expandedClients, setExpandedClients] = useState({});
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll();

      // If user is a client, filter to show only their client
      if (isClient() && user.client_id) {
        const clientData = res.data.filter(c => c.id === user.client_id);
        setClients(clientData);
        // Auto-expand for client users
        if (clientData.length > 0) {
          setExpandedClients({ [clientData[0].id]: true });
          loadProjectsForClient(clientData[0].id);
        }
      } else {
        setClients(res.data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsForClient = async (clientId, forceReload = false) => {
    if (projects[clientId] && !forceReload) {
      console.log(`Projects already loaded for client ${clientId}, skipping (use forceReload to refresh)`);
      return;
    }

    try {
      console.log(`Loading projects for client ${clientId}...`);
      const res = await projectsAPI.getAll({ client_id: clientId, include_tests: true });
      console.log(`Loaded ${res.data.length} projects for client ${clientId}:`, res.data);
      setProjects(prev => {
        const updated = {
          ...prev,
          [clientId]: res.data
        };
        console.log('Updated projects state:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Error loading projects:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const toggleClient = (clientId) => {
    const isExpanding = !expandedClients[clientId];

    setExpandedClients(prev => ({
      ...prev,
      [clientId]: isExpanding
    }));

    if (isExpanding) {
      loadProjectsForClient(clientId);
    }
  };

  const handleDeleteClient = (id) => {
    setConfirmDialog({
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client? Associated tests will not be deleted.',
      onConfirm: async () => {
        try {
          await clientsAPI.delete(id);
          loadClients();
        } catch (error) {
          console.error('Error deleting client:', error);
          alert('Failed to delete client');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDeleteProject = (projectId, clientId) => {
    setConfirmDialog({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await projectsAPI.delete(projectId);
          // Refresh projects for this client
          const res = await projectsAPI.getAll({ client_id: clientId });
          setProjects(prev => ({
            ...prev,
            [clientId]: res.data
          }));
        } catch (error) {
          console.error('Error deleting project:', error);
          alert(error.response?.data?.error || 'Failed to delete project');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleClientSaved = () => {
    setShowClientModal(false);
    setSelectedClient(null);
    loadClients();
  };

  const handleProjectSaved = async () => {
    console.log('Project saved! Refreshing projects for client:', selectedClient?.id);
    setShowProjectModal(false);
    if (selectedClient) {
      // Auto-expand the client
      setExpandedClients(prev => ({
        ...prev,
        [selectedClient.id]: true
      }));
      // Wait a moment for database to settle, then force reload
      setTimeout(async () => {
        console.log('Force reloading projects after delay...');
        await loadProjectsForClient(selectedClient.id, true);
      }, 300);
    }
    setSelectedProject(null);
  };

  const openNewProjectModal = (client) => {
    setSelectedClient(client);
    setSelectedProject(null);
    // Load projects first to check for duplicates
    loadProjectsForClient(client.id);
    setShowProjectModal(true);
  };

  const startEditingProject = (project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.project_name);
  };

  const cancelEditingProject = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const saveProjectName = async (projectId, clientId) => {
    if (!editingProjectName.trim()) {
      alert('Project name cannot be empty');
      return;
    }

    try {
      await projectsAPI.update(projectId, { project_name: editingProjectName });
      // Refresh projects for this client
      loadProjectsForClient(clientId, true);
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (error) {
      console.error('Error updating project name:', error);
      alert('Failed to update project name');
    }
  };

  const getTestId = (client, project, test) => {
    const clientNum = client.client_number || '###';
    const projectNum = project.project_number || '###';
    const testNum = test.test_number || '###';
    return `${clientNum}-${projectNum}-${testNum}`;
  };

  // Filter clients and projects based on search query
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    // Search in client fields
    const matchesClient =
      client.name?.toLowerCase().includes(query) ||
      client.client_number?.toLowerCase().includes(query) ||
      client.contact_email?.toLowerCase().includes(query) ||
      client.contact_phone?.toLowerCase().includes(query);

    if (matchesClient) return true;

    // Search in projects for this client
    const clientProjects = projects[client.id] || [];
    const matchesProject = clientProjects.some(project =>
      project.project_name?.toLowerCase().includes(query) ||
      project.project_number?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );

    return matchesProject;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Clients</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => exportClients(filteredClients)} title="Export to CSV">
            <Download size={20} />
            Export
          </button>
          <button className="btn btn-secondary" onClick={printPage} title="Print">
            <Printer size={20} />
            Print
          </button>
          {!isClient() && (
            <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
              <Plus size={20} />
              Add Client
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
            placeholder="Search clients, projects, client numbers, project numbers..."
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
          <div className="loading">Loading clients...</div>
        ) : filteredClients.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredClients.map(client => (
              <div key={client.id} className="card" style={{ margin: 0 }}>
                {/* Client Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1 }}
                      onClick={() => toggleClient(client.id)}
                    >
                      <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        {expandedClients[client.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                      <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                        <UsersIcon size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0 }}>{client.name}</h3>
                        {client.client_number && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Client #{client.client_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <Link to={`/clients/${client.id}`} className="btn btn-secondary btn-sm">
                      <ExternalLink size={14} />
                      View Details
                    </Link>
                  </div>

                  {client.contact_email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', marginLeft: '44px' }}>
                      <Mail size={16} />
                      <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6' }}>
                        {client.contact_email}
                      </a>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginLeft: '44px' }}>
                      <Phone size={16} />
                      <span>{client.contact_phone}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Projects Section */}
                {expandedClients[client.id] && (
                  <div style={{ marginTop: '1.5rem', marginLeft: '44px', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        Projects ({projects[client.id]?.length || 0})
                      </h4>
                      {!isClient() && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openNewProjectModal(client)}
                        >
                          <Plus size={16} />
                          Add Project
                        </button>
                      )}
                    </div>

                    {projects[client.id] && projects[client.id].length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {projects[client.id].map(project => (
                          <div key={project.id} style={{
                            padding: '1rem',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <FolderOpen size={18} color="#3b82f6" />
                              {editingProjectId === project.id && isFRAEmployee() ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={editingProjectName}
                                    onChange={(e) => setEditingProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveProjectName(project.id, client.id);
                                      } else if (e.key === 'Escape') {
                                        cancelEditingProject();
                                      }
                                    }}
                                    style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => saveProjectName(project.id, client.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={cancelEditingProject}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#3b82f6', cursor: 'pointer' }}>
                                      {project.project_name}
                                    </h4>
                                  </Link>
                                  {isFRAEmployee() && (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => startEditingProject(project)}
                                      title="Edit project name"
                                      style={{ padding: '0.25rem 0.5rem' }}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                </>
                              )}
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

                            {/* Show tests in project */}
                            {project.tests && project.tests.length > 0 && (
                              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-tertiary)' }}>
                                  Tests ({project.tests.length}):
                                </div>
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
                                          {getTestId(client, project, test)}
                                        </span>
                                        <span className={`badge badge-${test.status === 'completed' ? 'success' : test.status === 'in-progress' ? 'warning' : 'info'}`} style={{ marginLeft: 'auto' }}>
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
                                          <span>Date: {new Date(test.test_date).toLocaleDateString()}</span>
                                        )}
                                        {test.governing_standard && (
                                          <span>Standard: {test.governing_standard}</span>
                                        )}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Project Actions */}
                            {!isClient() && (
                              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedClient(client);
                                    setSelectedProject(project);
                                    setShowProjectModal(true);
                                  }}
                                >
                                  <Edit2 size={14} />
                                  Edit
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteProject(project.id, client.id)}
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
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        <FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>No projects yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Client Actions */}
                {!isClient() && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 size={16} />
                      Delete Client
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              {searchQuery ? <Search size={48} /> : <UsersIcon size={48} />}
            </div>
            <p>{searchQuery ? `No results found for "${searchQuery}"` : 'No clients yet'}</p>
            {searchQuery ? (
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
                Add Your First Client
              </button>
            )}
          </div>
        )}
      </div>

      {showClientModal && (
        <ClientModal
          client={selectedClient}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          onSuccess={handleClientSaved}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={selectedProject}
          client={selectedClient}
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

export default Clients;
