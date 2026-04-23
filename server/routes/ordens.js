const express = require('express');
const router = express.Router();
const db = require('../db');

function getNextCodigo() {
  const row = db.prepare("SELECT MAX(CAST(SUBSTR(codigo, 4) AS INTEGER)) as max FROM ordens").get();
  const next = (row.max || 0) + 1;
  return 'OS-' + String(next).padStart(4, '0');
}

function getOrdemFull(ordemId) {
  const ordem = db.prepare(`
    SELECT o.*, m.nome as motorista_nome, g.nome as gestor_nome, e.nome as encarregado_nome,
           ss.nome as status_nome, ss.sigla as status_sigla, ss.cor as status_cor
    FROM ordens o
    LEFT JOIN motoristas m ON o.motorista_id = m.id
    LEFT JOIN gestores g ON o.gestor_id = g.id
    LEFT JOIN encarregados e ON o.encarregado_id = e.id
    LEFT JOIN status_servico ss ON o.status_id = ss.id
    WHERE o.id = ?
  `).get(ordemId);

  if (!ordem) return null;

  const placas = db.prepare(`
    SELECT op.id, op.placa_id, op.km_horimetro, p.tipo, p.numero, p.modelo
    FROM ordem_placas op
    JOIN placas p ON op.placa_id = p.id
    WHERE op.ordem_id = ?
    ORDER BY op.id
  `).all(ordemId);

  const placasWithServicos = placas.map(p => {
    const servicos = db.prepare(`
      SELECT s.id, s.descricao, s.status_id, ss.nome as status_nome, ss.sigla as status_sigla, ss.cor as status_cor, s.created_at
      FROM servicos s
      LEFT JOIN status_servico ss ON s.status_id = ss.id
      WHERE s.ordem_placa_id = ?
      ORDER BY s.id
    `).all(p.id);

    const servicosWithObs = servicos.map(s => {
      const obs = db.prepare('SELECT * FROM observacoes_servico WHERE servico_id = ? ORDER BY created_at').all(s.id);
      return { ...s, observacoes: obs };
    });

    return { ...p, servicos: servicosWithObs };
  });

  return { ...ordem, placas: placasWithServicos };
}

router.get('/', (req, res) => {
  const ids = db.prepare('SELECT id FROM ordens ORDER BY id DESC').all();
  res.json(ids.map(r => getOrdemFull(r.id)));
});

router.get('/:id', (req, res) => {
  const ordem = getOrdemFull(parseInt(req.params.id));
  if (!ordem) return res.status(404).json({ error: 'Ordem não encontrada' });
  res.json(ordem);
});

router.post('/', (req, res) => {
  const { motorista_id, gestor_id, encarregado_id, status_id, destino, situacao, previsao, observacao, placas } = req.body;

  try {
    let ordemId;
    db.transaction(() => {
      const codigo = getNextCodigo();
      const result = db.prepare(
        'INSERT INTO ordens (codigo, motorista_id, gestor_id, encarregado_id, status_id, destino, situacao, previsao, observacao) VALUES (?,?,?,?,?,?,?,?,?)'
      ).run(codigo, motorista_id, gestor_id, encarregado_id, status_id || null, destino || '', situacao || '', previsao || '', observacao || '');

      ordemId = result.lastInsertRowid;

      for (const placa of (placas || [])) {
        const opRes = db.prepare('INSERT INTO ordem_placas (ordem_id, placa_id, km_horimetro) VALUES (?,?,?)').run(ordemId, placa.placa_id, placa.km_horimetro != null ? placa.km_horimetro : null);
        const ordemPlacaId = opRes.lastInsertRowid;
        for (const serv of (placa.servicos || [])) {
          db.prepare('INSERT INTO servicos (ordem_placa_id, descricao, status_id) VALUES (?,?,?)').run(ordemPlacaId, serv.descricao, serv.status_id || null);
        }
      }
    })();

    res.json(getOrdemFull(ordemId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const ordemId = parseInt(req.params.id);
  const { motorista_id, gestor_id, encarregado_id, status_id, destino, situacao, previsao, observacao, placas } = req.body;

  try {
    db.transaction(() => {
      db.prepare(
        'UPDATE ordens SET motorista_id=?, gestor_id=?, encarregado_id=?, status_id=?, destino=?, situacao=?, previsao=?, observacao=?, enviada_whatsapp=0 WHERE id=?'
      ).run(motorista_id, gestor_id, encarregado_id, status_id || null, destino || '', situacao || '', previsao || '', observacao || '', ordemId);

      if (!Array.isArray(placas)) return;

      const existingPlacas = db.prepare('SELECT id FROM ordem_placas WHERE ordem_id = ?').all(ordemId);
      const keepIds = new Set(placas.filter(p => p.id).map(p => p.id));

      // Delete placas removed by the user (cascades to servicos + observacoes)
      for (const ep of existingPlacas) {
        if (!keepIds.has(ep.id)) {
          db.prepare('DELETE FROM ordem_placas WHERE id = ?').run(ep.id);
        }
      }

      for (const placa of placas) {
        let ordemPlacaId = placa.id;

        if (!ordemPlacaId) {
          // New placa
          const r = db.prepare('INSERT INTO ordem_placas (ordem_id, placa_id, km_horimetro) VALUES (?,?,?)').run(ordemId, placa.placa_id, placa.km_horimetro != null ? placa.km_horimetro : null);
          ordemPlacaId = r.lastInsertRowid;
        }

        const existingServicos = db.prepare('SELECT id FROM servicos WHERE ordem_placa_id = ?').all(ordemPlacaId);
        const existingServIds = new Set(existingServicos.map(s => s.id));
        const keepServIds = new Set((placa.servicos || []).filter(s => s.id).map(s => s.id));

        // Delete removed servicos (cascades observacoes)
        for (const es of existingServicos) {
          if (!keepServIds.has(es.id)) {
            db.prepare('DELETE FROM servicos WHERE id = ?').run(es.id);
          }
        }

        for (const serv of (placa.servicos || [])) {
          if (serv.id && existingServIds.has(serv.id)) {
            db.prepare('UPDATE servicos SET descricao=?, status_id=? WHERE id=?').run(serv.descricao, serv.status_id || null, serv.id);
          } else if (!serv.id) {
            db.prepare('INSERT INTO servicos (ordem_placa_id, descricao, status_id) VALUES (?,?,?)').run(ordemPlacaId, serv.descricao, serv.status_id || null);
          }
        }
      }
    })();

    res.json(getOrdemFull(ordemId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM ordens WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/whatsapp', (req, res) => {
  const ordemId = parseInt(req.params.id);
  try {
    db.prepare('UPDATE ordens SET enviada_whatsapp = 1 WHERE id = ?').run(ordemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
