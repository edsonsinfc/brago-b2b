const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nexus_b2b',
  waitForConnections: true,
  connectionLimit: 10
});

async function criarPedidoTeste() {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Buscar equipe Oba Aguas Claras
    const [[equipe]] = await conn.execute(`
      SELECT id, nome, limite_disponivel, limite_credito
      FROM equipes
      WHERE nome LIKE '%Aguas Claras%'
      LIMIT 1
    `);
    
    if (!equipe) {
      console.log('❌ Equipe não encontrada');
      return;
    }
    
    console.log('\n📊 Equipe Selecionada:');
    console.log(`   Nome: ${equipe.nome}`);
    console.log(`   Limite Total: R$ ${Number(equipe.limite_credito).toFixed(2)}`);
    console.log(`   Limite Disponível: R$ ${Number(equipe.limite_disponivel).toFixed(2)}`);
    
    // Criar pedido com valor ALTO (acima do limite disponível)
    const valorPedido = Number(equipe.limite_disponivel) + 500; // R$ 500 acima do limite
    
    console.log(`\n💰 Valor do Pedido Teste: R$ ${valorPedido.toFixed(2)}`);
    console.log(`   (R$ 500,00 acima do limite disponível)`);
    
    // Inserir pedido
    const [result] = await conn.execute(`
      INSERT INTO pedidos (
        equipe_id, 
        valor_total, 
        status, 
        motivo_pendencia
      ) VALUES (?, ?, 'PENDENTE_APROVACAO', 'Limite de crédito insuficiente - Aguardando aprovação do gestor')
    `, [equipe.id, valorPedido]);
    
    const pedidoId = result.insertId;
    
    // Buscar alguns produtos para adicionar itens
    const [produtos] = await conn.execute(`
      SELECT id, descricao as nome, preco
      FROM produtos
      WHERE ativo = 1
      LIMIT 3
    `);
    
    // Adicionar itens ao pedido
    let valorItens = 0;
    for (const produto of produtos) {
      const quantidade = Math.floor(Math.random() * 50) + 10; // 10-60 unidades
      const subtotal = Number(produto.preco) * quantidade;
      valorItens += subtotal;
      
      await conn.execute(`
        INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [pedidoId, produto.id, quantidade, produto.preco, subtotal]);
      
      console.log(`   ✅ ${produto.nome}: ${quantidade} un x R$ ${Number(produto.preco).toFixed(2)} = R$ ${subtotal.toFixed(2)}`);
    }
    
    // Atualizar valor total do pedido
    await conn.execute(`
      UPDATE pedidos
      SET valor_total = ?
      WHERE id = ?
    `, [valorItens, pedidoId]);
    
    await conn.commit();
    
    console.log(`\n✅ Pedido #${pedidoId} criado com sucesso!`);
    console.log(`   Status: PENDENTE_APROVACAO`);
    console.log(`   Valor Real: R$ ${valorItens.toFixed(2)}`);
    console.log(`   Motivo: Limite insuficiente`);
    console.log('\n🎯 Agora você pode testar a aprovação deste pedido no dashboard do gestor!\n');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Erro:', error);
  } finally {
    conn.release();
    await pool.end();
  }
}

criarPedidoTeste();
