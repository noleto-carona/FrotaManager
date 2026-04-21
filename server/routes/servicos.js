const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do Multer para salvar arquivos reais
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'servico-' + req.params.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB por arquivo
});

// Listar todos os serviços
router.get('/', (req, res) => {
  const list = db.prepare('SELECT * FROM servicos').all();
  res.json(list);
});

// Detalhar um serviço (com fotos e obs)
router.get('/:id', (req, res) => {
  try {
    const serv = db.prepare(`
      SELECT s.id, s.descricao, s.status_id, ss.nome as status_nome, ss.cor as status_cor, s.created_at
      FROM servicos s
      LEFT JOIN status_servico ss ON s.status_id = ss.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!serv) return res.status(404).json({ error: 'Serviço não encontrado' });

    const obs = db.prepare('SELECT * FROM observacoes_servico WHERE servico_id = ? ORDER BY created_at').all(req.params.id);
    const fotos = db.prepare('SELECT id, arquivo_path, created_at FROM servico_fotos WHERE servico_id = ?').all(req.params.id);
    res.json({ ...serv, observacoes: obs, fotos: fotos });
  } catch (err) {
    console.error('Erro ao buscar serviço:', err);
    res.status(500).json({ error: 'Erro interno ao buscar serviço' });
  }
});

// Upload de foto (Arquivo Real)
router.post('/:id/fotos', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  try {
    const count = db.prepare('SELECT COUNT(*) as total FROM servico_fotos WHERE servico_id = ?').get(req.params.id).total;
    if (count >= 5) {
      fs.unlinkSync(req.file.path); // Remove arquivo se exceder limite
      return res.status(400).json({ error: 'Limite de 5 fotos atingido' });
    }

    const relPath = '/uploads/' + req.file.filename;
    db.prepare('INSERT INTO servico_fotos (servico_id, arquivo_path) VALUES (?,?)').run(req.params.id, relPath);
    res.json({ success: true, path: relPath });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Erro no banco: ' + err.message });
  }
});

// Excluir foto
router.delete('/:id/fotos/:fotoId', (req, res) => {
  try {
    const foto = db.prepare('SELECT arquivo_path FROM servico_fotos WHERE id = ?').get(req.params.fotoId);
    if (foto) {
      const fullPath = path.join(__dirname, '../../', foto.arquivo_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      db.prepare('DELETE FROM servico_fotos WHERE id = ?').run(req.params.fotoId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { descricao, status_id } = req.body;
  if (!descricao || !descricao.trim()) return res.status(400).json({ error: 'Descrição obrigatória' });
  db.prepare('UPDATE servicos SET descricao=?, status_id=? WHERE id=?').run(descricao.trim(), status_id || null, req.params.id);
  res.json({ success: true });
});

router.post('/:id/observacoes', (req, res) => {
  const { texto } = req.body;
  if (!texto || !texto.trim()) return res.status(400).json({ error: 'Texto obrigatório' });
  if (texto.trim().length > 150) return res.status(400).json({ error: 'Máximo 150 caracteres' });

  try {
    const result = db.prepare('INSERT INTO observacoes_servico (servico_id, texto) VALUES (?,?)').run(req.params.id, texto.trim());
    const obs = db.prepare('SELECT * FROM observacoes_servico WHERE id = ?').get(result.lastInsertRowid);
    res.json(obs);
  } catch (err) {
    console.error('Erro ao salvar observação:', err);
    res.status(500).json({ error: 'Erro interno ao salvar observação' });
  }
});

module.exports = router;
