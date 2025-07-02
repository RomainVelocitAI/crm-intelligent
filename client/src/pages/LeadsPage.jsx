import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const LeadsPage = () => {
  const { 
    leads, 
    loadLeads, 
    createLead, 
    updateLead, 
    deleteLead, 
    importLeads,
    searchLeads,
    filterLeads 
  } = useApp();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    temperature: '',
    source: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filteredLeads, setFilteredLeads] = useState([]);

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    // Appliquer recherche et filtres
    let result = leads;
    
    if (searchQuery.trim()) {
      result = searchLeads(searchQuery);
    }
    
    if (filters.status || filters.temperature || filters.source) {
      result = filterLeads(filters);
    }
    
    setFilteredLeads(result);
  }, [leads, searchQuery, filters]);

  const handleCreateLead = async (leadData) => {
    try {
      await createLead(leadData);
      setShowCreateModal(false);
      toast.success('Lead créé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdateLead = async (leadId, updates) => {
    try {
      await updateLead(leadId, updates);
      setEditingLead(null);
      toast.success('Lead mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
      try {
        await deleteLead(leadId);
        toast.success('Lead supprimé');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleImport = async (file) => {
    setLoading(true);
    try {
      await importLeads(file);
      setShowImportModal(false);
      toast.success('Import terminé');
    } catch (error) {
      toast.error('Erreur lors de l\'import');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      nouveau: 'badge badge-info',
      qualifie: 'badge badge-warning',
      devis_envoye: 'badge badge-success',
      devis_genere: 'badge badge-success',
      signe: 'badge badge-success',
      perdu: 'badge badge-danger'
    };
    return badges[status] || 'badge badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      nouveau: 'Nouveau',
      qualifie: 'Qualifié',
      devis_envoye: 'Devis envoyé',
      devis_genere: 'Devis généré',
      signe: 'Signé',
      perdu: 'Perdu'
    };
    return texts[status] || status;
  };

  const getTemperatureColor = (temperature) => {
    const colors = {
      chaud: 'bg-red-500',
      tiede: 'bg-yellow-500',
      froid: 'bg-blue-500'
    };
    return colors[temperature] || 'bg-gray-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Leads</h1>
          <p className="text-gray-600 mt-1">
            {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''} 
            {searchQuery && ` trouvé${filteredLeads.length > 1 ? 's' : ''} pour "${searchQuery}"`}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouveau Lead
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 form-input"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-input w-auto"
            >
              <option value="">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="qualifie">Qualifié</option>
              <option value="devis_envoye">Devis envoyé</option>
              <option value="signe">Signé</option>
              <option value="perdu">Perdu</option>
            </select>

            <select
              value={filters.temperature}
              onChange={(e) => setFilters({...filters, temperature: e.target.value})}
              className="form-input w-auto"
            >
              <option value="">Toutes les températures</option>
              <option value="chaud">Chaud</option>
              <option value="tiede">Tiède</option>
              <option value="froid">Froid</option>
            </select>

            <select
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              className="form-input w-auto"
            >
              <option value="">Toutes les sources</option>
              <option value="manual">Manuel</option>
              <option value="website">Site web</option>
              <option value="csv">Import CSV</option>
              <option value="api">API</option>
            </select>

            {(filters.status || filters.temperature || filters.source) && (
              <button
                onClick={() => setFilters({status: '', temperature: '', source: ''})}
                className="btn-secondary text-sm"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des leads */}
      {filteredLeads.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FunnelIcon className="empty-state-icon" />
            <h3 className="empty-state-title">
              {searchQuery || Object.values(filters).some(f => f) ? 
                'Aucun lead trouvé' : 'Aucun lead'}
            </h3>
            <p className="empty-state-description">
              {searchQuery || Object.values(filters).some(f => f) ? 
                'Essayez de modifier vos critères de recherche' : 
                'Commencez par ajouter votre premier lead'}
            </p>
            {!searchQuery && !Object.values(filters).some(f => f) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter un lead
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Entreprise</th>
                  <th>Statut</th>
                  <th>Température</th>
                  <th>Source</th>
                  <th>Dernière MAJ</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">{lead.contact?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{lead.contact?.email || 'N/A'}</div>
                        {lead.contact?.phone && (
                          <div className="text-sm text-gray-500">{lead.contact.phone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">{lead.contact?.company || 'N/A'}</div>
                    </td>
                    <td>
                      <span className={getStatusBadge(lead.status)}>
                        {getStatusText(lead.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full ${getTemperatureColor(lead.temperature)} mr-2`}></div>
                        <span className="text-sm text-gray-900 capitalize">{lead.temperature}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900 capitalize">{lead.source}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {new Date(lead.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-700"
                          title="Voir le détail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="text-gray-600 hover:text-gray-700"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Supprimer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création lead */}
      {showCreateModal && (
        <CreateLeadModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateLead}
        />
      )}

      {/* Modal édition lead */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSubmit={(updates) => handleUpdateLead(editingLead.id, updates)}
        />
      )}

      {/* Modal import */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSubmit={handleImport}
          loading={loading}
        />
      )}
    </div>
  );
};

// Composant Modal de création de lead
const CreateLeadModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    contact: {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    notes: '',
    temperature: 'tiede',
    tags: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nom *</label>
            <input
              type="text"
              required
              value={formData.contact.name}
              onChange={(e) => setFormData({
                ...formData,
                contact: { ...formData.contact, name: e.target.value }
              })}
              className="form-input"
              placeholder="Jean Dupont"
            />
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input
              type="email"
              required
              value={formData.contact.email}
              onChange={(e) => setFormData({
                ...formData,
                contact: { ...formData.contact, email: e.target.value }
              })}
              className="form-input"
              placeholder="jean@entreprise.com"
            />
          </div>

          <div>
            <label className="form-label">Téléphone</label>
            <input
              type="tel"
              value={formData.contact.phone}
              onChange={(e) => setFormData({
                ...formData,
                contact: { ...formData.contact, phone: e.target.value }
              })}
              className="form-input"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="form-label">Entreprise</label>
            <input
              type="text"
              value={formData.contact.company}
              onChange={(e) => setFormData({
                ...formData,
                contact: { ...formData.contact, company: e.target.value }
              })}
              className="form-input"
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <label className="form-label">Température</label>
            <select
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="form-input"
            >
              <option value="chaud">Chaud</option>
              <option value="tiede">Tiède</option>
              <option value="froid">Froid</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Notes sur ce lead..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Créer le lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal d'édition de lead
const EditLeadModal = ({ lead, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    contact: { ...lead.contact },
    notes: lead.notes || '',
    temperature: lead.temperature,
    status: lead.status
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Modifier le Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input"
              >
                <option value="nouveau">Nouveau</option>
                <option value="qualifie">Qualifié</option>
                <option value="devis_envoye">Devis envoyé</option>
                <option value="signe">Signé</option>
                <option value="perdu">Perdu</option>
              </select>
            </div>

            <div>
              <label className="form-label">Température</label>
              <select
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="form-input"
              >
                <option value="chaud">Chaud</option>
                <option value="tiede">Tiède</option>
                <option value="froid">Froid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows={4}
              placeholder="Notes sur ce lead..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal d'import
const ImportModal = ({ onClose, onSubmit, loading }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onSubmit(file);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Import CSV/Excel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Format attendu</h3>
          <p className="text-sm text-blue-700 mb-2">
            Votre fichier doit contenir les colonnes suivantes :
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside">
            <li><strong>nom</strong> ou <strong>name</strong> (obligatoire)</li>
            <li><strong>email</strong> (obligatoire)</li>
            <li><strong>telephone</strong> ou <strong>phone</strong> (optionnel)</li>
            <li><strong>entreprise</strong> ou <strong>company</strong> (optionnel)</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Fichier CSV/Excel</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="form-input"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={!file || loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Import en cours...' : 'Importer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadsPage;