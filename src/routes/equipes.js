const express = require('express');
const pool = require('../config/db.mysql');
const { authenticate, requireRole } = require('../middleware/auth');
const { verificarResetMensal, forcarResetEquipe } = require('../services/resetMensalService');

const router = express.Router();

router.use(authenticate);

router.get('/', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    let query = `
      SELECT id, nome, codigo_erp, cgc, gestor_id, vendedor_email, status, 
             limite_credito, limite_disponivel,
             limite_total, saldo_atual,
             limite_mensal, mes_referencia, ano_referencia,
             created_at, updated_at
      FROM equipes
    `;
    
    const params = [];
    
    // Gestor só vê suas equipes vinculadas
    if (req.user && req.user.perfil === 'gestor') {
      const [equipesGestor] = await pool.execute(
        'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
        [req.user.id]
      );
      
      if (equipesGestor.length > 0) {
        const equipesIds = equipesGestor.map(e => e.equipe_id);
        query += ` WHERE id IN (${equipesIds.map(() => '?').join(',')})`;
        params.push(...equipesIds);
      } else {
        // Gestor sem equipes não vê nada
        query += ' WHERE 1 = 0';
      }
    }
    
    query += ' ORDER BY nome';
    
    const [rows] = await pool.execute(query, params);
    res.json({ equipes: rows });
  } catch (error) {
    console.error('Erro ao listar equipes:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    console.log('📦 POST /api/equipes - Body recebido:', JSON.stringify(req.body));
    console.log('👤 Usuário autenticado:', req.user);
    
    const { nome, codigo_erp, cgc, gestor_id, limite_total, vendedor_email, limite_mensal } = req.body || {};
    
    console.log('📋 Campos extraídos:', { nome, codigo_erp, cgc, gestor_id, limite_total, vendedor_email, limite_mensal });
    
    if (!nome || !gestor_id || limite_total == null) {
      console.error('❌ Validação falhou:', { nome: !!nome, gestor_id: !!gestor_id, limite_total: limite_total != null });
      return res.status(400).json({ error: 'Campos obrigatórios: nome, gestor_id, limite_total' });
    }
    
    console.log('✅ Validação OK, inserindo no banco...');
    
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    const [r] = await pool.execute(
      'INSERT INTO equipes (nome, codigo_erp, cgc, vendedor_email, gestor_id, limite_total, saldo_atual, limite_credito, limite_disponivel, limite_mensal, mes_referencia, ano_referencia, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, codigo_erp || null, cgc || null, vendedor_email || null, gestor_id, limite_total, limite_total, limite_total, limite_mensal || limite_total, limite_mensal || null, mesAtual, anoAtual, 'ATIVA']
    );
    
    console.log('✅ Equipe criada com ID:', r.insertId);
    
    const [row] = await pool.execute('SELECT * FROM equipes WHERE id = ?', [r.insertId]);
    res.status(201).json(row[0]);
  } catch (e) {
    console.error('❌ Erro criar equipe:', e.message);
    console.error('Stack:', e.stack);
    res.status(500).json({ error: 'Erro interno: ' + e.message });
  }
});

router.patch('/:id', requireRole('admin', 'gestor'), async (req, res) => {
  const { id } = req.params;
  const { nome, codigo_erp, cgc, limite_total, limite_mensal, status, vendedor_email } = req.body || {};
  
  console.log('📝 PATCH /api/equipes/' + id + ' - Body:', req.body);
  
  const sets = [];
  const vals = [];
  
  if (nome !== undefined) { sets.push('nome = ?'); vals.push(nome); }
  if (codigo_erp !== undefined) { sets.push('codigo_erp = ?'); vals.push(codigo_erp || null); }
  if (cgc !== undefined) { sets.push('cgc = ?'); vals.push(cgc || null); }
  if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
  
  console.log('📋 Campos para atualizar:', { nome, codigo_erp, cgc, limite_total, limite_mensal, status, vendedor_email });
  
  // Apenas ADMIN pode editar vendedor_email
  if (vendedor_email !== undefined) {
    if (req.user?.perfil !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar o email do vendedor' });
    }
    sets.push('vendedor_email = ?');
    vals.push(vendedor_email || null);
  }
  
  // Quando limite_mensal muda, atualizar limite_disponivel e mes/ano de referência
  if (limite_mensal !== undefined) {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    sets.push('limite_mensal = ?');
    vals.push(limite_mensal);
    sets.push('limite_disponivel = ?');
    vals.push(limite_mensal);
    sets.push('mes_referencia = ?');
    vals.push(mesAtual);
    sets.push('ano_referencia = ?');
    vals.push(anoAtual);
  }
  
  // Quando limite_total (Limite de Crédito) muda:
  // - Atualizar limite_credito, limite_total, saldo_atual
  // - Atualizar limite_mensal com o mesmo valor
  // - Resetar limite_disponivel para o novo limite (não há pedidos aprovados consumindo)
  if (limite_total !== undefined) {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    // Buscar valor de pedidos aprovados desta equipe para calcular limite_disponivel correto
    const [[consumo]] = await pool.execute(
      'SELECT COALESCE(SUM(valor_total), 0) as consumido FROM pedidos WHERE equipe_id = ? AND status = ?',
      [id, 'APROVADO']
    );
    const consumido = parseFloat(consumo.consumido) || 0;
    const novoLimiteDisponivel = Number(limite_total) - consumido;
    
    console.log(`💰 Atualizando limite da equipe ${id}:`);
    console.log(`   Novo limite: R$ ${Number(limite_total).toFixed(2)}`);
    console.log(`   Pedidos aprovados consumidos: R$ ${consumido.toFixed(2)}`);
    console.log(`   Limite disponível calculado: R$ ${novoLimiteDisponivel.toFixed(2)}`);
    
    sets.push('limite_total = ?');
    vals.push(limite_total);
    sets.push('saldo_atual = ?');
    vals.push(limite_total);
    sets.push('limite_credito = ?');
    vals.push(limite_total);
    sets.push('limite_mensal = ?');
    vals.push(limite_total);
    sets.push('limite_disponivel = ?');
    vals.push(novoLimiteDisponivel);
    sets.push('mes_referencia = ?');
    vals.push(mesAtual);
    sets.push('ano_referencia = ?');
    vals.push(anoAtual);
  }
  
  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar' });
  vals.push(id);
  await pool.execute(`UPDATE equipes SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, vals);
  const [row] = await pool.execute('SELECT * FROM equipes WHERE id = ?', [id]);
  res.json(row[0]);
});

router.get('/:id/saldo', async (req, res) => {
  const { id } = req.params;
  const [[row]] = await pool.execute(
    'SELECT id, nome, limite_credito, limite_disponivel, limite_total, saldo_atual FROM equipes WHERE id = ?', 
    [id]
  );
  if (!row) return res.status(404).json({ error: 'Equipe não encontrada' });
  res.json(row);
});

// ============================================
// ROTAS PARA GERENCIAR PRODUTOS POR EQUIPE
// ============================================

// Listar produtos de uma equipe (produtos liberados para ela)
router.get('/:id/produtos', requireRole('admin', 'gestor', 'solicitante'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Segurança: equipe só pode ver seus próprios produtos
    if (req.user?.perfil === 'solicitante' && req.user?.equipe_id && Number(req.user.equipe_id) !== Number(id)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const [produtos] = await pool.execute(`
      SELECT 
        p.*,
        ep.data_atribuicao,
        u.nome as atribuido_por_nome
      FROM equipe_produtos ep
      INNER JOIN produtos p ON p.id = ep.produto_id
      LEFT JOIN usuarios u ON u.id = ep.atribuido_por
      WHERE ep.equipe_id = ?
      ORDER BY p.descricao
    `, [id]);
    
    res.json({ produtos });
  } catch (error) {
    console.error('Erro ao listar produtos da equipe:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Adicionar produto a uma equipe
router.post('/:id/produtos', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { produto_id } = req.body;
    
    if (!produto_id) {
      return res.status(400).json({ error: 'produto_id é obrigatório' });
    }
    
    // Verificar se equipe existe
    const [[equipe]] = await pool.execute('SELECT id FROM equipes WHERE id = ?', [id]);
    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }
    
    // Verificar se produto existe
    const [[produto]] = await pool.execute('SELECT id FROM produtos WHERE id = ?', [produto_id]);
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Adicionar relacionamento (ignora se já existe devido ao UNIQUE KEY)
    await pool.execute(
      'INSERT IGNORE INTO equipe_produtos (equipe_id, produto_id, atribuido_por) VALUES (?, ?, ?)',
      [id, produto_id, req.user?.id || null]
    );
    
    res.json({ message: 'Produto adicionado à equipe com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar produto à equipe:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Adicionar múltiplos produtos de uma vez
router.post('/:id/produtos/batch', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { produto_ids } = req.body; // Array de IDs
    
    if (!Array.isArray(produto_ids) || produto_ids.length === 0) {
      return res.status(400).json({ error: 'produto_ids deve ser um array não vazio' });
    }
    
    // Verificar se equipe existe
    const [[equipe]] = await pool.execute('SELECT id FROM equipes WHERE id = ?', [id]);
    if (!equipe) {
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }
    
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      let adicionados = 0;
      for (const produto_id of produto_ids) {
        const [result] = await conn.execute(
          'INSERT IGNORE INTO equipe_produtos (equipe_id, produto_id, atribuido_por) VALUES (?, ?, ?)',
          [id, produto_id, req.user?.id || null]
        );
        if (result.affectedRows > 0) adicionados++;
      }
      
      await conn.commit();
      res.json({ message: `${adicionados} produto(s) adicionado(s) à equipe` });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao adicionar produtos em lote:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Remover produto de uma equipe
router.delete('/:id/produtos/:produto_id', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { id, produto_id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM equipe_produtos WHERE equipe_id = ? AND produto_id = ?',
      [id, produto_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Relacionamento não encontrado' });
    }
    
    res.json({ message: 'Produto removido da equipe com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto da equipe:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Listar todos os produtos disponíveis (para atribuição)
router.get('/:id/produtos/disponiveis', requireRole('admin', 'gestor'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Produtos que NÃO estão atribuídos a esta equipe
    const [produtos] = await pool.execute(`
      SELECT p.*
      FROM produtos p
      WHERE p.id NOT IN (
        SELECT produto_id 
        FROM equipe_produtos 
        WHERE equipe_id = ?
      )
      ORDER BY p.descricao
    `, [id]);
    
    res.json({ produtos });
  } catch (error) {
    console.error('Erro ao listar produtos disponíveis:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota para reset manual de saldo mensal (Admin apenas)
router.post('/reset-mensal', requireRole('admin'), async (req, res) => {
  try {
    console.log('🔄 Reset mensal manual solicitado por:', req.user.email);
    const resultado = await verificarResetMensal();
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao executar reset mensal:', error);
    res.status(500).json({ error: 'Erro ao executar reset mensal' });
  }
});

// Rota para reset de uma equipe específica (Admin apenas)
router.post('/:id/reset', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Reset manual da equipe ${id} solicitado por:`, req.user.email);
    const resultado = await forcarResetEquipe(id);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao resetar equipe:', error);
    res.status(500).json({ error: error.message || 'Erro ao resetar equipe' });
  }
});

module.exports = { router };
