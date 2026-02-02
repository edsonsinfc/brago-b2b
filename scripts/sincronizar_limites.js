const mysql = require('mysql2/promise');

async function sincronizarLimites() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  console.log('🔧 SINCRONIZAÇÃO DE LIMITES\n');
  console.log('='.repeat(80));
  console.log('Este script vai:');
  console.log('1. Copiar limite_credito para limite_mensal (preservando o valor definido pelo gestor)');
  console.log('2. Recalcular limite_disponivel = limite_mensal - pedidos aprovados');
  console.log('='.repeat(80));

  // Buscar equipes
  const [equipes] = await conn.query(`
    SELECT id, nome, limite_credito, limite_mensal, limite_disponivel
    FROM equipes ORDER BY nome
  `);

  console.log('\n📊 SITUAÇÃO ATUAL:\n');
  console.table(equipes.map(e => ({
    nome: e.nome,
    limite_credito: parseFloat(e.limite_credito),
    limite_mensal: parseFloat(e.limite_mensal),
    limite_disponivel: parseFloat(e.limite_disponivel)
  })));

  console.log('\n🔄 PROCESSANDO CORREÇÕES...\n');

  for (const eq of equipes) {
    const limiteCredito = parseFloat(eq.limite_credito) || 0;
    
    // Buscar total de pedidos aprovados
    const [pedidos] = await conn.query(`
      SELECT COALESCE(SUM(valor_total), 0) as consumido
      FROM pedidos 
      WHERE equipe_id = ? AND status = 'APROVADO'
    `, [eq.id]);
    
    const consumido = parseFloat(pedidos[0].consumido) || 0;
    const novoLimiteDisponivel = limiteCredito - consumido;

    console.log(`📌 ${eq.nome}:`);
    console.log(`   Limite Credito (valor definido): R$ ${limiteCredito.toFixed(2)}`);
    console.log(`   Consumido (pedidos aprovados): R$ ${consumido.toFixed(2)}`);
    console.log(`   Novo Limite Disponível: R$ ${novoLimiteDisponivel.toFixed(2)}`);

    // Atualizar
    await conn.execute(`
      UPDATE equipes 
      SET limite_mensal = ?,
          limite_disponivel = ?
      WHERE id = ?
    `, [limiteCredito, novoLimiteDisponivel, eq.id]);

    console.log(`   ✅ Atualizado!\n`);
  }

  // Mostrar resultado
  console.log('\n📊 SITUAÇÃO APÓS CORREÇÃO:\n');
  const [equipesCorrigidas] = await conn.query(`
    SELECT id, nome, limite_credito, limite_mensal, limite_disponivel
    FROM equipes ORDER BY nome
  `);
  console.table(equipesCorrigidas.map(e => ({
    nome: e.nome,
    limite_credito: parseFloat(e.limite_credito),
    limite_mensal: parseFloat(e.limite_mensal),
    limite_disponivel: parseFloat(e.limite_disponivel)
  })));

  console.log('='.repeat(80));
  console.log('✅ Sincronização concluída!\n');
  console.log('Agora limite_mensal = limite_credito e limite_disponivel está correto.');
  console.log('='.repeat(80));

  await conn.end();
}

sincronizarLimites().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
