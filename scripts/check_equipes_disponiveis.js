// Script para verificar a estrutura da tabela equipes
const mysql = require('mysql2/promise');

async function checkEquipes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('\n🔍 VERIFICANDO EQUIPES NO BANCO DE DADOS...\n');
    
    // Verificar estrutura da tabela primeiro
    const [columns] = await connection.execute(`
      DESCRIBE equipes
    `);
    
    console.log('📊 ESTRUTURA DA TABELA EQUIPES:');
    console.log('─'.repeat(80));
    const columnNames = [];
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(Obrigatório)' : '(Opcional)'}`);
      columnNames.push(col.Field);
    });
    console.log('');
    
    // Buscar todas as equipes
    const [equipes] = await connection.execute(`
      SELECT *
      FROM equipes
      ORDER BY nome
    `);

    console.log('📋 TOTAL DE EQUIPES:', equipes.length);
    console.log('─'.repeat(80));
    
    if (equipes.length === 0) {
      console.log('❌ NENHUMA EQUIPE ENCONTRADA!');
      console.log('\n💡 Isso explica por que não há equipes para selecionar no formulário.');
    } else {
      console.log('\n✅ EQUIPES DISPONÍVEIS:\n');
      equipes.forEach((equipe, index) => {
        console.log(`${index + 1}. ID: ${equipe.id} - ${equipe.nome}`);
        if (equipe.codigo_erp) console.log(`   Código ERP: ${equipe.codigo_erp}`);
        if (equipe.cgc) console.log(`   CGC: ${equipe.cgc}`);
        if (equipe.limite_credito) console.log(`   Limite: R$ ${parseFloat(equipe.limite_credito).toFixed(2)}`);
        if (equipe.status) console.log(`   Status: ${equipe.status}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkEquipes();
