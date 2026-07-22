const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

// Ferramenta de desenvolvimento local: grava direto no banco SQLite usado
// pelo servidor rodando na sua máquina (data/app.db). Em produção (Railway),
// o banco vive num volume separado do código — use a página /admin do site
// para criar usuários lá.

const DB_PATH =
  process.env.DATABASE_PATH ||
  path.join(__dirname, "..", "data", "app.db");

function fail(message) {
  console.error(`Erro: ${message}`);
  process.exit(1);
}

const [, , nome, email, senha] = process.argv;

if (!nome || !email || !senha) {
  console.log(
    "Uso: node scripts/create-user.js \"Nome Completo\" email@dominio.com senha\n"
  );
  console.log(
    "Exemplo: node scripts/create-user.js \"Ana Paula\" ana@internit.com.br minhasenha123"
  );
  console.log(
    "\nAtenção: isso grava no banco LOCAL (data/app.db). Para criar usuários em produção, use a página /admin do site."
  );
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  fail(
    `banco de dados não encontrado em ${DB_PATH}. Rode "npm run dev" pelo menos uma vez antes, para ele ser criado/inicializado.`
  );
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Disponivel',
    room TEXT NOT NULL DEFAULT 'Recepção',
    sala_nome TEXT,
    avatar_tipo TEXT,
    avatar_valor TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0
  )
`);

const existing = db
  .prepare(
    "SELECT id FROM users WHERE lower(email) = lower(?)"
  )
  .get(email);

if (existing) {
  fail(`já existe um usuário com o e-mail ${email}`);
}

const senhaHash = bcrypt.hashSync(senha, 10);

const result = db
  .prepare(
    `INSERT INTO users (nome, email, senha_hash)
     VALUES (?, ?, ?)`
  )
  .run(nome, email, senhaHash);

console.log(
  `Usuário "${nome}" criado com id ${result.lastInsertRowid} no banco local.`
);
console.log(
  `A sala pessoal "Espaço ${nome}" já aparece automaticamente no menu lateral.`
);
console.log(
  "Isso só afeta o banco local. Em produção, crie o usuário pela página /admin do site."
);
