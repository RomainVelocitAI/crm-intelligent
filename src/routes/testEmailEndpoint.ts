import { Router, Request, Response } from 'express';

const router = Router();

// Endpoint de test PUBLIC pour diagnostiquer les problèmes email
// Accessible via GET pour faciliter le test depuis un navigateur
router.get('/api/test-email-diagnostic', async (req: Request, res: Response) => {
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

// Endpoint encore plus simple pour un test rapide
router.get('/api/ping-email', async (req: Request, res: Response) => {
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

export default router;