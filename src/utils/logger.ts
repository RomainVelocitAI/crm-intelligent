import winston from 'winston';
import { config } from '@/config';

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Créer le logger
export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: customFormat,
  defaultMeta: { service: 'velocitaleads-crm' },
  transports: [
    // Écrire les erreurs dans error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Écrire tous les logs dans combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Si nous ne sommes pas en production, ajouter aussi la console
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.timestamp({
        format: 'HH:mm:ss',
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    ),
  }));
}

// Fonctions utilitaires de logging
export const logRequest = (req: any) => {
  logger.info('Requête reçue', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Erreur capturée', {
    message: error.message,
    stack: error.stack,
    context,
  });
};

export const logAuth = (action: string, userId?: string, details?: any) => {
  logger.info('Action d\'authentification', {
    action,
    userId,
    ...details,
  });
};

export const logEmail = (action: string, to: string, subject?: string, details?: any) => {
  logger.info('Action email', {
    action,
    to,
    subject,
    ...details,
  });
};

export const logPdf = (action: string, quoteId: string, details?: any) => {
  logger.info('Action PDF', {
    action,
    quoteId,
    ...details,
  });
};

export default logger;