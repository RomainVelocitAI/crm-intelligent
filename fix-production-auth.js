#!/usr/bin/env node

/**
 * Script pour corriger l'authentification en production
 * Réinitialise les mots de passe directement dans Supabase
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

// Forcer l'utilisation de la base Supabase de production
process.env.DATABASE_URL = "postgresql://postgres.dzproavuumvmootwgevi:I@@8l2NAM@*8zVYS@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function resetPassword(email, newPassword) {
  try {
    console.log(`\n${colors.blue}Resetting password for: ${email}${colors.reset}`);
    
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        entreprise: true,
      }
    });

    if (!user) {
      console.log(`${colors.red}❌ User not found: ${email}${colors.reset}`);
      return false;
    }

    console.log(`${colors.green}✓ User found: ${user.prenom} ${user.nom}${colors.reset}`);
    
    // Hasher le nouveau mot de passe avec 12 rounds (valeur par défaut du backend sur Render)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log(`${colors.yellow}  New hash with 12 rounds (DEFAULT on Render): ${hashedPassword.substring(0, 20)}...${colors.reset}`);
    
    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });
    
    console.log(`${colors.green}✓ Password successfully reset${colors.reset}`);
    
    // Vérifier que ça fonctionne
    const testUser = await prisma.user.findUnique({
      where: { email },
      select: { password: true }
    });
    
    const isValid = await bcrypt.compare(newPassword, testUser.password);
    if (isValid) {
      console.log(`${colors.green}✓ Verification successful - password works${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Verification failed - password doesn't work${colors.reset}`);
      return false;
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.magenta}=== Production Authentication Fix ===${colors.reset}`);
  console.log(`Database: Supabase (dzproavuumvmootwgevi)`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Comptes à réinitialiser
  const accountsToFix = [
    { email: 'romain.cano33@gmail.com', password: 'azerty33', name: 'Romain Cano (principal)' },
    { email: 'romain.second@gmail.com', password: 'azerty33', name: 'Romain Cano (second)' },
    { email: 'ami@example.com', password: 'motdepasse123', name: 'Ami Test' },
  ];

  console.log(`${colors.yellow}Fixing ${accountsToFix.length} accounts...${colors.reset}`);

  for (const account of accountsToFix) {
    console.log(`\n${colors.blue}Processing: ${account.name}${colors.reset}`);
    const success = await resetPassword(account.email, account.password);
    
    if (!success) {
      console.log(`${colors.red}Failed to fix ${account.email}${colors.reset}`);
    }
  }

  // Afficher le résumé
  console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
  
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      nom: true,
      prenom: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`\n${colors.green}Total users in database: ${allUsers.length}${colors.reset}`);
  console.log('\nAll users:');
  allUsers.forEach(user => {
    const isUpdatedToday = new Date(user.updatedAt).toDateString() === new Date().toDateString();
    const status = isUpdatedToday ? `${colors.green}✓ Updated today${colors.reset}` : '';
    console.log(`  - ${user.email} (${user.prenom} ${user.nom}) ${status}`);
  });

  console.log(`\n${colors.magenta}=== Testing Login ===${colors.reset}`);
  
  // Tester la connexion pour le compte principal
  const testEmail = 'romain.cano33@gmail.com';
  const testPassword = 'azerty33';
  
  const testUser = await prisma.user.findUnique({
    where: { email: testEmail },
    select: { password: true }
  });
  
  if (testUser) {
    const isValid = await bcrypt.compare(testPassword, testUser.password);
    console.log(`\nLogin test for ${testEmail}:`);
    console.log(isValid 
      ? `${colors.green}✓ Password "azerty33" works correctly${colors.reset}`
      : `${colors.red}❌ Password "azerty33" does NOT work${colors.reset}`
    );
  }

  await prisma.$disconnect();
  
  console.log(`\n${colors.magenta}Done! You should now be able to login on https://crm-intelligent-lefi.vercel.app${colors.reset}\n`);
}

main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  console.error(error);
  process.exit(1);
});