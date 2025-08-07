#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testBcryptRounds() {
  const password = 'azerty33';
  
  // Hash connu avec 10 rounds (de la base actuelle)
  const hash10 = '$2a$10$WtSut05B8ctr9mYhmH6JF.Y/yN37wf1vM4MhzJHqPMlWSDYSP5.jG';
  
  // Hash connu avec 12 rounds (de la base actuelle)  
  const hash12 = '$2a$12$z9BxtKWgoyECoa.3xhsKdeTBuCQ8gwME3mWz8RaT/DU.MbuP0mD.2';
  
  console.log('Testing bcrypt rounds compatibility...\n');
  
  // Test avec 10 rounds
  const valid10 = await bcrypt.compare(password, hash10);
  console.log(`Password "azerty33" with 10 rounds hash: ${valid10 ? '✓ VALID' : '✗ INVALID'}`);
  
  // Test avec 12 rounds
  const valid12 = await bcrypt.compare(password, hash12);
  console.log(`Password "azerty33" with 12 rounds hash: ${valid12 ? '✓ VALID' : '✗ INVALID'}`);
  
  // Créer nouveaux hashs pour comparaison
  console.log('\nGenerating new hashes:');
  const newHash10 = await bcrypt.hash(password, 10);
  const newHash12 = await bcrypt.hash(password, 12);
  
  console.log(`10 rounds: ${newHash10.substring(0, 30)}...`);
  console.log(`12 rounds: ${newHash12.substring(0, 30)}...`);
  
  // Tester la compatibilité croisée
  console.log('\nCross-compatibility test:');
  console.log(`bcrypt.compare() works with any number of rounds: ${valid10 && valid12 ? '✓ YES' : '✗ NO'}`);
}

testBcryptRounds().catch(console.error);