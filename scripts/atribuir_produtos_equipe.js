const mysql = require('mysql2/promise');

async function atribuirProdutos() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    // Buscar equipe do Edson
    const [users] = await conn.query('SELECT equipe_id, nome FROM usuarios WHERE nome = ?', ['Edson']);
    
    if (users.length === 0) {
      console.log('❌ Usuário Edson não encontrado');
      return;
    }

    const equipeId = users[0].equipe_id;
    console.log('👤 Usuário:', users[0].nome);
    console.log('🏢 Equipe ID:', equipeId);

    if (!equipeId) {
      console.log('❌ Usuário não tem equipe atribuída');
      return;
    }

    // Buscar produtos ativos
    const [produtos] = await conn.query('SELECT id, codprod, descricao FROM produtos WHERE ativo = 1 LIMIT 10');
    console.log(`\n📦 Atribuindo ${produtos.length} produtos à equipe ${equipeId}...\n`);

    for (const produto of produtos) {
      await conn.query(
        'INSERT IGNORE INTO equipe_produtos (equipe_id, produto_id, atribuido_por) VALUES (?, ?, 1)',
        [equipeId, produto.id]
      );
      console.log(`✅ ${produto.codprod} - ${produto.descricao}`);
    }

    console.log(`\n✨ ${produtos.length} produtos atribuídos com sucesso!`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await conn.end();
  }
}

atribuirProdutos();
