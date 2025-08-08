import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixUserPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'direction@velocit-ai.fr' },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        password: true
      }
    });
    
    console.log('=== DIAGNOSTIC DU PROBLÈME DE CONNEXION ===\n');
    console.log('Utilisateur trouvé:');
    console.log('- Email:', user.email);
    console.log('- Nom:', user.prenom, user.nom);
    console.log('- A un mot de passe:', user.password ? 'OUI' : 'NON');
    
    if (!user.password) {
      console.log('\n❌ PROBLÈME IDENTIFIÉ:');
      console.log('L\'utilisateur n\'a PAS de mot de passe dans la base de données!');
      console.log('C\'est pourquoi vous ne pouvez pas vous connecter.');
      console.log('\n🔧 CORRECTION EN COURS...\n');
      
      // Créer un mot de passe temporaire
      const tempPassword = 'Velocita2024!';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      
      // Mettre à jour l'utilisateur avec le mot de passe
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Mot de passe créé avec succès!\n');
      console.log('=== INFORMATIONS DE CONNEXION ===');
      console.log('📧 Email: direction@velocit-ai.fr');
      console.log('🔑 Mot de passe: Velocita2024!');
      console.log('\nVous pouvez maintenant vous connecter dans l\'application CRM!');
      console.log('URL: http://localhost:3100 ou https://crm-intelligent.onrender.com');
      
    } else {
      console.log('\n✅ L\'utilisateur a déjà un mot de passe.');
      console.log('\nSi vous avez oublié votre mot de passe, vous pouvez le réinitialiser.');
      console.log('Voulez-vous définir un nouveau mot de passe? (relancez le script avec --reset)');
      
      // Si l'argument --reset est passé, réinitialiser le mot de passe
      if (process.argv.includes('--reset')) {
        console.log('\n🔧 Réinitialisation du mot de passe...\n');
        
        const newPassword = 'Velocita2024!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
        
        console.log('✅ Mot de passe réinitialisé!\n');
        console.log('=== NOUVELLES INFORMATIONS DE CONNEXION ===');
        console.log('📧 Email: direction@velocit-ai.fr');
        console.log('🔑 Nouveau mot de passe: Velocita2024!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPassword();