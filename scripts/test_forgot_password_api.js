require('dotenv').config();

async function testForgotPasswordAPI() {
  try {
    console.log('🧪 TESTANDO API DE RECUPERAÇÃO DE SENHA\n');
    
    const testEmail = 'edson.silva@bragodistribuidora.com.br';
    
    console.log('📧 Email para teste:', testEmail);
    console.log('🔗 URL: http://localhost:3100/api/password/forgot-password');
    console.log('');
    
    const response = await fetch('http://localhost:3100/api/password/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    const data = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📦 Resposta:', JSON.stringify(data, null, 2));
    console.log('');
    
    if (response.ok) {
      console.log('✅ API FUNCIONOU!');
      console.log('📧 Verifique o email:', testEmail);
      console.log('⚠️  Não esqueça de verificar a pasta de SPAM!\n');
      
      console.log('💡 DICA: Se não chegou, pode ser:');
      console.log('   1. Email está na pasta de SPAM');
      console.log('   2. Servidor SMTP temporariamente lento');
      console.log('   3. Email não existe no banco (verifique no banco)\n');
    } else {
      console.log('❌ ERRO na API:', data.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

testForgotPasswordAPI();
