require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function testEmailVendedor() {
  try {
    console.log('🔍 TESTANDO CONFIGURAÇÃO DE EMAILS\n');
    
    // Buscar todas as equipes e seus emails
    const [equipes] = await pool.execute(`
      SELECT 
        e.id, 
        e.nome, 
        e.vendedor_email,
        e.gestor_id,
        u.email as gestor_email
      FROM equipes e
      LEFT JOIN usuarios u ON u.id = e.gestor_id
      ORDER BY e.id
    `);
    
    console.log('📊 CONFIGURAÇÃO ATUAL DE EMAILS:\n');
    
    equipes.forEach(eq => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Equipe: ${eq.nome} (ID: ${eq.id})`);
      console.log(`   👤 Gestor ID: ${eq.gestor_id || 'Não configurado'}`);
      console.log(`   📧 Gestor Email: ${eq.gestor_email || 'N/A'} ${eq.gestor_email?.includes('@local') || eq.gestor_email?.includes('@teste') ? '⚠️  INVÁLIDO' : ''}`);
      console.log(`   📧 Vendedor Email: ${eq.vendedor_email || 'N/A'} ${eq.vendedor_email ? '✅' : '❌ NÃO CONFIGURADO'}`);
    });
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    console.log('📋 RESUMO DA CONFIGURAÇÃO ATUAL:\n');
    console.log('   ✅ Emails de pedidos são enviados APENAS para vendedor_email');
    console.log('   ✅ Email do gestor NÃO é mais usado (será configurado em produção)');
    console.log('   ✅ Independente do status (APROVADO ou PENDENTE), email vai para vendedor\n');
    
    // Verificar se há equipes sem vendedor_email
    const semEmail = equipes.filter(e => !e.vendedor_email);
    if (semEmail.length > 0) {
      console.log('⚠️  ATENÇÃO: Equipes sem vendedor_email configurado:\n');
      semEmail.forEach(e => {
        console.log(`   ❌ ${e.nome} (ID: ${e.id}) - Configure vendedor_email!`);
      });
      console.log('\n💡 Para configurar, execute:');
      console.log(`   UPDATE equipes SET vendedor_email = 'edson.silva@bragodistribuidora.com.br' WHERE id IN (${semEmail.map(e => e.id).join(', ')});`);
    } else {
      console.log('✅ Todas as equipes têm vendedor_email configurado!\n');
    }
    
    console.log('🎯 PRÓXIMO PASSO:');
    console.log('   1. Teste criando um orçamento');
    console.log('   2. Verifique se o email chegou em:', equipes[0]?.vendedor_email || 'N/A');
    console.log('   3. Em produção, configure o email do gestor no cadastro de usuários\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testEmailVendedor();
