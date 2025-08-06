# Guide de Déploiement VelocitaLeads CRM

## 🚀 URLs de Production

- **Frontend (Vercel)**: https://crm-intelligent-lefi.vercel.app
- **Backend (Render)**: https://crm-intelligent.onrender.com
- **Base de données**: Supabase (configurée)

## 📋 Prochaines Étapes

### 1. ✅ Mettre à jour l'URL Frontend sur Render

Connectez-vous à [Render Dashboard](https://dashboard.render.com) et mettez à jour la variable d'environnement :

```
FRONTEND_URL=https://crm-intelligent-lefi.vercel.app
```

### 2. ✅ Configurer les variables d'environnement sur Vercel

⚠️ **CRITIQUE** : Sans ces variables, le frontend essaiera d'appeler son propre domaine au lieu du backend, causant des erreurs 405 !

Dans les paramètres Vercel (Settings > Environment Variables), ajoutez :

```
VITE_API_URL=https://crm-intelligent.onrender.com
VITE_SUPABASE_URL=https://dzproavuumvmootwgevi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cHJvYXZ1dW12bW9vdHdnZXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0OTQ1MzgsImV4cCI6MjA3MDA3MDUzOH0.uSSd6zU7y7fXRflOpN8V6xt2fzRkPx1EPJjSxMu_ALA
```

📝 **Note de sécurité** : Ces variables VITE_* sont publiques par design :
- `VITE_API_URL` : URL publique du backend (comme l'adresse d'un site web)
- `VITE_SUPABASE_URL` : URL publique de Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé **anonyme** publique (protégée par RLS côté Supabase)

Les vraies clés secrètes (JWT_SECRET, DATABASE_URL, etc.) restent sécurisées sur le backend.

⚠️ **IMPORTANT** : Après avoir ajouté ces variables, vous devez **redéployer** votre application sur Vercel pour qu'elles soient prises en compte !

### 3. ✅ Tester l'Application

1. **Test de la page d'accueil** :
   - Visitez https://crm-intelligent-lefi.vercel.app
   - Vérifiez que la page se charge correctement

2. **Test de connexion** :
   - Créez un compte ou connectez-vous
   - Vérifiez que l'authentification fonctionne

3. **Test CRUD (Create, Read, Update, Delete)** :
   - Créez un nouveau contact
   - Modifiez le contact
   - Créez un devis
   - Générez un PDF

### 4. ✅ Surveillance et Maintenance

#### Render (Backend)
- Les logs sont disponibles dans le dashboard Render
- Le service redémarre automatiquement en cas de crash
- Plan gratuit : 750 heures/mois

#### Vercel (Frontend)
- Les logs sont dans le dashboard Vercel
- Déploiement automatique à chaque push sur `main`
- Plan gratuit : bande passante illimitée pour les projets personnels

#### Supabase (Base de données)
- Dashboard : https://supabase.com/dashboard
- Monitoring des requêtes et performances
- Plan gratuit : 500MB stockage, 2GB bande passante

## 🔧 Commandes Utiles

### Développement Local

```bash
# Backend
npm run dev              # Port 3001

# Frontend
cd client && npm run dev # Port 3000
```

### Base de Données

```bash
# Migrations
npm run db:migrate

# Seed (données de test)
npm run db:seed

# Studio (interface graphique)
npm run db:studio
```

### Build Local

```bash
# Backend
npm run build

# Frontend
cd client && npm run build
```

## 🐛 Dépannage

### Problème : "Cannot find module" sur Render
**Solution** : Vérifiez que tous les imports utilisent des chemins relatifs ou configurez `module-alias`.

### Problème : CORS errors
**Solution** : Vérifiez que `FRONTEND_URL` est correctement configurée sur Render.

### Problème : "Database connection failed"
**Solution** : Vérifiez `DATABASE_URL` dans les variables d'environnement.

### Problème : Page blanche sur Vercel
**Solution** : Vérifiez les variables `VITE_*` dans les paramètres Vercel.

## 📊 Monitoring

### Métriques à Surveiller
- **Temps de réponse API** : < 500ms
- **Taux d'erreur** : < 1%
- **Utilisation CPU** : < 80%
- **Mémoire** : < 400MB

### Alertes Recommandées
1. Service down > 5 minutes
2. Taux d'erreur > 5%
3. Temps de réponse > 2s
4. Quota Render/Vercel proche de la limite

## 🔐 Sécurité

### Checklist de Sécurité
- ✅ HTTPS activé (automatique avec Vercel/Render)
- ✅ Variables sensibles en environnement
- ✅ JWT pour l'authentification
- ✅ Validation des entrées
- ✅ Protection CSRF
- ⚠️ À faire : Rate limiting
- ⚠️ À faire : Monitoring des erreurs (Sentry)

## 📈 Optimisations Futures

1. **Performance**
   - Mise en cache CDN
   - Optimisation des images
   - Lazy loading des composants

2. **Scalabilité**
   - Migration vers plan payant si nécessaire
   - Load balancing
   - Base de données répliquée

3. **Fonctionnalités**
   - Intégration Stripe pour les paiements
   - Export Excel des données
   - Templates de devis personnalisables

## 📞 Support

Pour toute question ou problème :
- Email : dev@velocit-ai.fr
- Documentation : Ce fichier
- Logs : Dashboard Render/Vercel

---

*Dernière mise à jour : 2 janvier 2025*