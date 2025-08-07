#!/usr/bin/env node

/**
 * Script pour débugger le mystère de l'authentification
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

async function debugAuth() {
  console.log(`${colors.magenta}=== Authentication Mystery Debug ===${colors.reset}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const accounts = [
    { email: 'romain.cano33@gmail.com', password: 'azerty33' },
    { email: 'romain.second@gmail.com', password: 'azerty33' },
    { email: 'ami@example.com', password: 'motdepasse123' },
  ];

  for (const account of accounts) {
    console.log(`\n${colors.blue}Testing: ${account.email}${colors.reset}`);
    
    try {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        select: {
          id: true,
          email: true,
          password: true,
          nom: true,
          prenom: true,
        }
      });

      if (!user) {
        console.log(`  ${colors.red}✗ User not found in database${colors.reset}`);
        continue;
      }

      console.log(`  User found: ${user.prenom} ${user.nom}`);
      console.log(`  Hash: ${user.password.substring(0, 30)}...`);
      
      // Analyser le hash
      const hashParts = user.password.split('$');
      console.log(`  Hash format: $${hashParts[1]}$${hashParts[2]}$ (algorithm: ${hashParts[1]}, rounds: ${hashParts[2]})`);
      
      // Test avec le mot de passe attendu
      const isValid = await bcrypt.compare(account.password, user.password);
      console.log(`  Password "${account.password}" is ${isValid ? colors.green + '✓ VALID' : colors.red + '✗ INVALID'}${colors.reset}`);
      
      // Si invalide, essayer d'autres mots de passe communs
      if (!isValid) {
        const testPasswords = ['azerty33', 'motdepasse123', 'password', '123456'];
        console.log(`  ${colors.yellow}Testing other passwords:${colors.reset}`);
        for (const testPwd of testPasswords) {
          const testValid = await bcrypt.compare(testPwd, user.password);
          if (testValid) {
            console.log(`    ${colors.green}✓ "${testPwd}" works!${colors.reset}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }

  // Vérifier aussi ce qui se passe avec différents rounds
  console.log(`\n${colors.yellow}=== Hash Comparison Test ===${colors.reset}`);
  const testPassword = 'azerty33';
  
  console.log(`\nGenerating hashes for "${testPassword}":`);
  const hash10 = await bcrypt.hash(testPassword, 10);
  const hash12 = await bcrypt.hash(testPassword, 12);
  
  console.log(`  10 rounds: ${hash10}`);
  console.log(`  12 rounds: ${hash12}`);
  
  // Tester la compatibilité croisée
  console.log(`\nCross-validation test:`);
  console.log(`  10-round hash validates with bcrypt.compare: ${await bcrypt.compare(testPassword, hash10) ? '✓' : '✗'}`);
  console.log(`  12-round hash validates with bcrypt.compare: ${await bcrypt.compare(testPassword, hash12) ? '✓' : '✗'}`);

  await prisma.$disconnect();
}

debugAuth().catch(console.error);