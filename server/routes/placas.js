const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM placas ORDER BY numero').all());
});

router.post('/', (req, res) => {
  const { tipo, numero, modelo } = req.body;
  if (!tipo || !numero) return res.status(400).json({ error: 'Tipo e número obrigatórios' });
  const result = db.prepare('INSERT INTO placas (tipo, numero, modelo) VALUES (?, ?, ?)').run(tipo.trim(), numero.trim(), (modelo || '').trim());
  res.json({ id: result.lastInsertRowid, tipo: tipo.trim(), numero: numero.trim(), modelo: (modelo || '').trim() });
});

router.put('/:id', (req, res) => {
  const { tipo, numero, modelo } = req.body;
  if (!tipo || !numero) return res.status(400).json({ error: 'Tipo e número obrigatórios' });
  db.prepare('UPDATE placas SET tipo = ?, numero = ?, modelo = ? WHERE id = ?').run(tipo.trim(), numero.trim(), (modelo || '').trim(), req.params.id);
  res.json({ id: parseInt(req.params.id), tipo: tipo.trim(), numero: numero.trim(), modelo: (modelo || '').trim() });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM placas WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
