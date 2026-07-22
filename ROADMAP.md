# Roadmap — próximas melhorias

Lista de ideias já discutidas, mapeadas para retomar depois.

## ✅ Já implementado

- **Mutar o microfone de um usuário**: botão "Mutar" em cada participante
  remoto, dentro da chamada. Envia um pedido (`mute-user`) que o cliente
  da pessoa atende sozinho, desligando o próprio microfone.
- **Chamar um usuário de outra sala para a sala atual**: botão "Chamar
  aqui" ao lado de qualquer usuário que esteja em outra sala, na lista
  "Usuários". Quem recebe vê uma notificação com os botões "Ir até lá"
  (move direto pra sala de quem chamou) ou "Ignorar".

## Ainda por fazer

### Controles de chamada

- **Remover um usuário da chamada**: evento de socket (`kick-from-meeting`)
  enviado ao socket da pessoa; o servidor a retira da sala de chamada e o
  cliente dela encerra a própria conexão de vídeo local (mesmo fluxo do
  "Sair da Chamada").

### Chat de texto

- Conversas privadas e em grupo, com @menção de usuário.
- Precisa de um modelo de dados novo (mensagens: remetente, sala ou
  destinatário, texto, hora) e onde guardar isso — pode ser um arquivo
  JSON simples (como `data/usuarios.json` hoje) ou crescer para algo mais
  robusto se o volume de mensagens justificar.
- @menção pode reaproveitar a infraestrutura do "cutucar" (som +
  notificação) para avisar quem foi citado.

### Modo escuro

- Removemos o dark-mode *automático* (que quebrava a legibilidade) — dá
  pra fazer de propósito agora: um toggle salvo no perfil (ou
  `localStorage`), usando as variantes `dark:` do Tailwind em vez de
  depender só da preferência do sistema.

### Gravação de reuniões

- Gravar a chamada (câmeras + tela compartilhada) usando a API
  `MediaRecorder` do navegador de quem inicia a gravação.
- Combinar múltiplos streams remotos num único vídeo é a parte mais
  complexa (normalmente via `<canvas>` + `AudioContext` para mixar).
- Precisa de armazenamento para os arquivos gerados (o volume persistente
  que já configuramos no Railway serve, mas vídeo ocupa bem mais espaço
  que os dados de usuário — vale pensar num limite de tamanho/retenção).
