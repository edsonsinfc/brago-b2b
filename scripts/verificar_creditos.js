const mysql = require('mysql2/promise');

async function verificarCreditos() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔍 Verificando status dos créditos...\n');
    
    // 1. Contar pedidos
    const [countPedidos] = await conn.execute('SELECT COUNT(*) as total FROM pedidos');
    console.log(`📊 Total de pedidos: ${countPedidos[0].total}\n`);
    
    // 2. Ver equipes e seus limites
    const [equipes] = await conn.execute(`
      SELECT 
        id, 
        nome, 
        limite_credito,
        limite_disponivel,
        (limite_credito - limite_disponivel) as credito_usado
      FROM equipes 
      ORDER BY nome
    `);
    
    console.log('📋 Status das Equipes:');
    console.log('┌─────┬──────────────────────────────────┬─────────────┬──────────────┬──────────────┐');
    console.log('│ ID  │ Nome                             │ Lim. Total  │ Disponível   │ Usado        │');
    console.log('├─────┼──────────────────────────────────┼─────────────┼──────────────┼──────────────┤');
    
    equipes.forEach(equipe => {
      const id = String(equipe.id).padEnd(3);
      const nome = String(equipe.nome || '').substring(0, 32).padEnd(32);
      const limiteTotal = `R$ ${parseFloat(equipe.limite_credito || 0).toFixed(2)}`.padStart(11);
      const disponivel = `R$ ${parseFloat(equipe.limite_disponivel || 0).toFixed(2)}`.padStart(12);
      const usado = `R$ ${parseFloat(equipe.credito_usado || 0).toFixed(2)}`.padStart(12);
      console.log(`│ ${id} │ ${nome} │ ${limiteTotal} │ ${disponivel} │ ${usado} │`);
    });
    
    console.log('└─────┴──────────────────────────────────┴─────────────┴──────────────┴──────────────┘\n');
    
    // 3. Ver estrutura da tabela equipes
    const [columns] = await conn.execute('DESCRIBE equipes');
    console.log('📐 Estrutura da tabela equipes:');
    columns.forEach(col => {
      console.log(`   • ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `(default: ${col.Default})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

verificarCreditos();
