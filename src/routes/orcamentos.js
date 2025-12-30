const express = require('express');
const router = express.Router();
const db = require('../config/db.mysql');
const { authenticate } = require('../middleware/auth');
const { verificarResetMensal } = require('../middleware/limitesMensais');
const emailService = require('../services/emailService');

router.use(verificarResetMensal);

// POST /api/orcamentos - Enviar solicitação de orçamento
router.post('/', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { itens } = req.body;
    const usuario_id = req.user.id;
    
    // Validações
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Nenhum item no orçamento' });
    }
    
    // Buscar informações do usuário e equipe
    const [usuarios] = await connection.query(
      `SELECT u.id, u.nome, u.email, u.equipe_id, 
              e.nome as equipe_nome, e.cgc, e.codigo_erp, e.vendedor_email
       FROM usuarios u
       LEFT JOIN equipes e ON u.equipe_id = e.id
       WHERE u.id = ?`,
      [usuario_id]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = usuarios[0];
    
    // Inserir orçamento
    const [result] = await connection.query(
      `INSERT INTO orcamentos (usuario_id, equipe_id, status, data_solicitacao)
       VALUES (?, ?, 'pendente', NOW())`,
      [usuario_id, usuario.equipe_id]
    );
    
    const orcamento_id = result.insertId;
    
    // Buscar detalhes dos produtos
    const produto_ids = itens.map(item => item.produto_id);
    const [produtos] = await connection.query(
      `SELECT id, codprod, descricao, unidade, preco 
       FROM produtos 
       WHERE id IN (?)`,
      [produto_ids]
    );
    
    // Criar mapa de produtos
    const produtosMap = {};
    produtos.forEach(p => {
      produtosMap[p.id] = p;
    });
    
    // Inserir itens do orçamento
    for (const item of itens) {
      const produto = produtosMap[item.produto_id];
      if (produto) {
        await connection.query(
          `INSERT INTO orcamento_itens 
           (orcamento_id, produto_id, codprod, descricao, quantidade, observacao)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orcamento_id,
            item.produto_id,
            produto.codprod,
            produto.descricao,
            item.quantidade || 1,
            item.observacao || null
          ]
        );
      }
    }
    
    // Enviar email para o vendedor da equipe
    if (usuario.vendedor_email) {
      const itensHtml = itens.map(item => {
        const produto = produtosMap[item.produto_id];
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${produto.codprod}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${produto.descricao}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantidade}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.observacao || '-'}</td>
          </tr>
        `;
      }).join('');
      
      await emailService.enviarEmail(
        usuario.vendedor_email,
        `Nova Solicitação de Orçamento #${orcamento_id}`,
        `
          <h2 style="color: #3b82f6;">🛒 Nova Solicitação de Orçamento</h2>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Orçamento #:</strong> ${orcamento_id}</p>
            <p><strong>Cliente:</strong> ${usuario.equipe_nome || 'N/A'} ${usuario.cgc ? `(${usuario.cgc})` : ''}</p>
            <p><strong>Código ERP:</strong> ${usuario.codigo_erp || 'N/A'}</p>
            <p><strong>Solicitante:</strong> ${usuario.nome}</p>
            <p><strong>Email:</strong> ${usuario.email}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
          </div>
          
          <h3 style="margin-top: 30px;">Produtos Solicitados:</h3>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Código</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produto</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qtd</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Observação</th>
              </tr>
            </thead>
            <tbody>
              ${itensHtml}
            </tbody>
          </table>
          
          <p style="margin-top: 30px; color: #6b7280;">
            Por favor, prepare o orçamento e entre em contato com o cliente o mais breve possível.
          </p>
        `
      );
      console.log(`📧 Email de orçamento #${orcamento_id} enviado para: ${usuario.vendedor_email}`);
    } else {
      console.log('⚠️ Equipe não possui vendedor_email cadastrado para receber o orçamento');
    }
    
    res.json({
      success: true,
      orcamento_id,
      message: 'Orçamento enviado com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ 
      error: 'Erro ao criar orçamento',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});

// GET /api/orcamentos - Listar orçamentos do usuário
router.get('/', authenticate, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const usuario_id = req.user.id;
    const perfil = req.user.perfil;
    
    let query = `
      SELECT o.id, o.usuario_id, o.equipe_id, o.status, 
             o.data_solicitacao, o.data_resposta,
             u.nome as usuario_nome,
             e.nome as equipe_nome,
             COUNT(oi.id) as total_itens
      FROM orcamentos o
      LEFT JOIN usuarios u ON o.usuario_id = u.id
      LEFT JOIN equipes e ON o.equipe_id = e.id
      LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id
    `;
    
    const params = [];
    
    if (perfil === 'solicitante') {
      query += ' WHERE o.usuario_id = ?';
      params.push(usuario_id);
    } else if (perfil === 'gestor') {
      // Gestor vê orçamentos da sua equipe
      const [usuario] = await connection.query(
        'SELECT equipe_id FROM usuarios WHERE id = ?',
        [usuario_id]
      );
      if (usuario[0]?.equipe_id) {
        query += ' WHERE o.equipe_id = ?';
        params.push(usuario[0].equipe_id);
      }
    }
    // Admin vê todos
    
    query += ' GROUP BY o.id ORDER BY o.data_solicitacao DESC';
    
    const [orcamentos] = await connection.query(query, params);
    
    res.json(orcamentos);
    
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ error: 'Erro ao listar orçamentos' });
  } finally {
    connection.release();
  }
});

module.exports = { router };
