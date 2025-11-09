import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy } from 'lucide-react';
import { testsAPI, projectsAPI } from '../services/api';

function BulkTestModal({ clients, project, lockClient = false, onClose, onSuccess }) {
  const presetLocations = ['Rockville', 'York', 'Cambridge'];

  const defaultTest = {
    title: '',
    description: '',
    test_type: '',
    governing_standard: '',
    location: '',
    customLocation: '',
    client_id: project?.client_id || '',
    project_id: project?.id || '',
    test_date: '',
    status: 'Proposed',
    tags: ''
  };

  const [tests, setTests] = useState([{ ...defaultTest, id: Date.now() }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState([]);
  const [nextTestNumber, setNextTestNumber] = useState(null);

  useEffect(() => {
    if (project) {
      loadNextTestNumber(project.id);
    }
  }, [project]);

  useEffect(() => {
    if (tests[0]?.client_id) {
      loadProjects(tests[0].client_id);
    }
  }, []);

  const loadProjects = async (clientId) => {
    try {
      const res = await projectsAPI.getAll({ client_id: clientId });
      setProjects(res.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadNextTestNumber = async (projectId) => {
    try {
      const res = await projectsAPI.getNextTestNumber(projectId);
      setNextTestNumber(res.data.next_test_number);
    } catch (error) {
      console.error('Error loading next test number:', error);
    }
  };

  const handleClientChange = (value) => {
    setTests(tests.map(test => ({ ...test, client_id: value, project_id: '' })));
    if (value) {
      loadProjects(value);
    } else {
      setProjects([]);
    }
  };

  const handleProjectChange = (value) => {
    setTests(tests.map(test => ({ ...test, project_id: value })));
    if (value) {
      loadNextTestNumber(value);
    } else {
      setNextTestNumber(null);
    }
  };

  const handleTestChange = (index, field, value) => {
    const newTests = [...tests];
    newTests[index][field] = value;
    setTests(newTests);
  };

  const addTest = () => {
    setTests([...tests, { ...defaultTest, id: Date.now(), client_id: tests[0].client_id, project_id: tests[0].project_id }]);
  };

  const removeTest = (index) => {
    if (tests.length > 1) {
      setTests(tests.filter((_, i) => i !== index));
    }
  };

  const duplicateTest = (index) => {
    const testToCopy = { ...tests[index], id: Date.now() };
    const newTests = [...tests];
    newTests.splice(index + 1, 0, testToCopy);
    setTests(newTests);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create all tests
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const data = {
          title: test.title,
          description: test.description,
          test_type: test.test_type,
          governing_standard: test.governing_standard,
          location: test.location === 'Other' ? test.customLocation : test.location,
          client_id: test.client_id || null,
          project_id: test.project_id || null,
          test_date: test.test_date || null,
          status: test.status,
          tags: test.tags.split(',').map(t => t.trim()).filter(t => t)
        };

        await testsAPI.create(data);
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error creating tests:', error);
      alert('Failed to create tests: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={success ? onSuccess : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">Create Multiple Tests</h2>
          <button onClick={success ? onSuccess : onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Success!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {tests.length} test{tests.length > 1 ? 's' : ''} created successfully.
            </p>
            <button className="btn btn-primary" onClick={onSuccess}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          {/* Global Client & Project Selection */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Project Selection (applies to all tests)</h3>
            <div className={lockClient ? '' : 'grid grid-2'}>
              {lockClient ? (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Client</label>
                  <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    {clients.find(c => c.id == tests[0]?.client_id)?.name || 'Unknown Client'}
                  </div>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client *</label>
                  <select
                    className="form-select"
                    value={tests[0]?.client_id || ''}
                    onChange={(e) => handleClientChange(e.target.value)}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project *</label>
                <select
                  className="form-select"
                  value={tests[0]?.project_id || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  required
                  disabled={!tests[0]?.client_id}
                >
                  <option value="">Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.project_name} (#{project.project_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {nextTestNumber && (
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                Next test number will start from: {nextTestNumber}
              </small>
            )}
          </div>

          {/* Tests */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {tests.map((test, index) => (
              <div key={test.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Test #{index + 1}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateTest(index);
                      }}
                      title="Duplicate this test"
                    >
                      <Copy size={14} />
                    </button>
                    {tests.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTest(index);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={test.title}
                      onChange={(e) => handleTestChange(index, 'title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Test Type *</label>
                    <select
                      className="form-select"
                      value={test.test_type}
                      onChange={(e) => handleTestChange(index, 'test_type', e.target.value)}
                      required
                    >
                      <option value="">Select test type</option>
                      <option value="Unit">Unit</option>
                      <option value="Module">Module</option>
                      <option value="Cell">Cell</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Governing Standard *</label>
                    <select
                      className="form-select"
                      value={test.governing_standard}
                      onChange={(e) => handleTestChange(index, 'governing_standard', e.target.value)}
                      required
                    >
                      <option value="">Select standard</option>
                      <option value="UL 9540A">UL 9540A</option>
                      <option value="CSA 800">CSA 800</option>
                      <option value="NFPA 855">NFPA 855</option>
                      <option value="Other">Other</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <select
                      className="form-select"
                      value={test.location}
                      onChange={(e) => handleTestChange(index, 'location', e.target.value)}
                    >
                      <option value="">Select location</option>
                      <option value="Rockville">Rockville</option>
                      <option value="York">York</option>
                      <option value="Cambridge">Cambridge</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {test.location === 'Other' && (
                    <div className="form-group">
                      <label className="form-label">Custom Location</label>
                      <input
                        type="text"
                        className="form-input"
                        value={test.customLocation}
                        onChange={(e) => handleTestChange(index, 'customLocation', e.target.value)}
                        placeholder="Enter custom location"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Test Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={test.test_date}
                      onChange={(e) => handleTestChange(index, 'test_date', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={test.status}
                      onChange={(e) => handleTestChange(index, 'status', e.target.value)}
                    >
                      <option value="Proposed">Proposed</option>
                      <option value="Planning">Planning</option>
                      <option value="Complete">Complete</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={test.description}
                    onChange={(e) => handleTestChange(index, 'description', e.target.value)}
                    rows="2"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={test.tags}
                    onChange={(e) => handleTestChange(index, 'tags', e.target.value)}
                    placeholder="e.g., thermal, vibration, acoustic"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addTest}
            style={{ marginBottom: '1rem', width: '100%' }}
          >
            <Plus size={20} />
            Add Another Test
          </button>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : `Create ${tests.length} Test${tests.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default BulkTestModal;
