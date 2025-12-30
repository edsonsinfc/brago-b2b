require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function testPasswordRecovery() {
  try {
    console.log('🔍 TESTANDO SISTEMA DE RECUPERAÇÃO DE SENHA\n');
    
    // 1. Verificar tabela
    console.log('1️⃣ Verificando tabela password_reset_tokens...');
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'password_reset_tokens'"
    );
    
    if (tables.length === 0) {
      console.log('   ❌ Tabela não encontrada!');
      console.log('   Execute: node scripts/create_password_reset_table.js');
      process.exit(1);
    }
    console.log('   ✅ Tabela existe!\n');
    
    // 2. Verificar estrutura
    console.log('2️⃣ Estrutura da tabela:');
    const [columns] = await pool.execute(
      "DESCRIBE password_reset_tokens"
    );
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    console.log('');
    
    // 3. Verificar gestores com emails válidos
    console.log('3️⃣ Usuários que podem recuperar senha:\n');
    const [usuarios] = await pool.execute(`
      SELECT id, nome, email, perfil 
      FROM usuarios 
      WHERE perfil IN ('admin', 'gestor')
      ORDER BY id
    `);
    
    usuarios.forEach(u => {
      const emailValido = !u.email.includes('@local') && !u.email.includes('@teste');
      console.log(`   ${emailValido ? '✅' : '⚠️ '} ${u.nome}`);
      console.log(`      Email: ${u.email}`);
      console.log(`      Perfil: ${u.perfil}\n`);
    });
    
    // 4. Instruções
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 COMO TESTAR:\n');
    console.log('1. Acesse: http://localhost:3100/login.html');
    console.log('2. Clique em "Esqueci minha senha"');
    console.log('3. Digite um email válido (ex: gestor.brago@bragodistribuidora.com.br)');
    console.log('4. Verifique o email recebido');
    console.log('5. Clique no link de recuperação');
    console.log('6. Digite a nova senha\n');
    
    console.log('🔐 RECURSOS IMPLEMENTADOS:\n');
    console.log('✅ Página "Esqueci minha senha" (/forgot-password.html)');
    console.log('✅ Página de redefinição (/reset-password.html?token=...)');
    console.log('✅ API de solicitação (POST /api/password/forgot-password)');
    console.log('✅ API de validação (GET /api/password/validate-token/:token)');
    console.log('✅ API de redefinição (POST /api/password/reset-password)');
    console.log('✅ Emails automáticos com link de recuperação');
    console.log('✅ Token expira em 1 hora');
    console.log('✅ Token pode ser usado apenas 1 vez');
    console.log('✅ Senha mínima de 6 caracteres\n');
    
    console.log('⚡ PRÓXIMOS PASSOS:\n');
    console.log('1. Testar recuperação de senha');
    console.log('2. Verificar recebimento de emails');
    console.log('3. Em PRODUÇÃO: Configurar emails reais dos gestores\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testPasswordRecovery();
