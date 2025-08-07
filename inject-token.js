// Script pour injecter un token JWT valide dans le localStorage
// À exécuter dans la console du navigateur sur http://localhost:3100

const jwt = require('jsonwebtoken');

// Créer un token valide avec le bon secret
const token = jwt.sign(
  { 
    userId: 'cme0zwchj0000ei26neoow8d1',
    email: 'test@example.com'
  },
  'your-super-secret-jwt-key-change-this-in-production',
  { expiresIn: '7d' }
);

console.log('Token JWT généré:');
console.log(token);
console.log('');
console.log('Pour utiliser ce token, exécutez cette commande dans la console du navigateur:');
console.log(`localStorage.setItem('auth-token', '${token}');`);
console.log('');
console.log('Ou copiez directement le token ci-dessous:');
console.log(token);