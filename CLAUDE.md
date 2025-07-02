# CLAUDE.md

Ce fichier fournit des indications a Claude Code (claude.ai/code) lors du travail avec le code de ce depot.

## Presentation du Projet

VelocitaLeads est une application CRM francaise concue pour les freelances et petites entreprises pour creer et envoyer des devis professionnels avec suivi d'emails. L'accent est mis sur la generation et l'envoi de devis sans frais d'hebergement (sauf fonctionnalites IA premium).

## Vue d'ensemble de l'Architecture

Il s'agit d'une application TypeScript full-stack avec :
- **Backend** : Serveur API Node.js/Express sur le port 3001
- **Frontend** : SPA React avec serveur de developpement Vite sur le port 3000 
- **Base de donnees** : PostgreSQL avec ORM Prisma
- **Fonctionnalites cles** : Gestion des contacts, generation de devis avec export PDF, suivi d'emails

L'application implemente une interface a 3 onglets :
1. **CONTACTS** - Gestion des contacts avec metriques financieres automatiques
2. **OPPORTUNITES** - Creation et gestion de devis avec generation PDF
3. **METRIQUES** - Tableau de bord avec KPIs et analyses

## Commandes de Developpement

### Backend (Repertoire Racine)
```bash
# Configuration de developpement
npm install              # Installer les dependances  
npm run dev             # Demarrer le serveur backend sur le port 3001
npm run build           # Construire le backend pour la production
npm run start           # Demarrer le serveur de production
npm run test            # Executer la suite de tests
npm run lint            # Verification ESLint
npm run type-check      # Validation TypeScript

# Operations sur la base de donnees
npm run db:migrate      # Executer les migrations de base de donnees
npm run db:seed         # Alimenter avec des donnees de developpement  
npm run db:reset        # Reinitialiser la base de donnees
npm run db:generate     # Generer le client Prisma
npm run db:studio       # Ouvrir Prisma Studio
npm run setup           # Configuration complete du projet (installation + migration + alimentation)
```

### Frontend (Repertoire /client)
```bash
# Dans le repertoire /client
npm install              # Installer les dependances frontend
npm run dev             # Demarrer le serveur de developpement Vite sur le port 3000
npm run build           # Construire le frontend pour la production
npm run preview         # Previsualiser la version de production
```

## Structure du Projet

```
/
├── client/             # Application frontend React
│   ├── public/         # Ressources statiques
│   └── src/            # Code source frontend
│       ├── components/ # Composants React
│       ├── contexts/   # Contextes React
│       ├── hooks/      # Hooks personnalises
│       ├── pages/      # Composants de page
│       ├── services/   # Services API
│       └── types/      # Definitions de types TypeScript
│
├── prisma/             # Configuration et schema Prisma
│   └── schema.prisma   # Modele de donnees
│
├── src/                # Code source backend
│   ├── config/         # Configuration
│   ├── controllers/    # Controleurs d'API
│   ├── db/             # Scripts de base de donnees
│   ├── middleware/     # Middleware Express
│   ├── routes/         # Definitions de routes API
│   ├── services/       # Services metier
│   ├── types/          # Types TypeScript
│   ├── utils/          # Utilitaires
│   └── server.ts       # Point d'entree du serveur
│
├── uploads/            # Fichiers telecharges
│   └── pdfs/           # PDFs generes
│
├── .env                # Variables d'environnement (non commite)
├── .env.example        # Exemple de variables d'environnement
└── package.json        # Configuration du projet et dependances
```

## Fonctionnalites Principales

### Gestion des Contacts
- CRUD complet pour les contacts
- Calcul automatique des metriques financieres
- Segmentation par statut (Client actif, Prospect chaud, etc.)
- Historique des interactions

### Generation de Devis
- Creation de devis avec calcul automatique des totaux
- Generation de PDF professionnels avec pagination intelligente
- Envoi par email avec suivi
- Gestion du cycle de vie des devis (brouillon, envoye, vu, accepte, refuse)
- **NOUVEAU**: Systeme de pagination avance qui evite la coupure des elements

### Suivi d'Emails
- Pixel de suivi pour detecter les ouvertures
- Mise a jour automatique du statut des devis
- Historique des interactions par contact
- Metriques d'engagement

### Tableau de Bord et Metriques
- KPIs en temps reel
- Graphiques de performance
- Previsions de revenus
- Analyse de conversion

## Configuration

### Variables d'Environnement
Copiez `.env.example` vers `.env` et configurez les variables suivantes :

```env
# Base de donnees
DATABASE_URL="postgresql://user:password@localhost:5432/velocitaleads"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Your Name <your-email@gmail.com>"

# Application
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Base de Donnees
Le schema Prisma definit les modeles suivants :
- User (utilisateurs)
- Contact (contacts clients/prospects)
- Quote (devis)
- QuoteItem (lignes de devis)
- EmailTracking (suivi des emails)
- Metrics (metriques calculees)

## Securite
- Authentification JWT
- Validation des entrees avec express-validator
- Protection CSRF
- Rate limiting
- Sanitisation des donnees

## Generation PDF Avancee

### Systeme de Pagination Intelligent
Le service PDF utilise PDFKit avec un systeme de pagination avance qui garantit :
- **Aucune coupure d'elements** : Les lignes de devis restent toujours entieres
- **Gestion automatique des sauts de page** : Detection intelligente de l'espace disponible
- **En-tetes de tableau** : Redessines automatiquement sur chaque nouvelle page
- **Hauteur fixe des lignes** : 50 points par ligne pour eviter les coupures
- **Marge de securite** : 100 points en bas de page

### Fonctionnalites PDF
- **Template basique** : PDFKit pour performance optimale (5-10 KB)
- **Template premium** : Puppeteer pour design avance (200-400 KB)
- **Protection des documents** : Lecture seule, mots de passe optionnels
- **Customisation** : Couleurs, polices, logos personnalisables
- **Metadata** : Informations document automatiques

### Tests de Pagination
Utiliser `test-devis-pagination.js` pour tester avec de nombreux elements :
```bash
node test-devis-pagination.js
```

## Bonnes Pratiques de Developpement
- Utiliser les types TypeScript
- Suivre le modele MVC
- Utiliser les services pour la logique metier
- Documenter les fonctions et API
- Ecrire des tests pour les fonctionnalites critiques
- **Tester la pagination PDF** avec des devis longs avant deploiement