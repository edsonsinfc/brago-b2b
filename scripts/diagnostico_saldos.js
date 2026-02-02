const mysql = require('mysql2/promise');

async function diagnosticarSaldos() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  console.log('📋 DIAGNÓSTICO DE SALDOS DAS EQUIPES\n');
  console.log('='.repeat(80));

  // 1. Verificar pedidos aprovados
  console.log('\n📦 PEDIDOS APROVADOS (que consumiriam saldo):');
  const [pedidosAprovados] = await conn.query(`
    SELECT p.id, p.status, p.valor_total, e.nome as equipe 
    FROM pedidos p 
    LEFT JOIN equipes e ON p.equipe_id = e.id 
    WHERE p.status = 'APROVADO' 
    ORDER BY p.created_at DESC
  `);
  
  if (pedidosAprovados.length === 0) {
    console.log('   ✅ Nenhum pedido APROVADO - não deveria haver consumo de saldo!\n');
  } else {
    console.table(pedidosAprovados);
  }

  // 2. Resumo de status
  console.log('\n📊 RESUMO DE STATUS DOS PEDIDOS:');
  const [statusPedidos] = await conn.query(`
    SELECT status, COUNT(*) as qtd, SUM(valor_total) as valor_total 
    FROM pedidos 
    GROUP BY status
  `);
  console.table(statusPedidos);

  // 3. Analisar cada equipe
  console.log('\n🏢 ANÁLISE POR EQUIPE:');
  console.log('-'.repeat(80));

  const [equipes] = await conn.query(`
    SELECT id, nome, limite_mensal, limite_disponivel 
    FROM equipes 
    ORDER BY nome
  `);

  for (const equipe of equipes) {
    // Calcular consumo real (pedidos aprovados)
    const [consumo] = await conn.query(`
      SELECT COALESCE(SUM(valor_total), 0) as consumido
      FROM pedidos 
      WHERE equipe_id = ? AND status = 'APROVADO'
    `, [equipe.id]);

    const consumidoReal = parseFloat(consumo[0].consumido) || 0;
    const limiteMensal = parseFloat(equipe.limite_mensal) || 0;
    const limiteDisponivel = parseFloat(equipe.limite_disponivel) || 0;
    const limiteEsperado = limiteMensal - consumidoReal;

    const diferenca = limiteDisponivel - limiteEsperado;
    const temProblema = Math.abs(diferenca) > 0.01;

    if (temProblema) {
      console.log(`\n⚠️  ${equipe.nome} (ID: ${equipe.id})`);
      console.log(`   Limite Mensal: R$ ${limiteMensal.toFixed(2)}`);
      console.log(`   Consumido (pedidos aprovados): R$ ${consumidoReal.toFixed(2)}`);
      console.log(`   Limite Disponível ESPERADO: R$ ${limiteEsperado.toFixed(2)}`);
      console.log(`   Limite Disponível ATUAL: R$ ${limiteDisponivel.toFixed(2)}`);
      console.log(`   ❌ DIFERENÇA: R$ ${diferenca.toFixed(2)}`);
    } else {
      console.log(`✅ ${equipe.nome} - OK (Limite: R$ ${limiteMensal.toFixed(2)}, Disponível: R$ ${limiteDisponivel.toFixed(2)})`);
    }
  }

  // 4. Verificar se limite_disponivel foi definido diferente do limite_mensal
  console.log('\n\n📌 EQUIPES COM LIMITE_DISPONIVEL DIFERENTE DO LIMITE_MENSAL:');
  console.log('   (Isso pode indicar problema ou pode ser intencional)');
  
  for (const equipe of equipes) {
    const limiteMensal = parseFloat(equipe.limite_mensal) || 0;
    const limiteDisponivel = parseFloat(equipe.limite_disponivel) || 0;
    
    if (limiteMensal !== limiteDisponivel) {
      console.log(`   - ${equipe.nome}: Mensal=R$ ${limiteMensal.toFixed(2)}, Disponível=R$ ${limiteDisponivel.toFixed(2)}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 CONCLUSÃO:');
  console.log('   Se não há pedidos APROVADOS, o limite_disponivel deveria ser igual ao limite_mensal.');
  console.log('   Se estiver diferente, pode haver um bug no código que atualiza o saldo.');
  console.log('='.repeat(80));

  await conn.end();
}

diagnosticarSaldos().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
