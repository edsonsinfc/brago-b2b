require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function checkGestores() {
  try {
    console.log('📊 VERIFICANDO EMAILS DOS GESTORES\n');
    
    // Buscar gestores
    const [gestores] = await pool.execute(`
      SELECT u.id, u.nome, u.email, u.perfil 
      FROM usuarios u 
      WHERE u.perfil = 'gestor'
    `);
    
    console.log(`✅ Encontrados ${gestores.length} gestores:\n`);
    gestores.forEach(g => {
      console.log(`   ID: ${g.id}`);
      console.log(`   Nome: ${g.nome}`);
      console.log(`   Email: ${g.email}`);
      console.log(`   Perfil: ${g.perfil}\n`);
    });
    
    // Buscar equipes e seus gestores
    console.log('\n📊 EQUIPES E EMAILS:\n');
    const [equipes] = await pool.execute(`
      SELECT e.id, e.nome, e.gestor_id, e.vendedor_email, u.email as gestor_email
      FROM equipes e
      LEFT JOIN usuarios u ON u.id = e.gestor_id
    `);
    
    equipes.forEach(eq => {
      console.log(`   Equipe: ${eq.nome} (ID: ${eq.id})`);
      console.log(`   Gestor ID: ${eq.gestor_id || 'Não tem'}`);
      console.log(`   Gestor Email: ${eq.gestor_email || 'N/A'}`);
      console.log(`   Vendedor Email: ${eq.vendedor_email || 'N/A'}\n`);
    });
    
    // Detectar emails inválidos
    console.log('\n⚠️  EMAILS INVÁLIDOS DETECTADOS:\n');
    const emailsInvalidos = gestores.filter(g => g.email.includes('@local'));
    if (emailsInvalidos.length > 0) {
      emailsInvalidos.forEach(g => {
        console.log(`   ❌ ${g.nome} (${g.email}) - EMAIL INVÁLIDO`);
      });
      
      console.log('\n💡 SOLUÇÃO:');
      console.log('   Execute o seguinte SQL para corrigir:');
      console.log(`   UPDATE usuarios SET email = 'edson.silva@bragodistribuidora.com.br' WHERE email LIKE '%@local';`);
    } else {
      console.log('   ✅ Nenhum email inválido encontrado!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

checkGestores();
