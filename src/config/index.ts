import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

export const config = {
  // Environnement
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  
  // Base de données
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/velocitaleads',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'velocitaleads-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'velocitaleads-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'VelocitaLeads',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'noreply@velocitaleads.fr',
    },
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://69.62.110.246:3000',
  },
  
  // API externe
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  },
  
  // Stockage de fichiers
  storage: {
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  },
  
  // Sécurité
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  
  // Email tracking
  tracking: {
    baseUrl: process.env.TRACKING_BASE_URL || 'http://69.62.110.246:3001',
    pixelPath: '/api/tracking/pixel',
    linkPath: '/api/tracking/link',
  },
  
  // PDF
  pdf: {
    templatesDir: process.env.PDF_TEMPLATES_DIR || './src/templates',
    outputDir: process.env.PDF_OUTPUT_DIR || './uploads/pdfs',
  },
  
  // Application
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://69.62.110.246:3000',
  },
  
  // Airtable
  airtable: {
    enabled: process.env.AIRTABLE_ENABLED === 'true',
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    usersTable: process.env.AIRTABLE_USERS_TABLE || 'Users',
  },
};

// Validation des variables d'environnement critiques
const requiredEnvVars = ['DATABASE_URL'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push('JWT_SECRET', 'JWT_REFRESH_SECRET');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable d'environnement manquante: ${envVar}`);
  }
}

export default config;