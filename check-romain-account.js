const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkRomainAccount() {
  console.log('🔍 Vérification spécifique du compte romain.cano33@gmail.com\n');
  
  try {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: 'romain.cano33@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé!');
      
      // Lister tous les emails pour debug
      const allUsers = await prisma.user.findMany({
        select: { email: true }
      });
      console.log('\n📋 Tous les emails dans la base:');
      allUsers.forEach(u => console.log(`   - ${u.email}`));
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nom: ${user.prenom} ${user.nom}`);
    console.log(`   Hash: ${user.password.substring(0, 60)}...`);
    
    // Analyser le hash
    const hashMatch = user.password.match(/^\$2[aby]\$(\d+)\$/);
    if (hashMatch) {
      console.log(`   Rounds bcrypt: ${hashMatch[1]}`);
    }
    
    // Tester le mot de passe
    console.log('\n🔐 Test du mot de passe "Temoignage2025!":');
    const isValid = await bcrypt.compare('Temoignage2025!', user.password);
    console.log(`   Résultat: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}`);
    
    // Créer un nouveau hash pour comparaison
    console.log('\n🔄 Création d\'un nouveau hash pour comparaison:');
    const newHash = await bcrypt.hash('Temoignage2025!', 12);
    console.log(`   Nouveau hash: ${newHash.substring(0, 60)}...`);
    console.log(`   Hash actuel:  ${user.password.substring(0, 60)}...`);
    console.log(`   Identiques? ${newHash === user.password ? 'OUI' : 'NON (normal, salt différent)'}`);
    
    // Vérifier que le nouveau hash fonctionne
    const testNewHash = await bcrypt.compare('Temoignage2025!', newHash);
    console.log(`   Test nouveau hash: ${testNewHash ? '✅' : '❌'}`);
    
    // Forcer la mise à jour du mot de passe
    console.log('\n🔧 Forçage de la mise à jour du mot de passe...');
    const updatedUser = await prisma.user.update({
      where: { email: 'romain.cano33@gmail.com' },
      data: { password: newHash }
    });
    console.log('   ✅ Mot de passe mis à jour');
    
    // Vérifier après mise à jour
    const afterUpdate = await prisma.user.findUnique({
      where: { email: 'romain.cano33@gmail.com' }
    });
    const finalTest = await bcrypt.compare('Temoignage2025!', afterUpdate.password);
    console.log(`   Test final: ${finalTest ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRomainAccount().catch(console.error);