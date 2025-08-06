# Guide de Déploiement VelocitaLeads CRM

## Status Actuel

### ✅ Backend (Render) - DÉPLOYÉ
- **URL**: https://crm-intelligent.onrender.com
- **Statut**: En ligne et fonctionnel
- **Base de données**: Supabase PostgreSQL

### 🔄 Frontend (Vercel) - EN COURS
- **Configuration**: vercel.json configuré
- **Build**: En attente de vérification

## Configuration Vercel

### Option 1: Import depuis GitHub (Recommandé)

1. **Aller sur Vercel**
   - Se connecter sur https://vercel.com
   - Cliquer sur "Add New Project"

2. **Importer le Repository**
   - Connecter votre compte GitHub si ce n'est pas fait
   - Sélectionner le repository `crm-intelligent`

3. **Configuration du Build**
   Vercel devrait détecter automatiquement la configuration depuis `vercel.json`.
   Si demandé, utiliser ces paramètres:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (laisser vide)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install --prefix client`

4. **Variables d'Environnement**
   Ajouter ces variables dans Vercel:
   ```
   VITE_API_URL=https://crm-intelligent.onrender.com
   VITE_SUPABASE_URL=https://dzproavuumvmootwgevi.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cHJvYXZ1dW12bW9vdHdnZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTEzNDIsImV4cCI6MjA3MDA2NzM0Mn0.v_40kYXnHi_tNakdvroRXZbzD2UmHORtpznE4WLd8xY
   ```

5. **Déployer**
   - Cliquer sur "Deploy"
   - Attendre la fin du build (2-3 minutes)

### Option 2: Via CLI Vercel

```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Dans le dossier du projet
vercel

# Suivre les prompts:
# - Set up and deploy? Y
# - Which scope? (votre compte)
# - Link to existing project? N
# - What's your project's name? crm-intelligent
# - In which directory is your code located? ./
# - Want to modify settings? N
```

## Après le Déploiement Vercel

### 1. Mettre à jour Render
Une fois que Vercel est déployé et vous avez l'URL (ex: `https://crm-intelligent.vercel.app`):

1. Aller sur https://dashboard.render.com
2. Sélectionner votre service backend
3. Aller dans "Environment"
4. Mettre à jour `FRONTEND_URL` avec l'URL Vercel
5. Le service redémarrera automatiquement

### 2. Tester l'Application Complète

1. **Test de Connexion**
   - Aller sur l'URL Vercel
   - Se connecter avec les credentials de test

2. **Test CORS**
   - Créer un contact
   - Créer un devis
   - Générer un PDF

3. **Test Email** (si configuré)
   - Envoyer un devis par email
   - Vérifier le tracking

## Dépannage

### Si Vercel échoue avec "client directory not found"

1. Vérifier que le dossier client est bien commité:
   ```bash
   git ls-files client/ | head -5
   ```

2. Si le dossier n'est pas visible, vérifier .gitignore:
   ```bash
   cat .gitignore | grep client
   ```

3. Forcer l'ajout si nécessaire:
   ```bash
   git add -f client/
   git commit -m "fix: Ajouter le dossier client pour Vercel"
   git push
   ```

### Si CORS bloque les requêtes

1. Vérifier sur Render que `FRONTEND_URL` est correct
2. Vérifier dans le code backend `src/server.ts` que CORS est configuré
3. Redémarrer le service Render si nécessaire

### Si la base de données ne répond pas

1. Vérifier sur Supabase que le projet est actif
2. Vérifier `DATABASE_URL` sur Render
3. Tester la connexion:
   ```bash
   npx prisma db pull
   ```

## Variables d'Environnement

### Backend (Render)
```env
DATABASE_URL=postgresql://...@db.dzproavuumvmootwgevi.supabase.co:5432/postgres
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL=https://crm-intelligent.onrender.com
VITE_SUPABASE_URL=https://dzproavuumvmootwgevi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## URLs de Production

- **Backend API**: https://crm-intelligent.onrender.com
- **Frontend**: (À venir après déploiement Vercel)
- **Base de données**: Supabase (privé)
- **Monitoring Backend**: https://dashboard.render.com
- **Monitoring Frontend**: https://vercel.com/dashboard

## Maintenance

### Mise à jour du Backend
```bash
git add .
git commit -m "feat: Nouvelle fonctionnalité"
git push
# Render se déploie automatiquement
```

### Mise à jour du Frontend
```bash
git add .
git commit -m "feat: Nouvelle UI"
git push
# Vercel se déploie automatiquement
```

### Migrations de Base de Données
```bash
# En local
npx prisma migrate dev --name nom_migration

# Pousser vers production
git add prisma/
git commit -m "db: Nouvelle migration"
git push
# Render exécutera automatiquement les migrations
```

## Monitoring

### Vérifier le Status

1. **Backend Health Check**
   ```bash
   curl https://crm-intelligent.onrender.com/health
   ```

2. **Logs Render**
   - Dashboard > Service > Logs

3. **Logs Vercel**
   - Dashboard > Project > Functions > Logs

## Support

En cas de problème:
1. Vérifier les logs sur Render/Vercel
2. Vérifier les variables d'environnement
3. Tester localement avec les mêmes variables
4. Vérifier la console du navigateur pour les erreurs CORS/API