import React, { createContext, useContext, useState, useEffect } from 'react';
import { contactsService, quotesService, metricsService } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // États globaux
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stats, setStats] = useState({
    leads: {},
    quotes: {}
  });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Charger les données initiales
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLeads(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      addNotification('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Gestion des leads
  const loadLeads = async (filters = {}) => {
    try {
      const response = await contactsService.getContacts();
      if (response.success) {
        setLeads(response.contacts || []);
        return response.contacts || [];
      }
    } catch (error) {
      console.error('Erreur chargement leads:', error);
      addNotification('Erreur lors du chargement des leads', 'error');
      return [];
    }
  };

  const createLead = async (leadData) => {
    try {
      const response = await contactsService.createContact(leadData);
      if (response.success) {
        setLeads(prev => [response.contact, ...prev]);
        addNotification('Contact créé avec succès', 'success');
        return response.contact;
      }
    } catch (error) {
      console.error('Erreur création lead:', error);
      addNotification('Erreur lors de la création du lead', 'error');
      throw error;
    }
  };

  const updateLead = async (leadId, updates) => {
    try {
      const response = await contactsService.updateContact(leadId, updates);
      if (response.success) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? response.contact : lead
        ));
        if (selectedLead?.id === leadId) {
          setSelectedLead(response.contact);
        }
        addNotification('Contact mis à jour', 'success');
        return response.contact;
      }
    } catch (error) {
      console.error('Erreur mise à jour lead:', error);
      addNotification('Erreur lors de la mise à jour', 'error');
      throw error;
    }
  };

  const deleteLead = async (leadId) => {
    try {
      const response = await contactsService.deleteContact(leadId);
      if (response.success) {
        setLeads(prev => prev.filter(lead => lead.id !== leadId));
        if (selectedLead?.id === leadId) {
          setSelectedLead(null);
        }
        addNotification('Contact supprimé', 'success');
        return true;
      }
    } catch (error) {
      console.error('Erreur suppression lead:', error);
      addNotification('Erreur lors de la suppression', 'error');
      throw error;
    }
  };

  const importLeads = async (file) => {
    try {
      // TODO: Add importContacts method to contactsService
      throw new Error('Import functionality not yet implemented');
      if (response.success) {
        await loadLeads(); // Recharger la liste
        addNotification(
          `${response.imported} leads importés avec succès`, 
          'success'
        );
        if (response.errors > 0) {
          addNotification(
            `${response.errors} erreurs lors de l'import`, 
            'warning'
          );
        }
        return response;
      }
    } catch (error) {
      console.error('Erreur import leads:', error);
      addNotification('Erreur lors de l\'import', 'error');
      throw error;
    }
  };

  // Gestion des statistiques
  const loadStats = async () => {
    try {
      const [leadsStats, quotesStats] = await Promise.all([
        metricsService.getDashboard(),
        quotesService.getStats ? quotesService.getStats() : Promise.resolve({ success: true, stats: {} })
      ]);

      setStats({
        leads: leadsStats.success ? leadsStats.stats : {},
        quotes: quotesStats.success ? quotesStats.stats : {}
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Gestion des notifications
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date() };
    
    setNotifications(prev => [...prev, notification]);

    // Auto-suppression après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Utilitaires
  const refreshData = async () => {
    await loadInitialData();
  };

  const getLeadById = (leadId) => {
    return leads.find(lead => lead.id === leadId);
  };

  const getLeadsByStatus = (status) => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadsByTemperature = (temperature) => {
    return leads.filter(lead => lead.temperature === temperature);
  };

  // Recherche et filtrage
  const searchLeads = (query) => {
    if (!query.trim()) return leads;
    
    const searchTerm = query.toLowerCase();
    return leads.filter(lead => 
      (lead.contact?.name || '').toLowerCase().includes(searchTerm) ||
      (lead.contact?.email || '').toLowerCase().includes(searchTerm) ||
      (lead.contact?.company || '').toLowerCase().includes(searchTerm) ||
      (lead.notes || '').toLowerCase().includes(searchTerm)
    );
  };

  const filterLeads = (filters) => {
    let filteredLeads = [...leads];

    if (filters.status) {
      filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
    }

    if (filters.temperature) {
      filteredLeads = filteredLeads.filter(lead => lead.temperature === filters.temperature);
    }

    if (filters.source) {
      filteredLeads = filteredLeads.filter(lead => lead.source === filters.source);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredLeads = filteredLeads.filter(lead => 
        filters.tags.some(tag => lead.tags.includes(tag))
      );
    }

    if (filters.dateFrom) {
      filteredLeads = filteredLeads.filter(lead => 
        new Date(lead.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filteredLeads = filteredLeads.filter(lead => 
        new Date(lead.createdAt) <= new Date(filters.dateTo)
      );
    }

    return filteredLeads;
  };

  const value = {
    // États
    leads,
    selectedLead,
    stats,
    loading,
    notifications,

    // Actions leads
    loadLeads,
    createLead,
    updateLead,
    deleteLead,
    importLeads,
    setSelectedLead,

    // Actions stats
    loadStats,

    // Actions notifications
    addNotification,
    removeNotification,
    clearNotifications,

    // Utilitaires
    refreshData,
    getLeadById,
    getLeadsByStatus,
    getLeadsByTemperature,
    searchLeads,
    filterLeads
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};