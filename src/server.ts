import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();

// Configuration proxy trust pour nginx
app.set('trust proxy', true);

// Middleware de sécurité
app.use(helmet({
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "http://69.62.110.246:*"],
      formAction: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "http://69.62.110.246:*"],
      upgradeInsecureRequests: null
    }
  }
}));
app.use(cors({
  origin: [
    config.frontend.url, 
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://69.62.110.246:3000',
    'http://dev.crm.velocit-ai.fr:3000',
    'https://dev.crm.velocit-ai.fr',
    'http://localhost:3002', 
    'http://127.0.0.1:3002', 
    'http://69.62.110.246:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite à 1000 requêtes par fenêtre pour le développement
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes de base
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Favicon pour éviter l'erreur 404
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Routes API
app.use('/api', routes);

// Servir les fichiers statiques
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Middleware de gestion d'erreurs
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erreur serveur:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Serveur VelocitaLeads démarré sur le port ${config.port}`);
  logger.info(`🌍 Environnement: ${config.nodeEnv}`);
  logger.info(`🔗 Accessible sur: http://69.62.110.246:${config.port}`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté');
    process.exit(0);
  });
});

export default app;