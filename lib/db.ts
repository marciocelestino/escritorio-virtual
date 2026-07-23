import path from "path";
import fs from "fs";

// Antes usávamos SQLite (better-sqlite3), mas o binário nativo travava o
// processo (crash silencioso, sem stack trace — típico de segfault) ao
// abrir/escrever no volume persistente do Railway, provavelmente por causa
// do tipo de sistema de arquivos usado no bind-mount. Um arquivo JSON lido
// e escrito com fs puro não depende de lock nativo de arquivo nem de mmap,
// então é muito mais compatível com qualquer tipo de disco — ao custo de
// não ser ideal para alta concorrência, o que não é um problema aqui (são
// poucos usuários e o Node processa uma requisição por vez).

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
  // Só o refresh token fica guardado — o access token (de vida curta) é
  // mantido só em memória pelo server.js, nunca gravado em disco. Assim,
  // a renovação periódica do access token (que roda em server.js, sem
  // passar por este cache) não corre risco de sobrescrever um dado mais
  // recente escrito por aqui, já que o único campo do Spotify persistido
  // muda raramente (só quando o próprio Spotify decide trocar o refresh
  // token, o que não é o caso comum).
  spotifyRefreshToken: string | null;
};

// Se DATABASE_PATH não for definido, detecta sozinho um volume persistente
// montado em /data (convenção comum em hospedagens como o Railway) — assim
// não é preciso configurar nenhuma variável de ambiente à parte, só montar
// o volume nesse caminho.
function resolveUsersFilePath() {

  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  if (fs.existsSync("/data")) {
    return path.join("/data", "usuarios.json");
  }

  return path.join(
    process.cwd(),
    "data",
    "usuarios-db.json"
  );
}

function seedUsers(): DbUser[] {

  const seedPath = path.join(
    process.cwd(),
    "data",
    "usuarios.json"
  );

  if (!fs.existsSync(seedPath)) {
    return [];
  }

  const seed = JSON.parse(
    fs.readFileSync(seedPath, "utf8")
  ) as Array<{
    id: number;
    nome: string;
    email: string;
    senhaHash: string;
    status: string;
    room: string;
  }>;

  return seed.map((user) => ({
    ...user,
    salaNome: null,
    avatarTipo: null,
    avatarValor: null,
    isAdmin: user.id === 1,
    spotifyRefreshToken: null,
  }));
}

let cachedUsers: DbUser[] | null = null;
let usersFilePath: string | null = null;

function loadUsers(): DbUser[] {

  if (cachedUsers) {
    return cachedUsers;
  }

  usersFilePath = resolveUsersFilePath();

  fs.mkdirSync(
    path.dirname(usersFilePath),
    { recursive: true }
  );

  if (fs.existsSync(usersFilePath)) {

    cachedUsers = JSON.parse(
      fs.readFileSync(usersFilePath, "utf8")
    );

  } else {

    cachedUsers = seedUsers();

    persistUsers();

  }

  return cachedUsers as DbUser[];
}

function persistUsers() {

  if (!usersFilePath || !cachedUsers) {
    return;
  }

  // Escreve num arquivo temporário e renomeia por cima do definitivo:
  // uma escrita direta que for interrompida no meio (queda de energia,
  // restart) pode deixar o JSON corrompido pela metade; renomear é uma
  // operação atômica no sistema de arquivos.
  const tmpPath = `${usersFilePath}.tmp`;

  fs.writeFileSync(
    tmpPath,
    JSON.stringify(cachedUsers, null, 2)
  );

  fs.renameSync(tmpPath, usersFilePath);
}

export function getAllUsers(): DbUser[] {
  return [...loadUsers()];
}

export function getUserById(
  id: number
): DbUser | null {
  return (
    loadUsers().find(
      (user) => user.id === id
    ) ?? null
  );
}

export function getUserByEmail(
  email: string
): DbUser | null {

  const normalized = email
    .trim()
    .toLowerCase();

  return (
    loadUsers().find(
      (user) =>
        user.email.toLowerCase() ===
        normalized
    ) ?? null
  );
}

export function emailInUseByAnotherUser(
  email: string,
  excludingId: number
): boolean {

  const normalized = email
    .trim()
    .toLowerCase();

  return loadUsers().some(
    (user) =>
      user.email.toLowerCase() ===
        normalized &&
      user.id !== excludingId
  );
}

export function createUser(user: {
  nome: string;
  email: string;
  senhaHash: string;
  room?: string;
  isAdmin?: boolean;
}): DbUser {

  const users = loadUsers();

  const nextId =
    users.reduce(
      (max, u) => Math.max(max, u.id),
      0
    ) + 1;

  const created: DbUser = {
    id: nextId,
    nome: user.nome,
    email: user.email,
    senhaHash: user.senhaHash,
    status: "Disponivel",
    room: user.room ?? "Espaço Natureza",
    salaNome: null,
    avatarTipo: null,
    avatarValor: null,
    isAdmin: Boolean(user.isAdmin),
    spotifyRefreshToken: null,
  };

  users.push(created);

  persistUsers();

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
    isAdmin: boolean;
    spotifyRefreshToken: string | null;
  }>
): DbUser | null {

  const users = loadUsers();

  const index = users.findIndex(
    (user) => user.id === id
  );

  if (index === -1) {
    return null;
  }

  const updates = Object.fromEntries(
    Object.entries(fields).filter(
      ([, value]) => value !== undefined
    )
  );

  users[index] = {
    ...users[index],
    ...updates,
  };

  persistUsers();

  return users[index];
}

export function countAdmins(): number {
  return loadUsers().filter(
    (user) => user.isAdmin
  ).length;
}

export function deleteUser(
  id: number
): boolean {

  const users = loadUsers();

  const index = users.findIndex(
    (user) => user.id === id
  );

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);

  persistUsers();

  return true;
}
