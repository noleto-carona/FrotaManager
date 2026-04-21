const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM status_servico ORDER BY id').all());
});

router.post('/', (req, res) => {
  const { nome, cor } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  const result = db.prepare('INSERT INTO status_servico (nome, cor) VALUES (?, ?)').run(nome.trim(), cor || '#94a3b8');
  res.json({ id: result.lastInsertRowid, nome: nome.trim(), cor: cor || '#94a3b8' });
});

router.put('/:id', (req, res) => {
  const { nome, cor } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  db.prepare('UPDATE status_servico SET nome = ?, cor = ? WHERE id = ?').run(nome.trim(), cor || '#94a3b8', req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM status_servico WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir status:', err.message);
    if (err.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: 'Este status está sendo usado em serviços e não pode ser removido.' });
    }
    res.status(500).json({ error: 'Erro interno ao excluir status' });
  }
});

module.exports = router;
