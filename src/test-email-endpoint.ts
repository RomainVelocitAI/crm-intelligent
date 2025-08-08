import { PrismaClient } from '@prisma/client';
import { sendTrackedEmail } from './services/resendEmailService';

const prisma = new PrismaClient();

async function testEmailEndpoint() {
  try {
    console.log('Testing email endpoint with lazy loading...');
    
    // Get the test contact we created
    const contact = await prisma.contact.findFirst({
      where: {
        email: 'jean.dupont@example.com',
      },
    });
    
    if (!contact) {
      console.error('Test contact not found');
      return;
    }
    
    console.log('Found contact:', {
      id: contact.id,
      email: contact.email,
      name: `${contact.prenom} ${contact.nom}`,
    });
    
    // Test the sendTrackedEmail function directly (simulating the endpoint)
    console.log('\nAttempting to send email with lazy loading...');
    
    await sendTrackedEmail(
      contact.email,
      'Test Email - Lazy Loading Verification',
      'This is a test email to verify that the lazy loading implementation is working correctly.\n\nThe email service should initialize on-demand when this function is called.',
      contact.id,
      contact.userId
    );
    
    console.log('✅ Email sent successfully! Lazy loading is working.');
    
    // Verify the GenericEmail record was created
    const genericEmail = await prisma.genericEmail.findFirst({
      where: {
        contactId: contact.id,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });
    
    if (genericEmail) {
      console.log('\n✅ GenericEmail record created:', {
        id: genericEmail.id,
        subject: genericEmail.subject,
        trackingId: genericEmail.trackingId,
        sentAt: genericEmail.sentAt,
      });
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('\nThis error indicates the lazy loading might not be working correctly.');
  } finally {
    await prisma.$disconnect();
  }
}

testEmailEndpoint();