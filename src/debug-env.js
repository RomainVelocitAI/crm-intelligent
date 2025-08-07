/**
 * Endpoint de debug pour vérifier les variables d'environnement
 * À SUPPRIMER APRÈS DEBUG
 */

const express = require('express');
const router = express.Router();

router.get('/debug-env', (req, res) => {
  // Extraire seulement les infos importantes sans exposer les secrets complets
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const dbInfo = {
    isSet: !!process.env.DATABASE_URL,
    host: dbUrl.includes('supabase.com') ? 'SUPABASE' : 'UNKNOWN',
    project: dbUrl.match(/postgres\.([a-z]+)\:/)?.[1] || 'UNKNOWN',
    bcryptRounds: process.env.BCRYPT_ROUNDS || 'NOT SET (default: 12)',
    nodeEnv: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL
  };
  
  res.json({
    timestamp: new Date().toISOString(),
    environment: dbInfo,
    message: 'Debug endpoint - remove after fixing auth'
  });
});

module.exports = router;