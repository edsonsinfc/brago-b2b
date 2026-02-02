const mysql = require('mysql2/promise');

async function verificarInconsistencias() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  console.log('📋 VERIFICAÇÃO DE INCONSISTÊNCIAS NOS SALDOS\n');
  console.log('='.repeat(80));

  // Buscar todas as equipes
  const [equipes] = await conn.query(`
    SELECT id, nome, limite_mensal, limite_disponivel, limite_credito, limite_total, saldo_atual
    FROM equipes 
    ORDER BY nome
  `);

  console.log('\n📊 SITUAÇÃO ATUAL DAS EQUIPES:\n');
  console.log('-'.repeat(100));
  console.log('Equipe'.padEnd(25) + 
              'L.Mensal'.padStart(12) + 
              'L.Disponível'.padStart(14) + 
              'L.Credito'.padStart(12) + 
              'Observação'.padStart(30));
  console.log('-'.repeat(100));

  let equipesComProblema = [];

  for (const eq of equipes) {
    const limiteMensal = parseFloat(eq.limite_mensal) || 0;
    const limiteDisponivel = parseFloat(eq.limite_disponivel) || 0;
    const limiteCredito = parseFloat(eq.limite_credito) || 0;
    
    let obs = '✅ OK';
    
    // Verificar se limite_mensal está definido mas limite_disponivel está diferente (sem pedidos aprovados)
    // Buscar total de pedidos aprovados desta equipe
    const [pedidosAprovados] = await conn.query(`
      SELECT COALESCE(SUM(valor_total), 0) as total
      FROM pedidos 
      WHERE equipe_id = ? AND status = 'APROVADO'
    `, [eq.id]);
    
    const consumido = parseFloat(pedidosAprovados[0].total) || 0;
    const esperado = limiteMensal - consumido;
    
    if (limiteMensal === 0 && limiteDisponivel !== 0) {
      obs = '⚠️ L.Mensal=0 mas Disponível diferente';
      equipesComProblema.push({
        ...eq,
        problema: obs,
        sugestao: `Definir limite_mensal ou resetar limite_disponivel para 0`
      });
    } else if (limiteMensal > 0 && Math.abs(limiteDisponivel - esperado) > 0.01) {
      obs = `⚠️ Deveria ser ${esperado.toFixed(2)}`;
      equipesComProblema.push({
        ...eq,
        problema: obs,
        sugestao: `Corrigir limite_disponivel para ${esperado.toFixed(2)} (Mensal - Consumido)`
      });
    }

    console.log(
      eq.nome.substring(0, 24).padEnd(25) +
      limiteMensal.toFixed(2).padStart(12) +
      limiteDisponivel.toFixed(2).padStart(14) +
      limiteCredito.toFixed(2).padStart(12) +
      obs.padStart(30)
    );
  }

  console.log('-'.repeat(100));

  if (equipesComProblema.length > 0) {
    console.log('\n\n⚠️  EQUIPES COM PROBLEMAS:\n');
    
    for (const eq of equipesComProblema) {
      console.log(`📌 ${eq.nome} (ID: ${eq.id})`);
      console.log(`   Problema: ${eq.problema}`);
      console.log(`   Sugestão: ${eq.sugestao}`);
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('\n💡 OPÇÕES DE CORREÇÃO:');
    console.log('\n1. Se vocês DEFINIRAM limite_mensal corretamente:');
    console.log('   → O limite_disponivel deveria ser igual ao limite_mensal (se não há pedidos aprovados)');
    console.log('   → Execute: node scripts/sincronizar_limites.js');
    console.log('\n2. Se os valores de limite_disponivel estão corretos e limite_mensal está errado:');
    console.log('   → Atualizem o limite_mensal nas configurações de cada equipe');
    console.log('\n3. Se os limites ainda não foram configurados (limite_mensal = 0):');
    console.log('   → Configurem o limite_mensal de cada equipe na tela de gestão');
  } else {
    console.log('\n\n✅ TODAS AS EQUIPES ESTÃO CONSISTENTES!');
  }

  console.log('\n' + '='.repeat(80));

  await conn.end();
}

verificarInconsistencias().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
