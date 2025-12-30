const pool = require('../config/db.mysql');

/**
 * Middleware que verifica e reseta limites mensais das equipes
 * quando um novo mês começa. Não acumula sobras do mês anterior.
 */
async function verificarResetMensal(req, res, next) {
  try {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1; // 1-12
    const anoAtual = agora.getFullYear();
    
    // Buscar todas as equipes que precisam de reset
    const [equipes] = await pool.execute(`
      SELECT id, nome, limite_mensal, mes_referencia, ano_referencia, limite_disponivel
      FROM equipes
      WHERE limite_mensal IS NOT NULL
        AND (
          mes_referencia IS NULL 
          OR ano_referencia IS NULL
          OR mes_referencia != ?
          OR ano_referencia != ?
        )
    `, [mesAtual, anoAtual]);
    
    if (equipes.length > 0) {
      console.log(`🔄 Reset mensal: ${equipes.length} equipe(s) precisam de atualização`);
      
      for (const equipe of equipes) {
        await pool.execute(`
          UPDATE equipes
          SET limite_disponivel = limite_mensal,
              mes_referencia = ?,
              ano_referencia = ?,
              updated_at = NOW()
          WHERE id = ?
        `, [mesAtual, anoAtual, equipe.id]);
        
        console.log(`✅ Equipe ${equipe.nome} (ID ${equipe.id}): limite resetado para R$ ${equipe.limite_mensal}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar reset mensal:', error);
    // Não bloqueia a requisição em caso de erro
    next();
  }
}

/**
 * Função auxiliar para executar reset manual de todas as equipes
 */
async function resetarLimitesMensais() {
  try {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    const [result] = await pool.execute(`
      UPDATE equipes
      SET limite_disponivel = limite_mensal,
          mes_referencia = ?,
          ano_referencia = ?,
          updated_at = NOW()
      WHERE limite_mensal IS NOT NULL
    `, [mesAtual, anoAtual]);
    
    console.log(`✅ Reset mensal executado: ${result.affectedRows} equipes atualizadas`);
    return result.affectedRows;
  } catch (error) {
    console.error('❌ Erro ao resetar limites mensais:', error);
    throw error;
  }
}

module.exports = {
  verificarResetMensal,
  resetarLimitesMensais
};
