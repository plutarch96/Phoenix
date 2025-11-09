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
import { projectsAPI, clientsAPI, testsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectModal from '../components/ProjectModal';
import BulkTestModal from '../components/BulkTestModal';
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

  useEffect(() => {
    loadProject();
    checkIfTagged();
    loadMembers();
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

      {/* PROJECT ASSIGNMENT */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Users size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Project Assignment
          </h3>
        </div>

        {/* Show who claimed it */}
        {members.claimed_by && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Claimed by (Project Manager)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={16} />
              <span style={{ fontWeight: 500 }}>{members.claimed_by.username}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                ({members.claimed_by.email})
              </span>
            </div>
          </div>
        )}

        {/* Show who joined (staff members) */}
        {members.members.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Staff Members ({members.members.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {members.members.map(member => (
                <div key={member.id} style={{ padding: '0.5rem', background: 'var(--bg-tertiary)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={14} />
                  <span style={{ fontWeight: 500 }}>{member.username}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    ({member.email})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
      {/* MARK AS MINE / PROJECT ACTIONS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{canManageProjects() ? 'Project Actions' : 'My Projects'}</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isTagged ? 'btn-warning' : 'btn-secondary'}`}
            onClick={handleToggleTag}
            title={isTagged ? 'Remove from My Projects' : 'Add to My Projects'}
          >
            <Star size={20} style={{ fill: isTagged ? 'currentColor' : 'none' }} />
            {isTagged ? 'Remove from My Projects' : 'Mark as Mine'}
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
