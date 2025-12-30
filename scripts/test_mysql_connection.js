// Teste de conexão MySQL
const mysql = require('mysql2/promise');

async function testarConexao() {
  console.log('🔍 Testando conexão MySQL...\n');
  
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nexus_b2b',
    timezone: '+00:00'
  };
  
  console.log('Configuração:', config);
  console.log('');
  
  try {
    // Testar conexão única
    console.log('1️⃣ Testando conexão única...');
    const connection = await mysql.createConnection(config);
    console.log('   ✅ Conexão criada');
    
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM pedidos');
    console.log('   ✅ Query executada:', rows[0]);
    
    await connection.end();
    console.log('   ✅ Conexão fechada\n');
    
    // Testar pool
    console.log('2️⃣ Testando pool de conexões...');
    const pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('   ✅ Pool criado');
    
    const [rows2] = await pool.execute('SELECT COUNT(*) as total FROM pedidos');
    console.log('   ✅ Query no pool executada:', rows2[0]);
    
    await pool.end();
    console.log('   ✅ Pool fechado\n');
    
    console.log('✅ Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testarConexao();
