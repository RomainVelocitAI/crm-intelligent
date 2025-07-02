import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Send, 
  Eye, 
  Download,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Euro,
  Calendar,
  User,
  Building,
  FileText,
  X,
  Minus,
  Save,
  Star,
  Lock
} from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { useContacts } from '@/hooks/useContacts';
import { useServices } from '@/hooks/useServices';
import toast from 'react-hot-toast';
import { Quote, QuoteStatus, Contact, Service } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService, quotesService } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

const quoteItemSchema = z.object({
  serviceId: z.string().optional(),
  designation: z.string().min(1, 'Désignation requise'),
  description: z.string().optional(),
  quantite: z.number().min(0.01, 'Quantité invalide'),
  prixUnitaire: z.number().min(0, 'Prix invalide'),
  tauxTva: z.number().min(0).max(100).optional().default(20),
  conserver: z.boolean().optional().default(false),
});

const companyInfoSchema = z.object({
  nomEntreprise: z.string().min(1, 'Nom de l\'entreprise requis'),
  siren: z.string().min(9, 'SIREN invalide').max(9, 'SIREN invalide'),
  numeroTvaIntracommunautaire: z.string().optional(),
});

const contactSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  entreprise: z.string().optional(),
  poste: z.string().optional(),
  siren: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  pays: z.string().min(1, 'Pays requis').default('France'),
  notes: z.string().optional(),
});

const quoteSchema = z.object({
  contactId: z.string().min(1, 'Contact requis'),
  objet: z.string().min(1, 'Objet requis'),
  dateValidite: z.string().min(1, 'Date de validité requise'),
  conditions: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Au moins un élément requis'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

const statusColors = {
  [QuoteStatus.BROUILLON]: 'bg-gray-100 text-gray-800 border-gray-200',
  [QuoteStatus.PRET]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [QuoteStatus.ENVOYE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [QuoteStatus.VU]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [QuoteStatus.ACCEPTE]: 'bg-green-100 text-green-800 border-green-200',
  [QuoteStatus.REFUSE]: 'bg-red-100 text-red-800 border-red-200',
  [QuoteStatus.EXPIRE]: 'bg-orange-100 text-orange-800 border-orange-200',
  [QuoteStatus.TERMINE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [QuoteStatus.ARCHIVE]: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels = {
  [QuoteStatus.BROUILLON]: 'Brouillon',
  [QuoteStatus.PRET]: 'Prêt',
  [QuoteStatus.ENVOYE]: 'Envoyé',
  [QuoteStatus.VU]: 'Consulté',
  [QuoteStatus.ACCEPTE]: 'Accepté',
  [QuoteStatus.REFUSE]: 'Refusé',
  [QuoteStatus.EXPIRE]: 'Expiré',
  [QuoteStatus.TERMINE]: 'Terminé',
  [QuoteStatus.ARCHIVE]: 'Archivé',
};

const statusIcons = {
  [QuoteStatus.BROUILLON]: FileText,
  [QuoteStatus.PRET]: CheckCircle,
  [QuoteStatus.ENVOYE]: Send,
  [QuoteStatus.VU]: Eye,
  [QuoteStatus.ACCEPTE]: CheckCircle,
  [QuoteStatus.REFUSE]: XCircle,
  [QuoteStatus.EXPIRE]: AlertCircle,
  [QuoteStatus.TERMINE]: CheckCircle,
  [QuoteStatus.ARCHIVE]: Lock,
};

export default function QuotesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingQuote, setSendingQuote] = useState<Quote | null>(null);
  const [sendMessage, setSendMessage] = useState('');
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  
  // États pour les modals de confirmation de validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'download' | 'send' | 'validate' | null>(null);
  const [quoteToValidate, setQuoteToValidate] = useState<Quote | null>(null);
  
  const { quotes, isLoading, createQuote, updateQuote, deleteQuote, sendQuote } = useQuotes();
  const { contacts, createContact } = useContacts();
  const { services } = useServices();
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  // Informations entreprise
  const [companyInfo, setCompanyInfo] = useState({
    nomEntreprise: user?.entreprise || '',
    siren: user?.siret || '',
    numeroTvaIntracommunautaire: user?.numeroTvaIntracommunautaire || ''
  });

  // Mise à jour des infos entreprise quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setCompanyInfo({
        nomEntreprise: user.entreprise || '',
        siren: user.siret || '',
        numeroTvaIntracommunautaire: user.numeroTvaIntracommunautaire || ''
      });
    }
  }, [user]);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      items: [{ designation: '', description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20, conserver: false }],
    },
  });

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      pays: 'France',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  const calculateTotals = () => {
    const sousTotal = watchedItems.reduce((sum, item) => {
      return sum + (item.quantite || 0) * (item.prixUnitaire || 0);
    }, 0);
    const tva = watchedItems.reduce((sum, item) => {
      const itemTotal = (item.quantite || 0) * (item.prixUnitaire || 0);
      const tauxTva = (item.tauxTva || 20) / 100;
      return sum + (itemTotal * tauxTva);
    }, 0);
    const total = sousTotal + tva;
    
    return { sousTotal, tva, total };
  };

  const { sousTotal, tva, total } = calculateTotals();

  const filteredQuotes = quotes?.filter(quote => {
    // Exclure les devis archivés de la page Opportunités
    if (quote.statut === QuoteStatus.ARCHIVE) {
      return false;
    }
    
    const matchesSearch = 
      quote.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contact?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contact?.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.contact?.entreprise?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });


  const handleSubmit = async (data: QuoteFormData) => {
    try {
      const quoteData = {
        ...data,
        dateValidite: new Date(data.dateValidite).toISOString(),
        sousTotal,
        tva,
        total,
      };

      if (editingQuote) {
        await updateQuote.mutateAsync({ id: editingQuote.id, ...quoteData });
        toast.success('Devis mis à jour avec succès');
      } else {
        await createQuote.mutateAsync(quoteData);
        toast.success('Devis créé avec succès');
      }
      
      setShowForm(false);
      setEditingQuote(null);
      form.reset({
        items: [{ designation: '', description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20, conserver: false }],
      });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
    form.reset({
      contactId: quote.contactId,
      objet: quote.objet,
      dateValidite: format(new Date(quote.dateValidite), 'yyyy-MM-dd'),
      conditions: quote.conditions || '',
      notes: quote.notes || '',
      items: quote.items.map(item => ({
        serviceId: item.serviceId || undefined,
        designation: item.designation,
        description: item.description || '',
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
        tauxTva: 20, // Valeur par défaut pour les anciens devis
        conserver: item.conserver || false,
      })),
    });
    setShowForm(true);
  };

  const handleDelete = (quote: Quote) => {
    setQuoteToDelete(quote);
    setShowDeleteModal(true);
  };

  const handleTestPDF = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}/test-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('PDF généré avec succès ! Le devis est maintenant verrouillé.');
        console.log('PDF path:', data.data.pdfPath);
        // Recharger les devis pour refléter le verrouillage
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
      } else {
        toast.error(`Erreur PDF: ${data.message}${data.details ? ` - ${data.details}` : ''}`);
        console.error('Erreur PDF:', data);
      }
    } catch (error: any) {
      toast.error('Erreur lors du test PDF');
      console.error('Erreur test PDF:', error);
    }
  };

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}/test-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = `/${data.data.pdfPath}`;
        link.download = `devis_${quote.numero}.pdf`;
        link.click();
        
        // Afficher le message approprié selon la réponse du serveur
        if (data.data.statusChanged) {
          toast.success('PDF téléchargé avec succès ! Le devis est maintenant terminé.');
        } else {
          toast.success('PDF téléchargé avec succès !');
        }
        
        // Recharger les devis pour refléter le verrouillage
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
      } else {
        toast.error(`Erreur PDF: ${data.message}${data.details ? ` - ${data.details}` : ''}`);
        console.error('Erreur PDF:', data);
      }
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement PDF');
      console.error('Erreur téléchargement PDF:', error);
    }
  };

  // Nouvelles fonctions pour gérer la validation avant téléchargement/envoi
  const handleDownloadWithValidation = (quote: Quote) => {
    // Si le devis n'est pas un brouillon, téléchargement direct
    if (quote.statut !== QuoteStatus.BROUILLON) {
      handleDownloadPDF(quote);
      return;
    }
    
    // Pour les brouillons, toujours demander confirmation de validation
    setQuoteToValidate(quote);
    setValidationAction('download');
    setShowValidationModal(true);
  };

  const handleSendWithValidation = (quote: Quote) => {
    // Si le devis est déjà terminé, envoi direct sans validation
    if (quote.statut === QuoteStatus.TERMINE) {
      handleSend(quote);
      return;
    }
    
    // Pour les brouillons, demander confirmation de validation avant envoi
    setQuoteToValidate(quote);
    setValidationAction('send');
    setShowValidationModal(true);
  };

  const confirmValidation = () => {
    if (!quoteToValidate || !validationAction) return;

    if (validationAction === 'download') {
      handleDownloadPDF(quoteToValidate);
    } else if (validationAction === 'send') {
      handleSend(quoteToValidate);
    } else if (validationAction === 'validate') {
      performValidateQuote(quoteToValidate);
    }

    // Fermer le modal de validation
    setShowValidationModal(false);
    setQuoteToValidate(null);
    setValidationAction(null);
  };

  const cancelValidation = () => {
    setShowValidationModal(false);
    setQuoteToValidate(null);
    setValidationAction(null);
  };

  const handleSend = (quote: Quote) => {
    setSendingQuote(quote);
    setSendMessage(`Bonjour,

Veuillez trouver ci-joint notre devis ${quote.numero} pour ${quote.objet}.

N'hésitez pas à nous contacter pour toute question.

Cordialement`);
    setShowSendModal(true);
  };

  const handleDownload = (quote: Quote) => {
    handleDownloadWithValidation(quote);
  };

  // Nouvelle fonction pour valider un devis (BROUILLON -> PRET)
  const handleValidateQuote = (quote: Quote) => {
    // Afficher le modal de confirmation avant validation
    setQuoteToValidate(quote);
    setValidationAction('validate');
    setShowValidationModal(true);
  };

  // Fonction pour effectuer la validation après confirmation
  const performValidateQuote = async (quote: Quote) => {
    try {
      await quotesService.validateQuote(quote.id);
      
      // Mettre à jour le cache React Query
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      
      toast.success('Devis validé avec succès - Il est maintenant prêt à être envoyé');
    } catch (error: any) {
      console.error('Erreur lors de la validation du devis:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la validation du devis');
    }
  };

  const confirmDelete = async () => {
    if (!quoteToDelete) return;

    try {
      // Si c'est un brouillon, suppression directe
      if (quoteToDelete.statut === QuoteStatus.BROUILLON) {
        await deleteQuote.mutateAsync(quoteToDelete.id);
        toast.success('Devis supprimé définitivement');
        setShowDeleteModal(false);
        setQuoteToDelete(null);
        return;
      }

      // Si c'est un devis accepté, archivage légal obligatoire
      if (quoteToDelete.statut === QuoteStatus.ACCEPTE) {
        const response = await fetch(`/api/quotes/${quoteToDelete.id}/legal-archive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Devis archivé pour conservation légale (10 ans)');
          // Rediriger vers les archives
          window.location.href = '/archives';
        } else {
          toast.error(data.message || 'Erreur lors de l\'archivage légal');
        }
      } else {
        // Pour les autres statuts (TERMINE, ENVOYE, VU, REFUSE, EXPIRE), archivage normal
        await deleteQuote.mutateAsync(quoteToDelete.id);
        toast.success('Devis archivé avec succès');
        // Rediriger vers les archives
        window.location.href = '/archives';
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression/archivage');
    }

    setShowDeleteModal(false);
    setQuoteToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setQuoteToDelete(null);
  };

  const confirmSend = async () => {
    if (!sendingQuote) return;
    
    try {
      await sendQuote.mutateAsync(sendingQuote.id);
      toast.success('Devis envoyé avec succès');
      
      setShowSendModal(false);
      setSendingQuote(null);
      setSendMessage('');
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'envoi:', error);
      console.error('Response data:', error?.response?.data);
      console.error('Error message:', error?.response?.data?.message);
      console.error('Error details:', error?.response?.data?.details);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'envoi';
      const errorDetails = error?.response?.data?.details;
      toast.error(`Erreur: ${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
    }
  };

  const handleDuplicate = (quote: Quote) => {
    form.reset({
      contactId: quote.contactId,
      objet: `${quote.objet} (Copie)`,
      dateValidite: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // +30 jours
      conditions: quote.conditions || '',
      notes: quote.notes || '',
      items: quote.items.map(item => ({
        serviceId: item.serviceId || undefined,
        designation: item.designation,
        description: item.description || '',
        quantite: item.quantite,
        prixUnitaire: item.prixUnitaire,
        tauxTva: 20, // Valeur par défaut
        conserver: item.conserver || false,
      })),
    });
    setEditingQuote(null);
    setShowForm(true);
  };

  const handleQuoteClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  const handleSaveCompanyInfo = async () => {
    try {
      const response = await authService.updateProfile({
        entreprise: companyInfo.nomEntreprise,
        siret: companyInfo.siren,
        numeroTvaIntracommunautaire: companyInfo.numeroTvaIntracommunautaire
      });
      
      // Mettre à jour l'utilisateur dans le store
      setUser(response.data.user);
      toast.success('Informations sauvegardées');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const addServiceToQuote = (service: Service) => {
    append({
      serviceId: service.id,
      designation: service.nom,
      description: service.description || '',
      quantite: 1,
      prixUnitaire: service.prixDefaut || 0,
      tauxTva: 20,
      conserver: false,
    });
  };

  const handleCreateContact = async (data: ContactFormData) => {
    try {
      const response = await createContact.mutateAsync(data);
      toast.success('Contact créé avec succès');
      
      // Sélectionner automatiquement le nouveau contact dans le formulaire de devis
      const newContactId = response.data?.contact?.id || response.data?.id;
      
      if (newContactId) {
        // Attendre que la liste des contacts soit mise à jour par React Query
        setTimeout(() => {
          form.setValue('contactId', newContactId, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }, 500); // Attendre 500ms pour que React Query rafraîchisse la liste
      }
      
      // Fermer le modal et réinitialiser le formulaire
      setShowNewContactModal(false);
      contactForm.reset({
        pays: 'France',
      });
    } catch (error: any) {
      // Gestion spécifique des erreurs
      let errorMessage = 'Erreur lors de la création du contact';
      
      if (error?.response?.status === 409) {
        errorMessage = 'Un contact avec cet email existe déjà';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors?.length > 0) {
        errorMessage = error.response.data.errors[0];
      }
      
      toast.error(errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  };

  // Fonction pour calculer les jours depuis l'envoi d'un devis
  const getDaysSinceQuoteSent = (quote: Quote) => {
    if (!quote.dateEnvoi) return 0;
    const sentDate = new Date(quote.dateEnvoi);
    const today = new Date();
    const diffTime = today.getTime() - sentDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fonction pour déterminer l'urgence de relance (sur 7 jours)
  const getRelanceUrgency = (quote: Quote) => {
    if (quote.statut !== QuoteStatus.ENVOYE && quote.statut !== QuoteStatus.VU) {
      return { level: 'none', percentage: 0, message: '' };
    }

    const daysSinceSent = getDaysSinceQuoteSent(quote);
    const percentage = Math.min((daysSinceSent / 7) * 100, 100);

    if (daysSinceSent >= 7) {
      return { 
        level: 'urgent', 
        percentage: 100, 
        message: 'Relance urgente recommandée' 
      };
    } else if (daysSinceSent >= 5) {
      return { 
        level: 'warning', 
        percentage, 
        message: 'Relance bientôt nécessaire' 
      };
    } else if (daysSinceSent >= 3) {
      return { 
        level: 'info', 
        percentage, 
        message: 'Suivi en cours' 
      };
    } else {
      return { 
        level: 'good', 
        percentage, 
        message: 'Récemment envoyé' 
      };
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="quotes-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunités</h1>
          <p className="text-gray-600">Gérez vos devis et opportunités commerciales</p>
        </div>
      </div>

      {/* Section identification entreprise */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" data-tour="company-info">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Informations de l'entreprise</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la société *
            </label>
            <input
              type="text"
              value={companyInfo.nomEntreprise}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, nomEntreprise: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ma Société SARL"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIREN *
            </label>
            <input
              type="text"
              value={companyInfo.siren}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, siren: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123456789"
              maxLength={9}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° TVA intracommunautaire
            </label>
            <input
              type="text"
              value={companyInfo.numeroTvaIntracommunautaire}
              onChange={(e) => setCompanyInfo(prev => ({ ...prev, numeroTvaIntracommunautaire: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="FR12345678901 (optionnel)"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveCompanyInfo}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>

      {/* Section Premium - Services récurrents */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Services récurrents</span>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">PREMIUM</span>
          </h2>
        </div>
        
        {!true /* isPremium */ ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Fonctionnalité Premium</p>
                <p className="text-sm text-gray-500">Passez en Premium pour créer des services récurrents</p>
              </div>
            </div>
            <div className="opacity-50 pointer-events-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Service exemple</h3>
                  <p className="text-sm text-gray-600 mb-2">Description du service</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">500,00 € HT</span>
                    <span className="text-xs text-gray-500">TVA: 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Ici seront affichés les services récurrents pour les utilisateurs premium */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <button className="text-blue-600 hover:text-blue-700 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un service récurrent</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton central de génération de devis */}
      <div className="text-center py-8">
        <button
          onClick={() => {
            setEditingQuote(null);
            form.reset({
              items: [{ designation: '', description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20 }],
            });
            setShowForm(true);
          }}
          data-tour="new-quote-button"
          className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 mx-auto"
        >
          <Plus className="w-6 h-6" />
          <span>Générer un nouveau devis</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un devis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
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

      {/* Liste des devis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des devis...</p>
          </div>
        ) : filteredQuotes?.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun devis ne correspond aux critères de recherche'
                : 'Aucun devis pour le moment'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes?.map((quote, index) => {
                  const StatusIcon = statusIcons[quote.statut];
                  const isFirstQuote = index === 0; // Pour les attributs data-tour
                  
                  return (
                    <tr 
                      key={quote.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleQuoteClick(quote)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {quote.numero}
                          </p>
                          <p className="text-sm text-gray-500">
                            {quote.objet}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {quote.contact?.prenom.charAt(0)}{quote.contact?.nom.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {quote.contact?.prenom} {quote.contact?.nom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {quote.contact?.entreprise}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusColors[quote.statut]
                        }`}>
                          {(() => {
                            const StatusIcon = statusIcons[quote.statut];
                            return <StatusIcon className="w-3 h-3 mr-1" />;
                          })()}
                          {statusLabels[quote.statut]}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(quote.total)}
                          </p>
                          <p className="text-xs text-gray-500">
                            HT: {formatCurrency(quote.sousTotal)}
                          </p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>Créé: {formatDate(quote.dateCreation)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Valid.: {formatDate(quote.dateValidite)}</span>
                          </div>
                          {quote.dateEnvoi && (
                            <div className="flex items-center space-x-1">
                              <Send className="w-3 h-3" />
                              <span>Envoyé: {formatDate(quote.dateEnvoi)}</span>
                            </div>
                          )}
                          
                          {/* Barre de progression pour les devis envoyés */}
                          {(quote.statut === QuoteStatus.ENVOYE || quote.statut === QuoteStatus.VU) && quote.dateEnvoi && (() => {
                            const urgency = getRelanceUrgency(quote);
                            const daysSinceSent = getDaysSinceQuoteSent(quote);
                            
                            return (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-600">
                                    Relance ({daysSinceSent}/7 jours)
                                  </span>
                                  <span className={`text-xs font-medium ${
                                    urgency.level === 'urgent' ? 'text-red-600' :
                                    urgency.level === 'warning' ? 'text-orange-600' :
                                    urgency.level === 'info' ? 'text-blue-600' :
                                    'text-green-600'
                                  }`}>
                                    {urgency.message}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      urgency.level === 'urgent' ? 'bg-red-500' :
                                      urgency.level === 'warning' ? 'bg-orange-500' :
                                      urgency.level === 'info' ? 'bg-blue-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${urgency.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right" {...(isFirstQuote && { 'data-tour': 'quote-actions' })}>
                        <div className="flex items-center justify-end space-x-2">
                          {/* Boutons pour les brouillons - Nouvelle logique */}
                          {quote.statut === QuoteStatus.BROUILLON && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleValidateQuote(quote);
                                }}
                                className="text-green-600 hover:text-green-800 font-medium"
                                title="Valider le devis"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {/* Boutons pour les devis prêts - Nouvelle logique (pas de modal de validation) */}
                          {quote.statut === QuoteStatus.PRET && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(quote);
                                }}
                                className="text-blue-600 hover:text-orange-600"
                                title="Télécharger PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSend(quote);
                                }}
                                className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                                title="Envoyer par mail"
                              >
                                <Send className="w-4 h-4" />
                                <span className="text-xs">Envoyer</span>
                              </button>
                            </>
                          )}
                          
                          {/* Boutons pour les devis terminés */}
                          {quote.statut === QuoteStatus.TERMINE && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPDF(quote);
                                }}
                                className="text-blue-600 hover:text-orange-600"
                                title="Télécharger PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSend(quote);
                                }}
                                className="text-blue-600 hover:text-green-600"
                                title="Envoyer"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {/* Téléchargement pour les autres statuts (envoyés, acceptés, etc.) */}
                          {![QuoteStatus.BROUILLON, QuoteStatus.PRET, QuoteStatus.TERMINE].includes(quote.statut) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(quote);
                              }}
                              className="text-blue-600 hover:text-orange-600"
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(quote);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Dupliquer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          {/* Modification uniquement pour les brouillons */}
                          {quote.statut === QuoteStatus.BROUILLON && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(quote);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(quote);
                            }}
                            className="text-blue-600 hover:text-red-600"
                            title={
                              quote.statut === QuoteStatus.BROUILLON ? "Supprimer" : 
                              quote.statut === QuoteStatus.ACCEPTE ? "Conservation légale (10 ans)" :
                              "Archiver"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowForm(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {editingQuote ? 'Modifier le devis' : 'Nouveau devis'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Informations générales */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client *
                        </label>
                        <div className="flex space-x-2">
                          <select
                            {...form.register('contactId')}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Sélectionner un client</option>
                            {contacts?.map((contact) => (
                              <option key={contact.id} value={contact.id}>
                                {contact.prenom} {contact.nom} - {contact.entreprise || 'N/A'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setShowNewContactModal(true)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1 whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nouveau</span>
                          </button>
                        </div>
                        {form.formState.errors.contactId && (
                          <p className="mt-1 text-sm text-red-600">
                            {form.formState.errors.contactId.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date de validité *
                          </label>
                          <input
                            {...form.register('dateValidite')}
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {form.formState.errors.dateValidite && (
                            <p className="mt-1 text-sm text-red-600">
                              {form.formState.errors.dateValidite.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Objet du devis *
                          </label>
                          <input
                            {...form.register('objet')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Développement site web"
                          />
                          {form.formState.errors.objet && (
                            <p className="mt-1 text-sm text-red-600">
                              {form.formState.errors.objet.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Éléments du devis */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Éléments du devis</h4>
                      <button
                        type="button"
                        onClick={() => append({ designation: '', description: '', quantite: 1, prixUnitaire: 0, tauxTva: 20, conserver: false })}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un élément</span>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Élément {index + 1}</h5>
                            {fields.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Désignation sur toute la largeur */}
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Désignation *
                            </label>
                            <input
                              {...form.register(`items.${index}.designation`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nom du produit/service"
                            />
                          </div>

                          {/* Ligne avec Quantité, Prix unitaire HT et TVA */}
                          <div className="grid grid-cols-3 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantité *
                              </label>
                              <div className="relative">
                                <input
                                  {...form.register(`items.${index}.quantite`, { valueAsNumber: true })}
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="1"
                                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="absolute right-1 top-1 flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = form.getValues(`items.${index}.quantite`) || 0;
                                      form.setValue(`items.${index}.quantite`, currentValue + 1);
                                    }}
                                    className="px-1.5 py-0.5 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded transition-colors"
                                    title="Ajouter 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = form.getValues(`items.${index}.quantite`) || 0;
                                      if (currentValue > 0) {
                                        form.setValue(`items.${index}.quantite`, Math.max(0, currentValue - 1));
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded transition-colors"
                                    title="Retirer 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prix unitaire HT *
                              </label>
                              <div className="relative">
                                <input
                                  {...form.register(`items.${index}.prixUnitaire`, { valueAsNumber: true })}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <div className="absolute right-1 top-1 flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = form.getValues(`items.${index}.prixUnitaire`) || 0;
                                      form.setValue(`items.${index}.prixUnitaire`, currentValue + 10);
                                    }}
                                    className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded transition-colors"
                                    title="Ajouter 10€"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentValue = form.getValues(`items.${index}.prixUnitaire`) || 0;
                                      if (currentValue >= 10) {
                                        form.setValue(`items.${index}.prixUnitaire`, Math.max(0, currentValue - 10));
                                      }
                                    }}
                                    className="px-1.5 py-0.5 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded transition-colors"
                                    title="Retirer 10€"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                TVA (%) *
                              </label>
                              <input
                                {...form.register(`items.${index}.tauxTva`, { valueAsNumber: true })}
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                defaultValue={20}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              {...form.register(`items.${index}.description`)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Description détaillée (optionnel)"
                            />
                          </div>

                          {/* Toggle Conserver - Premium */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>Conserver dans les futurs devis</span>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">PREMIUM</span>
                              </label>
                            </div>
                            
                            {user?.isPremium ? (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  {...form.register(`items.${index}.conserver`)}
                                  type="checkbox"
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            ) : (
                              <div className="relative">
                                <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                                  <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                                    <div className="absolute top-[2px] start-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-all"></div>
                                  </div>
                                </label>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Lock className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 text-right space-y-1">
                            <p className="text-sm text-gray-600">
                              Total HT: {formatCurrency((watchedItems[index]?.quantite || 0) * (watchedItems[index]?.prixUnitaire || 0))}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              Total TTC: {formatCurrency(
                                ((watchedItems[index]?.quantite || 0) * (watchedItems[index]?.prixUnitaire || 0)) * 
                                (1 + ((watchedItems[index]?.tauxTva || 20) / 100))
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {form.formState.errors.items && (
                      <p className="mt-2 text-sm text-red-600">
                        {form.formState.errors.items.message}
                      </p>
                    )}
                  </div>

                  {/* Totaux */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sous-total HT:</span>
                        <span className="font-medium">{formatCurrency(sousTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>TVA (20%):</span>
                        <span className="font-medium">{formatCurrency(tva)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions et notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conditions particulières
                      </label>
                      <textarea
                        {...form.register('conditions')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Conditions de paiement, délais, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes internes
                      </label>
                      <textarea
                        {...form.register('notes')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Notes visibles uniquement par vous"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createQuote.isPending || updateQuote.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingQuote ? 'Mettre à jour' : 'Créer le devis'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du devis */}
      {showQuoteDetails && selectedQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowQuoteDetails(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Devis {selectedQuote.numero}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {selectedQuote.statut === QuoteStatus.BROUILLON && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuoteDetails(false);
                          handleEdit(selectedQuote);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowQuoteDetails(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Informations générales</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Client:</span>
                        <p>{selectedQuote.contact?.prenom} {selectedQuote.contact?.nom}</p>
                        <p className="text-gray-500">{selectedQuote.contact?.entreprise}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Statut:</span>
                        <p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            statusColors[selectedQuote.statut]
                          }`}>
                            {statusLabels[selectedQuote.statut]}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de création:</span>
                        <p>{formatDate(selectedQuote.dateCreation)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date de validité:</span>
                        <p>{formatDate(selectedQuote.dateValidite)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Éléments du devis */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Éléments du devis</h4>
                    <div className="space-y-3">
                      {selectedQuote.items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-900">{item.designation}</h5>
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Quantité: {item.quantite} × {formatCurrency(item.prixUnitaire)}</span>
                            <span>TVA: 20%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Récapitulatif</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Sous-total HT:</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.sousTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA:</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.tva)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC:</span>
                        <span>{formatCurrency(selectedQuote.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions et notes */}
                  {(selectedQuote.conditions || selectedQuote.notes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedQuote.conditions && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Conditions particulières</h5>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedQuote.conditions}</p>
                        </div>
                      )}
                      {selectedQuote.notes && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Notes internes</h5>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedQuote.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'envoi de devis */}
      {showSendModal && sendingQuote && (() => {
        const contact = contacts?.find(c => c.id === sendingQuote.contactId);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSendModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Envoyer le devis {sendingQuote.numero}
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Destinataire: {contact?.email || 'Email non trouvé'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Contact: {contact?.prenom} {contact?.nom}
                  </p>
                </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message d'accompagnement
                </label>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Votre message..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowSendModal(false);
                  setSendingQuote(null);
                  setSendMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmSend}
                disabled={sendQuote.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{sendQuote.isPending ? 'Envoi...' : 'Envoyer'}</span>
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Modal de création de contact */}
      {showNewContactModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowNewContactModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={contactForm.handleSubmit(handleCreateContact)}>
                <div className="bg-white px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Nouveau client
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewContactModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Informations personnelles */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prénom *
                        </label>
                        <input
                          {...contactForm.register('prenom')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Jean"
                        />
                        {contactForm.formState.errors.prenom && (
                          <p className="mt-1 text-sm text-red-600">
                            {contactForm.formState.errors.prenom.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom *
                        </label>
                        <input
                          {...contactForm.register('nom')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Dupont"
                        />
                        {contactForm.formState.errors.nom && (
                          <p className="mt-1 text-sm text-red-600">
                            {contactForm.formState.errors.nom.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          {...contactForm.register('email')}
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="jean.dupont@exemple.fr"
                        />
                        {contactForm.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {contactForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Téléphone
                        </label>
                        <input
                          {...contactForm.register('telephone')}
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="01 23 45 67 89"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations professionnelles */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Informations professionnelles</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Entreprise
                        </label>
                        <input
                          {...contactForm.register('entreprise')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ACME Corp"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Poste
                        </label>
                        <input
                          {...contactForm.register('poste')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Directeur"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro SIREN
                        </label>
                        <input
                          {...contactForm.register('siren')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123456789 (optionnel)"
                          maxLength={9}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Adresse</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Adresse
                        </label>
                        <input
                          {...contactForm.register('adresse')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123 Rue de la Paix"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code postal
                          </label>
                          <input
                            {...contactForm.register('codePostal')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="75001"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ville
                          </label>
                          <input
                            {...contactForm.register('ville')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Paris"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pays *
                          </label>
                          <input
                            {...contactForm.register('pays')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="France"
                          />
                          {contactForm.formState.errors.pays && (
                            <p className="mt-1 text-sm text-red-600">
                              {contactForm.formState.errors.pays.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      {...contactForm.register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notes internes sur ce contact..."
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewContactModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createContact.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{createContact.isPending ? 'Création...' : 'Créer le client'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression stylisée */}
      {showDeleteModal && quoteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 p-6 border-b">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {quoteToDelete.statut === QuoteStatus.BROUILLON ? 'Supprimer le devis' : 'Archiver le devis'}
                </h3>
                <p className="text-gray-600">
                  {quoteToDelete.statut === QuoteStatus.BROUILLON 
                    ? 'Cette action est irréversible.' 
                    : 'Le devis sera déplacé vers les archives.'}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Devis concerné :
                </p>
                <p className="font-semibold text-gray-900">{quoteToDelete.numero}</p>
                <p className="text-sm text-gray-600">{quoteToDelete.objet}</p>
                <p className="text-sm text-gray-600">
                  Client : {quoteToDelete.contact?.prenom} {quoteToDelete.contact?.nom}
                </p>
              </div>

              {/* Vérification si le PDF a été téléchargé/envoyé */}
              {(quoteToDelete.statut === QuoteStatus.ACCEPTE || 
                quoteToDelete.statut === QuoteStatus.ENVOYE || 
                quoteToDelete.statut === QuoteStatus.VU ||
                quoteToDelete.statut === QuoteStatus.TERMINE ||
                quoteToDelete.dateEnvoi) && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-semibold mb-2">Obligation légale de conservation</p>
                      <p className="mb-2">
                        <strong>Conformément aux articles L123-22 et R123-173 du Code de commerce</strong>, 
                        ce devis doit être <strong>conservé pendant 10 ans</strong> à des fins comptables et fiscales.
                      </p>
                      <p>
                        Il sera automatiquement archivé et accessible dans la section "Archives" 
                        où vous pourrez le consulter et le télécharger, mais pas le supprimer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {quoteToDelete.statut === QuoteStatus.BROUILLON && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-semibold mb-1">Suppression définitive</p>
                      <p>Ce brouillon sera supprimé définitivement et ne pourra pas être récupéré.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  quoteToDelete.statut === QuoteStatus.BROUILLON
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {quoteToDelete.statut === QuoteStatus.BROUILLON ? 'Supprimer définitivement' : 'Archiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de validation */}
      {showValidationModal && quoteToValidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowValidationModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 p-6 border-b">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {validationAction === 'download' ? 'Téléchargement du devis' : 
                   validationAction === 'validate' ? 'Validation du devis' : 'Envoi du devis'}
                </h3>
                <p className="text-gray-600">
                  {validationAction === 'download' ? 'Génération d\'une version PDF du devis' :
                   validationAction === 'validate' ? 'Cette action va finaliser le devis' :
                   'Cette action va valider définitivement le devis'}
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  Devis concerné :
                </p>
                <p className="font-semibold text-gray-900">{quoteToValidate.numero}</p>
                <p className="text-sm text-gray-600">{quoteToValidate.objet}</p>
                <p className="text-sm text-gray-600">
                  Client : {quoteToValidate.contact?.prenom} {quoteToValidate.contact?.nom}
                </p>
              </div>


              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    {validationAction === 'download' ? (
                      <>
                        <p className="font-semibold mb-1">Important à savoir :</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Le PDF généré sera une version figée du devis actuel</li>
                          <li>Vous pourrez toujours envoyer le devis par email après téléchargement</li>
                          <li>Le PDF aura une valeur légale à la date de génération</li>
                        </ul>
                      </>
                    ) : validationAction === 'validate' ? (
                      <>
                        <p className="font-semibold mb-1">Après validation :</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Le devis sera finalisé et non modifiable</li>
                          <li>Son statut passera à "Prêt"</li>
                          <li>Vous pourrez le télécharger et l'envoyer par email</li>
                          <li>Il aura une valeur contractuelle</li>
                          <li>Plus aucune modification ne sera possible</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold mb-1">Après envoi :</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Le devis sera envoyé au client par email</li>
                          <li>Il aura une valeur contractuelle</li>
                          <li>Vous pourrez toujours le consulter et le télécharger</li>
                          <li>Il sera conservé selon les obligations légales</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={cancelValidation}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmValidation}
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                  validationAction === 'download' ? 'bg-blue-600 hover:bg-blue-700' :
                  validationAction === 'validate' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {validationAction === 'download' ? 'Générer et télécharger le PDF' :
                 validationAction === 'validate' ? 'Valider le devis' :
                 'Valider et envoyer'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}