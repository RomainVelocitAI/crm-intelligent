# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VelocitaLeads is a French CRM application designed for freelancers and small businesses to create and send professional quotes with email tracking. Focus is on quote generation and sending without hosting fees (except premium AI features).

## Architecture

Full-stack TypeScript application:
- **Backend**: Node.js/Express API server on port 3001
- **Frontend**: React SPA with Vite dev server on port 3000
- **Database**: PostgreSQL with Prisma ORM
- **Key Features**: Contact management, quote generation with PDF export, email tracking

3-tab interface:
1. **CONTACTS** - Contact management with automatic financial metrics
2. **OPPORTUNITÉS** - Quote creation and management with PDF generation
3. **MÉTRIQUES** - Dashboard with KPIs and analytics

## Development Commands

### Backend (Root Directory)
```bash
npm run dev             # Start backend dev server on port 3001
npm run build           # Build for production
npm run start           # Start production server
npm run test            # Run test suite
npm run lint            # ESLint check
npm run type-check      # TypeScript validation

# Database operations
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed with development data
npm run db:reset        # Reset database
npm run db:generate     # Generate Prisma client
npm run db:studio       # Open Prisma Studio
npm run setup           # Complete setup (install + migrate + seed)
```

### Frontend (/client directory)
```bash
npm run dev             # Start Vite dev server on port 3000
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # ESLint check
npm run type-check      # TypeScript validation
```

## High-Level Architecture

### API Routes Structure
- `/api/auth/*` - Authentication (login, register, refresh)
- `/api/contacts/*` - Contact CRUD operations
- `/api/quotes/*` - Quote management and PDF generation
- `/api/metrics/*` - Dashboard metrics and analytics
- `/api/tracking/*` - Email tracking pixel and updates
- `/api/services/*` - Service catalog management

### Authentication Flow
- JWT-based authentication with refresh tokens
- Middleware validates tokens on protected routes
- User context available via `req.user` after authentication

### Data Flow
1. **Contact Creation** → Automatic metrics calculation
2. **Quote Creation** → Line items aggregation → Total calculation
3. **Quote Sending** → Email tracking setup → Status updates
4. **Email Opening** → Tracking pixel hit → Quote status update → Contact metrics update

### PDF Generation System
- **Basic Template**: PDFKit for optimal performance (5-10 KB files)
- **Premium Template**: Puppeteer for advanced design (200-400 KB files)
- **Intelligent Pagination**: Prevents element splitting across pages
- **Auto page breaks**: Detects available space and manages page transitions
- **Table headers**: Automatically redrawn on new pages

### Email Tracking Architecture
- Unique tracking pixel per quote
- Server-side tracking validation to filter bots
- Confidence scoring for tracking events
- Automatic status updates based on tracking data

## Database Schema Key Relationships

```
User (1) → (*) Contact
User (1) → (*) Quote
Contact (1) → (*) Quote
Quote (1) → (*) QuoteItem
Quote (1) → (*) EmailTracking
Service (1) → (*) QuoteItem
```

### Status Enums
- **ContactStatus**: CLIENT_ACTIF, PROSPECT_CHAUD, PROSPECT_TIEDE, PROSPECT_FROID, INACTIF
- **QuoteStatus**: BROUILLON, PRET, ENVOYE, VU, ACCEPTE, REFUSE, EXPIRE, TERMINE, ARCHIVE

## Testing Approach

### Unit Tests
```bash
npm run test                    # Run all tests
npm run test -- --watch        # Watch mode
npm run test -- auth.test      # Run specific test file
```

### PDF Pagination Testing
```bash
node test-devis-pagination.js  # Test with many items
```

## Critical Implementation Details

### Metrics Calculation
- **Chiffre d'affaires**: Sum of accepted quotes
- **Taux de conversion**: (Accepted quotes / Sent quotes) × 100
- **Panier moyen**: Revenue / Number of orders
- **Score de valeur**: Weighted calculation (CA 40%, recency 30%, frequency 20%, conversion 10%)

### Security Measures
- JWT authentication with refresh tokens
- Input validation using express-validator
- Rate limiting on API endpoints
- SQL injection prevention via Prisma
- XSS protection through sanitization

### Performance Optimizations
- Database queries use Prisma's `select` for field optimization
- PDF generation uses streaming for large files
- Email tracking uses lightweight pixel responses
- Frontend uses React Query for caching