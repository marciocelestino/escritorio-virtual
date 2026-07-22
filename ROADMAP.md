# Roadmap — próximas melhorias

Lista de ideias já discutidas, mapeadas para retomar depois. Nenhum desses
itens está implementado ainda.

## Controles de chamada

- **Mutar o microfone de um usuário**: não dá pra silenciar a track de
  áudio de outra pessoa à força (WebRTC não permite isso sem a cooperação
  do lado que está enviando). Na prática seria um "pedido de mudo": um
  evento de socket (`mute-user`, endereçado ao socket da pessoa) que o
  cliente que recebe atende automaticamente, desligando o próprio
  microfone (mesmo fluxo que o botão "Desligar microfone" já usa).
- **Remover um usuário da chamada**: evento de socket (`kick-from-meeting`)
  enviado ao socket da pessoa; o servidor a retira da sala de chamada e o
  cliente dela encerra a própria conexão de vídeo local (mesmo fluxo do
  "Sair da Chamada").

## Chat de texto

- Conversas privadas e em grupo, com @menção de usuário.
- Precisa de um modelo de dados novo (mensagens: remetente, sala ou
  destinatário, texto, hora) e onde guardar isso — pode ser um arquivo
  JSON simples (como `data/usuarios.json` hoje) ou crescer para algo mais
  robusto se o volume de mensagens justificar.
- @menção pode reaproveinar a infraestrutura do "cutucar" (som +
  notificação) para avisar quem foi citado.

## Modo escuro

- Removemos o dark-mode *automático* (que quebrava a legibilidade) — dá
  pra fazer de propósito agora: um toggle salvo no perfil (ou
  `localStorage`), usando as variantes `dark:` do Tailwind em vez de
  depender só da preferência do sistema.

## Gravação de reuniões

- Gravar a chamada (câmeras + tela compartilhada) usando a API
  `MediaRecorder` do navegador de quem inicia a gravação.
- Combinar múltiplos streams remotos num único vídeo é a parte mais
  complexa (normalmente via `<canvas>` + `AudioContext` para mixar).
- Precisa de armazenamento para os arquivos gerados (o volume persistente
  que já configuramos no Railway serve, mas vídeo ocupa bem mais espaço
  que os dados de usuário — vale pensar num limite de tamanho/retenção).

## Chamar um usuário de outra sala para a sala atual

Ideia de abordagem, reaproveitando o que já existe (cutucar):

1. Novo evento de socket `invite-to-room` — `{ to: userId, room, fromNome }`
   — o servidor retransmite para o socket da pessoa convidada (mesmo
   padrão de validação de identidade já usado no `poke`).
2. Quem recebe o convite vê uma notificação **com uma ação** ("Fulano te
   chamou para a Sala X" + botão "Ir até lá") — diferente do toast atual
   que só aparece e desaparece sozinho; precisa de um componente de
   notificação novo, com botão.
3. Ao clicar em "Ir até lá", o cliente chama a mesma função que o clique
   na barra lateral já usa (`moveToRoom(room)`), movendo a pessoa
   automaticamente.
