const express = require('express');
const pool = require('../config/db.mysql');
const { authenticate, requireRole } = require('../middleware/auth');
const { verificarResetMensal } = require('../middleware/limitesMensais');
const { registrarNotificacaoIfNeeded, checarAlertaSaldo } = require('../services/alertaService');
const { syncPedidoOracle } = require('../services/oracleSyncService');
const emailService = require('../services/emailService');

const router = express.Router();

router.use(authenticate);
router.use(verificarResetMensal);

// Criar pedido (equipe)
router.post('/', requireRole('admin', 'gestor', 'solicitante'), async (req, res) => {
  console.log('🔵 POST /api/pedidos - Iniciando criação de pedido');
  console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
  console.log('👤 Usuário:', req.user);
  
  const conn = await pool.getConnection();
  console.log('✅ Conexão obtida do pool');
  
  try {
    const { equipe_id, itens = [] } = req.body || {};
    if (!equipe_id || !Array.isArray(itens) || itens.length === 0) {
      console.log('❌ Validação falhou: equipe_id ou itens inválidos');
      return res.status(400).json({ error: 'Informe equipe_id e itens' });
    }

    // Validar itens - quantidade e valor unitário devem ser positivos
    for (const item of itens) {
      const quantidade = Number(item.quantidade || 0);
      const valorUnitario = Number(item.valor_unitario || 0);
      
      if (quantidade <= 0) {
        console.log('❌ Quantidade inválida:', item);
        return res.status(400).json({ 
          error: `Quantidade inválida para o produto ${item.descricao}. A quantidade deve ser maior que zero.` 
        });
      }
      
      if (valorUnitario < 0) {
        console.log('❌ Valor unitário negativo:', item);
        return res.status(400).json({ 
          error: `Valor unitário inválido para o produto ${item.descricao}. O valor não pode ser negativo.` 
        });
      }
    }

    // Segurança: se usuário for 'solicitante', só pode criar para a própria equipe
    if (req.user && req.user.perfil === 'solicitante' && req.user.equipe_id && Number(req.user.equipe_id) !== Number(equipe_id)) {
      console.log('❌ Equipe não autorizada:', req.user.equipe_id, '!==', equipe_id);
      return res.status(403).json({ error: 'Equipe não autorizada para este pedido' });
    }

    console.log('🔄 Iniciando transação...');
    await conn.beginTransaction();

    // Buscar informações da equipe incluindo limites, codigo_erp e cgc
    const [[eq]] = await conn.execute(
      'SELECT id, limite_total, saldo_atual, limite_credito, limite_disponivel, vendedor_email, nome, codigo_erp, cgc FROM equipes WHERE id = ? FOR UPDATE', 
      [equipe_id]
    );
    console.log('📊 Equipe encontrada:', eq);
    
    if (!eq) { 
      console.log('❌ Equipe não encontrada:', equipe_id);
      await conn.rollback(); 
      return res.status(404).json({ error: 'Equipe não encontrada' }); 
    }

    // Validar itens antes de calcular
    console.log('📦 Itens recebidos:', JSON.stringify(itens, null, 2));
    
    if (!itens || itens.length === 0) {
      console.log('❌ Nenhum item no pedido');
      await conn.rollback();
      return res.status(400).json({ error: 'O pedido deve ter pelo menos um item.' });
    }

    // Calcular valor total e validar cada item
    let valor_total = 0;
    for (const item of itens) {
      const qtd = Number(item.quantidade || 0);
      const vlr = Number(item.valor_unitario || 0);
      
      console.log(`   Item: ${item.codprod} - Qtd: ${qtd}, Valor Unit: ${vlr}, Total: ${qtd * vlr}`);
      
      if (qtd <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Quantidade inválida para o produto ${item.codprod}` });
      }
      
      if (vlr < 0) {
        await conn.rollback();
        return res.status(400).json({ error: `Valor unitário inválido para o produto ${item.codprod}` });
      }
      
      valor_total += qtd * vlr;
    }
    
    console.log('💰 Valor total calculado do pedido:', valor_total);
    console.log('💵 Saldo atual da equipe:', eq.saldo_atual);
    console.log('🔓 Limite disponível:', eq.limite_disponivel || 0);

    // Validar valor total do pedido
    if (valor_total <= 0) {
      console.log('❌ Valor total inválido:', valor_total);
      await conn.rollback();
      return res.status(400).json({ 
        error: 'O valor total do pedido deve ser maior que zero. Verifique se os produtos têm preço cadastrado.' 
      });
    }

    // NOVA LÓGICA: TODOS os pedidos começam como PENDENTE_APROVACAO
    const limiteDisponivel = Number(eq.limite_disponivel || 0);
    let statusPedido = 'PENDENTE_APROVACAO'; // Sempre começa pendente - gestor deve aprovar
    let motivoPendencia = `Pedido aguardando aprovação do gestor. Valor: R$ ${valor_total.toFixed(2)}`;

    console.log('📋 Pedido criado como PENDENTE_APROVACAO (aguardando gestor)');
    console.log(`   Limite disponível: R$ ${limiteDisponivel.toFixed(2)}`);
    console.log(`   Valor do pedido: R$ ${valor_total.toFixed(2)}`);
    
    // await registrarNotificacaoIfNeeded(conn, equipe_id, 'PEDIDO_PENDENTE', motivoPendencia);

    // Nota: Removida a validação que bloqueava pedidos com saldo insuficiente
    // Agora pedidos acima do limite são criados como PENDENTE_APROVACAO
    // A lógica de statusPedido e motivoPendencia já trata isso corretamente acima

    console.log('💾 Inserindo pedido no banco com status:', statusPedido);
    const [r] = await conn.execute(
      'INSERT INTO pedidos (equipe_id, criado_por, valor_total, data, status, saldo_restante, origem, data_confirmacao, motivo_pendencia, codigo_erp, cgc) VALUES (?, ?, ?, NOW(), ?, ?, ?, NOW(), ?, ?, ?)',
      [equipe_id, req.user.id, valor_total, statusPedido, (eq.saldo_atual - valor_total), 'Local', motivoPendencia, eq.codigo_erp, eq.cgc]
    );
    const pedidoId = r.insertId;
    console.log('✅ Pedido inserido com ID:', pedidoId);
    
    // Verificar o status que foi gravado
    const [[pedidoVerificacao]] = await conn.execute('SELECT status FROM pedidos WHERE id = ?', [pedidoId]);
    console.log('🔍 Status gravado no banco:', pedidoVerificacao.status);
    
    console.log('📝 Pedido criado com dados da equipe:');
    console.log(`   codigo_erp: ${eq.codigo_erp || 'não informado'}`);
    console.log(`   cgc: ${eq.cgc || 'não informado'}`);

    for (const it of itens) {
      await conn.execute(
        'INSERT INTO itens_pedido (pedido_id, codprod, descricao, quantidade, valor_unitario, valor_total) VALUES (?, ?, ?, ?, ?, ?)',
        [pedidoId, it.codprod, it.descricao, it.quantidade, it.valor_unitario, (Number(it.quantidade)*Number(it.valor_unitario))]
      );
    }

    // NÃO debitar saldo - pedido está pendente de aprovação do gestor
    console.log('⏸️  Pedido PENDENTE - NÃO debitando saldo (aguarda aprovação do gestor)');

    // await checarAlertaSaldo(conn, equipe_id); // alerta < 10%

    console.log('✅ Commit da transação...');
    await conn.commit();
    console.log('✅ Transação commitada com sucesso!');

    // Enviar notificação por email após commit bem-sucedido
    try {
      console.log('📧 Tentando enviar email de notificação...');
      
      // Buscar dados completos do pedido incluindo codigo_erp e cgc
      const [[pedidoCompleto]] = await conn.execute(
        'SELECT p.id, p.valor_total, p.data, p.status, p.codigo_erp, p.cgc FROM pedidos p WHERE p.id = ?',
        [pedidoId]
      );
      
      const [[equipeInfo]] = await conn.execute(
        'SELECT e.nome, e.vendedor_email, e.gestor_id, u.email as gestor_email FROM equipes e LEFT JOIN usuarios u ON u.id = e.gestor_id WHERE e.id = ?', 
        [equipe_id]
      );
      
      console.log('📋 Info da equipe:', equipeInfo);
      console.log('📋 Info do pedido:', pedidoCompleto);
      
      // Pedido PENDENTE: enviar email APENAS para o GESTOR
      if (equipeInfo && equipeInfo.gestor_email) {
        console.log('📧 Enviando email de solicitação de aprovação para o GESTOR:', equipeInfo.gestor_email);
        await emailService.enviarSolicitacaoAprovacao({
          pedido: pedidoCompleto,
          equipe: equipeInfo,
          itens: itens,
          vendedorEmail: equipeInfo.gestor_email,
          motivoPendencia: motivoPendencia
        });
        console.log('✅ Email de solicitação enviado para o gestor!');
      } else {
        console.log('⚠️  Email não enviado: gestor_email não configurado');
      }
      
      // NÃO enviar email para vendedor enquanto pedido está pendente
      console.log('ℹ️  Email para vendedor será enviado apenas após aprovação do gestor');
      
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de notificação:', emailError);
      // Não falha a operação se email der erro
    }

    console.log('🎉 Retornando sucesso para o cliente:', { id: pedidoId, status: statusPedido });
    res.status(201).json({ 
      id: pedidoId, 
      status: statusPedido,
      mensagem: 'Pedido criado com sucesso! Aguardando aprovação do gestor.'
    });
  } catch (e) {
    console.error('❌ ERRO FATAL ao criar pedido:', e);
    console.error('❌ Stack:', e.stack);
    await conn.rollback();
    console.error('Erro criar pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    console.log('🔄 Liberando conexão...');
    conn.release();
    console.log('✅ Conexão liberada');
  }
});

// Listar pedidos
router.get('/', requireRole('admin', 'gestor', 'solicitante'), async (req, res) => {
  let { status, equipe_id } = req.query;
  let page = parseInt(req.query.page || '1', 10);
  let pageSize = parseInt(req.query.pageSize || '20', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 1000) pageSize = 1000;

  const where = [];
  const vals = [];
  if (status) { where.push('p.status = ?'); vals.push(status); }
  if (equipe_id) { where.push('p.equipe_id = ?'); vals.push(equipe_id); }

  // segurança: usuário equipe só pode listar os próprios pedidos
  if (req.user && req.user.perfil === 'solicitante' && req.user.equipe_id) {
    where.push('p.equipe_id = ?');
    vals.push(req.user.equipe_id);
  }
  
  // segurança: gestor só pode listar pedidos das suas equipes
  if (req.user && req.user.perfil === 'gestor') {
    const [equipesGestor] = await pool.execute(
      'SELECT equipe_id FROM usuarios_equipes WHERE usuario_id = ?',
      [req.user.id]
    );
    
    if (equipesGestor.length > 0) {
      const equipesIds = equipesGestor.map(e => e.equipe_id);
      where.push(`p.equipe_id IN (${equipesIds.map(() => '?').join(',')})`);
      vals.push(...equipesIds);
    } else {
      // Gestor sem equipes não vê nenhum pedido
      where.push('1 = 0');
    }
  }

  const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM pedidos p JOIN equipes e ON e.id = p.equipe_id ${whereSql}`,
    vals
  );
  
  const offset = (page - 1) * pageSize;
  const [rows] = await pool.execute(
    `SELECT p.*, e.nome AS equipe_nome, e.codigo_erp, e.cgc FROM pedidos p JOIN equipes e ON e.id = p.equipe_id ${whereSql} ORDER BY p.data DESC LIMIT ${pageSize} OFFSET ${offset}`,
    vals
  );
  
  res.json({ pedidos: rows, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

// Cancelar pedido (AGUARDANDO)
router.post('/:id/cancelar', requireRole('admin', 'gestor', 'solicitante'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    await conn.beginTransaction();
    const [[ped]] = await conn.execute('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [id]);
    if (!ped) { await conn.rollback(); return res.status(404).json({ error: 'Pedido não encontrado' }); }
    if (ped.status !== 'AGUARDANDO') { await conn.rollback(); return res.status(400).json({ error: 'Somente pedidos AGUARDANDO podem ser cancelados' }); }
    // equipe só pode cancelar pedido da própria equipe
    if (req.user && req.user.perfil === 'solicitante' && req.user.equipe_id && Number(req.user.equipe_id) !== Number(ped.equipe_id)) {
      await conn.rollback();
      return res.status(403).json({ error: 'Sem permissão para cancelar este pedido' });
    }

    // estorna saldo
    await conn.execute('UPDATE equipes SET saldo_atual = saldo_atual + ?, limite_disponivel = limite_disponivel + ? WHERE id = ?', [ped.valor_total, ped.valor_total, ped.equipe_id]);
    // marca cancelado
    await conn.execute('UPDATE pedidos SET status = ? WHERE id = ?', ['CANCELADO', id]);

    await conn.commit();
    res.json({ message: 'Pedido cancelado', id });
  } catch (e) {
    await conn.rollback();
    console.error('Erro cancelar pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    conn.release();
  }
});

// Buscar detalhes de um pedido específico com rastreamento
router.get('/:id', requireRole('admin', 'gestor', 'solicitante'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar pedido
    const [[pedido]] = await pool.execute(
      `SELECT p.*, e.nome AS equipe_nome 
       FROM pedidos p 
       JOIN equipes e ON e.id = p.equipe_id 
       WHERE p.id = ?`,
      [id]
    );
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Segurança: equipe só pode ver próprios pedidos
    if (req.user && req.user.perfil === 'solicitante' && req.user.equipe_id && Number(req.user.equipe_id) !== Number(pedido.equipe_id)) {
      return res.status(403).json({ error: 'Sem permissão para ver este pedido' });
    }
    
    // Buscar itens do pedido
    const [itens] = await pool.execute(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );
    
    res.json({ pedido, itens });
  } catch (e) {
    console.error('Erro ao buscar pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar status de rastreamento (apenas gestor)
router.put('/:id/rastreamento', requireRole('admin', 'gestor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { etapa, observacoes } = req.body;
    
    await conn.beginTransaction();
    
    const [[pedido]] = await conn.execute('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [id]);
    if (!pedido) {
      await conn.rollback();
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    let updateFields = [];
    let updateValues = [];
    let newStatus = pedido.status;
    
    switch(etapa) {
      case 'confirmacao':
        updateFields.push('data_confirmacao = NOW()');
        newStatus = 'AGUARDANDO';
        break;
      case 'separacao':
        updateFields.push('data_separacao = NOW()');
        newStatus = 'EM_SEPARACAO';
        break;
      case 'transporte':
        updateFields.push('data_transporte = NOW()');
        newStatus = 'EM_TRANSPORTE';
        break;
      case 'saida':
        updateFields.push('data_saida = NOW()');
        newStatus = 'SAIU_ENTREGA';
        break;
      case 'entrega':
        updateFields.push('data_entrega = NOW()');
        newStatus = 'ENTREGUE';
        break;
      default:
        await conn.rollback();
        return res.status(400).json({ error: 'Etapa inválida' });
    }
    
    if (observacoes) {
      updateFields.push('observacoes_rastreamento = ?');
      updateValues.push(observacoes);
    }
    
    updateFields.push('status = ?');
    updateValues.push(newStatus);
    updateValues.push(id);
    
    await conn.execute(
      `UPDATE pedidos SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    await conn.commit();
    
    res.json({ message: 'Rastreamento atualizado', status: newStatus });
  } catch (e) {
    await conn.rollback();
    console.error('Erro ao atualizar rastreamento:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    conn.release();
  }
});

// Aprovar pedido e aumentar limite (apenas gestor)
router.put('/:id/aprovar', requireRole('admin', 'gestor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { aumentar_limite } = req.body; // valor a aumentar no limite
    
    await conn.beginTransaction();
    
    const [[pedido]] = await conn.execute(
      'SELECT p.*, e.limite_disponivel, e.limite_credito FROM pedidos p JOIN equipes e ON e.id = p.equipe_id WHERE p.id = ? FOR UPDATE',
      [id]
    );
    
    if (!pedido) {
      await conn.rollback();
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    if (pedido.status !== 'PENDENTE_APROVACAO') {
      await conn.rollback();
      return res.status(400).json({ error: 'Pedido não está pendente de aprovação' });
    }
    
    // Calcular limite necessário
    const limiteDisponivel = Number(pedido.limite_disponivel);
    const valorPedido = Number(pedido.valor_total);
    const faltante = valorPedido - limiteDisponivel;
    
    // Se não tiver limite suficiente, exigir aumento
    if (faltante > 0 && (!aumentar_limite || Number(aumentar_limite) < faltante)) {
      await conn.rollback();
      return res.status(400).json({ 
        error: 'Limite insuficiente',
        limite_disponivel: limiteDisponivel,
        valor_pedido: valorPedido,
        faltante: faltante,
        message: `Limite disponível insuficiente. É necessário aumentar o limite em pelo menos R$ ${faltante.toFixed(2)}`
      });
    }
    
    // Se for aumentar o limite
    if (aumentar_limite && Number(aumentar_limite) > 0) {
      await conn.execute(
        'UPDATE equipes SET limite_credito = limite_credito + ?, limite_disponivel = limite_disponivel + ? WHERE id = ?',
        [aumentar_limite, aumentar_limite, pedido.equipe_id]
      );
    }
    
    // Debitar do limite disponível e saldo atual
    await conn.execute(
      'UPDATE equipes SET limite_disponivel = limite_disponivel - ?, saldo_atual = saldo_atual - ? WHERE id = ?',
      [pedido.valor_total, pedido.valor_total, pedido.equipe_id]
    );
    
    console.log('💳 Crédito debitado na aprovação do gestor:');
    console.log(`   Valor debitado: R$ ${Number(pedido.valor_total).toFixed(2)}`);
    console.log(`   Equipe ID: ${pedido.equipe_id}`);
    
    // Atualizar status do pedido para APROVADO
    await conn.execute(
      'UPDATE pedidos SET status = ?, motivo_pendencia = NULL, data_confirmacao = NOW(), aprovado_por = ?, data_aprovacao = NOW() WHERE id = ?',
      ['APROVADO', req.user.id, id]
    );
    
    await conn.commit();
    
    // Buscar dados completos do pedido e equipe para enviar email
    const [[pedidoCompleto]] = await conn.execute(`
      SELECT p.*, e.nome as equipe_nome, e.vendedor_email,
             u_criador.nome as comprador_nome, u_criador.email as comprador_email,
             u_aprovador.nome as gestor_nome, u_aprovador.email as gestor_email
      FROM pedidos p
      JOIN equipes e ON e.id = p.equipe_id
      LEFT JOIN usuarios u_criador ON u_criador.id = p.criado_por
      LEFT JOIN usuarios u_aprovador ON u_aprovador.id = p.aprovado_por
      WHERE p.id = ?
    `, [id]);
    
    const [itens] = await conn.execute(
      'SELECT * FROM itens_pedido WHERE pedido_id = ?',
      [id]
    );
    
    // Enviar email para destinatários cadastrados em emails_notificacao
    try {
      console.log('📧 Enviando email de pedido aprovado para destinatários cadastrados...');
      await emailService.enviarPedidoAprovado({
        pedido: {
          id: pedidoCompleto.id,
          valor_total: pedidoCompleto.valor_total,
          data: pedidoCompleto.data,
          data_aprovacao: pedidoCompleto.data_aprovacao,
          status: 'APROVADO',
          codigo_erp: pedidoCompleto.codigo_erp,
          cgc: pedidoCompleto.cgc
        },
        equipe: {
          nome: pedidoCompleto.equipe_nome
        },
        comprador: {
          nome: pedidoCompleto.comprador_nome || 'Não informado',
          email: pedidoCompleto.comprador_email || ''
        },
        gestor: {
          nome: pedidoCompleto.gestor_nome || req.user.nome,
          email: pedidoCompleto.gestor_email || req.user.email
        },
        itens: itens
      });
      console.log(`✅ Email de pedido aprovado enviado com sucesso`);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de aprovação:', emailError);
      console.error('⚠️ Stack:', emailError.stack);
      // Não falhar a aprovação por erro de email
    }
    
    res.json({ 
      message: 'Pedido aprovado com sucesso!',
      pedido_id: id,
      status: 'APROVADO'
    });
  } catch (e) {
    await conn.rollback();
    console.error('Erro ao aprovar pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    conn.release();
  }
});

// Rejeitar pedido (apenas gestor)
router.put('/:id/rejeitar', requireRole('admin', 'gestor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    await conn.beginTransaction();
    
    const [[pedido]] = await conn.execute(
      'SELECT * FROM pedidos WHERE id = ? FOR UPDATE',
      [id]
    );
    
    if (!pedido) {
      await conn.rollback();
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    if (pedido.status !== 'PENDENTE_APROVACAO') {
      await conn.rollback();
      return res.status(400).json({ error: 'Pedido não está pendente de aprovação' });
    }
    
    // Devolver o saldo para a equipe (já foi debitado na criação)
    await conn.execute(
      'UPDATE equipes SET saldo_atual = saldo_atual + ?, limite_disponivel = limite_disponivel + ? WHERE id = ?',
      [pedido.valor_total, pedido.valor_total, pedido.equipe_id]
    );
    
    // Atualizar status do pedido
    await conn.execute(
      'UPDATE pedidos SET status = ?, motivo_pendencia = ? WHERE id = ?',
      ['CANCELADO', motivo || 'Rejeitado pelo gestor - limite de crédito insuficiente', id]
    );
    
    await conn.commit();
    
    res.json({ 
      message: 'Pedido rejeitado',
      pedido_id: id,
      status: 'CANCELADO'
    });
  } catch (e) {
    await conn.rollback();
    console.error('Erro ao rejeitar pedido:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    conn.release();
  }
});

// Atualizar limite de crédito da equipe (apenas gestor)
router.put('/equipe/:equipe_id/limite', requireRole('admin', 'gestor'), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { equipe_id } = req.params;
    const { novo_limite } = req.body;
    
    if (!novo_limite || Number(novo_limite) < 0) {
      return res.status(400).json({ error: 'Informe um valor válido para o novo limite' });
    }
    
    await conn.beginTransaction();
    
    const [[equipe]] = await conn.execute(
      'SELECT limite_credito, limite_disponivel FROM equipes WHERE id = ? FOR UPDATE',
      [equipe_id]
    );
    
    if (!equipe) {
      await conn.rollback();
      return res.status(404).json({ error: 'Equipe não encontrada' });
    }
    
    // Calcular a diferença e ajustar o disponível proporcionalmente
    const diferenca = Number(novo_limite) - Number(equipe.limite_credito);
    
    await conn.execute(
      'UPDATE equipes SET limite_credito = ?, limite_disponivel = limite_disponivel + ? WHERE id = ?',
      [novo_limite, diferenca, equipe_id]
    );
    
    await conn.commit();
    
    res.json({ 
      message: 'Limite atualizado com sucesso',
      limite_anterior: equipe.limite_credito,
      limite_novo: novo_limite,
      diferenca: diferenca
    });
  } catch (e) {
    await conn.rollback();
    console.error('Erro ao atualizar limite:', e);
    res.status(500).json({ error: 'Erro interno' });
  } finally {
    conn.release();
  }
});

module.exports = { router };
