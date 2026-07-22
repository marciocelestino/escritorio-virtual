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
- Nome real do participante na chamada (no lugar de "Participante"),
  recuperação automática de conexão de vídeo quando a rede cai, e
  recolher/expandir as listas de Salas e Usuários.

## Ainda por fazer

### Ajustes rápidos em recursos existentes

- **Indicar se o microfone de alguém já está mutado**: o botão "Mutar"
  hoje não mostra se a pessoa já está muda ou não.
- **Mostrar avatar quando a câmera está desligada**: hoje aparece só a
  caixa cinza "Câmera desligada" — dá pra mostrar o avatar (foto/emoji)
  da pessoa no lugar, já que o Meus Dados já guarda isso.
- **Recolher a barra lateral de verdade**: hoje o botão ▾/▸ só esconde a
  lista, mas o espaço da barra (Salas/Usuários) continua reservado —
  o ideal é encolher a barra pra um trilho fino na lateral, liberando
  espaço pra área central.

### Controles de chamada

- **Remover um usuário da chamada**: evento de socket (`kick-from-meeting`)
  enviado ao socket da pessoa; o servidor a retira da sala de chamada e o
  cliente dela encerra a própria conexão de vídeo local (mesmo fluxo do
  "Sair da Chamada").
- **Escolher dispositivo de entrada/saída de áudio**: selecionar
  microfone e alto-falante durante a chamada (`enumerateDevices` +
  `getUserMedia({ audio: { deviceId } })`; troca de alto-falante depende
  de `setSinkId`, que hoje só funciona em navegadores baseados em
  Chromium).
- **Indicador de quem está falando**: detectar volume de áudio de cada
  participante (`AnalyserNode` da Web Audio API) e destacar visualmente
  o card de quem está com a voz ativa.
- **Plano de fundo da câmera** (tipo Google Meet): borrar ou trocar o
  fundo da própria câmera. Normalmente feito com segmentação de pessoa
  em tempo real (ex.: bibliotecas de segmentação corporal) desenhando
  num `<canvas>` antes de enviar o vídeo.

### Compartilhamento de tela

- **Corrigir: quem entra depois de iniciado o compartilhamento não
  consegue ver** — hoje um participante novo só recebe as faixas de
  vídeo que já existiam no momento em que ele entrou na chamada; a tela
  compartilhada de quem já estava lá não é enviada automaticamente pra
  quem chega depois.
- **Mostrar o compartilhamento separado da câmera/avatar da pessoa**:
  hoje compartilhar tela substitui o vídeo da própria pessoa no card
  dela. A ideia é continuar mostrando a câmera (ou avatar) normalmente
  e exibir a tela compartilhada num espaço à parte, maior. Tecnicamente
  precisa de uma segunda faixa de vídeo dedicada por participante (hoje
  só existe uma "faixa de vídeo" por pessoa, que é reaproveitada pra
  câmera ou tela).
- **Quem está compartilhando também ver a própria tela** que está sendo
  compartilhada (hoje só quem recebe vê).
- **Rabiscar / apagar rabisco na tela compartilhada**: uma camada de
  desenho por cima do compartilhamento, sincronizada entre os
  participantes (precisa de eventos de socket pra cada traço/apagar).

### Permissões e organização

- **Cargo para usuários** (um usuário pode ter mais de um cargo, ex.:
  "Gestão", "Design", "Dev").
- **Salas restritas por cargo**: criar salas que só usuários com
  determinado(s) cargo(s) podem entrar (ex.: só quem tem o cargo
  "Gestão" entra na "Sala Gestão"). Depende do item anterior (cargos)
  já existir.

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
