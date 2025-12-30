const db = require('../src/config/db.mysql');

async function checkUsuario() {
  const connection = await db.getConnection();
  
  try {
    console.log('👤 Verificando usuário "Usuário Teste"...\n');
    
    const [usuarios] = await connection.query(
      `SELECT u.*, e.nome as equipe_nome 
       FROM usuarios u 
       LEFT JOIN equipes e ON u.equipe_id = e.id 
       WHERE u.nome LIKE "%Teste%"`
    );
    
    console.table(usuarios);
    
    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      console.log(`\n🏢 Equipe: ${usuario.equipe_nome} (ID: ${usuario.equipe_id})`);
      
      const [produtos] = await connection.query(
        `SELECT p.id, p.codprod, p.descricao, p.cont_oba, p.ativo
         FROM produtos p
         INNER JOIN equipe_produtos ep ON ep.produto_id = p.id
         WHERE ep.equipe_id = ? AND p.ativo = 1 AND p.cont_oba = 'S'`,
        [usuario.equipe_id]
      );
      
      console.log(`\n📦 Produtos disponíveis para esta equipe: ${produtos.length}`);
      if (produtos.length > 0) {
        console.table(produtos);
      } else {
        console.log('❌ Nenhum produto atribuído a esta equipe!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    connection.release();
    process.exit(0);
  }
}

checkUsuario();
