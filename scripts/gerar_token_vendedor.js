require('dotenv').config();
const jwt = require('jsonwebtoken');

// Criar token para vendedor
const payload = {
  id: 6,
  nome: 'Vendedor Teste',
  email: 'vendedor@bragodistribuidora.com.br',
  perfil: 'vendedor',
  equipe_id: undefined
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

console.log('🔑 Token JWT do Vendedor:');
console.log(token);
console.log('');
console.log('📦 Payload decodificado:');
console.log(JSON.stringify(payload, null, 2));
console.log('');
console.log('✅ Use este token no localStorage:');
console.log(`localStorage.setItem('nexus_b2b_token', '${token}');`);
