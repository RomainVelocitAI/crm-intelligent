const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebase');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const xlsx = require('xlsx');

// Configuration multer pour upload CSV/Excel
const upload = multer({ 
  dest: './uploads/temp/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Récupérer tous les leads de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, temperature, search } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (temperature) filters.temperature = temperature;

    let leads = await firebaseService.getLeads(req.user.id, filters);

    // Recherche textuelle simple
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead => 
        lead.contact.name.toLowerCase().includes(searchLower) ||
        lead.contact.email.toLowerCase().includes(searchLower) ||
        lead.contact.company.toLowerCase().includes(searchLower)
      );
    }

    // Tri par date de mise à jour (plus récent en premier)
    leads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ success: true, leads });
  } catch (error) {
    console.error('Erreur récupération leads:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un lead spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await firebaseService.getLead(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouvé' });
    }

    if (lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    console.error('Erreur récupération lead:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { contact, source = 'manual', notes = '', tags = [] } = req.body;

    // Validation
    if (!contact || !contact.name || !contact.email) {
      return res.status(400).json({ error: 'Nom et email obligatoires' });
    }

    const leadData = {
      userId: req.user.id,
      contact,
      source,
      status: 'nouveau',
      temperature: 'tiede',
      notes,
      tags
    };

    const lead = await firebaseService.createLead(leadData);
    res.json({ success: true, lead });
  } catch (error) {
    console.error('Erreur création lead:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await firebaseService.getLead(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouvé' });
    }

    if (lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const updates = req.body;
    delete updates.id; // Empêcher la modification de l'ID
    delete updates.userId; // Empêcher la modification du propriétaire

    const updatedLead = await firebaseService.updateLead(req.params.id, updates);
    res.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Erreur mise à jour lead:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await firebaseService.getLead(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead non trouvé' });
    }

    if (lead.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await firebaseService.deleteLead(req.params.id);
    res.json({ success: true, message: 'Lead supprimé' });
  } catch (error) {
    console.error('Erreur suppression lead:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Import CSV/Excel
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier manquant' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const importedLeads = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Mapping flexible des colonnes
        const contact = {
          name: row.nom || row.name || row.Nom || row.Name || '',
          email: row.email || row.Email || row.mail || row.Mail || '',
          phone: row.telephone || row.phone || row.Phone || row.tel || '',
          company: row.entreprise || row.company || row.Company || row.societe || ''
        };

        if (!contact.name || !contact.email) {
          errors.push(`Ligne ${i + 1}: Nom et email obligatoires`);
          continue;
        }

        const leadData = {
          userId: req.user.id,
          contact,
          source: 'csv',
          status: 'nouveau',
          temperature: 'tiede',
          notes: row.notes || row.Notes || '',
          tags: []
        };

        const lead = await firebaseService.createLead(leadData);
        importedLeads.push(lead);
      } catch (error) {
        errors.push(`Ligne ${i + 1}: ${error.message}`);
      }
    }

    // Nettoyage du fichier temporaire
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      imported: importedLeads.length,
      errors: errors.length,
      leads: importedLeads,
      errorDetails: errors
    });
  } catch (error) {
    console.error('Erreur import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

// Statistiques des leads
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const leads = await firebaseService.getLeads(req.user.id);
    
    const stats = {
      total: leads.length,
      nouveau: leads.filter(l => l.status === 'nouveau').length,
      qualifie: leads.filter(l => l.status === 'qualifie').length,
      devis_envoye: leads.filter(l => l.status === 'devis_envoye').length,
      signe: leads.filter(l => l.status === 'signe').length,
      perdu: leads.filter(l => l.status === 'perdu').length,
      chaud: leads.filter(l => l.temperature === 'chaud').length,
      tiede: leads.filter(l => l.temperature === 'tiede').length,
      froid: leads.filter(l => l.temperature === 'froid').length
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erreur stats leads:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;