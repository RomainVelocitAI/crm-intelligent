#!/usr/bin/env node

/**
 * Script de test et monitoring pour l'authentification
 * Permet de vérifier que les comptes fonctionnent correctement
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration des comptes à tester
const ACCOUNTS_TO_TEST = [
  { email: 'romain.cano33@gmail.com', password: 'azerty33', name: 'Romain Cano (principal)' },
  { email: 'romain.second@gmail.com', password: 'azerty33', name: 'Romain Cano (second)' },
  { email: 'ami@example.com', password: 'motdepasse123', name: 'Ami Test' },
];

// Couleurs pour l'affichage
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function testAuthentication(email, password, name) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`Email: ${email}`);
  
  try {
    // 1. Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        nom: true,
        prenom: true,
        entreprise: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      console.log(`${colors.red}❌ User not found in database${colors.reset}`);
      return false;
    }

    console.log(`${colors.green}✓ User found in database${colors.reset}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.prenom} ${user.nom}`);
    console.log(`  Created: ${user.createdAt}`);
    console.log(`  Updated: ${user.updatedAt}`);

    // 2. Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      console.log(`${colors.green}✓ Password is correct${colors.reset}`);
      
      // 3. Analyser le hash
      const hashParts = user.password.match(/^\$2[aby]\$(\d+)\$/);
      if (hashParts) {
        console.log(`  Hash uses ${hashParts[1]} rounds`);
      }
      
      return true;
    } else {
      console.log(`${colors.red}❌ Password is incorrect${colors.reset}`);
      
      // Créer un nouveau hash pour comparaison
      const newHash = await bcrypt.hash(password, 10);
      console.log(`${colors.yellow}  Current hash starts with: ${user.password.substring(0, 10)}${colors.reset}`);
      console.log(`${colors.yellow}  New hash would start with: ${newHash.substring(0, 10)}${colors.reset}`);
      
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function fixAccount(email, password, name) {
  console.log(`\n${colors.magenta}Fixing account: ${name}${colors.reset}`);
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        email: true,
        nom: true,
        prenom: true,
      }
    });
    
    console.log(`${colors.green}✓ Password reset for ${result.email}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Failed to reset password: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.blue}=== CRM Authentication Test & Monitor ===${colors.reset}`);
  console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results = [];
  
  // Tester tous les comptes
  for (const account of ACCOUNTS_TO_TEST) {
    const success = await testAuthentication(account.email, account.password, account.name);
    results.push({ ...account, success });
  }

  // Résumé
  console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`${colors.green}✓ Success: ${successCount}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failCount}${colors.reset}`);

  // Proposer de corriger les comptes en échec
  if (failCount > 0) {
    console.log(`\n${colors.yellow}Would you like to fix the failed accounts? (y/n)${colors.reset}`);
    
    // Si exécuté avec --fix, corriger automatiquement
    if (process.argv.includes('--fix')) {
      console.log('Auto-fixing enabled...');
      for (const account of results.filter(r => !r.success)) {
        await fixAccount(account.email, account.password, account.name);
      }
      
      // Re-tester après correction
      console.log(`\n${colors.blue}=== Re-testing after fixes ===${colors.reset}`);
      for (const account of results.filter(r => !r.success)) {
        await testAuthentication(account.email, account.password, account.name);
      }
    }
  }

  // Afficher le nombre total d'utilisateurs
  const totalUsers = await prisma.user.count();
  console.log(`\n${colors.blue}Total users in database: ${totalUsers}${colors.reset}`);

  await prisma.$disconnect();
  process.exit(failCount > 0 && !process.argv.includes('--fix') ? 1 : 0);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});