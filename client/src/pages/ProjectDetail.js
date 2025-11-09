import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
  FileText,
  Download,
  FolderOpen,
  User,
  Mail,
  Phone,
  Building,
  Plus,
  List
} from 'lucide-react';
import { projectsAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';
import BulkTestModal from '../components/BulkTestModal';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isFRAEmployee, canManageProjects } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBulkTestModal, setShowBulkTestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.getById(id);
      setProject(res.data);

      // Load client details
      if (res.data.client_id) {
        const clientRes = await clientsAPI.getById(res.data.client_id);
        setClient(clientRes.data);
      }

      // Load all clients for bulk test modal
      const clientsRes = await clientsAPI.getAll();
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdated = () => {
    setShowProjectModal(false);
    loadProject();
  };

  const handleBulkTestsCreated = () => {
    setShowBulkTestModal(false);
    loadProject();
    toast.success('Tests created successfully');
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await projectsAPI.delete(id);
          toast.success('Project deleted successfully');
          navigate('/clients');
        } catch (error) {
          console.error('Error deleting project:', error);
          toast.error(error.response?.data?.error || 'Failed to delete project');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const getTestId = (test) => {
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

  if (loading) {
    return <div className="page"><div className="loading">Loading project details...</div></div>;
  }

  if (!project) {
    return <div className="page"><div className="empty-state">Project not found</div></div>;
  }

  return (
    <div className="page">
      <Breadcrumb
        items={[
          { label: 'Clients', path: '/clients' },
          { label: client?.name || 'Client', path: `/clients?highlight=${project?.client_id}` },
          { label: project?.project_name || 'Project' }
        ]}
      />

      {/* PROJECT SUMMARY */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <div className="stat-icon blue" style={{ width: '48px', height: '48px' }}>
            <FolderOpen size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{project.project_name}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${project.status === 'active' ? 'success' : 'secondary'}`}>
                {project.status}
              </span>
              <span style={{ color: '#64748b' }}>
                Project #{project.client_number}-{project.project_number}
              </span>
              <span style={{ color: '#64748b' }}>
                {project.tests?.length || 0} test(s)
              </span>
            </div>
            {project.description && (
              <p style={{ color: '#64748b', marginTop: '1rem' }}>{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* CLIENT CONTACT INFORMATION */}
      {client && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Building size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Client Information
            </h3>
            <Link to="/clients" className="btn btn-secondary btn-sm">
              View Client Page
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="#64748b" />
              <div>
                <div style={{ fontWeight: 600 }}>{client.name}</div>
                {client.client_number && (
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Client #{client.client_number}
                  </div>
                )}
              </div>
            </div>
            {client.contact_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="#64748b" />
                <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6' }}>
                  {client.contact_email}
                </a>
              </div>
            )}
            {client.contact_phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} color="#64748b" />
                <span>{client.contact_phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TESTS IN PROJECT */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Tests ({project.tests?.length || 0})
          </h3>
          {isFRAEmployee() && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowBulkTestModal(true)}>
                <List size={16} />
                Add Multiple Tests
              </button>
            </div>
          )}
        </div>
        {project.tests && project.tests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.tests.map(test => (
              <Link
                key={test.id}
                to={`/tests/${test.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  border: '1px solid var(--border-color)',
                  transition: 'all 0.2s'
                }}
                className="hover-lift"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <FileText size={18} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: 600, color: '#3b82f6', fontSize: '1rem' }}>
                    {getTestId(test)}
                  </span>
                  <span className={`badge badge-${
                    test.status === 'Complete' ? 'success' :
                    test.status === 'Planning' ? 'warning' :
                    test.status === 'Cancelled' ? 'danger' : 'secondary'
                  }`}>
                    {test.status}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {test.title}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {test.test_type && (
                    <span>Type: {test.test_type}</span>
                  )}
                  {test.test_date && (
                    <span>Date: {formatDate(test.test_date)}</span>
                  )}
                  {test.governing_standard && (
                    <span>Standard: {test.governing_standard}</span>
                  )}
                  {test.location && (
                    <span>Location: {test.location}</span>
                  )}
                </div>
                {test.description && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {test.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.5 }} />
            <p>No tests in this project yet</p>
          </div>
        )}
      </div>

      {/* PROJECT DOCUMENTS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Project Documents
          </h3>
          {isFRAEmployee() && (
            <button className="btn btn-primary btn-sm">
              <Upload size={16} />
              Upload Document
            </button>
          )}
        </div>
        <div className="empty-state">
          <FileText size={48} style={{ opacity: 0.5 }} />
          <p>Project-level document management coming soon</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Upload proposals, test plans, client documents, and other project-related files
          </p>
        </div>
      </div>

      {/* EDIT/DELETE ACTIONS */}
      {canManageProjects() && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Project Actions</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowProjectModal(true)}>
              <Edit size={20} />
              Edit Project
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={20} />
              Delete Project
            </button>
          </div>
        </div>
      )}

      {showProjectModal && (
        <ProjectModal
          project={project}
          client={client}
          onClose={() => setShowProjectModal(false)}
          onSuccess={handleProjectUpdated}
        />
      )}

      {showBulkTestModal && (
        <BulkTestModal
          clients={clients}
          project={project}
          onClose={() => setShowBulkTestModal(false)}
          onSuccess={handleBulkTestsCreated}
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

export default ProjectDetail;
