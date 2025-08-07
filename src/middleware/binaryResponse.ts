/**
 * Middleware pour forcer la réponse binaire sur certaines routes
 * Évite la corruption des fichiers binaires via proxy/CDN
 */

import { Request, Response, NextFunction } from 'express';

export const forceBinaryResponse = (req: Request, res: Response, next: NextFunction) => {
  // Sauvegarder la méthode originale
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override pour les routes de téléchargement
  if (req.path.includes('/download') || req.path.includes('/pdf')) {
    res.send = function(data: any) {
      // Forcer l'envoi binaire
      if (Buffer.isBuffer(data)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Transfer-Encoding', 'binary');
      }
      return originalSend.call(this, data);
    };
  }
  
  next();
};
