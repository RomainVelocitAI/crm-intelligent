const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Vérification des utilisateurs dans la base de données...\n');
  
  try {
    // Vérifier la connexion à la base de données
    const dbUrl = process.env.DATABASE_URL || '';
    console.log(`📊 Base de données: ${dbUrl.includes('dzproavuumvmootwgevi') ? '✅ CORRECT_SUPABASE' : '❌ WRONG_DB'}`);
    console.log(`🔑 Bcrypt rounds configurés: ${process.env.BCRYPT_ROUNDS || '12 (default)'}\n`);
    
    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        nom: true,
        prenom: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`📋 Nombre d'utilisateurs trouvés: ${users.length}\n`);
    
    // Analyser chaque utilisateur
    for (const user of users) {
      console.log(`👤 Utilisateur: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nom: ${user.prenom} ${user.nom}`);
      console.log(`   Créé le: ${user.createdAt}`);
      console.log(`   Hash: ${user.password.substring(0, 30)}...`);
      
      // Analyser le hash
      const hashMatch = user.password.match(/^\$2[aby]\$(\d+)\$/);
      if (hashMatch) {
        const rounds = parseInt(hashMatch[1]);
        console.log(`   Rounds bcrypt détectés: ${rounds}`);
      }
      
      // Tester les mots de passe connus
      const testPasswords = [
        'Temoignage2025!',
        'TestPass2025!',
        'Test1234!',
        'Password123!'
      ];
      
      console.log('   Test des mots de passe:');
      for (const testPass of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPass, user.password);
          if (isValid) {
            console.log(`   ✅ Mot de passe valide: ${testPass}`);
          }
        } catch (err) {
          // Silencieusement ignorer les erreurs de comparaison
        }
      }
      console.log('');
    }
    
    // Test de hachage avec 12 rounds
    console.log('🔐 Test de hachage avec 12 rounds:');
    const testPassword = 'Temoignage2025!';
    const hash12 = await bcrypt.hash(testPassword, 12);
    console.log(`   Hash généré: ${hash12.substring(0, 30)}...`);
    
    // Vérifier la compatibilité
    const testCompare = await bcrypt.compare(testPassword, hash12);
    console.log(`   Vérification: ${testCompare ? '✅ OK' : '❌ ERREUR'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers().catch(console.error);