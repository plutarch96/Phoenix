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
  List,
  Star,
  UserPlus,
  Users,
  Briefcase
} from 'lucide-react';
import { projectsAPI, clientsAPI, testsAPI, projectMediaAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';
import BulkTestModal from '../components/BulkTestModal';
import ProjectMediaUpload from '../components/ProjectMediaUpload';
import Breadcrumb from '../components/Breadcrumb';
import ConfirmDialog from '../components/ConfirmDialog';

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isFRAEmployee, canManageProjects, isProjectManager, isAdmin, isStaff } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBulkTestModal, setShowBulkTestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isTagged, setIsTagged] = useState(false);
  const [members, setMembers] = useState({ claimed_by: null, members: [] });
  const [isClaimed, setIsClaimed] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [testMembers, setTestMembers] = useState({});
  const [projectMedia, setProjectMedia] = useState([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);

  useEffect(() => {
    loadProject();
    checkIfTagged();
    loadMembers();
    loadProjectMedia();
  }, [id]);

  useEffect(() => {
    if (project && project.tests) {
      loadTestMembers();
    }
  }, [project]);

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
      // Handle new paginated response format
      setClients(clientsRes.data.data || clientsRes.data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMedia = async () => {
    try {
      const res = await projectMediaAPI.getByProject(id);
      setProjectMedia(res.data);
    } catch (error) {
      console.error('Error loading project media:', error);
    }
  };

  const handleProjectUpdated = () => {
    setShowProjectModal(false);
    loadProject();
  };

  const handleMediaUploaded = () => {
    setShowMediaUpload(false);
    loadProjectMedia();
    toast.success('Documents uploaded successfully');
  };

  const handleDeleteMedia = (mediaId) => {
    setConfirmDialog({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await projectMediaAPI.delete(mediaId);
          loadProjectMedia();
          toast.success('Document deleted successfully');
        } catch (error) {
          console.error('Error deleting media:', error);
          toast.error('Failed to delete document');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDownloadAll = async () => {
    try {
      const response = await projectMediaAPI.downloadAll(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${id}-documents.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading documents:', error);
      toast.error('Failed to download documents');
    }
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

  const checkIfTagged = async () => {
    try {
      const res = await projectsAPI.getTaggedByUser(user.id);
      const tagged = res.data.some(p => p.id == id);
      setIsTagged(tagged);
    } catch (error) {
      console.error('Error checking if project is tagged:', error);
    }
  };

  const handleToggleTag = async () => {
    try {
      if (isTagged) {
        await projectsAPI.untagProject(id, user.id);
        toast.success('Removed from My Projects');
      } else {
        await projectsAPI.tagProject(id, user.id);
        toast.success('Added to My Projects');
      }
      setIsTagged(!isTagged);
    } catch (error) {
      console.error('Error toggling project tag:', error);
      toast.error('Failed to update project tag');
    }
  };

  const loadMembers = async () => {
    try {
      const res = await projectsAPI.getMembers(id);
      setMembers(res.data);
      setIsClaimed(res.data.claimed_by?.id === user.id);
      setIsJoined(res.data.members.some(m => m.id === user.id));
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await projectsAPI.claimProject(id, user.id);
      toast.success('Project claimed successfully');
      loadMembers();
    } catch (error) {
      console.error('Error claiming project:', error);
      toast.error(error.response?.data?.error || 'Failed to claim project');
    }
  };

  const handleUnclaim = async () => {
    try {
      await projectsAPI.unclaimProject(id, user.id);
      toast.success('Project unclaimed');
      loadMembers();
    } catch (error) {
      console.error('Error unclaiming project:', error);
      toast.error('Failed to unclaim project');
    }
  };

  const handleJoin = async () => {
    try {
      await projectsAPI.joinProject(id, user.id);
      toast.success('Joined project successfully');
      loadMembers();
    } catch (error) {
      console.error('Error joining project:', error);
      toast.error(error.response?.data?.error || 'Failed to join project');
    }
  };

  const handleLeave = async () => {
    try {
      await projectsAPI.leaveProject(id, user.id);
      toast.success('Left project');
      loadMembers();
    } catch (error) {
      console.error('Error leaving project:', error);
      toast.error('Failed to leave project');
    }
  };

  const loadTestMembers = async () => {
    if (!project || !project.tests) return;

    try {
      const promises = project.tests.map(test =>
        testsAPI.getTestMembers(test.id).then(res => ({ testId: test.id, data: res.data }))
      );
      const results = await Promise.all(promises);
      const membersMap = {};
      results.forEach(({ testId, data }) => {
        membersMap[testId] = data.members || [];
      });
      setTestMembers(membersMap);
    } catch (error) {
      console.error('Error loading test members:', error);
    }
  };

  const handleJoinTest = async (testId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await testsAPI.joinTest(testId, user.id);
      toast.success('Joined test successfully');
      loadTestMembers();
    } catch (error) {
      console.error('Error joining test:', error);
      toast.error(error.response?.data?.error || 'Failed to join test');
    }
  };

  const handleLeaveTest = async (testId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await testsAPI.leaveTest(testId, user.id);
      toast.success('Left test successfully');
      loadTestMembers();
    } catch (error) {
      console.error('Error leaving test:', error);
      toast.error('Failed to leave test');
    }
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
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>{project.project_name}</h2>

              {/* Claim/Join buttons in top right */}
              {isFRAEmployee() && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* PM/Admin can claim */}
                  {(isProjectManager() || isAdmin()) && (
                    <>
                      {!members.claimed_by ? (
                        <button className="btn btn-primary btn-sm" onClick={handleClaim}>
                          <Briefcase size={16} />
                          Claim
                        </button>
                      ) : isClaimed ? (
                        <button className="btn btn-secondary btn-sm" onClick={handleUnclaim}>
                          <Briefcase size={16} />
                          Unclaim
                        </button>
                      ) : null}
                    </>
                  )}

                  {/* All FRA employees can join as staff */}
                  {!isJoined ? (
                    <button className="btn btn-primary btn-sm" onClick={handleJoin}>
                      <UserPlus size={16} />
                      Join
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={handleLeave}>
                      <UserPlus size={16} />
                      Leave
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${project.status === 'active' ? 'success' : 'secondary'}`}>
                {project.status}
              </span>
              <span style={{ color: '#64748b' }}>
                {project.client_number}-{project.project_number}
              </span>
              <span style={{ color: '#64748b' }}>
                {project.tests?.length || 0} test(s)
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>PM:</strong> {members.claimed_by ? members.claimed_by.username : 'None'}
            </div>
            {project.description && (
              <p style={{ color: '#64748b', marginTop: '1rem', marginBottom: '1rem' }}>{project.description}</p>
            )}
            {members.members.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <strong>Staff:</strong>
                <span style={{ color: '#64748b' }}>
                  {members.members.map(m => m.username).join(', ')}
                </span>
              </div>
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
                    {client.client_number}
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
                Add Tests
              </button>
            </div>
          )}
        </div>
        {project.tests && project.tests.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {project.tests.map(test => {
              const members = testMembers[test.id] || [];
              const isJoinedTest = members.some(m => m.id === user.id);

              return (
                <div
                  key={test.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <Link
                    to={`/tests/${test.id}`}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
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
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500, marginTop: '0.5rem' }}>
                      {test.title}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', flexWrap: 'wrap', marginTop: '0.5rem' }}>
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

                  {/* Test members and join/leave buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      {members.length > 0 && (
                        <>
                          <Users size={14} color="var(--text-secondary)" />
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {members.map(m => m.username).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    {isFRAEmployee() && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isJoinedTest ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(e) => handleJoinTest(test.id, e)}
                          >
                            <UserPlus size={14} />
                            Join
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => handleLeaveTest(test.id, e)}
                          >
                            <UserPlus size={14} />
                            Leave
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
            Project Documents ({projectMedia.length})
          </h3>
          {isFRAEmployee() && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {projectMedia.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={handleDownloadAll}>
                  <Download size={16} />
                  Download All
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={() => setShowMediaUpload(true)}>
                <Upload size={16} />
                Upload Document
              </button>
            </div>
          )}
        </div>
        {projectMedia.length > 0 ? (
          <div>
            {projectMedia.map(media => (
              <div key={media.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={24} color="#64748b" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 500 }}>{media.file_name}</span>
                        {media.document_category && (
                          <span className={`badge ${
                            media.document_category === 'client_documents' ? 'badge-success' :
                            media.document_category === 'test_plan' ? 'badge-primary' :
                            media.document_category === 'purchase_order' ? 'badge-warning' :
                            media.document_category === 'proposal' ? 'badge-secondary' :
                            'badge-secondary'
                          }`}>
                            {media.document_category === 'client_documents' ? 'Client Document' :
                             media.document_category === 'test_plan' ? 'Test Plan' :
                             media.document_category === 'purchase_order' ? 'Purchase Order' :
                             media.document_category === 'proposal' ? 'Proposal' :
                             media.document_category === 'nda' ? 'NDA' :
                             media.document_category}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {media.file_size ? `${(media.file_size / 1024).toFixed(2)} KB` : ''} •
                        Uploaded {new Date(media.uploaded_at).toLocaleDateString()}
                      </div>
                      {media.description && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {media.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={`/api/project-media/download/${media.id}`}
                      className="btn btn-primary btn-sm"
                      download
                    >
                      <Download size={16} />
                      Download
                    </a>
                    {isFRAEmployee() && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMedia(media.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.5 }} />
            <p>No project documents uploaded yet</p>
            {isFRAEmployee() && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Upload proposals, test plans, client documents, and other project-related files
              </p>
            )}
          </div>
        )}
      </div>

      {/* EDIT/DELETE ACTIONS */}
      {/* MARK AS MINE / PROJECT ACTIONS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{canManageProjects() ? 'Project Actions' : 'My Projects'}</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isTagged ? 'btn-warning' : 'btn-secondary'}`}
            onClick={handleToggleTag}
            title={isTagged ? 'Unfollow this project' : 'Follow this project'}
          >
            <Star size={20} style={{ fill: isTagged ? 'currentColor' : 'none' }} />
            {isTagged ? 'Unfollow' : 'Follow'}
          </button>
          {canManageProjects() && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowProjectModal(true)}>
                <Edit size={20} />
                Edit Project
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={20} />
                Delete Project
              </button>
            </>
          )}
        </div>
      </div>

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
          lockClient={true}
          onClose={() => setShowBulkTestModal(false)}
          onSuccess={handleBulkTestsCreated}
        />
      )}

      {showMediaUpload && (
        <ProjectMediaUpload
          projectId={id}
          onClose={() => setShowMediaUpload(false)}
          onSuccess={handleMediaUploaded}
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
