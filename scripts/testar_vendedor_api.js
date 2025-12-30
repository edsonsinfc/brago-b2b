require('dotenv').config();
const jwt = require('jsonwebtoken');

// Gerar token
const token = jwt.sign(
  {
    id: 6,
    nome: 'Vendedor Teste',
    email: 'vendedor@bragodistribuidora.com.br',
    perfil: 'vendedor'
  },
  process.env.JWT_SECRET || 'secret',
  { expiresIn: '8h' }
);

console.log('🔑 Token gerado:\n', token);
console.log('\n');

// Testar APIs
async function testarAPIs() {
  const baseURL = 'http://localhost:3100';
  
  const endpoints = [
    '/api/vendedor/dashboard',
    '/api/vendedor/produtos-mais-vendidos?limit=10',
    '/api/vendedor/ranking-lojas?limit=10',
    '/api/vendedor/vendas-por-mes?meses=12',
    '/api/vendedor/pedidos?page=1&pageSize=5',
    '/api/vendedor/status-distribution'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      const response = await fetch(baseURL + endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log(`❌ Erro ${response.status}: ${response.statusText}`);
        const error = await response.text();
        console.log('Detalhes:', error);
      } else {
        const data = await response.json();
        console.log('✅ Sucesso:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
  }
  
  process.exit(0);
}

testarAPIs();
