const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM encarregados ORDER BY nome').all());
});

router.post('/', (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  const result = db.prepare('INSERT INTO encarregados (nome) VALUES (?)').run(nome.trim());
  res.json({ id: result.lastInsertRowid, nome: nome.trim() });
});

router.put('/:id', (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome obrigatório' });
  db.prepare('UPDATE encarregados SET nome = ? WHERE id = ?').run(nome.trim(), req.params.id);
  res.json({ id: parseInt(req.params.id), nome: nome.trim() });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM encarregados WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
