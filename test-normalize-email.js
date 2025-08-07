const validator = require('validator');

console.log('🔍 Test de normalizeEmail() de express-validator\n');

const emails = [
  'romain.cano33@gmail.com',
  'Romain.cano33@gmail.com',
  'ROMAIN.CANO33@GMAIL.COM',
  'romain.cano33+test@gmail.com',
  'romain.cano33@googlemail.com',
  'ami@example.com',
  'AMI@EXAMPLE.COM'
];

console.log('normalizeEmail() utilise ces options par défaut:');
console.log('- gmail_lowercase: true (met en minuscules la partie avant @)');
console.log('- gmail_remove_dots: true (enlève les points pour Gmail)');
console.log('- gmail_remove_subaddress: true (enlève +xxx pour Gmail)');
console.log('- gmail_convert_googlemaildotcom: true (convertit googlemail.com en gmail.com)\n');

for (const email of emails) {
  const normalized = validator.normalizeEmail(email);
  console.log(`Original: "${email}"`);
  console.log(`Normalisé: "${normalized}"`);
  if (email !== normalized) {
    console.log('  ⚠️  MODIFICATION DÉTECTÉE!');
  }
  console.log('');
}

console.log('\n💡 Le problème possible:');
console.log('Si la base de données contient "romain.cano33@gmail.com"');
console.log('Mais normalizeEmail() transforme en "romaincano33@gmail.com" (sans points)');
console.log('Alors findUnique() ne trouvera pas l\'utilisateur!\n');