const pool = require('../src/config/db.mysql');

async function fixCorruptedData() {
  const conn = await pool.getConnection();
  
  try {
    console.log('🔧 Corrigindo dados corrompidos...');
    
    // Buscar todos os usuários
    const [users] = await conn.query('SELECT id, nome, email FROM usuarios');
    
    for (const user of users) {
      // Converter de Latin1 para UTF-8
      const nomeFixed = Buffer.from(user.nome, 'latin1').toString('utf8');
      const emailFixed = Buffer.from(user.email, 'latin1').toString('utf8');
      
      if (nomeFixed !== user.nome || emailFixed !== user.email) {
        await conn.query('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [nomeFixed, emailFixed, user.id]);
        console.log(`✅ Corrigido: ${user.nome} → ${nomeFixed}`);
      }
    }
    
    // Buscar todas as equipes
    const [equipes] = await conn.query('SELECT id, nome FROM equipes');
    
    for (const equipe of equipes) {
      const nomeFixed = Buffer.from(equipe.nome, 'latin1').toString('utf8');
      
      if (nomeFixed !== equipe.nome) {
        await conn.query('UPDATE equipes SET nome = ? WHERE id = ?', [nomeFixed, equipe.id]);
        console.log(`✅ Equipe corrigida: ${equipe.nome} → ${nomeFixed}`);
      }
    }
    
    console.log('🎉 Dados corrigidos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    conn.release();
    process.exit();
  }
}

fixCorruptedData();
