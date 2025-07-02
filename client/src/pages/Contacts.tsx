import { useState } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, Phone, Mail, Building, TrendingUp,
  Users, X, AlertCircle, Sparkles, Star
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import toast from 'react-hot-toast';
import { Contact, ContactStatus, UnifiedEmail } from '@/types';
import { contactsService } from '@/services/api';
import ContactForm from '@/components/ContactForm';
import ContactDetails from '@/components/ContactDetails';
import EmailModal from '@/components/EmailModal';

// Constantes
const statusColors = {
  [ContactStatus.CLIENT_ACTIF]: 'bg-green-100 text-green-800 border-green-200',
  [ContactStatus.PROSPECT_CHAUD]: 'bg-orange-100 text-orange-800 border-orange-200',
  [ContactStatus.PROSPECT_TIEDE]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ContactStatus.PROSPECT_FROID]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ContactStatus.INACTIF]: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels = {
  [ContactStatus.CLIENT_ACTIF]: 'Client actif',
  [ContactStatus.PROSPECT_CHAUD]: 'Prospect chaud',
  [ContactStatus.PROSPECT_TIEDE]: 'Prospect tiede',
  [ContactStatus.PROSPECT_FROID]: 'Prospect froid',
  [ContactStatus.INACTIF]: 'Inactif',
};


export default function ContactsPage() {
  // Etats de base
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Etats pour modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  // Etats pour le tracking d'email
  const [contactEmails, setContactEmails] = useState<UnifiedEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  
  // Hooks
  const { contacts, isLoading, deleteContact, createContact, updateContact } = useContacts();

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };


  // Gestionnaires d'evenements
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  const handleEmailContact = async (contact: Contact) => {
    setSelectedContact(contact);
    setEmailSubject('');
    setEmailContent('');
    setContactEmails([]);
    setShowEmailModal(true);
    
    // Charger les emails du contact
    setIsLoadingEmails(true);
    try {
      const response = await contactsService.getContactEmails(contact.id);
      if (response.success) {
        setContactEmails(response.data.emails || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleCallContact = (contact: Contact) => {
    window.open(`tel:${contact.telephone}`);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;
    
    try {
      await deleteContact.mutateAsync(contactToDelete.id);
      toast.success('Contact supprime avec succes');
      setShowDeleteModal(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Erreur suppression:', error);
      if (error.response?.status === 404) {
        toast.warning('Ce contact a déjà été supprimé');
        // Rafraîchir la liste pour mettre à jour l'affichage
        refetch();
      } else if (error.response?.status === 400) {
        // Erreur métier spécifique
        const message = error.response?.data?.message || 'Impossible de supprimer ce contact';
        toast.error(message);
      } else {
        toast.error('Erreur lors de la suppression');
      }
      setShowDeleteModal(false);
      setContactToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  const handleSendEmail = async () => {
    if (!selectedContact || !emailSubject || !emailContent) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoadingEmail(true);
    try {
      await contactsService.sendEmailToContact(
        selectedContact.id,
        emailSubject,
        emailContent
      );
      toast.success('Email envoye avec succes et tracking active');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailContent('');
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleSubmitContact = async (data: any) => {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, ...data });
        toast.success('Contact modifie avec succes');
      } else {
        await createContact.mutateAsync(data);
        toast.success('Contact cree avec succes');
      }
      setShowForm(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Erreur sauvegarde contact:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  // Filtrage et tri des donnees
  const filteredContacts = contacts?.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (contact.prenom || '').toLowerCase().includes(searchLower) ||
      (contact.nom || '').toLowerCase().includes(searchLower) ||
      (contact.email || '').toLowerCase().includes(searchLower) ||
      (contact.entreprise || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || contact.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Statistiques simplifiées (seul le nombre de contacts est affiché)
  // Les autres métriques sont disponibles dans la page Métriques dédiée

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex justify-between items-center" data-tour="contacts-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Contacts ({filteredContacts.length})
          </h1>
          <p className="text-gray-600">
            Gerez vos contacts et suivez vos interactions
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-tour="new-contact-button"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau contact
        </button>
      </div>

      {/* Chargement */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des contacts...</p>
        </div>
      )}

      {/* Contenu principal */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredContacts.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white p-4 rounded-lg shadow-sm border" data-tour="contacts-search">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grille de contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => {
              const isTopPerformer = contact.scoreValeur >= 70;
              const isActiveClient = contact.statut === ContactStatus.CLIENT_ACTIF;
              
              return (
                <div 
                  key={contact.id} 
                  data-tour="contact-card"
                  className={`relative bg-white p-6 rounded-xl shadow-sm border-2 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                    isTopPerformer ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50' :
                    isActiveClient ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' :
                    'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleContactClick(contact)}
                >
                  {/* Badge premium pour les top performers */}
                  {isTopPerformer && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full shadow-lg">
                        <Star className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* En-tete de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {/* Avatar avec initiales ameliore */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md ${
                        isActiveClient ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                        isTopPerformer ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        'bg-gradient-to-br from-blue-400 to-indigo-500'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {(contact.prenom || 'N').charAt(0)}{(contact.nom || 'N').charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {contact.prenom || 'Prenom'} {contact.nom || 'Inconnu'}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">{contact.email || 'Email non renseigne'}</p>
                        {contact.entreprise && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3" />
                            {contact.entreprise}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badge de statut ameliore */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm ${statusColors[contact.statut]}`}>
                      {isActiveClient && <Sparkles className="w-3 h-3 mr-1" />}
                      {statusLabels[contact.statut]}
                    </span>
                  </div>

                  {/* Score de valeur avec barre de progression */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${
                          contact.scoreValeur >= 70 ? 'text-green-600' :
                          contact.scoreValeur >= 40 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                        <span className="text-sm font-semibold text-gray-700">Score de valeur</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{Math.round(contact.scoreValeur || 0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          contact.scoreValeur >= 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                          contact.scoreValeur >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                        style={{ width: `${Math.min(contact.scoreValeur || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Metriques rapides avec icones */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">CA total</p>
                      <p className="font-bold text-gray-900 text-lg">{formatCurrency(contact.chiffresAffairesTotal || 0)}</p>
                    </div>
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">Taux conversion</p>
                      <p className="font-bold text-gray-900 text-lg">{Math.round(contact.tauxConversion || 0)}%</p>
                    </div>
                  </div>

                  {/* Actions avec design ameliore */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200" data-tour="contact-actions">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmailContact(contact);
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                      {contact.telephone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallContact(contact);
                          }}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Appeler"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(contact);
                        }}
                        className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
                <p className="text-gray-600">Cette action est irreversible.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                Vous etes sur le point de supprimer le contact :
              </p>
              <p className="font-semibold text-gray-900 mt-1">
                {contactToDelete.prenom} {contactToDelete.nom}
              </p>
              <p className="text-sm text-gray-600">{contactToDelete.email}</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'email */}
      <EmailModal
        isOpen={showEmailModal && !!selectedContact}
        onClose={() => setShowEmailModal(false)}
        contact={selectedContact!}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailContent={emailContent}
        setEmailContent={setEmailContent}
        onSendEmail={handleSendEmail}
        isLoadingEmail={isLoadingEmail}
        contactEmails={contactEmails}
        isLoadingEmails={isLoadingEmails}
      />

      {/* Modal de formulaire contact */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelForm}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
              </h3>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ContactForm
              contact={editingContact}
              onSubmit={handleSubmitContact}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}

      {/* Modal de details du contact */}
      {showContactModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {(selectedContact.prenom || 'N').charAt(0)}{(selectedContact.nom || 'N').charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedContact.prenom} {selectedContact.nom}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedContact.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-4">
              <ContactDetails contact={selectedContact} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}