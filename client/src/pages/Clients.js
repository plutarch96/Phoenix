import React, { useState, useEffect } from 'react';
import { Plus, Users as UsersIcon, Mail, Phone, Trash2 } from 'lucide-react';
import { clientsAPI } from '../services/api';
import ClientModal from '../components/ClientModal';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll();
      setClients(res.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client? This will not delete associated tests.')) {
      try {
        await clientsAPI.delete(id);
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert('Failed to delete client');
      }
    }
  };

  const handleClientSaved = () => {
    setShowModal(false);
    setSelectedClient(null);
    loadClients();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Clients</h2>
          <p>Manage your client contacts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Client
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Clients ({clients.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading clients...</div>
        ) : clients.length > 0 ? (
          <div className="grid grid-2">
            {clients.map(client => (
              <div key={client.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}>
                        <UsersIcon size={20} />
                      </div>
                      <h3 style={{ margin: 0 }}>{client.name}</h3>
                    </div>
                    {client.contact_email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#64748b' }}>
                        <Mail size={16} />
                        <a href={`mailto:${client.contact_email}`} style={{ color: '#3b82f6' }}>
                          {client.contact_email}
                        </a>
                      </div>
                    )}
                    {client.contact_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                        <Phone size={16} />
                        <span>{client.contact_phone}</span>
                      </div>
                    )}
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                      Added {new Date(client.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(client.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UsersIcon size={48} />
            </div>
            <p>No clients yet</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Your First Client
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <ClientModal
          client={selectedClient}
          onClose={() => {
            setShowModal(false);
            setSelectedClient(null);
          }}
          onSuccess={handleClientSaved}
        />
      )}
    </div>
  );
}

export default Clients;
