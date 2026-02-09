const jwt = require('jsonwebtoken');
const pool = require('../config/db.mysql');

async function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    
    // VALIDAÇÃO 1: Verificar se o usuário foi atualizado após a criação do token
    const [rows] = await pool.execute(
      'SELECT updated_at, categoria_acesso, perfil, equipe_id, pode_editar_equipes FROM usuarios WHERE id = ? LIMIT 1',
      [payload.id]
    );
    
    if (rows.length === 0) {
      console.log(`⚠️ Usuário ${payload.id} não encontrado no banco de dados`);
      return res.status(401).json({ 
        error: 'Usuário não encontrado. Por favor, faça login novamente.',
        requiresRelogin: true 
      });
    }
    
    const usuario = rows[0];
    
    // Adicionar pode_editar_equipes ao req.user para uso em outras rotas
    req.user.pode_editar_equipes = Boolean(usuario.pode_editar_equipes);
    
    const tokenCreatedAt = payload.iat * 1000; // Converter de segundos para milissegundos
    const userUpdatedAt = new Date(usuario.updated_at).getTime();
    
    // Se o usuário foi atualizado DEPOIS que o token foi criado, invalidar o token
    if (userUpdatedAt > tokenCreatedAt) {
      console.log(`🔒 Token invalidado para usuário ${payload.id} (${payload.nome})`);
      console.log(`   Token criado em: ${new Date(tokenCreatedAt).toISOString()}`);
      console.log(`   Usuário atualizado em: ${new Date(userUpdatedAt).toISOString()}`);
      console.log(`   Motivo: Administrador alterou dados do usuário`);
      
      return res.status(401).json({ 
        error: 'Suas informações foram atualizadas pelo administrador. Por favor, faça login novamente.',
        requiresRelogin: true 
      });
    }
    
    // VALIDAÇÃO 2: Se for solicitante, verificar se categoria_acesso mudou
    if (payload.perfil === 'solicitante') {
      const categoriaAtual = usuario.categoria_acesso;
      const categoriaToken = payload.categoria_acesso;
      
      // Se a categoria mudou, forçar novo login
      if (categoriaAtual !== categoriaToken) {
        console.log(`⚠️ Categoria alterada para usuário ${payload.id}: token="${categoriaToken}" → db="${categoriaAtual}"`);
        return res.status(401).json({ 
          error: 'Suas permissões foram atualizadas. Por favor, faça login novamente.',
          requiresRelogin: true 
        });
      }
    }
    
    // VALIDAÇÃO 3: Verificar se equipe_id mudou (importante para solicitantes)
    if (usuario.equipe_id && payload.equipe_id && usuario.equipe_id !== payload.equipe_id) {
      console.log(`⚠️ Equipe alterada para usuário ${payload.id}: token="${payload.equipe_id}" → db="${usuario.equipe_id}"`);
      return res.status(401).json({ 
        error: 'Sua equipe foi alterada. Por favor, faça login novamente.',
        requiresRelogin: true 
      });
    }
    
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    if (!roles.includes(req.user.perfil)) return res.status(403).json({ error: 'Sem permissão' });
    next();
  };
}

// Helper para verificar se usuário é admin OU gestor (acesso administrativo geral)
function requireAdminOrGestor(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.user.perfil !== 'admin' && req.user.perfil !== 'gestor') {
    return res.status(403).json({ error: 'Sem permissão' });
  }
  next();
}

// Helper para verificar se usuário é APENAS admin (acesso total incluindo produtos)
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  if (req.user.perfil !== 'admin') {
    return res.status(403).json({ error: 'Apenas administradores podem acessar esta funcionalidade' });
  }
  next();
}

module.exports = { authenticate, requireRole, requireAdminOrGestor, requireAdmin };
