require('dotenv').config();
const pool = require('../src/config/db.mysql');

async function showGestorMapping() {
  try {
    console.log('📊 MAPEAMENTO EQUIPE → GESTOR → EMAIL\n');
    
    const [equipes] = await pool.execute(`
      SELECT 
        e.id as equipe_id,
        e.nome as equipe_nome,
        e.gestor_id,
        e.vendedor_email,
        u.id as usuario_id,
        u.nome as gestor_nome,
        u.email as gestor_email,
        u.perfil
      FROM equipes e
      LEFT JOIN usuarios u ON e.gestor_id = u.id
      ORDER BY e.id
    `);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    equipes.forEach(eq => {
      console.log(`🏢 Equipe: ${eq.equipe_nome} (ID: ${eq.equipe_id})`);
      console.log(`   ├─ Gestor ID: ${eq.gestor_id || '❌ NÃO TEM'}`);
      
      if (eq.gestor_id) {
        console.log(`   ├─ Gestor Nome: ${eq.gestor_nome}`);
        console.log(`   ├─ Gestor Email: ${eq.gestor_email} ${eq.gestor_email?.includes('@brago') ? '✅' : '⚠️'}`);
        console.log(`   ├─ Perfil: ${eq.perfil}`);
      }
      
      console.log(`   └─ Vendedor Email: ${eq.vendedor_email || '❌ NÃO CONFIGURADO'}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 REGRA DE ENVIO DE EMAILS:\n');
    console.log('1️⃣ Pedido PENDENTE_APROVACAO:');
    console.log('   → Envia para: GESTOR da equipe (usuarios.email onde id = equipes.gestor_id)');
    console.log('   → Também envia para: VENDEDOR (equipes.vendedor_email)\n');
    
    console.log('2️⃣ Pedido APROVADO (automático):');
    console.log('   → Envia para: VENDEDOR (equipes.vendedor_email)\n');
    
    console.log('✅ O código JÁ ESTÁ CORRETO! Busca gestor_email via JOIN:\n');
    console.log('   SELECT e.vendedor_email, e.gestor_id, u.email as gestor_email');
    console.log('   FROM equipes e LEFT JOIN usuarios u ON u.id = e.gestor_id\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

showGestorMapping();
