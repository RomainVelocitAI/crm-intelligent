const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function resetPasswords() {
  console.log('🔄 Réinitialisation des mots de passe...\n');
  
  // IMPORTANT: Utiliser 12 rounds pour correspondre à Render
  const BCRYPT_ROUNDS = 12;
  console.log(`🔐 Utilisation de ${BCRYPT_ROUNDS} rounds bcrypt (Render default)\n`);
  
  const updates = [
    {
      email: 'romain.cano33@gmail.com',
      password: 'Temoignage2025!',
      nom: 'Cano',
      prenom: 'Romain'
    },
    {
      email: 'romain.second@gmail.com', 
      password: 'Temoignage2025!',
      nom: 'Cano',
      prenom: 'Romain'
    },
    {
      email: 'ami@example.com',
      password: 'TestPass2025!',
      nom: 'Test',
      prenom: 'Ami'
    }
  ];
  
  try {
    for (const update of updates) {
      console.log(`📝 Mise à jour de ${update.email}...`);
      
      // Hacher le mot de passe avec 12 rounds
      const hashedPassword = await bcrypt.hash(update.password, BCRYPT_ROUNDS);
      console.log(`   Hash généré: ${hashedPassword.substring(0, 30)}...`);
      
      // Vérifier que le hash fonctionne
      const testCompare = await bcrypt.compare(update.password, hashedPassword);
      console.log(`   Vérification du hash: ${testCompare ? '✅' : '❌'}`);
      
      // Mettre à jour dans la base de données
      const user = await prisma.user.update({
        where: { email: update.email },
        data: { 
          password: hashedPassword,
          nom: update.nom,
          prenom: update.prenom
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true
        }
      });
      
      console.log(`   ✅ Utilisateur mis à jour: ${user.prenom} ${user.nom} (${user.id})`);
      console.log(`   Mot de passe: ${update.password}\n`);
    }
    
    console.log('✅ Tous les mots de passe ont été réinitialisés avec 12 rounds');
    console.log('\n📋 Comptes disponibles:');
    console.log('   Email: romain.cano33@gmail.com | Password: Temoignage2025!');
    console.log('   Email: romain.second@gmail.com | Password: Temoignage2025!');
    console.log('   Email: ami@example.com | Password: TestPass2025!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords().catch(console.error);