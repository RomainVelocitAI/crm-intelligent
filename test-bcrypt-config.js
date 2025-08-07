#!/usr/bin/env node

/**
 * Script pour tester la configuration bcrypt utilisée par le backend
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

async function testAllConfigurations() {
  console.log(`${colors.magenta}=== Testing Bcrypt Configurations ===${colors.reset}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const email = 'romain.cano33@gmail.com';
  const password = 'azerty33';

  try {
    // Récupérer le hash actuel de la base
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true }
    });

    if (!user) {
      console.log(`${colors.red}User not found!${colors.reset}`);
      return;
    }

    console.log(`${colors.blue}Current hash from database:${colors.reset}`);
    console.log(`  ${user.password.substring(0, 30)}...\n`);

    // Analyser le hash pour déterminer le nombre de rounds
    const hashParts = user.password.split('$');
    const rounds = hashParts[2];
    console.log(`${colors.yellow}Hash analysis:${colors.reset}`);
    console.log(`  Algorithm: ${hashParts[1]}`);
    console.log(`  Rounds: ${rounds}`);
    console.log(`  Salt+Hash: ${hashParts[3].substring(0, 20)}...`);

    // Tester avec différentes configurations
    console.log(`\n${colors.blue}Testing password "azerty33" with current hash:${colors.reset}`);
    
    const validWithCurrent = await bcrypt.compare(password, user.password);
    console.log(`  Validation: ${validWithCurrent ? colors.green + '✓ VALID' : colors.red + '✗ INVALID'}${colors.reset}`);

    // Générer des hashs avec différents rounds pour comparaison
    console.log(`\n${colors.blue}Generating test hashes:${colors.reset}`);
    
    for (const testRounds of [10, 11, 12]) {
      const testHash = await bcrypt.hash(password, testRounds);
      const isValid = await bcrypt.compare(password, testHash);
      console.log(`  ${testRounds} rounds: ${testHash.substring(0, 30)}... ${isValid ? '✓' : '✗'}`);
    }

    // Tester ce que le backend devrait utiliser
    console.log(`\n${colors.yellow}Backend configuration check:${colors.reset}`);
    console.log(`  BCRYPT_ROUNDS in .env: ${process.env.BCRYPT_ROUNDS || 'NOT SET (default: 10)'}`);
    
    // Simuler ce que fait le backend
    const backendRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    console.log(`  Backend should use: ${backendRounds} rounds`);
    
    const backendHash = await bcrypt.hash(password, backendRounds);
    console.log(`  Backend would generate: ${backendHash.substring(0, 30)}...`);
    
    // Comparer avec le hash en base
    const hashesMatch = user.password.substring(0, 7) === backendHash.substring(0, 7);
    console.log(`  Matches database hash format: ${hashesMatch ? colors.green + '✓ YES' : colors.red + '✗ NO'}${colors.reset}`);

    // Recommandation
    console.log(`\n${colors.magenta}=== Recommendation ===${colors.reset}`);
    if (rounds === String(backendRounds)) {
      console.log(`${colors.green}✓ Database hash uses ${rounds} rounds, matching backend config${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ MISMATCH: Database has ${rounds} rounds, backend expects ${backendRounds} rounds${colors.reset}`);
      console.log(`${colors.yellow}  Solution: Update passwords to use ${backendRounds} rounds${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  } finally {
    await prisma.$disconnect();
  }
}

testAllConfigurations().catch(console.error);