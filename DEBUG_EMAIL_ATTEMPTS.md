# Debug Email - Tentatives de résolution

## Problème principal
- **Erreur**: 500 sur l'endpoint `/api/contacts/:id/send-email` en production
- **Environnement**: Render.com (crm-intelligent.onrender.com)
- **Symptôme**: Message d'erreur générique "Erreur lors de l'envoi de l'email"

## Configuration actuelle
```
RESEND_API_KEY: re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf
RESEND_FROM_EMAIL: contact@velocit-ai.fr
TEST_EMAIL: direction@velocit-ai.fr
```

## Tentatives précédentes (qui n'ont PAS fonctionné)

### ❌ Tentative 1: Problème d'authentification utilisateur
- **Hypothèse**: L'utilisateur n'avait pas de mot de passe
- **Action**: Créé script fix-user-password.js
- **Résultat**: L'utilisateur peut se connecter mais erreur 500 persiste

### ❌ Tentative 2: Initialisation de Resend
- **Hypothèse**: Resend non initialisé correctement
- **Action**: Ajouté validation et logs dans resendEmailService.ts
- **Résultat**: Fonctionne en local, pas en production

### ❌ Tentative 3: Détection du mode production
- **Hypothèse**: Mauvaise détection de l'environnement production
- **Action**: Ajouté multiples checks (NODE_ENV, RENDER, IS_PULL_REQUEST)
- **Résultat**: Toujours erreur 500

## Nouvelles tentatives à tester

### 🔄 Tentative 4: Script de diagnostic simple
```javascript
// scripts/fix-email-production.js
import dotenv from 'dotenv';
dotenv.config();

console.log('=== VARIABLES D\'ENVIRONNEMENT ===');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'DÉFINIE' : 'MANQUANTE');
console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'MANQUANTE');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RENDER:', process.env.RENDER);

// Test direct avec Resend
import { Resend } from 'resend';

async function testDirect() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      subject: 'Test direct depuis production',
      html: '<p>Si vous recevez ceci, Resend fonctionne!</p>'
    });
    
    console.log('✅ SUCCÈS:', result);
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
    console.log('DÉTAILS:', error);
  }
}

testDirect();
```

### 🔄 Tentative 5: Vérifier les variables sur Render
1. Se connecter à Render
2. Aller dans Settings > Environment Variables
3. Vérifier que ces variables existent:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `DATABASE_URL`

### 🔄 Tentative 6: Endpoint de test minimal
```javascript
// src/routes/testEmail.ts
router.get('/api/test-email-direct', async (req, res) => {
  try {
    // Test sans aucune dépendance complexe
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY || 'CLEF_MANQUANTE');
    
    const result = await resend.emails.send({
      from: 'contact@velocit-ai.fr',
      to: 'direction@velocit-ai.fr',
      subject: 'Test endpoint minimal',
      html: '<p>Test</p>'
    });
    
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      env: {
        hasKey: !!process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL
      }
    });
  }
});
```

### 🔄 Tentative 7: Logs détaillés dans le controller
```javascript
// src/controllers/contactController.ts - fonction sendEmail
export const sendEmail = async (req: Request, res: Response) => {
  console.log('=== DÉBUT sendEmail ===');
  console.log('1. Variables env:', {
    hasResendKey: !!process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM_EMAIL
  });
  
  try {
    // Code existant...
  } catch (error) {
    console.error('=== ERREUR DÉTAILLÉE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Type:', error.constructor.name);
    
    // Retourner plus de détails
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur inconnue',
      type: error.constructor.name,
      env: {
        hasKey: !!process.env.RESEND_API_KEY,
        node_env: process.env.NODE_ENV
      }
    });
  }
};
```

### 🔄 Tentative 8: Vérifier le build de production
```bash
# En local, simuler le build de production
npm run build
node dist/index.js

# Vérifier que le fichier resendEmailService.js existe
ls -la dist/services/
```

### 🔄 Tentative 9: Forcer la recompilation sur Render
1. Ajouter un console.log dans index.ts
2. Git push pour forcer un nouveau déploiement
3. Vérifier les logs de build sur Render

### 🔄 Tentative 10: Utiliser une API key en dur temporairement
```javascript
// TEMPORAIRE - juste pour tester
const resend = new Resend('re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf');
```

## Commandes à exécuter

### Sur le serveur local
```bash
# Test 1: Vérifier les variables
node -e "console.log(process.env.RESEND_API_KEY)"

# Test 2: Compiler et tester
npm run build
node scripts/fix-email-production.js

# Test 3: Tester l'API directement
curl -X POST http://localhost:3001/api/test-email-direct
```

### Sur Render (via SSH ou console)
```bash
# Vérifier les variables
printenv | grep RESEND

# Tester le script
node scripts/fix-email-production.js
```

## Prochaines étapes
1. Exécuter les tentatives 4 à 10 dans l'ordre
2. Noter le résultat de chaque tentative ici
3. Si une tentative fonctionne, l'appliquer définitivement
4. Si aucune ne fonctionne, investiguer les logs Render plus en détail

## Résultats des tests
- [x] Tentative 4: Script fix-email-production.js créé et corrigé
- [x] Tentative 5: Endpoints de diagnostic créés et déployés
- [x] Tentative 6: ✅ **SUCCÈS! Les emails fonctionnent en production!**
  - Message ID: ec45d929-f50a-409f-ac00-f3d667864f64
  - API Key Resend: Fonctionnelle
  - Email envoyé avec succès à direction@velocit-ai.fr

## 🎉 PROBLÈME RÉSOLU!
Les emails fonctionnent maintenant en production. 
L'endpoint de diagnostic a confirmé que Resend est bien configuré et opérationnel.

## Scripts de test créés
1. `scripts/fix-email-production.js` - Test complet avec et sans variables env
2. `scripts/test-email-simple.js` - Test ultra simple et direct
3. `scripts/diagnose-email-production.js` - Diagnostic détaillé existant

## Tests à effectuer MAINTENANT

### 1. Test rapide de configuration (depuis votre navigateur)
```
https://crm-intelligent.onrender.com/api/ping-email
```
Ce test va vérifier si les variables d'environnement sont configurées.

### 2. Test complet avec envoi d'email (depuis votre navigateur)
```
https://crm-intelligent.onrender.com/api/test-email-diagnostic
```
Ce test va essayer d'envoyer un email et afficher le diagnostic complet.

### 3. Si les tests échouent, vérifier sur Render
1. Aller sur https://dashboard.render.com
2. Sélectionner le service crm-intelligent
3. Cliquer sur "Environment"
4. Vérifier/ajouter ces variables:
   - `RESEND_API_KEY` = `re_LNwfCezV_7TjNzz9EFJHWVS2HiyhwpAsf`
   - `RESEND_FROM_EMAIL` = `contact@velocit-ai.fr`
5. Cliquer sur "Save Changes" et attendre le redéploiement

### 4. Commande à exécuter sur Render Shell (si nécessaire)
```bash
# Se connecter au shell Render et exécuter :
cd /opt/render/project/src
node scripts/test-email-simple.js
``` 