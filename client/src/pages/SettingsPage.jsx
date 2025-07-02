import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  KeyIcon,
  BellIcon,
  CogIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profil', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'system', name: 'Système', icon: CogIcon },
    { id: 'about', name: 'À propos', icon: InformationCircleIcon }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos préférences et la configuration de votre compte
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation des onglets */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-link w-full ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'system' && <SystemTab />}
          {activeTab === 'about' && <AboutTab />}
        </div>
      </div>
    </div>
  );
};

// Onglet Profil
const ProfileTab = ({ user, updateUser }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: user?.company || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulation de mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        name: formData.name,
        company: formData.company
      });

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      // Simulation de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Mot de passe modifié avec succès');
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="form-label">Nom complet</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-10 form-input"
                placeholder="Votre nom complet"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                disabled
                className="pl-10 form-input bg-gray-50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div>
            <label className="form-label">Entreprise</label>
            <div className="relative">
              <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="pl-10 form-input"
                placeholder="Nom de votre entreprise"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Mise à jour...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* Changement de mot de passe */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sécurité</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="form-label">Mot de passe actuel</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="pl-10 form-input"
                placeholder="Votre mot de passe actuel"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Nouveau mot de passe</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="pl-10 form-input"
                placeholder="Nouveau mot de passe (min. 6 caractères)"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-10 form-input"
                placeholder="Confirmez le nouveau mot de passe"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.currentPassword || !formData.newPassword}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Onglet Notifications
const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    newLeadNotifications: true,
    quoteStatusNotifications: true,
    weeklyReports: false,
    marketingEmails: false
  });

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    toast.success('Préférences mises à jour');
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Préférences de notification</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Notifications par email</h3>
            <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
          </div>
          <button
            onClick={() => handleToggle('emailNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Nouveaux leads</h3>
            <p className="text-sm text-gray-500">Notification lors de l'ajout d'un nouveau lead</p>
          </div>
          <button
            onClick={() => handleToggle('newLeadNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.newLeadNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.newLeadNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Statut des devis</h3>
            <p className="text-sm text-gray-500">Notification quand un devis est lu ou signé</p>
          </div>
          <button
            onClick={() => handleToggle('quoteStatusNotifications')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.quoteStatusNotifications ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.quoteStatusNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Rapports hebdomadaires</h3>
            <p className="text-sm text-gray-500">Recevoir un résumé hebdomadaire de votre activité</p>
          </div>
          <button
            onClick={() => handleToggle('weeklyReports')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.weeklyReports ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Emails marketing</h3>
            <p className="text-sm text-gray-500">Recevoir des conseils et actualités produit</p>
          </div>
          <button
            onClick={() => handleToggle('marketingEmails')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// Onglet Système
const SystemTab = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration système</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">API Backend</h3>
                <p className="text-sm text-green-600">Connecté et opérationnel</p>
              </div>
            </div>
            <span className="badge badge-success">Actif</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Service IA</h3>
                <p className="text-sm text-green-600">Qualification automatique disponible</p>
              </div>
            </div>
            <span className="badge badge-success">Actif</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Génération PDF</h3>
                <p className="text-sm text-green-600">Service de génération de devis opérationnel</p>
              </div>
            </div>
            <span className="badge badge-success">Actif</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Service Email</h3>
                <p className="text-sm text-green-600">Envoi automatique de devis configuré</p>
              </div>
            </div>
            <span className="badge badge-success">Actif</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations techniques</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Version:</span>
            <span className="ml-2 text-gray-900">1.0.0 (Démo)</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Environnement:</span>
            <span className="ml-2 text-gray-900">Développement</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Base de données:</span>
            <span className="ml-2 text-gray-900">Simulation locale</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Dernière mise à jour:</span>
            <span className="ml-2 text-gray-900">25 Décembre 2024</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Onglet À propos
const AboutTab = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">À propos de CRM Intelligent</h2>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            CRM Intelligent est une solution complète de gestion de la relation client 
            avec génération automatisée de devis par intelligence artificielle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Fonctionnalités principales</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Gestion complète des leads</li>
                <li>• Qualification automatique par IA</li>
                <li>• Génération de devis PDF</li>
                <li>• Envoi automatique par email</li>
                <li>• Suivi des ouvertures et signatures</li>
                <li>• Import CSV/Excel</li>
                <li>• Dashboard analytique</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Technologies utilisées</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React + Tailwind CSS</li>
                <li>• Node.js + Express</li>
                <li>• Intelligence Artificielle (OpenAI)</li>
                <li>• Génération PDF (PDFKit)</li>
                <li>• Authentification sécurisée</li>
                <li>• API REST complète</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Version de démonstration - Toutes les fonctionnalités sont simulées pour 
              permettre de tester l'interface et les workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Support et Contact</h2>
        
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-600">Email de support:</span>
            <span className="ml-2 text-blue-600">support@crm-intelligent.com</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Documentation:</span>
            <span className="ml-2 text-blue-600">docs.crm-intelligent.com</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Statut des services:</span>
            <span className="ml-2 text-blue-600">status.crm-intelligent.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;