const mysql = require('mysql2/promise');
const fs = require('fs');

async function exportarUsuarios() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b'
  });

  try {
    console.log('🔍 Buscando usuários gestores e solicitantes...\n');
    
    // Buscar usuários
    const [usuarios] = await conn.execute(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.perfil,
        u.ativo,
        u.created_at,
        GROUP_CONCAT(e.nome SEPARATOR ', ') as equipes
      FROM usuarios u
      LEFT JOIN usuarios_equipes ue ON u.id = ue.usuario_id
      LEFT JOIN equipes e ON ue.equipe_id = e.id
      WHERE u.perfil IN ('gestor', 'solicitante')
      GROUP BY u.id
      ORDER BY u.perfil, u.nome
    `);

    console.log(`📊 Total de usuários: ${usuarios.length}\n`);

    // Criar CSV
    let csv = 'ID,Nome,Email,Perfil,Ativo,Equipes,Data Criação,Senha Padrão Sugerida\n';
    
    usuarios.forEach(user => {
      const ativo = user.ativo ? 'Sim' : 'Não';
      const equipes = user.equipes || 'Nenhuma';
      const dataCriacao = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '';
      const senhapadrao = 'brago@2025'; // Sugestão de senha padrão
      
      csv += `${user.id},"${user.nome}","${user.email}",${user.perfil},${ativo},"${equipes}",${dataCriacao},${senhapadrao}\n`;
    });

    // Salvar arquivo
    const filename = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csv, 'utf8');
    
    console.log(`✅ Arquivo gerado: ${filename}\n`);

    // Mostrar tabela no console
    console.log('┌─────┬─────────────────────────┬──────────────────────────┬────────────┬───────┬──────────────────────────────────┐');
    console.log('│ ID  │ Nome                    │ Email                    │ Perfil     │ Ativo │ Equipes                          │');
    console.log('├─────┼─────────────────────────┼──────────────────────────┼────────────┼───────┼──────────────────────────────────┤');
    
    usuarios.forEach(user => {
      const id = String(user.id).padEnd(3);
      const nome = String(user.nome || '').substring(0, 23).padEnd(23);
      const email = String(user.email || '').substring(0, 24).padEnd(24);
      const perfil = String(user.perfil).padEnd(10);
      const ativo = user.ativo ? ' Sim ' : ' Não ';
      const equipes = String(user.equipes || 'Nenhuma').substring(0, 32).padEnd(32);
      
      console.log(`│ ${id} │ ${nome} │ ${email} │ ${perfil} │ ${ativo} │ ${equipes} │`);
    });
    
    console.log('└─────┴─────────────────────────┴──────────────────────────┴────────────┴───────┴──────────────────────────────────┘');
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • As senhas estão criptografadas (bcrypt) no banco de dados');
    console.log('   • Não é possível recuperar as senhas originais');
    console.log('   • Sugestão: Use "brago@2025" como senha padrão ao resetar');
    console.log('   • Para resetar senha de um usuário, use o endpoint de recuperação de senha');
    
    // Estatísticas
    const gestores = usuarios.filter(u => u.perfil === 'gestor').length;
    const solicitantes = usuarios.filter(u => u.perfil === 'solicitante').length;
    const ativos = usuarios.filter(u => u.ativo).length;
    
    console.log('\n📈 Estatísticas:');
    console.log(`   • Gestores: ${gestores}`);
    console.log(`   • Solicitantes: ${solicitantes}`);
    console.log(`   • Ativos: ${ativos}`);
    console.log(`   • Inativos: ${usuarios.length - ativos}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await conn.end();
  }
}

exportarUsuarios();
