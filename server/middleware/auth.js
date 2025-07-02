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

module.exports = { authenticateToken };