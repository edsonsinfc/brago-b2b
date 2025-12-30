const mysql = require('mysql2/promise');

async function runMigration() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nexus_b2b',
    multipleStatements: true
  });
  
  try {
    console.log('🚀 Iniciando migration: Adicionar perfil GESTOR...\n');
    
    // Ler arquivo SQL
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'sql', '20251107_add_gestor_perfil.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar migration
    await conn.query(sql);
    console.log('✅ Migration executada com sucesso!\n');
    
    // Verificar resultados
    const [usuarios] = await conn.execute('SELECT id, nome, email, perfil FROM usuarios ORDER BY id');
    
    console.log('📊 Usuários cadastrados:');
    console.log(''.padEnd(80, '='));
    usuarios.forEach(u => {
      console.log(`ID: ${u.id} | ${u.nome.padEnd(25)} | ${u.email.padEnd(30)} | Perfil: ${u.perfil}`);
    });
    console.log(''.padEnd(80, '='));
    
    console.log('\n✅ Perfis disponíveis agora:');
    console.log('   - admin: Acesso total (pedidos, equipes, usuários, produtos)');
    console.log('   - gestor: Acesso comercial (pedidos, equipes, usuários - SEM produtos)');
    console.log('   - equipe: Acesso limitado (criar pedidos, ver próprios pedidos)');
    
  } catch (error) {
    console.error('❌ Erro na migration:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

runMigration().catch(console.error);
