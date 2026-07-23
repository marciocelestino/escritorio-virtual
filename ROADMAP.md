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
- **Indicar se o microfone de alguém já está mutado**: selo 🔇 visível no
  card de vídeo de quem está mutado, pros outros participantes.
- **Indicador de quem está falando**: aro verde no vídeo de quem está com
  a voz ativa, via `AnalyserNode` da Web Audio API.
- **Recolher a barra lateral de verdade**: Salas e Usuários encolhem para
  um trilho fino de ícones (com contagem), liberando espaço pra área
  central.
- **Pulso do escritório**: tira no topo com a contagem de gente em cada
  sala, clicável pra pular direto pra ela.
- **Piso ilustrado nas salas**: porta, sofás, plantas, mesas, monitores,
  árvores e lago desenhados em CSS no lugar dos emojis de decoração.
- **Dock de chamada flutuante persistente**: a chamada fica presa à sala
  onde você entrou (não à sala que está sendo vista), num dock fixo no
  canto da tela — dá pra navegar por outras salas sem cair da chamada.
- **Lugares fixos clicáveis**: cada sala tem assentos numerados de
  verdade; clicar num lugar vazio move o avatar pra lá, sincronizado
  pelo servidor (auto-atribuído ao entrar na sala, liberado ao sair).
- **Mostrar avatar quando a câmera está desligada**: no lugar da caixa
  cinza "Câmera desligada", mostra o avatar (foto/emoji) da pessoa.
- **Botão "voltar pra chamada"**: quando o dock está tocando uma chamada
  de uma sala diferente da que você está vendo, um atalho rápido pra
  navegar de volta até ela.
- **Selo de "mutado" também pro próprio usuário**: o selo 🔇 agora
  aparece no seu próprio card na chamada, não só nos dos outros.
- **Mais assentos na Sala de Reunião**: 6 → 15 lugares, em 3 fileiras de
  5 voltadas pra mesa, no lugar do antigo frente-a-frente.
- **Remover um usuário da chamada**: botão ❌ ao lado de cada participante
  remoto — o servidor tira a pessoa da sala de chamada e ela recebe um
  aviso encerrando a própria câmera/microfone.
- **Escolher microfone e alto-falante**: seletor de dispositivo de áudio
  de entrada e saída durante a chamada (troca de alto-falante só
  funciona em navegadores baseados em Chromium, por depender de
  `setSinkId`).
- **Chamada escala pra muita gente**: minimizada é só uma pastilha no
  canto (contagem de participantes + indicador de quem fala); ao
  expandir, abre um painel grande com grade responsiva (1 a 5 colunas
  conforme o número de participantes) em vez da antiga lista vertical
  de 1 coluna, que virava um scroll enorme com muita gente na chamada.
- **Barra de chamada nova**: virou uma barra fixa no rodapé da tela, com
  fita horizontal de miniaturas (a sua e a de cada participante) e os
  controles (microfone, câmera, compartilhar, dispositivos de áudio,
  sair) sempre visíveis — troca a pastilha/painel expansível anterior.
  Mutar/remover participante agora aparece ao passar o mouse sobre a
  miniatura da pessoa.
- **Corrige vídeo remoto congelado/em branco**: câmera desligada (ou
  nunca ligada, ex.: entrou só com áudio) de um participante agora
  mostra o avatar dele — antes ficava com o último quadro recebido
  congelado ou branco, já que só tratávamos isso pra própria câmera.
- **Painel de Participantes + Chat de texto por sala**: substitui a
  antiga lista "Nesta sala" — duas abas (Participantes/Chat), com chat
  em tempo real por sala (sem @menção nem histórico persistente por
  enquanto — mensagens somem ao recarregar a página; isso fica pra uma
  segunda leva do chat).
- **Modo escuro de propósito**: toggle (🌙/☀️) no cabeçalho, salvo em
  `localStorage`, usando as variantes `dark:` do Tailwind — nunca pela
  preferência do sistema (é assim que quebrou a legibilidade da vez
  passada). Cobre a página do escritório e seus componentes (salas,
  barras laterais, painel de participantes/chat, chamada). Decidido não
  cobrir admin, login e "Meus Dados" — ficam só no tema claro mesmo.
- **Mapa do escritório inteiro**: todas as salas (comuns e pessoais)
  visíveis ao mesmo tempo numa única visão, no lugar de escolher uma
  sala por vez — inspirado num mockup visual enviado pelo cliente.
  Clicar num lugar vazio em qualquer sala já muda pra ela e senta lá
  (mesmo se não for a sala "atual"). Sala de Reunião aparece maior/mais
  central, como no mockup. Substituiu o "pulso do escritório" (tira de
  pastilhas), que ficou redundante com a ocupação já visível no mapa.
- **Corrige áudio cortado com a câmera desligada**: mostrar o avatar no
  lugar do vídeo (item acima) tinha um efeito colateral sério — como só
  o elemento de vídeo tocava áudio, quem estava com a câmera desligada
  (ou nunca ligou, ex.: sem webcam) ficava mudo pros outros. Cada
  participante agora tem um elemento de áudio próprio, independente de
  mostrar vídeo ou avatar — o indicador de "falando" também passou a
  aparecer no avatar, não só no vídeo.
- **Cards das salas no mapa ficam menores**: removida toda a decoração
  (porta, sofás, plantas, mesas, cadeiras) — só os assentos, avatares e
  o nome da sala. Bem menos altura por card, bem menos rolagem.
- **Painel Participantes/Chat vira barra lateral de verdade**: saiu do
  meio do conteúdo rolável (onde a barra fixa da chamada cobria a
  rolagem do chat) e virou parte da coluna lateral direita, acima da
  lista de Usuários — sempre visível, com prioridade sobre a barra da
  chamada.

## Ainda por fazer

### Redesenho visual (em andamento, por fases)

- **Central de notificações e busca global (Ctrl+K)**: recursos novos,
  não existem hoje.

### Controles de chamada

- **Plano de fundo da câmera** (tipo Google Meet): borrar ou trocar o
  fundo da própria câmera. Normalmente feito com segmentação de pessoa
  em tempo real (ex.: bibliotecas de segmentação corporal) desenhando
  num `<canvas>` antes de enviar o vídeo — precisa adicionar uma
  dependência nova de ML no projeto.

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

### Chat de texto (segunda leva)

- Já existe um chat básico por sala (ver "Já implementado"). Falta:
  conversas privadas (1:1) e em grupo, @menção de usuário, e histórico
  persistente entre sessões.
- Precisa de um modelo de dados novo pra persistência (mensagens:
  remetente, sala ou destinatário, texto, hora) e onde guardar isso —
  pode ser um arquivo JSON simples (como `data/usuarios.json` hoje) ou
  crescer para algo mais robusto se o volume de mensagens justificar.
- @menção pode reaproveitar a infraestrutura do "cutucar" (som +
  notificação) para avisar quem foi citado.

### Gravação de reuniões

- Gravar a chamada (câmeras + tela compartilhada) usando a API
  `MediaRecorder` do navegador de quem inicia a gravação.
- Combinar múltiplos streams remotos num único vídeo é a parte mais
  complexa (normalmente via `<canvas>` + `AudioContext` para mixar).
- Precisa de armazenamento para os arquivos gerados (o volume persistente
  que já configuramos no Railway serve, mas vídeo ocupa bem mais espaço
  que os dados de usuário — vale pensar num limite de tamanho/retenção).
