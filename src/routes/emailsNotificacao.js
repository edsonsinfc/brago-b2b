const express = require('express');
const pool = require('../config/db.mysql');
const { authenticate, requireAdminOrGestor } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdminOrGestor);

// Listar emails
router.get('/', async (req, res) => {
  try {
    const [emails] = await pool.execute(`
      SELECT id, email, nome, tipo, ativo, created_at, updated_at
      FROM emails_notificacao
      ORDER BY nome ASC
    `);
    
    res.json({ emails });
  } catch (error) {
    console.error('Erro ao listar emails:', error);
    res.status(500).json({ error: 'Erro ao listar emails' });
  }
});

// Criar email
router.post('/', async (req, res) => {
  try {
    const { email, nome, tipo = 'todos', ativo = true } = req.body;
    
    if (!email || !nome) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO emails_notificacao (email, nome, tipo, ativo)
      VALUES (?, ?, ?, ?)
    `, [email, nome, tipo, ativo]);
    
    res.json({ 
      id: result.insertId, 
      email, 
      nome, 
      tipo, 
      ativo 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    console.error('Erro ao criar email:', error);
    res.status(500).json({ error: 'Erro ao criar email' });
  }
});

// Atualizar email
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nome, tipo, ativo } = req.body;
    
    const updates = [];
    const values = [];
    
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (nome !== undefined) { updates.push('nome = ?'); values.push(nome); }
    if (tipo !== undefined) { updates.push('tipo = ?'); values.push(tipo); }
    if (ativo !== undefined) { updates.push('ativo = ?'); values.push(ativo); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    values.push(id);
    
    await pool.execute(`
      UPDATE emails_notificacao 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    res.json({ message: 'Email atualizado com sucesso' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    console.error('Erro ao atualizar email:', error);
    res.status(500).json({ error: 'Erro ao atualizar email' });
  }
});

// Excluir email
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM emails_notificacao WHERE id = ?', [id]);
    
    res.json({ message: 'Email excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir email:', error);
    res.status(500).json({ error: 'Erro ao excluir email' });
  }
});

// Obter emails ativos por tipo
router.get('/ativos/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    
    const [emails] = await pool.execute(`
      SELECT email, nome
      FROM emails_notificacao
      WHERE ativo = true AND (tipo = ? OR tipo = 'todos')
      ORDER BY nome ASC
    `, [tipo]);
    
    res.json({ emails });
  } catch (error) {
    console.error('Erro ao buscar emails ativos:', error);
    res.status(500).json({ error: 'Erro ao buscar emails ativos' });
  }
});

module.exports = router;
