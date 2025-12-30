const express = require('express');
const { getProdutosOracle } = require('../repositories/oracleProdutos');
const produtoSyncService = require('../services/produtoSyncService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Rota específica para galeria - mostra TODOS os produtos ativos (sem filtro de equipe)
router.get('/galeria', async (req, res) => {
  try {
    const { search, categoria, page = 1, pageSize = 1000 } = req.query;
    
    console.log('🎨 Buscando produtos para galeria (todos os produtos ativos)...');
    
    const result = await produtoSyncService.buscarProdutos({
      search,
      categoria,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      ativo: true
    });
    
    console.log(`✅ Retornando ${result.produtos?.length || 0} produtos para galeria`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos para galeria:', error);
    res.status(500).json({ error: 'Erro ao consultar catálogo' });
  }
});

// Listar produtos do catálogo local (todos os usuários autenticados podem ver preços)
router.get('/', async (req, res) => {
  try {
    const { search, categoria, page = 1, pageSize = 20 } = req.query;
    
    // Se o usuário for SOLICITANTE, filtrar por categoria de acesso
    if (req.user && req.user.perfil === 'solicitante') {
      const pool = require('../config/db.mysql');
      
      console.log('🏢 Buscando produtos para SOLICITANTE...');
      console.log('   Categoria de acesso:', req.user.categoria_acesso);
      
      // Buscar produtos com cont_oba = 'S' filtrados por categoria
      let query = `
        SELECT p.* 
        FROM produtos p
        WHERE p.ativo = 1 
        AND p.cont_oba = 'S'
      `;
      const params = [];
      
      // Filtrar por categoria de acesso do usuário
      if (req.user.categoria_acesso === 'facility') {
        query += ` AND p.categoria_facility = 1`;
      } else if (req.user.categoria_acesso === 'manipulacao') {
        query += ` AND p.categoria_manipulacao = 1`;
      } else if (req.user.categoria_acesso === 'ambas') {
        // Mostrar produtos que tenham pelo menos uma das categorias
        query += ` AND (p.categoria_facility = 1 OR p.categoria_manipulacao = 1)`;
      }
      
      if (search) {
        query += ` AND (p.descricao LIKE ? OR p.codprod LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (categoria) {
        query += ` AND p.categoria = ?`;
        params.push(categoria);
      }
      
      query += ` ORDER BY p.descricao`;
      
      const [produtos] = await pool.execute(query, params);
      
      console.log(`✅ Retornando ${produtos.length} produtos filtrados por categoria para SOLICITANTE`);
      
      return res.json({
        produtos,
        page: 1,
        pageSize: produtos.length,
        total: produtos.length
      });
    }
    
    // Admin e Gestor veem todos os produtos
    console.log('🔍 Buscando todos os produtos para admin/gestor...');
    const result = await produtoSyncService.buscarProdutos({
      search,
      categoria,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      ativo: true
    });
    
    console.log(`✅ Retornando ${result.produtos?.length || 0} produtos`);
    
    // Todos os usuários autenticados podem ver os preços
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao consultar catálogo' });
  }
});

// Buscar categorias disponíveis
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await produtoSyncService.buscarCategorias();
    res.json({ categorias });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Sincronizar produtos do Oracle (apenas admin)
router.post('/sync', requireAdmin, async (req, res) => {
  try {
    const result = await produtoSyncService.sincronizarProdutos();
    res.json({
      message: 'Sincronização concluída',
      ...result
    });
  } catch (error) {
    if (error.code === 'ORACLE_CONFIG_MISSING') {
      return res.status(503).json({ error: 'Oracle não configurado' });
    }
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro na sincronização' });
  }
});

// Obter produto específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produto = await produtoSyncService.obterProduto(id);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Se for usuário equipe, remover preço
    if (req.user?.perfil === 'solicitante') {
      produto.preco = undefined;
    }
    
    res.json(produto);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro ao obter produto' });
  }
});

// Criar novo produto (apenas admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    console.log('📦 Dados recebidos para criar produto:', req.body);
    
    // Validações básicas
    if (!req.body.codprod || !req.body.descricao) {
      return res.status(400).json({ 
        error: 'Código do produto e descrição são obrigatórios' 
      });
    }
    
    const result = await produtoSyncService.criarProduto(req.body);
    console.log('✅ Produto criado com sucesso:', result);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ Erro detalhado ao criar produto:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack.substring(0, 500)
    });
    
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Código do produto já existe' });
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(400).json({ error: 'Dados muito longos para os campos' });
    } else {
      res.status(500).json({ 
        error: `Erro ao criar produto: ${error.message}`,
        details: error.sqlMessage || 'Erro interno do servidor'
      });
    }
  }
});

// Atualizar produto (apenas admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await produtoSyncService.atualizarProduto(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Código do produto já existe' });
    } else {
      res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
  }
});

// Excluir produto (apenas admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await produtoSyncService.excluirProduto(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// Buscar produtos do Oracle (legacy - manter compatibilidade)
router.get('/oracle', async (req, res) => {
  try {
    const { search, categoria, fornecedor, codigo } = req.query || {};
    const data = await getProdutosOracle({ search, categoria, fornecedor, codigo });
    res.json({ produtos: data });
  } catch (e) {
    if (e.code === 'ORACLE_CONFIG_MISSING') return res.status(503).json({ error: 'Oracle não configurado' });
    console.error('Erro produtos Oracle:', e);
    res.status(500).json({ error: 'Erro ao consultar catálogo' });
  }
});

// ====================================
// ROTAS DE MÍDIAS
// ====================================

// Adicionar imagem ao produto
router.post('/:id/imagens', requireAdmin, async (req, res) => {
  try {
    const { url, legenda, principal } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL da imagem é obrigatória' });
    }
    
    const result = await produtoSyncService.adicionarImagem(id, { url, legenda, principal });
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao adicionar imagem:', error);
    res.status(500).json({ error: 'Erro ao adicionar imagem' });
  }
});

// Remover imagem do produto
router.delete('/:id/imagens/:imagemId', requireAdmin, async (req, res) => {
  try {
    const result = await produtoSyncService.removerImagem(id, imagemId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao remover imagem:', error);
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});

// Reordenar imagens
router.put('/:id/imagens/ordem', requireAdmin, async (req, res) => {
  try {
    const { imagens } = req.body; // Array de { id, ordem }
    
    const result = await produtoSyncService.reordenarImagens(id, imagens);
    res.json(result);
  } catch (error) {
    console.error('Erro ao reordenar imagens:', error);
    res.status(500).json({ error: 'Erro ao reordenar imagens' });
  }
});

// Definir imagem principal
router.put('/:id/imagens/:imagemId/principal', requireAdmin, async (req, res) => {
  try {
    const result = await produtoSyncService.definirImagemPrincipal(id, imagemId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao definir imagem principal:', error);
    res.status(500).json({ error: 'Erro ao definir imagem principal' });
  }
});

// Adicionar vídeo ao produto
router.post('/:id/videos', requireAdmin, async (req, res) => {
  try {
    const { url, titulo, tipo } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL do vídeo é obrigatória' });
    }
    
    const result = await produtoSyncService.adicionarVideo(id, { url, titulo, tipo });
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao adicionar vídeo:', error);
    res.status(500).json({ error: 'Erro ao adicionar vídeo' });
  }
});

// Remover vídeo do produto
router.delete('/:id/videos/:videoId', requireAdmin, async (req, res) => {
  try {
    const result = await produtoSyncService.removerVideo(id, videoId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    res.status(500).json({ error: 'Erro ao remover vídeo' });
  }
});

// Adicionar especificação técnica
router.post('/:id/especificacoes', requireAdmin, async (req, res) => {
  try {
    const { atributo, valor } = req.body;
    
    if (!atributo || !valor) {
      return res.status(400).json({ error: 'Atributo e valor são obrigatórios' });
    }
    
    const result = await produtoSyncService.adicionarEspecificacao(id, { atributo, valor });
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao adicionar especificação:', error);
    res.status(500).json({ error: 'Erro ao adicionar especificação' });
  }
});

// Atualizar especificação técnica
router.put('/:id/especificacoes/:especId', requireAdmin, async (req, res) => {
  try {
    const { atributo, valor } = req.body;
    
    const result = await produtoSyncService.atualizarEspecificacao(id, especId, { atributo, valor });
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar especificação:', error);
    res.status(500).json({ error: 'Erro ao atualizar especificação' });
  }
});

// Remover especificação técnica
router.delete('/:id/especificacoes/:especId', requireAdmin, async (req, res) => {
  try {
    const result = await produtoSyncService.removerEspecificacao(id, especId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao remover especificação:', error);
    res.status(500).json({ error: 'Erro ao remover especificação' });
  }
});

module.exports = { router };
