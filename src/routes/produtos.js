const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getProdutosOracle } = require('../repositories/oracleProdutos');
const produtoSyncService = require('../services/produtoSyncService');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/produtos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'produto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)'));
    }
  }
});

router.use(authenticate);

// Rota para upload de foto de produto
router.post('/upload-foto', requireAdmin, (req, res) => {
  upload.single('foto')(req, res, (err) => {
    try {
      if (err) {
        console.error('❌ Erro do multer:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB.' });
          }
          return res.status(400).json({ error: `Erro no upload: ${err.message}` });
        }
        return res.status(400).json({ error: err.message || 'Erro ao processar upload' });
      }
      
      if (!req.file) {
        console.log('⚠️ Nenhum arquivo enviado');
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }
      
      const fotoPath = `/uploads/produtos/${req.file.filename}`;
      console.log('✅ Foto do produto uploaded:', fotoPath);
      
      res.json({ 
        success: true, 
        fotoPath: fotoPath,
        message: 'Foto enviada com sucesso!'
      });
    } catch (error) {
      console.error('❌ Erro inesperado ao fazer upload:', error);
      res.status(500).json({ error: 'Erro interno ao enviar foto' });
    }
  });
});

// Rota específica para galeria - filtra produtos por equipe do usuário
router.get('/galeria', async (req, res) => {
  try {
    const { search, categoria, page = 1, pageSize = 1000 } = req.query;
    const pool = require('../config/db.mysql');
    
    console.log('🎨 Buscando produtos para galeria...');
    console.log('   Usuário:', req.user.id, '| Perfil:', req.user.perfil);
    
    // ADMIN vê TODOS os produtos
    if (req.user.perfil === 'admin') {
      console.log('   👑 Admin - retornando todos os produtos');
      
      let whereClause = 'WHERE p.ativo = 1';
      let params = [];
      
      if (search) {
        whereClause += ' AND (p.codprod LIKE ? OR p.descricao LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (categoria) {
        whereClause += ' AND p.categoria = ?';
        params.push(categoria);
      }
      
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 1000;
      const offset = (pageNum - 1) * pageSizeNum;
      
      const [produtos] = await pool.execute(`
        SELECT * FROM produtos p
        ${whereClause}
        ORDER BY p.descricao
        LIMIT ? OFFSET ?
      `, [...params, pageSizeNum, offset]);
      
      console.log(`✅ Retornando ${produtos.length} produtos para admin`);
      
      return res.json({
        produtos,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: produtos.length,
          totalPages: Math.ceil(produtos.length / pageSizeNum)
        }
      });
    }
    
    // Para outros perfis, filtrar por equipes
    const [equipesUsuario] = await pool.execute(
      'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
      [req.user.id]
    );
    
    const equipesIds = equipesUsuario.map(e => e.equipe_id);
    console.log('   Equipes do usuário:', equipesIds);
    
    // Buscar produtos
    let whereClause = 'WHERE p.ativo = 1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (p.codprod LIKE ? OR p.descricao LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (categoria) {
      whereClause += ' AND p.categoria = ?';
      params.push(categoria);
    }
    
    // Filtrar produtos:
    // 1. Produtos com acesso_especifico = 0 (disponíveis para todos)
    // 2. Produtos com acesso_especifico = 1 que estão vinculados às equipes do usuário
    const query = `
      SELECT DISTINCT p.* 
      FROM produtos p
      LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
      ${whereClause}
      AND (
        p.acesso_especifico = 0
        OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipesIds.length > 0 ? equipesIds.join(',') : '0'}))
      )
      ORDER BY p.descricao
      LIMIT ? OFFSET ?
    `;
    
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 1000;
    const offset = (pageNum - 1) * pageSizeNum;
    
    params.push(pageSizeNum, offset);
    
    const [produtos] = await pool.execute(query, params);
    
    console.log(`✅ Retornando ${produtos.length} produtos para galeria`);
    
    res.json({
      produtos,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: produtos.length,
        totalPages: Math.ceil(produtos.length / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos para galeria:', error);
    res.status(500).json({ error: 'Erro ao consultar catálogo' });
  }
});

// Listar produtos do catálogo local (todos os usuários autenticados podem ver preços)
router.get('/', async (req, res) => {
  try {
    const { search, categoria, page = 1, pageSize = 20 } = req.query;
    const pool = require('../config/db.mysql');
    
    // Se o usuário for SOLICITANTE, filtrar por categoria de acesso E equipes
    if (req.user && req.user.perfil === 'solicitante') {
      console.log('🏢 Buscando produtos para SOLICITANTE...');
      console.log('   Categoria de acesso:', req.user.categoria_acesso);
      
      // Buscar equipes do usuário
      const [equipesUsuario] = await pool.execute(
        'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
        [req.user.id]
      );
      
      const equipesIds = equipesUsuario.map(e => e.equipe_id);
      console.log('   Equipes do usuário:', equipesIds);
      
      // Buscar produtos com cont_oba = 'S' filtrados por categoria
      // OU produtos com acesso específico para as equipes do usuário
      let whereClause = 'WHERE p.ativo = 1';
      const params = [];
      
      // Filtrar por categoria de acesso do usuário (para produtos OBA)
      let categoriaFilter = '';
      if (req.user.categoria_acesso === 'facility') {
        categoriaFilter = 'p.categoria_facility = 1';
      } else if (req.user.categoria_acesso === 'manipulacao') {
        categoriaFilter = 'p.categoria_manipulacao = 1';
      } else if (req.user.categoria_acesso === 'ambas') {
        categoriaFilter = '(p.categoria_facility = 1 OR p.categoria_manipulacao = 1)';
      }
      
      // Produtos disponíveis:
      // 1. Produtos OBA (cont_oba = 'S') com categoria correta
      // 2. Produtos com acesso_especifico = 0 (todos)
      // 3. Produtos com acesso_especifico = 1 vinculados às equipes do usuário
      if (categoriaFilter) {
        whereClause += ` AND (
          (p.cont_oba = 'S' AND ${categoriaFilter})
          OR p.acesso_especifico = 0
          OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipesIds.length > 0 ? equipesIds.join(',') : '0'}))
        )`;
      } else {
        whereClause += ` AND (
          p.acesso_especifico = 0
          OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipesIds.length > 0 ? equipesIds.join(',') : '0'}))
        )`;
      }
      
      if (search) {
        whereClause += ` AND (p.descricao LIKE ? OR p.codprod LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (categoria) {
        whereClause += ` AND p.categoria = ?`;
        params.push(categoria);
      }
      
      const query = `
        SELECT DISTINCT p.* 
        FROM produtos p
        LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
        ${whereClause}
        ORDER BY p.descricao
      `;
      
      const [produtos] = await pool.execute(query, params);
      
      console.log(`✅ Retornando ${produtos.length} produtos para SOLICITANTE`);
      
      return res.json({
        produtos,
        page: 1,
        pageSize: produtos.length,
        total: produtos.length
      });
    }
    
    // Para VENDEDOR e GESTOR, filtrar por equipes
    if (req.user && (req.user.perfil === 'vendedor' || req.user.perfil === 'gestor')) {
      console.log('🛒 Buscando produtos para VENDEDOR/GESTOR...');
      
      // Buscar equipes do usuário
      const [equipesUsuario] = await pool.execute(
        'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
        [req.user.id]
      );
      
      const equipesIds = equipesUsuario.map(e => e.equipe_id);
      console.log('   Equipes do usuário:', equipesIds);
      
      let whereClause = 'WHERE p.ativo = 1';
      let params = [];
      
      if (search) {
        whereClause += ' AND (p.codprod LIKE ? OR p.descricao LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }
      
      if (categoria) {
        whereClause += ' AND p.categoria = ?';
        params.push(categoria);
      }
      
      // Filtrar produtos:
      // 1. Produtos com acesso_especifico = 0 (disponíveis para todos)
      // 2. Produtos com acesso_especifico = 1 que estão vinculados às equipes do usuário
      const query = `
        SELECT DISTINCT p.* 
        FROM produtos p
        LEFT JOIN produtos_equipes_especificas pe ON p.id = pe.produto_id
        ${whereClause}
        AND (
          p.acesso_especifico = 0
          OR (p.acesso_especifico = 1 AND pe.equipe_id IN (${equipesIds.length > 0 ? equipesIds.join(',') : '0'}))
        )
        ORDER BY p.descricao
        LIMIT ? OFFSET ?
      `;
      
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 20;
      const offset = (pageNum - 1) * pageSizeNum;
      
      params.push(pageSizeNum, offset);
      
      const [produtos] = await pool.execute(query, params);
      
      console.log(`✅ Retornando ${produtos.length} produtos para vendedor/gestor`);
      
      return res.json({
        produtos,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total: produtos.length,
          totalPages: Math.ceil(produtos.length / pageSizeNum)
        }
      });
    }
    
    // Admin vê todos os produtos
    console.log('🔍 Buscando todos os produtos para admin...');
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

// Buscar equipes específicas de um produto
router.get('/:id/equipes-especificas', async (req, res) => {
  try {
    const pool = require('../config/db.mysql');
    const { id } = req.params;
    
    const [equipes] = await pool.execute(`
      SELECT e.id, e.nome, e.cnpj, pe.criado_em
      FROM produtos_equipes_especificas pe
      INNER JOIN equipes e ON e.id = pe.equipe_id
      WHERE pe.produto_id = ?
      ORDER BY e.nome
    `, [id]);
    
    res.json(equipes);
  } catch (error) {
    console.error('Erro ao buscar equipes específicas:', error);
    res.status(500).json({ error: 'Erro ao buscar equipes' });
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
