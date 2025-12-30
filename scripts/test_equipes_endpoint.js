const http = require('http');

// Token de teste válido para IRINEU DE CARVALHO
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTQsIm5vbWUiOiJJUklORVUgREUgQ0FSVkFMSE8iLCJlbWFpbCI6ImlyaW5ldS5jYXJ2YWxob0ByZWRlb2JhLmNvbS5iciIsInBlcmZpbCI6InNvbGljaXRhbnRlIiwiZXF1aXBlX2lkIjoxLCJpYXQiOjE3NjcwNDMxMDl9.tZuJdGsJ_kY1L2DEwsCJS6J2H_LC5GImJofrdUpXoks';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/usuarios/54/equipes',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

console.log('🔍 Testando endpoint:', options.path);

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📡 Status:', res.statusCode);
    console.log('📦 Response:', data);
    
    if (res.statusCode === 200) {
      try {
        const json = JSON.parse(data);
        console.log('\n✅ Endpoint funcionando!');
        console.log('📊 Total de equipes:', json.equipes ? json.equipes.length : 0);
        if (json.equipes && json.equipes.length > 0) {
          console.log('\n📋 Primeiras 3 equipes:');
          json.equipes.slice(0, 3).forEach(eq => {
            console.log(`   - ${eq.nome} (ID: ${eq.id})`);
            console.log(`     Limite: R$ ${eq.limite_disponivel}`);
          });
        }
      } catch (e) {
        console.error('❌ Erro ao parsear JSON:', e.message);
      }
    } else {
      console.log('❌ Erro no endpoint');
    }
    
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
  process.exit(1);
});

req.end();
