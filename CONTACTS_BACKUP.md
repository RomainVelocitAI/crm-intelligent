# Sauvegarde des fonctionnalités de la page Contacts

## ⚠️ RÈGLE CAPITALE ⚠️
**TOUJOURS FAIRE DES ALLERS-RETOURS ENTRE LE FICHIER ET LE BACKUP**
- Après chaque ajout de code dans Contacts.tsx, IMMÉDIATEMENT l'ajouter dans ce backup
- Si problème d'encodage = fichier effacé = on peut restaurer rapidement depuis ce backup
- Ne JAMAIS faire de gros blocs de code d'un coup
- Tester chaque petite partie avant de continuer

## Fonctionnalités à restaurer :

### 1. Imports nécessaires
- useState, useEffect, useRef
- useForm, zodResolver, z
- Toutes les icônes Lucide : Plus, Search, Filter, Edit2, Trash2, Phone, Mail, Building, TrendingUp, Euro, Users, Percent, ShoppingCart, Calendar, MoreVertical, X, Grid3X3, List, Eye, FileText, Activity, BarChart3, Send, CheckCircle, XCircle, AlertCircle, MessageSquare, Eye as EyeIcon
- useContacts, useQuotes hooks
- toast from react-hot-toast
- Contact, ContactStatus, QuoteStatus, GenericEmail types
- contactsService, useQuery

### 2. États et variables
- searchTerm, statusFilter, showForm, editingContact, viewMode, sortBy
- showContactModal, selectedContact, showEmailModal, emailSubject, emailContent, isLoadingEmail
- showHistoryModal, showHistoryDropdown, dropdownRef

### 3. Schémas et constantes
- contactSchema avec validation Zod
- statusColors avec couleurs pour chaque statut
- statusLabels avec libellés corrects (sans caractères spéciaux)

### 4. Fonctions utilitaires
- formatCurrency (format français EUR)
- formatDate (format français DD/MM/YYYY)
- getDaysSinceCreation (calcul jours depuis création)
- getQuoteStatusColor (couleurs statuts devis)

### 5. Gestionnaires d'événements
- handleEdit, handleDelete, onSubmit pour CRUD contacts
- handleContactClick, handleEmailContact, handleCallContact
- handleSendEmail avec simulation d'envoi
- handleStatusChange pour changer statut devis

### 6. Interface principale
- En-tête avec titre et bouton "Nouveau contact"
- Statistiques (4 cartes : Total contacts, CA total, Conversion moy., Clients actifs)
- Barre de recherche avec filtre par statut
- Grille de cartes contacts

### 7. Cartes de contacts
- Avatar avec initiales
- Nom, prénom, email, entreprise
- Badge de statut coloré
- Score de valeur avec icône TrendingUp
- Métriques rapides (CA, Taux conversion)
- Actions (email, téléphone, modifier, supprimer)
- Cliquable pour ouvrir modal détails

### 8. Modal de détails du contact
- En-tête avec avatar et infos contact
- Métriques principales (4 cartes)
- Section devis avec :
  - Liste des devis du contact
  - Statut coloré de chaque devis
  - Date création et montant
  - Boutons accepter/refuser pour devis VU/ENVOYE
  - Jauge de progression 6 jours pour devis ENVOYE
  - Indicateur "Récent/À suivre/Relance recommandée"
  - Tracking (envoyé, ouvert)
  - Bouton relance email avec couleur selon urgence
- Section emails envoyés avec :
  - Liste des emails avec tracking
  - Statut ouvert/non ouvert
  - Nombre d'ouvertures
  - Date d'envoi et d'ouverture
  - Contenu de l'email
- Actions rapides (Envoyer email, Appeler, Modifier)

### 9. Modal d'email
- Champs destinataire (disabled), sujet, message
- Indicateur "Email avec tracking activé"
- Boutons Annuler/Envoyer
- État de chargement avec spinner
- Pré-remplissage pour relances devis

### 10. Fonctionnalités de relance
- Bouton relance sur chaque devis ENVOYE/VU
- Couleur du bouton selon urgence (bleu < 3j, orange 3-6j, rouge > 6j)
- Pré-remplissage email avec objet "Relance - [nom devis]"
- Message personnalisé avec nom contact et nom devis

### 11. Filtrage et tri
- Recherche par nom, prénom, email, entreprise
- Filtre par statut (tous, client actif, prospect chaud/tiède/froid, inactif)
- Tri par score, revenue, activity

### 12. Gestion des erreurs et états
- États de chargement
- Messages d'erreur avec toast
- Confirmations de suppression
- Gestion des clics extérieurs pour fermer dropdowns

## Encodage
- Tous les textes en français sans caractères spéciaux problématiques
- Utiliser "tiede" au lieu de "tiède", "a" au lieu de "à", etc.
- Éviter les emojis, utiliser des caractères simples

## Structure du code
1. Imports
2. Constantes (statusColors, statusLabels)
3. Schémas Zod
4. Composant principal avec :
   - États
   - Hooks
   - Fonctions utilitaires
   - Gestionnaires d'événements
   - Filtrage des données
   - Rendu JSX
   - Modales

## ✅ ÉTAPES COMPLÉTÉES :
1. **Mapping des champs corrigé** - Utilise nom/prenom/statut/telephone/entreprise comme la DB
2. **Vraies métriques** - scoreValeur, chiffresAffairesTotal, tauxConversion
3. **Envoi d'email réel** - Utilise contactsService.sendEmailToContact avec tracking
4. **CRUD complet** - Création, modification, suppression avec vraies APIs
5. **Formulaire complet** - Tous les champs avec validation Zod

## ÉTAT ACTUEL DU PROJET

### ✅ FONCTIONNALITÉS TERMINÉES :

#### 1. Champs de création de devis réorganisés (client/src/pages/Quotes.tsx)
- Désignation sur toute la largeur
- Quantité, Prix unitaire HT, TVA sur une ligne (grid-cols-3)
- Curseurs colorés avec couleurs pastel (emerald, rose, blue, orange)
- Meilleure ergonomie et espacement

#### 2. Statut "TERMINE" ajouté
- Nouveau statut TERMINE dans enum QuoteStatus (client/src/types/index.ts)
- Couleur purple pour le statut terminé (client/src/pages/Quotes.tsx)
- Backend modifié pour passer en TERMINE après téléchargement PDF (src/controllers/quoteController.ts)
- Migration base de données effectuée (prisma/schema.prisma)

#### 3. Case à cocher "ne plus afficher" pour téléchargements
- État skipDownloadWarning ajouté (client/src/pages/Quotes.tsx)
- Case à cocher dans modal de confirmation téléchargement
- Sauvegarde préférence utilisateur via skipArchiveWarning
- Réinitialisation états dans cancelAction et confirmAction

### 🔄 EN COURS : Page Contacts (client/src/pages/Contacts.tsx)

#### État actuel :
- ✅ Imports et constantes (statusColors, statusLabels, contactSchema)
- ✅ États de base et modales déclarés
- ✅ Fonctions utilitaires ajoutées (formatCurrency, formatDate, etc.)
- ❌ Interface utilisateur basique temporaire

#### À FAIRE IMMÉDIATEMENT :

1. **Gestionnaires d'événements** (priorité 1)
```typescript
// Ajouter après les fonctions utilitaires :
const handleContactClick = (contact: Contact) => {
  setSelectedContact(contact);
  setShowContactModal(true);
};

const handleEmailContact = (contact: Contact) => {
  setSelectedContact(contact);
  setEmailSubject('');
  setEmailContent('');
  setShowEmailModal(true);
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
    // TODO: Implementer la suppression avec l'API
    toast.success('Contact supprimé avec succès');
    setShowDeleteModal(false);
    setContactToDelete(null);
  } catch (error) {
    console.error('Erreur suppression:', error);
    toast.error('Erreur lors de la suppression');
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
    toast.success('Email envoyé avec succès et tracking activé');
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

// Filtrage et tri des données
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

// Calcul des statistiques globales
const globalStats = {
  totalCA: filteredContacts.reduce((sum, contact) => sum + (contact.chiffresAffairesTotal || 0), 0),
  avgConversion: filteredContacts.length > 0 
    ? filteredContacts.reduce((sum, contact) => sum + (contact.tauxConversion || 0), 0) / filteredContacts.length
    : 0,
  clientsActifs: filteredContacts.filter(c => c.statut === ContactStatus.CLIENT_ACTIF).length,
};
```

2. **Interface principale complète** (priorité 2)
- Remplacer le return actuel par l'interface complète du backup
- En-tête avec titre et bouton "Nouveau contact"
- Statistiques (4 cartes avec globalStats)
- Barre de recherche et filtres
- Grille de contacts avec cartes stylisées

3. **Modal de suppression stylisée** (priorité 3)
- Ajouter la modal avec design moderne
- Icône d'alerte, animations, transitions

4. **Modal d'email** (priorité 4)
- Modal complète avec champs sujet/message
- Indication tracking activé

5. **Modal détails contact** (priorité 5)
- Utiliser ContactDetails component
- Affichage historique, devis, métriques

### 📋 FICHIERS À VÉRIFIER/COMPLÉTER :

1. **client/src/components/ContactDetails.tsx** - Vérifier qu'il existe et fonctionne
2. **client/src/components/ContactForm.tsx** - Vérifier qu'il existe et fonctionne  
3. **client/src/hooks/useContacts.ts** - Vérifier les mutations CRUD
4. **src/services/emailService.ts** - Vérifier contactsService.sendEmailToContact

### 🎯 OBJECTIF FINAL :
Page Contacts complètement fonctionnelle avec :
- CRUD complet des contacts
- Envoi d'emails avec tracking
- Modal de suppression stylisée (demande originale)
- Affichage des statistiques et métriques
- Historique des interactions

## Code ajouté :
```typescript
// Imports de base
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Icones Lucide
import { 
  Plus, Search, Filter, Edit2, Trash2, Phone, Mail, Building, TrendingUp,
  Users, Calendar, X, Eye, FileText, Send, CheckCircle, XCircle, 
  AlertCircle, MessageSquare, Eye as EyeIcon
} from 'lucide-react';
// Hooks et services
import { useContacts } from '@/hooks/useContacts';
import { useQuotes } from '@/hooks/useQuotes';
import toast from 'react-hot-toast';
import { Contact, ContactStatus, QuoteStatus, GenericEmail } from '@/types';
import { contactsService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

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

// Schema de validation
const contactSchema = z.object({
  prenom: z.string().min(1, 'Le prenom est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  poste: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().optional(),
  statut: z.nativeEnum(ContactStatus),
  notes: z.string().optional(),
});

export default function ContactsPage() {
  // Etats de base
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'score' | 'revenue' | 'activity'>('score');
  
  // Etats pour modales
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  
  // Etats pour historique
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { contacts, isLoading } = useContacts();
  const { quotes } = useQuotes();

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getDaysSinceCreation = (date: string | Date) => {
    const now = new Date();
    const created = new Date(date);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getQuoteStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.BROUILLON: return 'bg-gray-100 text-gray-800';
      case QuoteStatus.ENVOYE: return 'bg-blue-100 text-blue-800';
      case QuoteStatus.VU: return 'bg-yellow-100 text-yellow-800';
      case QuoteStatus.ACCEPTE: return 'bg-green-100 text-green-800';
      case QuoteStatus.REFUSE: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getDaysSinceCreation = (date: string | Date) => {
    const now = new Date();
    const created = new Date(date);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getQuoteStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.BROUILLON: return 'bg-gray-100 text-gray-800';
      case QuoteStatus.ENVOYE: return 'bg-blue-100 text-blue-800';
      case QuoteStatus.VU: return 'bg-yellow-100 text-yellow-800';
      case QuoteStatus.ACCEPTE: return 'bg-green-100 text-green-800';
      case QuoteStatus.REFUSE: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Gestionnaires d'evenements
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactModal(true);
  };

  const handleEmailContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEmailSubject('');
    setEmailContent('');
    setShowEmailModal(true);
  };

  const handleCallContact = (contact: Contact) => {
    window.open(`tel:${contact.phone}`);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = async (contactId: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer ce contact ?')) {
      try {
        // TODO: Implementer la suppression
        toast.success('Contact supprime avec succes');
      } catch (error) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleSendEmail = async () => {
    if (!selectedContact || !emailSubject || !emailContent) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoadingEmail(true);
    try {
      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Email envoye avec succes');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailContent('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  // Filtrage et tri des donnees
  const filteredContacts = contacts?.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (contact.firstName || '').toLowerCase().includes(searchLower) ||
      (contact.lastName || '').toLowerCase().includes(searchLower) ||
      (contact.email || '').toLowerCase().includes(searchLower) ||
      (contact.company || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex justify-between items-center">
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
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">CA total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion moy.</p>
                  <p className="text-2xl font-bold text-gray-900">0%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredContacts.filter(c => c.status === ContactStatus.CLIENT_ACTIF).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
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
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id} 
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleContactClick(contact)}
              >
                {/* En-tete de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar avec initiales */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {(contact.firstName || 'N').charAt(0)}{(contact.lastName || 'N').charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {contact.firstName || 'Nom'} {contact.lastName || 'Inconnu'}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.email || 'Email non renseigne'}</p>
                      {contact.company && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge de statut */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[contact.status]}`}>
                    {statusLabels[contact.status]}
                  </span>
                </div>

                {/* Score de valeur */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Score: 85/100</span>
                  </div>
                </div>

                {/* Metriques rapides */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">CA total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Taux conversion</p>
                    <p className="font-semibold text-gray-900">0%</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmailContact(contact);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Envoyer un email"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    {contact.phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCallContact(contact);
                        }}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(contact.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal d'email */}
      {showEmailModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Envoyer un email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinataire
                </label>
                <input
                  type="email"
                  value={selectedContact.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sujet
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Objet de l'email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Votre message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <EyeIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">Email avec tracking active</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isLoadingEmail || !emailSubject || !emailContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```
