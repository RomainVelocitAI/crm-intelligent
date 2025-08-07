// Script pour corriger les problèmes de production
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixProductionIssues() {
  console.log('🔧 Correction des problèmes de production...');
  
  try {
    // 1. Créer ou mettre à jour l'utilisateur de test
    const email = 'direction@velocit-ai.fr';
    const password = 'Test123456!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          motDePasse: hashedPassword,
        }
      });
      console.log('✅ Mot de passe mis à jour pour:', email);
    } else {
      await prisma.user.create({
        data: {
          email,
          motDePasse: hashedPassword,
          prenom: 'Direction',
          nom: 'VelocitAI',
          entreprise: 'VelocitAI',
          telephone: '0600000000',
          roleId: 'admin',
        }
      });
      console.log('✅ Utilisateur créé:', email);
    }
    
    // 2. Vérifier la variable NODE_ENV
    console.log('🔍 NODE_ENV actuel:', process.env.NODE_ENV);
    console.log('🔍 RESEND_API_KEY présente:', !!process.env.RESEND_API_KEY);
    console.log('🔍 TEST_EMAIL:', process.env.TEST_EMAIL);
    console.log('🔍 FORCE_PRODUCTION_EMAIL:', process.env.FORCE_PRODUCTION_EMAIL);
    
    // 3. Lister les devis récents pour vérifier
    const recentQuotes = await prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        numero: true,
        statut: true,
        createdAt: true,
      }
    });
    
    console.log('📋 Devis récents:', recentQuotes);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionIssues();