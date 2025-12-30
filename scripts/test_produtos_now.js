async function test() {
  try {
    console.log('🔐 Fazendo login...');
    
    // Fazer login primeiro
    const loginRes = await fetch('http://localhost:3100/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@local',
        senha: 'admin123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('❌ Login falhou, sem token retornado');
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso!');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Buscar produtos
    console.log('\n🔍 Buscando produtos...');
    const produtosRes = await fetch('http://localhost:3100/api/produtos?page=1&pageSize=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Produtos status:', produtosRes.status);
    const produtosData = await produtosRes.json();
    
    console.log('\n📦 Resposta da API:');
    console.log(JSON.stringify(produtosData, null, 2));
    
    if (produtosData.produtos) {
      console.log(`\n✅ Total de produtos: ${produtosData.produtos.length}`);
      if (produtosData.produtos.length > 0) {
        console.log('\n🎯 Primeiro produto:');
        console.log(produtosData.produtos[0]);
      } else {
        console.log('\n⚠️  Nenhum produto encontrado no banco!');
      }
    } else if (produtosData.error) {
      console.log('\n❌ Erro:', produtosData.error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
