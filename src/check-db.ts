import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
      },
      take: 3,
    });
    
    console.log('Users:', JSON.stringify(users, null, 2));
    
    // Check contacts for the first user
    if (users.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: { userId: users[0].id },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
        },
        take: 3,
      });
      
      console.log('\nContacts for user', users[0].email + ':', JSON.stringify(contacts, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();