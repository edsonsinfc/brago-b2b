require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function updateTerminology() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    console.log('🔄 Atualizando terminologia do sistema...\n');
    
    // 1. Atualizar perfil de 'equipe' para 'solicitante'
    console.log('1️⃣ Atualizando perfis de usuários...');
    const [result1] = await conn.execute(
      "UPDATE usuarios SET perfil = 'solicitante' WHERE perfil = 'equipe'"
    );
    console.log(`   ✅ ${result1.affectedRows} usuários atualizados de 'equipe' para 'solicitante'\n`);
    
    // 2. Adicionar campo categoria aos produtos
    console.log('2️⃣ Adicionando campo categoria aos produtos...');
    try {
      await conn.execute(`
        ALTER TABLE produtos 
        ADD COLUMN IF NOT EXISTS categoria_facility BOOLEAN DEFAULT FALSE AFTER ativo,
        ADD COLUMN IF NOT EXISTS categoria_manipulacao BOOLEAN DEFAULT FALSE AFTER categoria_facility
      `);
      console.log('   ✅ Campos de categoria adicionados aos produtos\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️  Campos de categoria já existem\n');
      } else throw e;
    }
    
    // 3. Adicionar campo categoria aos usuários solicitantes
    console.log('3️⃣ Adicionando campo categoria aos usuários...');
    try {
      await conn.execute(`
        ALTER TABLE usuarios 
        ADD COLUMN IF NOT EXISTS categoria_acesso VARCHAR(50) DEFAULT NULL AFTER equipe_id
      `);
      console.log('   ✅ Campo categoria_acesso adicionado aos usuários\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️  Campo categoria_acesso já existe\n');
      } else throw e;
    }
    
    // 4. Adicionar campos para controle mensal de limite
    console.log('4️⃣ Adicionando campos de controle mensal às equipes...');
    try {
      await conn.execute(`
        ALTER TABLE equipes 
        ADD COLUMN IF NOT EXISTS limite_mensal DECIMAL(15,2) DEFAULT 0.00 AFTER limite_credito,
        ADD COLUMN IF NOT EXISTS mes_referencia INT DEFAULT NULL AFTER limite_mensal,
        ADD COLUMN IF NOT EXISTS ano_referencia INT DEFAULT NULL AFTER mes_referencia
      `);
      console.log('   ✅ Campos de controle mensal adicionados às equipes\n');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('   ⚠️  Campos de controle mensal já existem\n');
      } else throw e;
    }
    
    // 5. Inicializar limite_mensal com valor do limite_credito atual
    console.log('5️⃣ Inicializando limites mensais...');
    const [result5] = await conn.execute(`
      UPDATE equipes 
      SET limite_mensal = limite_credito,
          mes_referencia = MONTH(NOW()),
          ano_referencia = YEAR(NOW())
      WHERE limite_mensal = 0 OR limite_mensal IS NULL
    `);
    console.log(`   ✅ ${result5.affectedRows} equipes com limite mensal inicializado\n`);
    
    await conn.commit();
    console.log('✅ Todas as alterações foram aplicadas com sucesso!');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    conn.release();
    await pool.end();
  }
}

updateTerminology();
