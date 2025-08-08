import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  try {
    console.log('Testing Resend configuration...');
    console.log('API Key:', process.env.RESEND_API_KEY ? 'Configured' : 'Missing');
    console.log('From Email:', process.env.RESEND_FROM_EMAIL || 'Not configured');
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: ['direction@velocit-ai.fr'],
      subject: 'Test VelocitaLeads Email',
      html: '<p>This is a test email from VelocitaLeads</p>',
    });

    if (error) {
      console.error('Resend Error:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testResend();