import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// Se DATABASE_PATH não for definido, detecta sozinho um volume persistente
// montado em /data (convenção comum em hospedagens como o Railway) — assim
// não é preciso configurar nenhuma variável de ambiente à parte, só montar
// o volume nesse caminho.
function resolveDbPath() {

  if (process.env.DATABASE_PATH) {
    console.log(
      `[db] Usando DATABASE_PATH definido no ambiente: ${process.env.DATABASE_PATH}`
    );
    return process.env.DATABASE_PATH;
  }

  const volumeExists = fs.existsSync("/data");

  console.log(
    `[db] /data existe? ${volumeExists}`
  );

  if (volumeExists) {
    return path.join("/data", "app.db");
  }

  return path.join(process.cwd(), "data", "app.db");
}

function seedFromJsonIfEmpty(
  db: Database.Database
) {

  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };

  console.log(
    `[db] Usuários já existentes na tabela: ${count}`
  );

  if (count > 0) {
    return;
  }

  const seedPath = path.join(
    process.cwd(),
    "data",
    "usuarios.json"
  );

  const seedFileExists =
    fs.existsSync(seedPath);

  console.log(
    `[db] Arquivo de seed (${seedPath}) existe? ${seedFileExists}`
  );

  if (!seedFileExists) {
    return;
  }

  const seedUsers = JSON.parse(
    fs.readFileSync(seedPath, "utf8")
  );

  // INSERT OR IGNORE: se dois processos caírem aqui ao mesmo tempo, o
  // segundo não derruba com erro de chave duplicada — só ignora as
  // linhas que o primeiro já inseriu.
  const insert = db.prepare(`
    INSERT OR IGNORE INTO users
      (id, nome, email, senha_hash, status, room, is_admin)
    VALUES
      (@id, @nome, @email, @senhaHash, @status, @room, @isAdmin)
  `);

  const insertAll = db.transaction(
    (
      users: Array<{
        id: number;
        nome: string;
        email: string;
        senhaHash: string;
        status: string;
        room: string;
      }>
    ) => {
      for (const user of users) {
        insert.run({
          ...user,
          isAdmin: user.id === 1 ? 1 : 0,
        });
      }
    }
  );

  insertAll(seedUsers);

  console.log(
    `Banco de usuários inicializado com ${seedUsers.length} usuário(s) a partir de data/usuarios.json.`
  );
}

let dbInstance: Database.Database | null = null;

// Conexão criada só na primeira vez que alguém realmente precisa do banco
// (uma requisição de verdade chegando), nunca ao simplesmente importar este
// módulo — o build do Next.js importa as rotas em vários processos paralelos
// só para inspecioná-las, e abrir/escrever no mesmo arquivo SQLite nesse
// momento (sem nenhuma requisição real) já derrubou o build com SIGSEGV.
function getDb() {

  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = resolveDbPath();

  console.log(
    `[db] Abrindo banco em: ${dbPath}`
  );

  fs.mkdirSync(path.dirname(dbPath), {
    recursive: true,
  });

  const db = new Database(dbPath, {
    timeout: 5000,
  });

  // Modo WAL exige mmap/locking de memória compartilhada que nem todo
  // volume de rede/bind-mount suporta direito — em produção (Railway)
  // isso derrubava o processo inteiro (crash loop, sem nem aparecer erro
  // no log, típico de um segfault nativo). O modo padrão (DELETE) é mais
  // lento sob concorrência pesada, mas muito mais compatível.
  db.pragma("journal_mode = DELETE");
  db.pragma("busy_timeout = 5000");

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

  seedFromJsonIfEmpty(db);

  dbInstance = db;

  return db;
}

export type DbUser = {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  status: string;
  room: string;
  salaNome: string | null;
  avatarTipo: string | null;
  avatarValor: string | null;
  isAdmin: boolean;
};

type UserRow = {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  status: string;
  room: string;
  sala_nome: string | null;
  avatar_tipo: string | null;
  avatar_valor: string | null;
  is_admin: number;
};

function rowToUser(row: UserRow): DbUser {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    senhaHash: row.senha_hash,
    status: row.status,
    room: row.room,
    salaNome: row.sala_nome,
    avatarTipo: row.avatar_tipo,
    avatarValor: row.avatar_valor,
    isAdmin: Boolean(row.is_admin),
  };
}

export function getAllUsers(): DbUser[] {
  const rows = getDb()
    .prepare("SELECT * FROM users ORDER BY id")
    .all() as UserRow[];

  return rows.map(rowToUser);
}

export function getUserById(
  id: number
): DbUser | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;

  return row ? rowToUser(row) : null;
}

export function getUserByEmail(
  email: string
): DbUser | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM users WHERE lower(email) = lower(?)"
    )
    .get(email) as UserRow | undefined;

  return row ? rowToUser(row) : null;
}

export function emailInUseByAnotherUser(
  email: string,
  excludingId: number
): boolean {
  const row = getDb()
    .prepare(
      "SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?"
    )
    .get(email, excludingId);

  return Boolean(row);
}

export function createUser(user: {
  nome: string;
  email: string;
  senhaHash: string;
  room?: string;
  isAdmin?: boolean;
}): DbUser {

  const result = getDb()
    .prepare(
      `INSERT INTO users (nome, email, senha_hash, room, is_admin)
       VALUES (@nome, @email, @senhaHash, @room, @isAdmin)`
    )
    .run({
      nome: user.nome,
      email: user.email,
      senhaHash: user.senhaHash,
      room: user.room ?? "Recepção",
      isAdmin: user.isAdmin ? 1 : 0,
    });

  const created = getUserById(
    Number(result.lastInsertRowid)
  );

  if (!created) {
    throw new Error(
      "Falha ao criar usuário."
    );
  }

  return created;
}

export function updateUser(
  id: number,
  fields: Partial<{
    nome: string;
    email: string;
    senhaHash: string;
    salaNome: string | null;
    avatarTipo: string | null;
    avatarValor: string | null;
  }>
): DbUser | null {

  const columns: Record<string, string> = {
    nome: "nome",
    email: "email",
    senhaHash: "senha_hash",
    salaNome: "sala_nome",
    avatarTipo: "avatar_tipo",
    avatarValor: "avatar_valor",
  };

  const updates = Object.entries(fields).filter(
    ([, value]) => value !== undefined
  );

  if (updates.length === 0) {
    return getUserById(id);
  }

  const setClause = updates
    .map(([key]) => `${columns[key]} = @${key}`)
    .join(", ");

  const params = Object.fromEntries(updates);

  getDb()
    .prepare(
      `UPDATE users SET ${setClause} WHERE id = @id`
    )
    .run({ ...params, id });

  return getUserById(id);
}
