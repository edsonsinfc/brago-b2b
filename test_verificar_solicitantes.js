const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nexus_b2b',
    charset: 'utf8mb4'
  });

  console.log('='.repeat(80));
  console.log('🔍 VERIFICAÇÃO DOS SOLICITANTES DE MANIPULAÇÃO');
  console.log('='.repeat(80));

  // IDs da imagem
  const ids = [12, 36, 44, 33, 32, 18, 42, 14, 50, 52, 38, 22, 16, 28, 29, 46, 47, 25, 24, 40, 20];

  const [usuarios] = await connection.execute(`
    SELECT u.id, u.nome, u.email, u.perfil, u.categoria_acesso, u.ativo
    FROM usuarios u
    WHERE u.id IN (${ids.join(',')})
    ORDER BY u.id
  `);

  console.log(`\n📊 Total encontrado: ${usuarios.length} de ${ids.length} IDs\n`);

  let problemasEncontrados = 0;

  for (const usuario of usuarios) {
    // Buscar equipes
    const [equipes] = await connection.execute(`
      SELECT e.id, e.nome
      FROM equipes e
      INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id
      WHERE ue.usuario_id = ?
      ORDER BY e.nome
    `, [usuario.id]);

    const statusIcon = usuario.ativo ? '✅' : '❌';
    const perfilIcon = usuario.perfil === 'solicitante' ? '👤' : '⚠️';
    const categoriaIcon = usuario.categoria_acesso === 'manipulacao' ? '💊' : 
                          usuario.categoria_acesso === 'ambas' ? '🔄' :
                          usuario.categoria_acesso === 'facility' ? '📦' : '❓';

    console.log(`${statusIcon} ${perfilIcon} [ID ${usuario.id}] ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Perfil: ${usuario.perfil} | Categoria: ${categoriaIcon} ${usuario.categoria_acesso || 'NENHUMA'}`);
    console.log(`   Ativo: ${usuario.ativo ? 'Sim' : 'NÃO'}`);
    console.log(`   Equipes (${equipes.length}): ${equipes.map(e => e.nome).join(', ') || 'NENHUMA'}`);

    // Verificar problemas
    if (usuario.perfil !== 'solicitante') {
      console.log(`   ⚠️  PROBLEMA: Perfil deveria ser 'solicitante', mas é '${usuario.perfil}'`);
      problemasEncontrados++;
    }

    if (usuario.categoria_acesso !== 'manipulacao' && usuario.categoria_acesso !== 'ambas') {
      console.log(`   ⚠️  PROBLEMA: Categoria deveria ser 'manipulacao' ou 'ambas', mas é '${usuario.categoria_acesso || 'NULL'}'`);
      problemasEncontrados++;
    }

    if (!usuario.ativo) {
      console.log(`   ⚠️  AVISO: Usuário está INATIVO`);
    }

    if (equipes.length === 0) {
      console.log(`   ⚠️  PROBLEMA: Usuário SEM EQUIPE atribuída`);
      problemasEncontrados++;
    }

    if (equipes.length > 1) {
      console.log(`   ℹ️  INFO: Usuário faz parte de ${equipes.length} equipes`);
    }

    console.log('');
  }

  // Verificar IDs não encontrados
  const idsEncontrados = usuarios.map(u => u.id);
  const idsNaoEncontrados = ids.filter(id => !idsEncontrados.includes(id));

  if (idsNaoEncontrados.length > 0) {
    console.log('❌ IDs NÃO ENCONTRADOS no banco de dados:');
    idsNaoEncontrados.forEach(id => console.log(`   - ID ${id}`));
    console.log('');
  }

  // Resumo
  console.log('='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`Total de usuários verificados: ${usuarios.length}`);
  console.log(`Usuários ativos: ${usuarios.filter(u => u.ativo).length}`);
  console.log(`Usuários inativos: ${usuarios.filter(u => !u.ativo).length}`);
  console.log(`Categoria 'manipulacao': ${usuarios.filter(u => u.categoria_acesso === 'manipulacao').length}`);
  console.log(`Categoria 'ambas': ${usuarios.filter(u => u.categoria_acesso === 'ambas').length}`);
  console.log(`Categoria 'facility': ${usuarios.filter(u => u.categoria_acesso === 'facility').length}`);
  console.log(`Sem categoria: ${usuarios.filter(u => !u.categoria_acesso).length}`);
  console.log(`Problemas encontrados: ${problemasEncontrados}`);

  // Verificar distribuição por equipe
  console.log('\n📊 DISTRIBUIÇÃO POR EQUIPE:');
  const [distribuicao] = await connection.execute(`
    SELECT e.nome, COUNT(DISTINCT ue.usuario_id) as total
    FROM equipes e
    LEFT JOIN usuarios_equipes ue ON ue.equipe_id = e.id
    LEFT JOIN usuarios u ON u.id = ue.usuario_id
    WHERE u.id IN (${ids.join(',')})
    GROUP BY e.id, e.nome
    ORDER BY total DESC, e.nome
  `);

  distribuicao.forEach(d => {
    console.log(`   ${d.nome}: ${d.total} solicitante(s)`);
  });

  await connection.end();
}

test().catch(console.error);
