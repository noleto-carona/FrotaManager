// Uses Node.js 22.5+ built-in SQLite — no native compilation needed.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const _db = new DatabaseSync(path.join(dbDir, 'frota.db'));

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
  _db.exec('PRAGMA journal_mode = WAL');
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
      cor TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (motorista_id) REFERENCES motoristas(id),
      FOREIGN KEY (gestor_id) REFERENCES gestores(id),
      FOREIGN KEY (encarregado_id) REFERENCES encarregados(id)
    )
  `);

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

  // Migrations
  try {
    db.exec('ALTER TABLE ordens ADD COLUMN enviada_whatsapp INTEGER DEFAULT 0');
  } catch (e) {
    // Column already exists or other error we can ignore for now
  }

  // Seed default status if empty
  const statusCount = db.prepare('SELECT COUNT(*) as total FROM status_servico').get().total;
  if (statusCount === 0) {
    const defaultStatus = [
      { nome: 'PENDENTE', cor: '#f59e0b' },
      { nome: 'EM ANDAMENTO', cor: '#3b82f6' },
      { nome: 'FINALIZADO', cor: '#10b981' }
    ];
    const stmt = db.prepare('INSERT INTO status_servico (nome, cor) VALUES (?, ?)');
    defaultStatus.forEach(s => stmt.run(s.nome, s.cor));
  }
} catch (err) {
  console.error('Erro ao inicializar banco de dados:', err);
}

module.exports = db;
