const mysql = require('mysql2/promise');

async function corrigirSaldosEquipes() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  console.log('🔧 CORREÇÃO DE SALDOS DAS EQUIPES\n');
  console.log('='.repeat(80));

  // 1. Mostrar situação atual
  console.log('\n📊 SITUAÇÃO ATUAL:\n');
  const [equipes] = await conn.query(`
    SELECT id, nome, limite_mensal, limite_disponivel, 
           (limite_mensal - limite_disponivel) as utilizado
    FROM equipes 
    ORDER BY nome
  `);
  console.table(equipes.map(e => ({
    id: e.id,
    nome: e.nome,
    limite_mensal: parseFloat(e.limite_mensal),
    limite_disponivel: parseFloat(e.limite_disponivel),
    utilizado: parseFloat(e.utilizado)
  })));

  // 2. Verificar pedidos aprovados por equipe
  console.log('\n📦 PEDIDOS APROVADOS POR EQUIPE:\n');
  const [pedidosAprovados] = await conn.query(`
    SELECT p.equipe_id, e.nome, 
           COUNT(*) as qtd_pedidos, 
           COALESCE(SUM(p.valor_total), 0) as total_aprovado
    FROM pedidos p
    JOIN equipes e ON p.equipe_id = e.id
    WHERE p.status = 'APROVADO'
    GROUP BY p.equipe_id, e.nome
  `);
  
  if (pedidosAprovados.length === 0) {
    console.log('   ✅ Nenhum pedido APROVADO encontrado');
  } else {
    console.table(pedidosAprovados);
  }

  // 3. Calcular o saldo correto para cada equipe
  console.log('\n🔄 CORRIGINDO SALDOS...\n');
  
  for (const equipe of equipes) {
    // Buscar total de pedidos aprovados desta equipe
    const [aprovados] = await conn.query(`
      SELECT COALESCE(SUM(valor_total), 0) as total
      FROM pedidos
      WHERE equipe_id = ? AND status = 'APROVADO'
    `, [equipe.id]);
    
    const totalAprovado = parseFloat(aprovados[0].total) || 0;
    const limiteMenusal = parseFloat(equipe.limite_mensal) || 0;
    const limiteDisponvelCorreto = limiteMenusal - totalAprovado;
    const limiteAtual = parseFloat(equipe.limite_disponivel) || 0;
    
    if (Math.abs(limiteAtual - limiteDisponvelCorreto) > 0.01) {
      console.log(`⚠️  ${equipe.nome}:`);
      console.log(`   Limite Mensal: R$ ${limiteMenusal.toFixed(2)}`);
      console.log(`   Total Aprovado: R$ ${totalAprovado.toFixed(2)}`);
      console.log(`   Limite Disponível Atual: R$ ${limiteAtual.toFixed(2)} (INCORRETO)`);
      console.log(`   Limite Disponível Correto: R$ ${limiteDisponvelCorreto.toFixed(2)}`);
      
      // Corrigir
      await conn.execute(`
        UPDATE equipes 
        SET limite_disponivel = ?
        WHERE id = ?
      `, [limiteDisponvelCorreto, equipe.id]);
      
      console.log(`   ✅ CORRIGIDO!\n`);
    }
  }

  // 4. Mostrar situação após correção
  console.log('\n📊 SITUAÇÃO APÓS CORREÇÃO:\n');
  const [equipesCorrigidas] = await conn.query(`
    SELECT id, nome, limite_mensal, limite_disponivel
    FROM equipes 
    ORDER BY nome
  `);
  console.table(equipesCorrigidas.map(e => ({
    id: e.id,
    nome: e.nome,
    limite_mensal: parseFloat(e.limite_mensal),
    limite_disponivel: parseFloat(e.limite_disponivel)
  })));

  console.log('='.repeat(80));
  console.log('✅ Correção concluída!\n');

  await conn.end();
}

corrigirSaldosEquipes().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
