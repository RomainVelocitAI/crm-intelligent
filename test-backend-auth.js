#!/usr/bin/env node

/**
 * Script pour tester directement l'authentification via l'API backend
 */

const axios = require('axios');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function testAuth(apiUrl, email, password) {
  console.log(`\n${colors.blue}Testing: ${email}${colors.reset}`);
  console.log(`  API: ${apiUrl}`);
  
  try {
    const response = await axios.post(
      `${apiUrl}/api/auth/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Accept any status code
      }
    );

    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`  ${colors.green}✓ LOGIN SUCCESS${colors.reset}`);
      console.log(`  User: ${response.data.user?.prenom} ${response.data.user?.nom}`);
      console.log(`  Token: ${response.data.token?.substring(0, 20)}...`);
    } else {
      console.log(`  ${colors.red}✗ LOGIN FAILED${colors.reset}`);
      console.log(`  Message: ${response.data.message || 'Unknown error'}`);
      if (response.data.details) {
        console.log(`  Details: ${JSON.stringify(response.data.details)}`);
      }
    }
    
    return response.status === 200;
    
  } catch (error) {
    console.log(`  ${colors.red}✗ REQUEST ERROR${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    if (error.response) {
      console.log(`  Response: ${error.response.status} - ${error.response.statusText}`);
    }
    return false;
  }
}

async function main() {
  console.log(`${colors.magenta}=== Backend Authentication Test ===${colors.reset}`);
  console.log(`Time: ${new Date().toISOString()}`);

  const accounts = [
    { email: 'romain.cano33@gmail.com', password: 'azerty33' },
    { email: 'romain.second@gmail.com', password: 'azerty33' },
    { email: 'ami@example.com', password: 'motdepasse123' },
  ];

  // Test en production (Render)
  console.log(`\n${colors.yellow}Testing Production Backend (Render):${colors.reset}`);
  
  for (const account of accounts) {
    await testAuth('https://crm-intelligent.onrender.com', account.email, account.password);
  }

  // Test endpoint de santé
  console.log(`\n${colors.yellow}Testing Health Endpoint:${colors.reset}`);
  try {
    const healthResponse = await axios.get('https://crm-intelligent.onrender.com/health', {
      validateStatus: () => true,
    });
    console.log(`  Status: ${healthResponse.status}`);
    if (healthResponse.data) {
      console.log(`  Response: ${JSON.stringify(healthResponse.data)}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}Health check failed: ${error.message}${colors.reset}`);
  }

  console.log(`\n${colors.magenta}=== Summary ===${colors.reset}`);
  console.log(`If all logins fail with 401, the backend might be:`);
  console.log(`  1. Using a different database`);
  console.log(`  2. Using different bcrypt configuration`);
  console.log(`  3. Missing environment variables`);
  console.log(`  4. Using cached/old code`);
}

main().catch(console.error);