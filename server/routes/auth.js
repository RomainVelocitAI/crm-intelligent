const express = require('express');
const router = express.Router();
const firebaseService = require('../services/firebase');

// Middleware d'authentification simulé pour la démo
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  // Pour la démo, on accepte le token "demo-token"
  if (token === 'demo-token') {
    req.user = { id: 'demo-user-1', email: 'demo@crm-intelligent.com' };
    next();
  } else {
    res.status(403).json({ error: 'Token invalide' });
  }
};

// Route de connexion (démo)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation simple pour la démo
    if (email === 'demo@crm-intelligent.com' && password === 'demo123') {
      const user = await firebaseService.getUser('demo-user-1');
      
      res.json({
        success: true,
        user,
        token: 'demo-token',
        message: 'Connexion réussie'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route d'inscription (démo)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;

    // Validation basique
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const user = await firebaseService.createUser({
      email,
      name,
      company: company || '',
      subscription: 'free'
    });

    res.json({
      success: true,
      user,
      token: 'demo-token',
      message: 'Inscription réussie'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de vérification du token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await firebaseService.getUser(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de déconnexion
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

module.exports = router;