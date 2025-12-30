const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = {
  id: 54,
  nome: 'IRINEU DE CARVALHO',
  email: 'irineu.carvalho@redeoba.com.br',
  perfil: 'solicitante',
  equipe_id: 1,
  iat: Math.floor(Date.now() / 1000)
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'nexus_b2b_secret_key_2024');

console.log('\n🔑 Token gerado para teste:');
console.log('='.repeat(80));
console.log(token);
console.log('='.repeat(80));
console.log('\n👤 Payload:');
console.log(payload);
console.log('\n');
