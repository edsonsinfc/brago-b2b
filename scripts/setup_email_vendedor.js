require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function configurarEmailEquipe() {
  try {
    console.log('📧 Configurando email para equipe de teste...\n');
    
    // Verificar equipes existentes
    const [equipes] = await pool.execute('SELECT id, nome, vendedor_email FROM equipes');
    
    console.log('📋 Equipes encontradas:');
    equipes.forEach(eq => {
      console.log(`  - ID ${eq.id}: ${eq.nome} ${eq.vendedor_email ? `(✅ ${eq.vendedor_email})` : '(❌ sem email)'}`);
    });
    
    if (equipes.length === 0) {
      console.log('\n❌ Nenhuma equipe encontrada. Crie uma equipe primeiro.');
      process.exit(1);
    }
    
    // Atualizar primeira equipe com email de exemplo
    const primeiraEquipe = equipes[0];
    const emailVendedor = 'edson.silva@bragodistribuidora.com.br';
    
    await pool.execute(
      'UPDATE equipes SET vendedor_email = ? WHERE id = ?',
      [emailVendedor, primeiraEquipe.id]
    );
    
    console.log(`\n✅ Email configurado para equipe "${primeiraEquipe.nome}"`);
    console.log(`📧 Email: ${emailVendedor}`);
    console.log('\n💡 Dica: Configure o email real do vendedor no painel do gestor > Equipes');
    console.log('⚠️  Para envios reais, configure as variáveis de email no .env:');
    console.log('   - EMAIL_USER (seu email Gmail)');
    console.log('   - EMAIL_PASS (senha de app do Gmail)');
    console.log('   - EMAIL_FROM (remetente)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

configurarEmailEquipe();
