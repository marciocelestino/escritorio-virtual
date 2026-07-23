const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

// Ferramenta de desenvolvimento local: grava direto no arquivo de usuários
// usado pelo servidor rodando na sua máquina (data/usuarios-db.json). Em
// produção (Railway), os usuários vivem num arquivo separado, dentro do
// volume persistente — use a página /admin do site para criar usuários lá.

const USERS_PATH =
  process.env.DATABASE_PATH ||
  path.join(
    __dirname,
    "..",
    "data",
    "usuarios-db.json"
  );

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
    "\nAtenção: isso grava no arquivo LOCAL (data/usuarios-db.json). Para criar usuários em produção, use a página /admin do site."
  );
  process.exit(1);
}

if (!fs.existsSync(USERS_PATH)) {
  fail(
    `arquivo de usuários não encontrado em ${USERS_PATH}. Rode "npm run dev" pelo menos uma vez antes (e faça algum login/consulta), para ele ser criado/inicializado.`
  );
}

const users = JSON.parse(
  fs.readFileSync(USERS_PATH, "utf8")
);

const existing = users.find(
  (u) =>
    u.email.toLowerCase() ===
    email.toLowerCase()
);

if (existing) {
  fail(`já existe um usuário com o e-mail ${email}`);
}

const nextId =
  users.reduce(
    (max, u) => Math.max(max, u.id),
    0
  ) + 1;

users.push({
  id: nextId,
  nome,
  email,
  senhaHash: bcrypt.hashSync(senha, 10),
  status: "Disponivel",
  room: "Espaço Natureza",
  salaNome: null,
  avatarTipo: null,
  avatarValor: null,
  isAdmin: false,
});

fs.writeFileSync(
  USERS_PATH,
  JSON.stringify(users, null, 2)
);

console.log(
  `Usuário "${nome}" criado com id ${nextId} no arquivo local.`
);
console.log(
  `A sala pessoal "Espaço ${nome}" já aparece automaticamente no menu lateral.`
);
console.log(
  "Isso só afeta o arquivo local. Em produção, crie o usuário pela página /admin do site."
);
