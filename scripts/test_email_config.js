require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function testarEmail() {
  try {
    console.log('🔍 Verificando configuração de email...\n');
    
    // Verificar variáveis de ambiente
    console.log('📧 Variáveis de ambiente:');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NÃO CONFIGURADO');
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Configurado' : '❌ NÃO CONFIGURADO');
    console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NÃO CONFIGURADO');
    
    // Verificar equipes com email
    const [equipes] = await pool.execute('SELECT id, nome, vendedor_email FROM equipes');
    
    console.log('\n📋 Equipes com email configurado:');
    equipes.forEach(eq => {
      console.log(`  - ${eq.nome}: ${eq.vendedor_email || '❌ SEM EMAIL'}`);
    });
    
    // Verificar últimos pedidos
    const [pedidos] = await pool.execute(`
      SELECT p.id, p.equipe_id, p.data, p.valor_total, e.nome as equipe_nome, e.vendedor_email
      FROM pedidos p
      JOIN equipes e ON e.id = p.equipe_id
      ORDER BY p.data DESC
      LIMIT 5
    `);
    
    console.log('\n📦 Últimos 5 pedidos:');
    if (pedidos.length === 0) {
      console.log('  ❌ Nenhum pedido encontrado');
    } else {
      pedidos.forEach(p => {
        console.log(`  - Pedido #${p.id} - ${p.equipe_nome} - ${new Date(p.data).toLocaleString('pt-BR')}`);
        console.log(`    Email vendedor: ${p.vendedor_email || '❌ NÃO CONFIGURADO'}`);
      });
    }
    
    console.log('\n⚠️  ATENÇÃO:');
    console.log('Para que os emails sejam enviados, você precisa:');
    console.log('1. Configurar as variáveis EMAIL_USER, EMAIL_PASS e EMAIL_FROM no .env');
    console.log('2. Usar uma "senha de app" do Gmail (não a senha normal)');
    console.log('3. Criar senha de app em: https://myaccount.google.com/apppasswords');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testarEmail();
