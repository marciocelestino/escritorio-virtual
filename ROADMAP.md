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
- **Removida a barra de Salas da lateral esquerda**: redundante desde
  que o mapa mostra todas as salas de uma vez.
- **Removidos os cards "Evolução Futura" e "Usuários Online"**.
- **Chat rola sozinho** até a mensagem mais recente, e tem o comando
  `\clear` pra apagar o histórico da sala — só o dono (salas pessoais)
  ou um admin (salas comuns) pode usar.
- **Corrigido o link errado no e-mail de boas-vindas**: pegava o
  endereço interno do servidor (`0.0.0.0:8080`) em vez do domínio
  público; agora usa os headers de proxy corretos.
- **Status só muda quando a própria pessoa escolhe**: removida a troca
  automática pra "Disponível"/"Ausente" por atividade/inatividade do
  mouse.
- **Novos status**: Almoço 🍽️ e Ocioso 💤, além dos já existentes.
- **Ícone de administração**: trocado o link de texto por um ícone de
  engrenagem ⚙️ no cabeçalho.
- **Sino de notificação por menção**: aparece quando alguém escreve
  "@primeironome" da própria pessoa em qualquer chat de sala — mostra
  um contador e uma lista curta das últimas menções, clicar leva até a
  sala.
- **Modo escuro vira o padrão**: em vez de ativado por escolha (item
  acima), agora começa ligado pra todo mundo (script no `<head>` evita
  o flash de tela clara antes do React montar) — quem quiser o tema
  claro ainda pode trocar no cabeçalho, e a escolha continua salva.
- **Visual mais próximo do mockup enviado**: badge colorido com ícone
  por tipo de sala (Recepção, Sala de Reunião, Espaço Natureza, salas
  pessoais, cada uma com sua cor), paleta escura mais rica nos cards
  (tom mais profundo, bordas translúcidas em vez de cinza sólido), e
  botões da barra de chamada com texto (Microfone/Câmera/Compartilhar)
  no lugar de só ícone.
- **Ajustes finos de layout (2ª rodada do mockup)**: removido o texto
  "Escritório Internit / salas livres · pessoas online" abaixo do
  logo; logo maior no cabeçalho; barra lateral (Chat + Usuários
  Online) agora pode ser fechada por inteiro (botão «/» perto de
  "Portas abertas"), e Chat/Usuários Online minimizam de forma
  independente um do outro (ícone −/+ em cada cabeçalho de seção);
  aba "Participantes" removida do painel — virou só Chat, com o
  avatar da pessoa ao lado do nome em cada mensagem; cards de vídeo
  da fita da chamada um pouco maiores; botões da barra de chamada
  viraram chips (ícone em cima, rótulo embaixo) com um botão "Chat"
  novo que reabre a barra lateral.
- **Compartilhamento de tela em card separado**: agora usa uma faixa
  de vídeo dedicada (sender próprio) por participante, então a tela
  compartilhada aparece como um card A MAIS na fita da chamada — a
  câmera (ou avatar) da pessoa continua aparecendo normalmente, sem
  ser substituída. Isso também resolveu de quebra dois itens que
  estavam pendentes: quem entra na chamada depois que o
  compartilhamento já começou também recebe a tela (a conexão nova já
  sai com os dois sender de vídeo, câmera e tela), e quem está
  compartilhando agora vê a própria tela também (antes só quem
  recebia via). Como não foi possível testar com múltiplos
  navegadores reais neste ambiente, vale uma conferida com 2+ pessoas
  numa chamada de verdade.
- **Corrige card de tela compartilhada "grudado"**: ao parar de
  compartilhar, quem recebia via o card continuar aparecendo (o
  navegador não detectava a falta de vídeo de forma confiável/rápida).
  Agora quem para de compartilhar avisa direto pelo socket
  (`screen-share-stopped`), e o card some na hora pra todo mundo.
- **Barra de chamada mais compacta**: os controles (Microfone, Câmera,
  Compartilhar, Chat, ⚙️, Sair) viraram uma grade fixa de 2 linhas por
  3, em vez de uma fileira que quebrava linha sem previsibilidade —
  sobra mais espaço horizontal pra fita de vídeo, cabendo mais gente
  antes de precisar rolar.
- **Avatar do dono em cada "Espaço"**: o ícone genérico de computador
  💻 nas salas pessoais virou o avatar de verdade (foto/emoji/iniciais)
  de quem é dono daquela sala.
- **Recepção e Espaço Natureza maiores**: mesma altura da Sala de
  Reunião (280px) e 10 assentos (2 fileiras de 5) no lugar dos 4
  antigos.
- **Assentos viram grade responsiva de verdade**: os lugares de cada
  sala eram posicionados em pixels fixos (x/y absolutos), o que forçava
  rolagem horizontal dentro do card em telas menores. Agora usam CSS
  Grid fluido — a sala encolhe/cresce com a largura disponível, sem
  scrollbar interna.
- **Ajustes finos de acabamento**: seção "Usuários Online" da lateral
  virou só "Online"; a linha clara abaixo do cabeçalho ficou escura
  (mesmo tom translúcido dos cards); nome das salas ~30% menor;
  espaçamentos gerais mais enxutos pra aproveitar melhor a altura da
  tela (menos rolagem vertical, especialmente em Full HD).
- **Mapa só mostra a sala inteira de quem está online**: quem está
  offline vira só uma marcação pequena (avatar meio apagado + nome),
  sem abrir a sala toda — assim dá pra ver quem existe no sistema e
  quem está offline sem inflar o mapa com salas vazias. Ao a pessoa
  conectar, a sala dela aparece por inteiro pra todo mundo.
- **Barra de chamada vira coluna vertical na lateral esquerda**: antes
  era uma barra fixa no rodapé que cobria o mapa (sobrepunha o
  conteúdo). Agora é uma coluna de verdade, do mesmo jeito que a barra
  de Chat/Usuários na direita: participantes (câmera/avatar) empilhados
  no topo com rolagem própria, e os controles (Microfone, Câmera,
  Compartilhar, Chat, ⚙️, Sair) fixos embaixo, sempre visíveis. Ocupa
  espaço de verdade no layout (não é mais sobreposição), então o mapa
  simplesmente encolhe pra abrir espaço, sem nada cobrindo nada.
- **Cards de sala com a mesma altura**: Recepção, Sala de Reunião e
  Espaço Natureza (e os cards pessoais entre si) agora esticam pra
  bater com o mais alto da fileira (CSS Grid), com os assentos
  centralizados verticalmente no espaço sobrando.
- **Avatares dos assentos ~30% menores**: ajuda a deixar os cards de
  sala mais compactos e a rolagem geral do mapa mais curta.
- **Cards de vídeo da chamada maiores**: preenchem a largura da coluna
  lateral (em vez de um tamanho fixo pequeno), aproveitando melhor o
  espaço criado quando a barra virou coluna vertical.
- **Trancar sala pessoal**: cada usuário pode trancar/destrancar a
  própria sala ("🔒 Minha sala trancada" no cabeçalho). Trancada, só
  entra quem o dono chamar ("Chamar aqui") ou aceitar um pedido de
  entrada — quem tenta entrar sem isso recebe um pedido enviado ao
  dono (aceitar/recusar), nunca entra direto. A checagem é feita no
  servidor (`server.js`), não só no cliente. Sala com cadeado 🔒 visível
  no mapa pra todo mundo.
- **Bloqueado pra buscadores**: `public/robots.txt` (já existia,
  `Disallow: /`) reforçado com a meta tag `robots: noindex, nofollow`
  em todas as páginas — sistema interno, não deve aparecer no Google
  nem em outros buscadores.

## Ainda por fazer

### Redesenho visual (em andamento, por fases)

- **Piso das salas ainda é ilustração simples em CSS** (assentos +
  nome + badge), não o visual fotorrealista/isométrico do mockup —
  isso exigiria assets de ilustração de verdade (contratar arte ou
  usar uma biblioteca de assets isométricos prontos), não é algo que
  dá pra gerar só com código.
- **Central de notificações mais completa e busca global (Ctrl+K)**:
  o sino hoje só cobre menções de chat — uma central de notificações
  de verdade (outros tipos de evento, histórico) e a busca global
  ainda não existem.

### Controles de chamada

- **Plano de fundo da câmera** (tipo Google Meet): borrar ou trocar o
  fundo da própria câmera. Normalmente feito com segmentação de pessoa
  em tempo real (ex.: bibliotecas de segmentação corporal) desenhando
  num `<canvas>` antes de enviar o vídeo — precisa adicionar uma
  dependência nova de ML no projeto.

### Compartilhamento de tela

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
