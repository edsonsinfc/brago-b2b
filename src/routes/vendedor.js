const express = require('express');
const router = express.Router();
const pool = require('../config/db.mysql');
const { authenticate } = require('../middleware/auth');

// Middleware para verificar se é vendedor
const checkVendedor = (req, res, next) => {
  if (req.user.perfil !== 'vendedor') {
    return res.status(403).json({ error: 'Acesso negado. Apenas vendedores podem acessar esta rota.' });
  }
  next();
};

// GET /api/vendedor/dashboard - Estatísticas gerais do dashboard
router.get('/dashboard', authenticate, checkVendedor, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    try {
      // Total de pedidos
      const [[totalPedidos]] = await conn.execute(
        'SELECT COUNT(*) as total FROM pedidos'
      );
      
      // Valor total vendido (apenas APROVADO)
      const [[valorTotal]] = await conn.execute(
        'SELECT COALESCE(SUM(valor_total), 0) as total FROM pedidos WHERE status = "APROVADO"'
      );
      
      // Pedidos pendentes de aprovação
      const [[pedidosPendentes]] = await conn.execute(
        'SELECT COUNT(*) as total FROM pedidos WHERE status = "PENDENTE_APROVACAO"'
      );
      
      // Total de equipes ativas
      const [[totalEquipes]] = await conn.execute(
        'SELECT COUNT(*) as total FROM equipes'
      );
      
      // Valor médio por pedido aprovado
      const [[valorMedio]] = await conn.execute(
        'SELECT COALESCE(AVG(valor_total), 0) as media FROM pedidos WHERE status = "APROVADO"'
      );
      
      // Vendas do mês atual
      const [[vendasMes]] = await conn.execute(`
        SELECT COALESCE(SUM(valor_total), 0) as total 
        FROM pedidos 
        WHERE status = "APROVADO" 
        AND MONTH(data) = MONTH(CURRENT_DATE())
        AND YEAR(data) = YEAR(CURRENT_DATE())
      `);
      
      // Pedidos do mês atual
      const [[pedidosMes]] = await conn.execute(`
        SELECT COUNT(*) as total 
        FROM pedidos 
        WHERE MONTH(data) = MONTH(CURRENT_DATE())
        AND YEAR(data) = YEAR(CURRENT_DATE())
      `);
      
      res.json({
        totalPedidos: totalPedidos.total,
        valorTotalVendido: parseFloat(valorTotal.total),
        pedidosPendentes: pedidosPendentes.total,
        totalEquipes: totalEquipes.total,
        valorMedioPedido: parseFloat(valorMedio.media),
        vendasMesAtual: parseFloat(vendasMes.total),
        pedidosMesAtual: pedidosMes.total
      });
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas do dashboard' });
  }
});

// GET /api/vendedor/produtos-mais-vendidos - Top produtos
router.get('/produtos-mais-vendidos', authenticate, checkVendedor, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('🔍 Buscando produtos mais vendidos, limit:', limit);
    
    const conn = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          pi.codprod,
          pi.descricao,
          SUM(pi.quantidade) as quantidade_total,
          COUNT(DISTINCT pi.pedido_id) as num_pedidos,
          COALESCE(SUM(pi.quantidade * pi.valor_unitario), 0) as valor_total
        FROM itens_pedido pi
        INNER JOIN pedidos p ON p.id = pi.pedido_id
        WHERE p.status = 'APROVADO'
        GROUP BY pi.codprod, pi.descricao
        ORDER BY quantidade_total DESC
        LIMIT ${limit}
      `;
      
      console.log('📋 Executando query produtos...');
      const [produtos] = await conn.execute(query);
      console.log('✅ Produtos encontrados:', produtos.length);
      
      res.json(produtos);
      
    } catch (queryError) {
      console.error('❌ Erro na query produtos:', queryError.message);
      console.error('SQL:', queryError.sql);
      throw queryError;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Erro geral produtos:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao carregar produtos mais vendidos', details: error.message });
  }
});

// GET /api/vendedor/ranking-lojas - Ranking de lojas por valor
router.get('/ranking-lojas', authenticate, checkVendedor, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log('🔍 Buscando ranking lojas, limit:', limit);
    
    const conn = await pool.getConnection();
    
    try {
      const query = `
        SELECT 
          e.id,
          e.nome,
          e.codigo_erp,
          COUNT(p.id) as total_pedidos,
          COALESCE(SUM(CASE WHEN p.status = 'APROVADO' THEN p.valor_total ELSE 0 END), 0) as valor_total,
          COALESCE(AVG(CASE WHEN p.status = 'APROVADO' THEN p.valor_total ELSE NULL END), 0) as ticket_medio,
          SUM(CASE WHEN p.status = 'PENDENTE_APROVACAO' THEN 1 ELSE 0 END) as pedidos_pendentes
        FROM equipes e
        LEFT JOIN pedidos p ON p.equipe_id = e.id
        GROUP BY e.id, e.nome, e.codigo_erp
        ORDER BY valor_total DESC
        LIMIT ${limit}
      `;
      
      console.log('📋 Executando query lojas...');
      const [lojas] = await conn.execute(query);
      console.log('✅ Lojas encontradas:', lojas.length);
      
      res.json(lojas);
      
    } catch (queryError) {
      console.error('❌ Erro na query lojas:', queryError.message);
      console.error('SQL:', queryError.sql);
      throw queryError;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Erro geral lojas:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao carregar ranking de lojas', details: error.message });
  }
});

// GET /api/vendedor/vendas-por-mes - Histórico mensal de vendas
router.get('/vendas-por-mes', authenticate, checkVendedor, async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 12;
    const conn = await pool.getConnection();
    
    try {
      const [vendas] = await conn.execute(`
        SELECT 
          DATE_FORMAT(p.data, '%Y-%m') as mes,
          DATE_FORMAT(p.data, '%m/%Y') as mes_formatado,
          COUNT(p.id) as total_pedidos,
          COALESCE(SUM(CASE WHEN p.status = 'APROVADO' THEN p.valor_total ELSE 0 END), 0) as valor_total,
          SUM(CASE WHEN p.status = 'APROVADO' THEN 1 ELSE 0 END) as pedidos_aprovados,
          SUM(CASE WHEN p.status = 'PENDENTE_APROVACAO' THEN 1 ELSE 0 END) as pedidos_pendentes,
          SUM(CASE WHEN p.status = 'CANCELADO' THEN 1 ELSE 0 END) as pedidos_cancelados
        FROM pedidos p
        WHERE p.data >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
        GROUP BY mes, mes_formatado
        ORDER BY mes DESC
      `, [meses]);
      
      res.json(vendas);
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao buscar vendas por mês:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de vendas' });
  }
});

// GET /api/vendedor/pedidos - Lista todos os pedidos (com filtros)
router.get('/pedidos', authenticate, checkVendedor, async (req, res) => {
  try {
    const { status, equipe_id, data_inicio, data_fim, page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * pageSize;
    
    const conn = await pool.getConnection();
    
    try {
      let whereConditions = [];
      let params = [];
      
      if (status) {
        whereConditions.push('p.status = ?');
        params.push(status);
      }
      
      if (equipe_id) {
        whereConditions.push('p.equipe_id = ?');
        params.push(equipe_id);
      }
      
      if (data_inicio) {
        whereConditions.push('DATE(p.data) >= ?');
        params.push(data_inicio);
      }
      
      if (data_fim) {
        whereConditions.push('DATE(p.data) <= ?');
        params.push(data_fim);
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Total de registros
      const [[{ total }]] = await conn.execute(`
        SELECT COUNT(*) as total
        FROM pedidos p
        ${whereClause}
      `, params);
      
      // Pedidos paginados
      const limit = parseInt(pageSize);
      const offsetInt = parseInt(offset);
      
      const [pedidos] = await conn.execute(`
        SELECT 
          p.id,
          p.data,
          p.status,
          p.valor_total,
          p.codigo_erp,
          p.cgc,
          e.nome as equipe_nome,
          e.codigo_erp as equipe_codigo
        FROM pedidos p
        INNER JOIN equipes e ON e.id = p.equipe_id
        ${whereClause}
        ORDER BY p.data DESC
        LIMIT ${limit} OFFSET ${offsetInt}
      `, params);
      
      res.json({
        pedidos,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ error: 'Erro ao carregar pedidos' });
  }
});

// GET /api/vendedor/pedido/:id - Detalhes de um pedido específico
router.get('/pedido/:id', authenticate, checkVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    try {
      // Dados do pedido
      const [[pedido]] = await conn.execute(`
        SELECT 
          p.*,
          e.nome as equipe_nome,
          e.codigo_erp as equipe_codigo,
          e.vendedor_email
        FROM pedidos p
        INNER JOIN equipes e ON e.id = p.equipe_id
        WHERE p.id = ?
      `, [id]);
      
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
      }
      
      // Itens do pedido
      const [itens] = await conn.execute(`
        SELECT * FROM itens_pedido WHERE pedido_id = ?
      `, [id]);
      
      res.json({ pedido, itens });
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes do pedido:', error);
    res.status(500).json({ error: 'Erro ao carregar detalhes do pedido' });
  }
});

// GET /api/vendedor/status-distribution - Distribuição de pedidos por status
router.get('/status-distribution', authenticate, checkVendedor, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    
    try {
      const [distribuicao] = await conn.execute(`
        SELECT 
          status,
          COUNT(*) as quantidade,
          COALESCE(SUM(valor_total), 0) as valor_total
        FROM pedidos
        GROUP BY status
        ORDER BY quantidade DESC
      `);
      
      res.json(distribuicao);
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Erro ao buscar distribuição de status:', error);
    res.status(500).json({ error: 'Erro ao carregar distribuição de status' });
  }
});

module.exports = router;
