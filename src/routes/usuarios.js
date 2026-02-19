const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db.mysql');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Rota para qualquer usuário autenticado buscar seus próprios dados
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [usuarios] = await pool.execute(
      'SELECT id, nome, email, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao, pode_editar_equipes FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = usuarios[0];
    usuario.ativo = Boolean(usuario.ativo);
    usuario.recebe_email_notificacao = Boolean(usuario.recebe_email_notificacao);
    
    // Buscar equipes vinculadas
    const [equipes] = await pool.execute(
      `SELECT e.id, e.nome 
       FROM equipes e 
       INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id 
       WHERE ue.usuario_id = ?`,
      [userId]
    );
    
    usuario.equipes = equipes;
    usuario.equipes_ids = equipes.map(e => e.id);
    
    res.json(usuario);
  } catch (e) {
    console.error('Erro ao buscar dados do usuário:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota para buscar equipes de um usuário específico com informações de crédito
router.get('/:id/equipes', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Verificar se o usuário está tentando acessar suas próprias equipes ou se é admin/gestor
    if (req.user.perfil !== 'admin' && req.user.perfil !== 'gestor' && parseInt(id) !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar equipes vinculadas com informações de crédito
    const [equipes] = await pool.execute(
      `SELECT 
        e.id, 
        e.nome, 
        e.codigo_erp, 
        e.limite_credito,
        e.limite_disponivel,
        e.limite_credito - e.limite_disponivel as utilizado
       FROM equipes e 
       INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id 
       WHERE ue.usuario_id = ?
       ORDER BY e.nome`,
      [id]
    );
    
    res.json({ equipes });
  } catch (e) {
    console.error('Erro ao buscar equipes do usuário:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.use(authenticate, requireRole('admin', 'gestor'));

// Listar usuários (com filtros opcionais)
router.get('/', async (req, res) => {
  try {
    const { perfil, ativo, q, equipe_id, categoria_acesso } = req.query || {};
    let page = parseInt(req.query.page || '1', 10);
    let pageSize = parseInt(req.query.pageSize || '20', 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
    if (pageSize > 100) pageSize = 100;

    const where = [];
    const vals = [];
    if (perfil) { where.push('u.perfil = ?'); vals.push(perfil); }
    if (ativo !== undefined) { where.push('u.ativo = ?'); vals.push(ativo === '1' || ativo === 'true' ? 1 : 0); }
    if (q) { where.push('(u.nome LIKE ? OR u.email LIKE ?)'); vals.push(`%${q}%`, `%${q}%`); }
    if (categoria_acesso) { where.push('u.categoria_acesso = ?'); vals.push(categoria_acesso); }
    
    // Filtrar por equipe específica
    if (equipe_id) {
      where.push('EXISTS (SELECT 1 FROM usuarios_equipes ue WHERE ue.usuario_id = u.id AND ue.equipe_id = ?)');
      vals.push(parseInt(equipe_id));
    }
    
    // Gestor só vê usuários das suas equipes
    if (req.user && req.user.perfil === 'gestor') {
      const [equipesGestor] = await pool.execute(
        'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
        [req.user.id]
      );
      
      if (equipesGestor.length > 0) {
        const equipesIds = equipesGestor.map(e => e.equipe_id);
        where.push(`EXISTS (SELECT 1 FROM usuarios_equipes ue WHERE ue.usuario_id = u.id AND ue.equipe_id IN (${equipesIds.map(() => '?').join(',')}))`);
        vals.push(...equipesIds);
      } else {
        // Gestor sem equipes não vê nenhum usuário
        where.push('1 = 0');
      }
    }
    
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(DISTINCT u.id) AS total
         FROM usuarios u
         ${whereSql}`,
      vals
    );

    const offset = (page - 1) * pageSize;
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.equipe_id, u.categoria_acesso, u.recebe_email_notificacao, u.pode_editar_equipes
         FROM usuarios u
         ${whereSql}
         ORDER BY u.nome
         LIMIT ${pageSize} OFFSET ${offset}`,
      vals
    );
    
    // Buscar equipes de cada usuário
    for (const usuario of rows) {
      // Converter tinyint para boolean
      usuario.ativo = Boolean(usuario.ativo);
      usuario.recebe_email_notificacao = Boolean(usuario.recebe_email_notificacao);
      usuario.pode_editar_equipes = Boolean(usuario.pode_editar_equipes);
      
      const [equipes] = await pool.execute(
        `SELECT e.id, e.nome 
         FROM equipes e 
         INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id 
         WHERE ue.usuario_id = ?
         ORDER BY e.nome`,
        [usuario.id]
      );
      usuario.equipes = equipes;
      usuario.equipes_ids = equipes.map(e => e.id);
    }
    
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    res.json({ usuarios: rows, page, pageSize, total, totalPages });
  } catch (e) {
    console.error('Erro listar usuarios:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil, ativo = 1, equipes_ids = null, categoria_acesso = null, recebe_email_notificacao = false, pode_editar_equipes = false } = req.body || {};
    
    // Validação de campos obrigatórios
    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, perfil' });
    }
    
    // Validação de perfil
    if (!['admin', 'gestor', 'solicitante', 'vendedor'].includes(perfil)) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }
    
    // Gestor não pode criar Admin
    if (req.user.perfil === 'gestor' && perfil === 'admin') {
      return res.status(403).json({ error: 'Gestores não podem criar administradores' });
    }
    
    // Apenas Admin pode criar Gestores
    if (req.user.perfil !== 'admin' && perfil === 'gestor') {
      return res.status(403).json({ error: 'Apenas administradores podem criar gestores' });
    }
    
    // Perfil "solicitante" requer pelo menos uma equipe
    if (perfil === 'solicitante' && (!equipes_ids || equipes_ids.length === 0)) {
      return res.status(400).json({ error: 'Usuários do tipo Solicitante devem estar vinculados a pelo menos uma equipe' });
    }
    
    // Gestor só pode atribuir equipes que ele gerencia
    if (req.user.perfil === 'gestor' && equipes_ids && Array.isArray(equipes_ids) && equipes_ids.length > 0) {
      const [equipesGestor] = await pool.execute(
        'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
        [req.user.id]
      );
      
      const equipesGestorIds = equipesGestor.map(e => e.equipe_id);
      const equipesInvalidas = equipes_ids.filter(id => !equipesGestorIds.includes(id));
      
      if (equipesInvalidas.length > 0) {
        return res.status(403).json({ error: 'Você não pode atribuir equipes que não gerencia' });
      }
    }

    const senhaHash = await bcrypt.hash(String(senha), parseInt(process.env.BCRYPT_ROUNDS || '10', 10));
    
    // Criar usuário (mantém equipe_id como null por padrão para compatibilidade)
    const [r] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo, equipe_id, categoria_acesso, recebe_email_notificacao, pode_editar_equipes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, email, senhaHash, perfil, (ativo ? 1 : 0), null, categoria_acesso, recebe_email_notificacao ? 1 : 0, pode_editar_equipes ? 1 : 0]
    );
    
    const usuarioId = r.insertId;
    
    // Inserir relacionamentos com equipes
    if (equipes_ids && Array.isArray(equipes_ids) && equipes_ids.length > 0) {
      for (const equipeId of equipes_ids) {
        await pool.execute(
          'INSERT IGNORE INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
          [usuarioId, equipeId]
        );
      }
      
      // Atualizar equipe_id com a primeira equipe (compatibilidade com código legado)
      await pool.execute(
        'UPDATE usuarios SET equipe_id = ? WHERE id = ?',
        [equipes_ids[0], usuarioId]
      );
    }
    
    const [novo] = await pool.execute('SELECT id, nome, email, perfil, ativo, equipe_id, recebe_email_notificacao, pode_editar_equipes FROM usuarios WHERE id = ?', [usuarioId]);
    
    // Converter tinyint para boolean
    if (novo[0]) {
      novo[0].ativo = Boolean(novo[0].ativo);
      novo[0].recebe_email_notificacao = Boolean(novo[0].recebe_email_notificacao);
    }
    
    // Buscar equipes vinculadas
    const [equipes] = await pool.execute(
      `SELECT e.id, e.nome 
       FROM equipes e 
       INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id 
       WHERE ue.usuario_id = ?`,
      [usuarioId]
    );
    
    const resultado = novo[0];
    resultado.equipes = equipes;
    resultado.equipes_ids = equipes.map(e => e.id);
    
    res.status(201).json(resultado);
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'E-mail já cadastrado' });
    console.error('Erro criar usuario:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar usuário
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, perfil, ativo, equipes_ids, senha, categoria_acesso, recebe_email_notificacao, pode_editar_equipes } = req.body || {};

    const sets = [];
    const vals = [];
    if (nome !== undefined) { sets.push('nome = ?'); vals.push(nome); }
    if (email !== undefined) { sets.push('email = ?'); vals.push(email); }
    if (perfil !== undefined) {
      if (!['admin','gestor','solicitante','vendedor'].includes(perfil)) return res.status(400).json({ error: 'Perfil inválido' });
      
      // Apenas admin pode alterar perfil para gestor ou admin
      if ((perfil === 'gestor' || perfil === 'admin') && req.user.perfil !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores podem criar ou editar gestores e administradores' });
      }
      
      sets.push('perfil = ?'); vals.push(perfil);
    }
    if (ativo !== undefined) { sets.push('ativo = ?'); vals.push(ativo ? 1 : 0); }
    if (categoria_acesso !== undefined) { sets.push('categoria_acesso = ?'); vals.push(categoria_acesso); }
    if (recebe_email_notificacao !== undefined) { sets.push('recebe_email_notificacao = ?'); vals.push(recebe_email_notificacao ? 1 : 0); }
    
    // Apenas admin pode alterar permissão de editar equipes
    if (pode_editar_equipes !== undefined) {
      if (req.user.perfil !== 'admin') {
        return res.status(403).json({ error: 'Apenas administradores podem alterar permissões de edição de equipes' });
      }
      sets.push('pode_editar_equipes = ?'); vals.push(pode_editar_equipes ? 1 : 0);
    }

    if (senha !== undefined && senha !== null && senha !== '') {
      const senhaHash = await bcrypt.hash(String(senha), parseInt(process.env.BCRYPT_ROUNDS || '10', 10));
      sets.push('senha = ?'); vals.push(senhaHash);
    }

    if (sets.length > 0) {
      vals.push(id);
      const [r] = await pool.execute(`UPDATE usuarios SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, vals);
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Atualizar equipes vinculadas se fornecidas
    if (equipes_ids !== undefined) {
      // Gestor só pode atribuir equipes que ele gerencia
      if (req.user.perfil === 'gestor' && Array.isArray(equipes_ids) && equipes_ids.length > 0) {
        const [equipesGestor] = await pool.execute(
          'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
          [req.user.id]
        );
        
        const equipesGestorIds = equipesGestor.map(e => e.equipe_id);
        const equipesInvalidas = equipes_ids.filter(id => !equipesGestorIds.includes(id));
        
        if (equipesInvalidas.length > 0) {
          return res.status(403).json({ error: 'Você não pode atribuir equipes que não gerencia' });
        }
      }
      
      // Remover todas as equipes atuais
      await pool.execute('DELETE FROM usuarios_equipes WHERE usuario_id = ?', [id]);
      
      // Adicionar novas equipes
      if (Array.isArray(equipes_ids) && equipes_ids.length > 0) {
        for (const equipeId of equipes_ids) {
          await pool.execute(
            'INSERT IGNORE INTO usuarios_equipes (usuario_id, equipe_id) VALUES (?, ?)',
            [id, equipeId]
          );
        }
        
        // Atualizar equipe_id com a primeira equipe (compatibilidade)
        await pool.execute(
          'UPDATE usuarios SET equipe_id = ? WHERE id = ?',
          [equipes_ids[0], id]
        );
      } else {
        // Nenhuma equipe selecionada
        await pool.execute('UPDATE usuarios SET equipe_id = NULL WHERE id = ?', [id]);
      }
    }

    const [novo] = await pool.execute('SELECT id, nome, email, perfil, ativo, equipe_id, recebe_email_notificacao, pode_editar_equipes FROM usuarios WHERE id = ?', [id]);
    
    // Converter tinyint para boolean
    if (novo[0]) {
      novo[0].ativo = Boolean(novo[0].ativo);
      novo[0].recebe_email_notificacao = Boolean(novo[0].recebe_email_notificacao);
    }
    
    // Buscar equipes vinculadas
    const [equipes] = await pool.execute(
      `SELECT e.id, e.nome 
       FROM equipes e 
       INNER JOIN usuarios_equipes ue ON ue.equipe_id = e.id 
       WHERE ue.usuario_id = ?`,
      [id]
    );
    
    const resultado = novo[0];
    resultado.equipes = equipes;
    resultado.equipes_ids = equipes.map(e => e.id);
    
    res.json(resultado);
  } catch (e) {
    console.error('Erro atualizar usuario:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = { router };
