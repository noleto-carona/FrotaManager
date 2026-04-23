// Uses Node.js 22.5+ built-in SQLite — no native compilation needed.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// No Render, usamos o diretório /data para persistência (Disk)
// Localmente, mantemos a pasta ../db
const IS_RENDER = process.env.RENDER === 'true';
const dbDir = IS_RENDER ? '/opt/render/project/src/data' : path.join(__dirname, '..', 'db');

console.log(`[DB] Modo Render: ${IS_RENDER}`);
console.log(`[DB] Caminho do banco: ${path.join(dbDir, 'frota.db')}`);

if (!fs.existsSync(dbDir)) {
  console.log(`[DB] Criando diretório: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'frota.db');
const _db = new DatabaseSync(dbPath);

// Thin compatibility wrapper — same API surface as better-sqlite3
const db = {
  prepare: (sql) => _db.prepare(sql),
  exec: (sql) => { _db.exec(sql); return db; },
  pragma: (sql) => { _db.exec('PRAGMA ' + sql); return db; },
  transaction: (fn) => {
    return () => {
      _db.exec('BEGIN');
      try {
        fn();
        _db.exec('COMMIT');
      } catch (e) {
        _db.exec('ROLLBACK');
        throw e;
      }
    };
  }
};

try {
  // WAL mode can cause "disk I/O error" on Docker for Windows/WSL2 because of shared memory mapping.
  // We use a fallback if it fails.
  try {
    _db.exec('PRAGMA journal_mode = WAL');
  } catch (e) {
    console.log('[DB] Falha ao ativar WAL mode, usando padrão. Erro:', e.message);
  }
  _db.exec('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS motoristas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS gestores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS encarregados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS placas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      numero TEXT NOT NULL,
      modelo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS status_servico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      sigla TEXT NOT NULL,
      cor TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Comando de correção rápida: garante que a coluna sigla exista caso a tabela tenha sido criada anteriormente sem ela
  try {
    db.exec("ALTER TABLE status_servico ADD COLUMN sigla TEXT;");
    // Se a coluna foi adicionada agora, ela estará NULL. O script de auto-fill abaixo cuidará disso e o NOT NULL será aplicado em futuras criações.
  } catch (e) {
    // A coluna provavelmente já existe
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ordens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      motorista_id INTEGER,
      gestor_id INTEGER,
      encarregado_id INTEGER,
      destino TEXT,
      situacao TEXT,
      previsao TEXT,
      observacao TEXT,
      enviada_whatsapp INTEGER DEFAULT 0,
      status_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
      FOREIGN KEY (gestor_id) REFERENCES gestores(id),
      FOREIGN KEY (encarregado_id) REFERENCES encarregados(id),
      FOREIGN KEY (status_id) REFERENCES status_servico(id)
    )
  `);

  // Migration: Adicionar status_id na tabela ordens se não existir
  try {
    db.prepare("ALTER TABLE ordens ADD COLUMN status_id INTEGER REFERENCES status_servico(id)").run();
    console.log('[DB] Coluna status_id adicionada em ordens');
  } catch (e) {
    // A coluna provavelmente já existe
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS ordem_placas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordem_id INTEGER NOT NULL,
      placa_id INTEGER NOT NULL,
      km_horimetro REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ordem_id) REFERENCES ordens(id) ON DELETE CASCADE,
      FOREIGN KEY (placa_id) REFERENCES placas(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ordem_placa_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      status_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ordem_placa_id) REFERENCES ordem_placas(id) ON DELETE CASCADE,
      FOREIGN KEY (status_id) REFERENCES status_servico(id)
    )
  `);

  // Tabela de fotos dos serviços
  db.exec(`
    CREATE TABLE IF NOT EXISTS servico_fotos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servico_id INTEGER NOT NULL,
      arquivo_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
    )
  `);

  // Tabela de observações dos serviços
  db.exec(`
    CREATE TABLE IF NOT EXISTS observacoes_servico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      servico_id INTEGER NOT NULL,
      texto TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE
    )
  `);

  // Seed default status if empty
  const statusCount = db.prepare('SELECT COUNT(*) as total FROM status_servico').get().total;
  if (statusCount === 0) {
    const defaultStatus = [
      { nome: 'PENDENTE', sigla: 'PEN', cor: '#f59e0b' },
      { nome: 'EM ANDAMENTO', sigla: 'AND', cor: '#3b82f6' },
      { nome: 'FINALIZADO', sigla: 'FIN', cor: '#10b981' },
      { nome: 'TESTE', sigla: 'TST', cor: '#8b5cf6' },
      { nome: 'FINALIZADO COM PENDÊNCIA', sigla: 'FIP', cor: '#fa0000' }
    ];
    const stmt = db.prepare('INSERT INTO status_servico (nome, sigla, cor) VALUES (?, ?, ?)');
    defaultStatus.forEach(s => stmt.run(s.nome, s.sigla, s.cor));
  }

  // Migration: Adicionar FIP se não existir
  try {
    const fipExists = db.prepare("SELECT COUNT(*) as total FROM status_servico WHERE sigla = 'FIP'").get().total;
    if (fipExists === 0) {
      db.prepare("INSERT INTO status_servico (nome, sigla, cor) VALUES ('FINALIZADO COM PENDÊNCIA', 'FIP', '#fa0000')").run();
    }
  } catch (e) {
    console.error('[DB] Erro ao garantir status FIP:', e.message);
  }

  // Migration: Renomear REVISÃO para TESTE (Sigla: TST)
  try {
    db.prepare("UPDATE status_servico SET nome = 'TESTE', sigla = 'TST' WHERE nome = 'REVISÃO'").run();
  } catch (e) {
    // Erro ao atualizar ou não existe
  }

  // Migrations
  try {
    db.exec('ALTER TABLE status_servico ADD COLUMN sigla TEXT');
  } catch (e) {
    // Column already exists
  }

  // Auto-fill siglas if they are null
  const missingSiglas = db.prepare('SELECT id, nome FROM status_servico WHERE sigla IS NULL').all();
  if (missingSiglas.length > 0) {
    const updateStmt = db.prepare('UPDATE status_servico SET sigla = ? WHERE id = ?');
    missingSiglas.forEach(s => {
      let sigla = s.nome.substring(0, 3).toUpperCase();
      // Handle special cases
      if (s.nome === 'EM ANDAMENTO') sigla = 'AND';
      updateStmt.run(sigla, s.id);
    });
  }

  // Migrations
  try {
    db.exec('ALTER TABLE ordens ADD COLUMN enviada_whatsapp INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists or other error we can ignore for now
  }

  // TRIGGERS para resetar enviada_whatsapp = 0 em qualquer alteração
  // 1. Alteração em servicos
  db.exec(`DROP TRIGGER IF EXISTS trg_servicos_reset_wa_ins`);
  db.exec(`
    CREATE TRIGGER trg_servicos_reset_wa_ins AFTER INSERT ON servicos
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT ordem_id FROM ordem_placas WHERE id = NEW.ordem_placa_id);
    END;
  `);
  db.exec(`DROP TRIGGER IF EXISTS trg_servicos_reset_wa_upd`);
  db.exec(`
    CREATE TRIGGER trg_servicos_reset_wa_upd AFTER UPDATE ON servicos
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT ordem_id FROM ordem_placas WHERE id = NEW.ordem_placa_id);
    END;
  `);
  db.exec(`DROP TRIGGER IF EXISTS trg_servicos_reset_wa_del`);
  db.exec(`
    CREATE TRIGGER trg_servicos_reset_wa_del AFTER DELETE ON servicos
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT ordem_id FROM ordem_placas WHERE id = OLD.ordem_placa_id);
    END;
  `);

  // 2. Alteração em ordem_placas
  db.exec(`DROP TRIGGER IF EXISTS trg_placas_reset_wa_ins`);
  db.exec(`
    CREATE TRIGGER trg_placas_reset_wa_ins AFTER INSERT ON ordem_placas
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 WHERE id = NEW.ordem_id;
    END;
  `);
  db.exec(`DROP TRIGGER IF EXISTS trg_placas_reset_wa_upd`);
  db.exec(`
    CREATE TRIGGER trg_placas_reset_wa_upd AFTER UPDATE ON ordem_placas
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 WHERE id = NEW.ordem_id;
    END;
  `);
  db.exec(`DROP TRIGGER IF EXISTS trg_placas_reset_wa_del`);
  db.exec(`
    CREATE TRIGGER trg_placas_reset_wa_del AFTER DELETE ON ordem_placas
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 WHERE id = OLD.ordem_id;
    END;
  `);

  // 3. Alteração em servico_fotos
  db.exec(`DROP TRIGGER IF EXISTS trg_fotos_reset_wa_ins`);
  db.exec(`
    CREATE TRIGGER trg_fotos_reset_wa_ins AFTER INSERT ON servico_fotos
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT op.ordem_id FROM ordem_placas op JOIN servicos s ON s.ordem_placa_id = op.id WHERE s.id = NEW.servico_id);
    END;
  `);
  db.exec(`DROP TRIGGER IF EXISTS trg_fotos_reset_wa_del`);
  db.exec(`
    CREATE TRIGGER trg_fotos_reset_wa_del AFTER DELETE ON servico_fotos
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT op.ordem_id FROM ordem_placas op JOIN servicos s ON s.ordem_placa_id = op.id WHERE s.id = OLD.servico_id);
    END;
  `);

  // 4. Alteração em observacoes_servico
  db.exec(`DROP TRIGGER IF EXISTS trg_obs_reset_wa_ins`);
  db.exec(`
    CREATE TRIGGER trg_obs_reset_wa_ins AFTER INSERT ON observacoes_servico
    BEGIN
      UPDATE ordens SET enviada_whatsapp = 0 
      WHERE id = (SELECT op.ordem_id FROM ordem_placas op JOIN servicos s ON s.ordem_placa_id = op.id WHERE s.id = NEW.servico_id);
    END;
  `);
} catch (err) {
  console.error('Erro ao inicializar banco de dados:', err);
}

module.exports = db;
