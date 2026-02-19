const axios = require('axios');

async function testarAPI() {
  try {
    console.log('🔍 Testando API /api/produtos/galeria...\n');
    
    const response = await axios.get('http://localhost:3000/api/produtos/galeria', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTQsImVtYWlsIjoiYnJhZ29AZ21haWwuY29tIiwibm9tZSI6IkFuZHJlIENhbXBvcyIsInBlcmZpbCI6IkdFU1RPUiIsImVxdWlwZV9pZCI6MTgsImlhdCI6MTczODg3NzE1MywiZXhwIjoxNzM5NDgxOTUzfQ.Zw_3D4qLQBGhEJw7X9d7tQKY5zZ9g9mN4jN4hN6hN7c'
      }
    });
    
    const produtos = response.data.produtos;
    console.log(`✅ ${produtos.length} produtos retornados\n`);
    
    // Procurar produto Rexona (ID 42)
    const rexona = produtos.find(p => p.id === 42 || p.codprod === '17412');
    
    if (rexona) {
      console.log('🎯 Produto Rexona encontrado:');
      console.log('ID:', rexona.id);
      console.log('Código:', rexona.codprod);
      console.log('Descrição:', rexona.descricao);
      console.log('Acesso Específico:', rexona.acesso_especifico);
      console.log('Equipes com Acesso:', rexona.equipes_com_acesso);
      console.log('Tipo equipes_com_acesso:', typeof rexona.equipes_com_acesso);
      console.log('É Array?:', Array.isArray(rexona.equipes_com_acesso));
    } else {
      console.log('❌ Produto Rexona NÃO encontrado na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testarAPI();
