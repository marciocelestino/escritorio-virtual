const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_PATH = path.join(
  __dirname,
  "..",
  "data",
  "usuarios.json"
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
  process.exit(1);
}

const users = JSON.parse(
  fs.readFileSync(DATA_PATH, "utf8")
);

if (
  users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  )
) {
  fail(`já existe um usuário com o e-mail ${email}`);
}

const nextId =
  users.reduce(
    (max, u) => Math.max(max, u.id),
    0
  ) + 1;

const newUser = {
  id: nextId,
  nome,
  email,
  status: "Disponivel",
  online: true,
  room: "Recepção",
  senhaHash: bcrypt.hashSync(senha, 10),
};

users.push(newUser);

fs.writeFileSync(
  DATA_PATH,
  JSON.stringify(users, null, 2) + "\n"
);

console.log(
  `Usuário "${nome}" criado com id ${nextId}.`
);
console.log(
  `A sala pessoal "Espaço ${nome}" já aparece automaticamente no menu lateral.`
);
console.log(
  "Reinicie o servidor (node server.js) para carregar o novo usuário."
);
