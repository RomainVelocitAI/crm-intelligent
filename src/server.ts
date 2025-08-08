// Enregistrer les alias de module pour la production
import 'module-alias/register';

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
    'https://crm-intelligent-lefi.vercel.app',
    'https://crm-intelligent.vercel.app',
    'http://localhost:3002', 
    'http://127.0.0.1:3002', 
    'http://69.62.110.246:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting avec configuration pour proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite à 1000 requêtes par fenêtre pour le développement
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
  standardHeaders: true, // Retourne les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // Configuration pour proxy - utilise l'IP du client depuis les headers du proxy
  keyGenerator: (req: express.Request) => {
    // Sur Render, l'IP réelle est dans x-forwarded-for
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // Prend la première IP de la liste (client original)
      const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
      return ips[0].trim();
    }
    // Fallback sur l'IP de la connexion
    return req.ip || (req.connection as any)?.remoteAddress || 'unknown';
  },
  skip: (req: express.Request) => {
    // Skip rate limiting pour les routes de santé
    return req.path === '/health';
  }
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

// Endpoint de diagnostic email PUBLIC (accessible sans auth)
app.get('/api/test-email-diagnostic', async (req, res) => {
  try {
    // Collecter toutes les informations de diagnostic
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        RENDER: process.env.RENDER || 'undefined',
        IS_PULL_REQUEST: process.env.IS_PULL_REQUEST || 'undefined',
        RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME || 'undefined'
      },
      resend_config: {
        has_api_key: !!process.env.RESEND_API_KEY,
        api_key_preview: process.env.RESEND_API_KEY ? 
          process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'MISSING',
        from_email: process.env.RESEND_FROM_EMAIL || 'MISSING',
        test_email: process.env.TEST_EMAIL || 'not configured'
      },
      test_result: null as any,
      error: null as any
    };

    // Si pas de clé API, on arrête là
    if (!process.env.RESEND_API_KEY) {
      diagnostic.error = {
        code: 'MISSING_API_KEY',
        message: 'RESEND_API_KEY is not configured',
        solution: 'Add RESEND_API_KEY to Render environment variables'
      };
      return res.status(500).json(diagnostic);
    }

    // Tenter d'envoyer un email de test
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'contact@velocit-ai.fr',
        to: 'direction@velocit-ai.fr',
        subject: `Test Diagnostic - ${new Date().toLocaleString('fr-FR')}`,
        html: `
          <h2>Email de test diagnostic</h2>
          <p>Envoyé depuis: ${process.env.RENDER ? 'Render Production' : 'Local'}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <hr>
          <pre>${JSON.stringify(diagnostic.environment, null, 2)}</pre>
        `
      });

      diagnostic.test_result = {
        success: true,
        message_id: result.data?.id,
        message: 'Email sent successfully!'
      };

      return res.json(diagnostic);

    } catch (emailError: any) {
      diagnostic.error = {
        code: emailError.name || 'SEND_ERROR',
        message: emailError.message,
        details: emailError.response?.data || emailError
      };

      // Analyser l'erreur pour donner une solution
      if (emailError.message?.includes('not_found')) {
        diagnostic.error.solution = 'Invalid API key - check RESEND_API_KEY in Render';
      } else if (emailError.message?.includes('validation')) {
        diagnostic.error.solution = 'Email validation error - verify domain in Resend';
      } else if (emailError.message?.includes('DNS')) {
        diagnostic.error.solution = 'DNS configuration issue - check domain settings';
      }

      return res.status(500).json(diagnostic);
    }

  } catch (error: any) {
    // Erreur globale inattendue
    res.status(500).json({
      error: {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// Endpoint simple pour vérifier la configuration
app.get('/api/ping-email', (req, res) => {
  const hasKey = !!process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'not configured';
  
  res.json({
    status: hasKey ? 'configured' : 'not configured',
    api_key: hasKey ? 'present' : 'missing',
    from_email: fromEmail,
    server: process.env.RENDER ? 'Render' : 'Local',
    timestamp: new Date().toISOString()
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