// Teste de API com autenticação
const http = require('http');

// IMPORTANTE: Substitua pelo token real de um gestor/admin
const TOKEN = process.argv[2] || '';

if (!TOKEN) {
  console.log('❌ Forneça um token JWT como argumento');
  console.log('Exemplo: node scripts/test_api_pedidos_auth.js "seu-token-aqui"');
  process.exit(1);
}

const options = {
  hostname: 'localhost',
  port: 3100,
  path: '/api/pedidos?status=PENDENTE_APROVACAO&pageSize=500',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Testando API com autenticação...');
console.log('📡 URL:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('🔑 Token:', TOKEN.substring(0, 30) + '...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Status:', res.statusCode);
    console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
    console.log('\n📦 Resposta:');
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.pedidos) {
        console.log('\n✅ Total de pedidos PENDENTE_APROVACAO:', json.pedidos.length);
        json.pedidos.forEach(p => {
          console.log(`  → Pedido #${p.id} - ${p.equipe_nome} - R$ ${p.valor_total} - ${p.data}`);
        });
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro:', e.message);
});

req.end();
