# VelocitaLeads CRM

CRM français pour freelances et petites entreprises - Création et envoi de devis professionnels avec suivi email.

## Fonctionnalités principales

- **Gestion des contacts** avec métriques financières automatiques
- **Création de devis** avec calculs automatiques et génération PDF
- **Suivi des emails** (ouvertures, clics)
- **Tableau de bord** avec KPIs en temps réel
- **Interface 3 onglets** : CONTACTS, OPPORTUNITÉS, MÉTRIQUES

## Prérequis

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn
- Git

## Installation rapide

### 1. Cloner et installer

```bash
git clone https://github.com/votre-compte/velocitaleads.git
cd velocitaleads
npm install
```

### 2. Configuration de la base de données

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Configurer la base de données dans .env
# DATABASE_URL="postgresql://username:password@localhost:5432/velocitaleads"

# Générer le client Prisma
npm run db:generate

# Créer et appliquer les migrations
npm run db:migrate

# Alimenter la base avec des données de test
npm run db:seed
```

### 3. Démarrage

```bash
# Mode développement avec rechargement automatique
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start
```

Le serveur démarre sur http://localhost:3000

### 4. Utilisateur de test

Après le seeding, vous pouvez vous connecter avec :
- **Email** : demo@velocitaleads.com
- **Mot de passe** : password123

## Configuration Email

### 1. **Générer un mot de passe d'application Google**

1. Connectez-vous à votre **Admin Console Google Workspace** : https://admin.google.com
2. Allez dans **Sécurité** > **Authentification à 2 facteurs**
3. Vérifiez que la 2FA est activée pour votre compte
4. Cliquez sur **Mots de passe d'application**
5. Sélectionnez **Courrier** et donnez un nom (ex: "VelocitaLeads CRM")
6. **Copiez le mot de passe généré** (16 caractères)

### 2. **Configurer les variables d'environnement**

Éditez votre fichier `.env` :

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@votre-domaine.com"
SMTP_PASS="le-mot-de-passe-application-16-caracteres"
EMAIL_FROM="VelocitaLeads <votre-email@votre-domaine.com>"
```

### 3. **Alternative : OAuth2 Google**

Si les mots de passe d'application ne sont pas disponibles :

1. Créez un projet sur Google Cloud Console
2. Activez l'API Gmail
3. Créez des identifiants OAuth2
4. Configurez dans .env :

```env
# OAuth2 Google
GOOGLE_CLIENT_ID="votre-client-id"
GOOGLE_CLIENT_SECRET="votre-client-secret"
GOOGLE_REFRESH_TOKEN="sera-généré-automatiquement"
```

## Architecture

### Backend API
- **Stack** : Node.js + Express + TypeScript + PostgreSQL + Prisma
- **Sécurité** : JWT, Helmet, CORS, Rate Limiting, Validation complète
- **Services** : Email SMTP, PDF Generation, Tracking, Logging

### Frontend React SaaS
- **Stack** : React + TypeScript + Tailwind CSS + Vite
- **État** : Zustand + React Query
- **Composants** : 4 pages principales + Layout responsive

## Métriques automatiques

### Métriques de contact
- **Chiffre d'affaires total** : Somme des devis acceptés
- **Taux de conversion** : (Devis acceptés / Devis envoyés) × 100
- **Panier moyen** : Chiffre d'affaires / Nombre de commandes
- **Score de valeur** : Calcul pondéré basé sur le CA (40%), récence (30%), fréquence (20%), conversion (10%)

### Statuts de contact
- **Client Actif** : CA > 0 ET dernier achat < 6 mois
- **Prospect Chaud** : Devis récent ouvert OU fort engagement email
- **Prospect Tiède** : Contact récent mais pas de devis
- **Prospect Froid** : Aucune interaction > 6 mois
- **Inactif** : Aucune interaction > 1 an

## Structure du projet

```
src/
├── config/         # Configuration (DB, variables d'environnement)
├── controllers/    # Logique métier des endpoints
├── middleware/     # Middleware Express (auth, validation)
├── routes/         # Définition des routes API
├── services/       # Services métier (email, PDF, etc.)
├── types/          # Types TypeScript
├── utils/          # Utilitaires (logger, etc.)
├── db/             # Scripts de base de données (seed)
└── server.ts       # Point d'entrée du serveur

prisma/
└── schema.prisma   # Schéma de base de données
```

## Scripts disponibles

- `npm run dev` - Serveur de développement avec rechargement automatique
- `npm run build` - Compilation TypeScript pour la production
- `npm run start` - Démarrage du serveur de production
- `npm run test` - Exécution des tests
- `npm run lint` - Vérification du code avec ESLint
- `npm run type-check` - Vérification des types TypeScript
- `npm run db:migrate` - Application des migrations de base de données
- `npm run db:seed` - Alimentation de la base avec des données de test
- `npm run db:reset` - Remise à zéro de la base de données
- `npm run db:generate` - Génération du client Prisma
- `npm run db:studio` - Ouvre Prisma Studio pour explorer la base de données

## Sécurité et bonnes pratiques

- Authentification JWT requise pour les endpoints sensibles
- Validation des emails avec express-validator
- Logs sécurisés (pas de mots de passe en clair)
- Rate limiting sur l'API
- Sanitisation des données d'entrée

## Support

En cas de problème, vérifiez :
1. Les logs du serveur : `tail -f logs/combined.log`
2. La configuration `.env`
3. La connectivité SMTP : `telnet smtp.gmail.com 587`

## Licence

MIT - Voir le fichier [LICENSE](LICENSE) pour plus de détails.