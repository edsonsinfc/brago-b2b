require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function checkEmailInDatabase() {
  try {
    console.log('🔍 VERIFICANDO EMAIL NO BANCO DE DADOS\n');
    
    const emailTeste = 'edson.silva@bragodistribuidora.com.br';
    
    // 1. Verificar se email existe em usuarios
    const [usuarios] = await pool.execute(
      'SELECT id, nome, email, perfil FROM usuarios WHERE email = ?',
      [emailTeste]
    );
    
    console.log(`1️⃣ Buscando: ${emailTeste}\n`);
    
    if (usuarios.length > 0) {
      console.log('✅ EMAIL ENCONTRADO NA TABELA USUARIOS:\n');
      usuarios.forEach(u => {
        console.log(`   ID: ${u.id}`);
        console.log(`   Nome: ${u.nome}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Perfil: ${u.perfil}\n`);
      });
    } else {
      console.log('❌ EMAIL NÃO ENCONTRADO NA TABELA USUARIOS!\n');
      console.log('💡 O email precisa estar cadastrado como usuário para recuperar senha.\n');
    }
    
    // 2. Verificar tokens de recuperação gerados
    console.log('2️⃣ TOKENS DE RECUPERAÇÃO GERADOS (últimos 5):\n');
    const [tokens] = await pool.execute(`
      SELECT 
        prt.id,
        prt.token,
        prt.expires_at,
        prt.usado,
        prt.created_at,
        u.email,
        u.nome
      FROM password_reset_tokens prt
      JOIN usuarios u ON u.id = prt.usuario_id
      ORDER BY prt.created_at DESC
      LIMIT 5
    `);
    
    if (tokens.length > 0) {
      tokens.forEach(t => {
        const expirado = new Date(t.expires_at) < new Date();
        console.log(`   Token ID: ${t.id}`);
        console.log(`   Email: ${t.email}`);
        console.log(`   Nome: ${t.nome}`);
        console.log(`   Token: ${t.token.substring(0, 20)}...`);
        console.log(`   Criado: ${new Date(t.created_at).toLocaleString('pt-BR')}`);
        console.log(`   Expira: ${new Date(t.expires_at).toLocaleString('pt-BR')}`);
        console.log(`   Status: ${t.usado ? '❌ Usado' : expirado ? '⏰ Expirado' : '✅ Válido'}\n`);
      });
    } else {
      console.log('   ℹ️  Nenhum token gerado ainda.\n');
    }
    
    // 3. Verificar último token para o email
    const [ultimoToken] = await pool.execute(`
      SELECT 
        prt.*,
        u.email,
        u.nome
      FROM password_reset_tokens prt
      JOIN usuarios u ON u.id = prt.usuario_id
      WHERE u.email = ?
      ORDER BY prt.created_at DESC
      LIMIT 1
    `, [emailTeste]);
    
    if (ultimoToken.length > 0) {
      const t = ultimoToken[0];
      const expirado = new Date(t.expires_at) < new Date();
      
      console.log('3️⃣ ÚLTIMO TOKEN PARA ESTE EMAIL:\n');
      console.log(`   Link: http://localhost:3100/reset-password.html?token=${t.token}`);
      console.log(`   Criado: ${new Date(t.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Expira: ${new Date(t.expires_at).toLocaleString('pt-BR')}`);
      console.log(`   Status: ${t.usado ? '❌ Usado' : expirado ? '⏰ Expirado' : '✅ Válido'}\n`);
      
      if (!t.usado && !expirado) {
        console.log('🎯 VOCÊ PODE USAR ESTE LINK AGORA!\n');
      }
    } else {
      console.log('3️⃣ Nenhum token gerado para este email ainda.\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkEmailInDatabase();
