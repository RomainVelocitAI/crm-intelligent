# ⚠️ COMMANDES INTERDITES EN PRODUCTION ⚠️

## JAMAIS UTILISER CES COMMANDES SUR UNE BASE DE PRODUCTION

### 🚫 COMMANDES QUI EFFACENT TOUTES LES DONNÉES

1. **`npx prisma db push --force-reset`**
   - EFFACE TOUTE LA BASE DE DONNÉES
   - PERTE TOTALE DES DONNÉES UTILISATEURS
   - CATASTROPHIQUE EN PRODUCTION

2. **`npx prisma migrate reset`**
   - RÉINITIALISE COMPLÈTEMENT LA BASE
   - SUPPRIME TOUTES LES TABLES ET DONNÉES
   - JAMAIS EN PRODUCTION

3. **`DROP DATABASE`**
   - SUPPRIME LA BASE ENTIÈRE
   - IRRÉVERSIBLE

4. **`TRUNCATE TABLE`**
   - VIDE COMPLÈTEMENT UNE TABLE
   - PERTE DE TOUTES LES LIGNES

5. **`DELETE FROM table` (sans WHERE)**
   - SUPPRIME TOUTES LES LIGNES
   - TRÈS DANGEREUX

## ✅ ALTERNATIVES SÛRES

### Au lieu de `--force-reset`:
```bash
# SAFE: Synchronise sans effacer
npx prisma db push

# SAFE: Applique les migrations
npx prisma migrate deploy
```

### Pour modifier le schéma:
```bash
# 1. Créer une migration
npx prisma migrate dev --name description_du_changement

# 2. Tester en local
npm run test

# 3. Appliquer en production
npx prisma migrate deploy
```

## 🛡️ RÈGLES DE SÉCURITÉ

1. **TOUJOURS faire un backup avant toute modification de schéma**
2. **JAMAIS utiliser --force-reset en production**
3. **JAMAIS utiliser migrate reset en production**
4. **TOUJOURS tester les migrations en local d'abord**
5. **TOUJOURS utiliser des transactions pour les modifications critiques**

## 🚨 SI ERREUR COMMISE

1. ARRÊTER immédiatement toute opération
2. Vérifier s'il existe des backups Supabase
3. Contacter le support Supabase si nécessaire
4. NE PAS tenter de "réparer" sans backup

---
⚠️ CE FICHIER DOIT ÊTRE LU AVANT TOUTE OPÉRATION DE BASE DE DONNÉES ⚠️