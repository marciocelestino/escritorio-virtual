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
- **Cores da marca em botões e avisos**: botão "Chamar" (antes "Chamar
  aqui"), botão "Enviar" do chat e o aviso de notificação (cutucar,
  convites, avisos gerais) usam o azul e o vermelho/rosa do logo da
  Internit (`#007CB2` e `#C32E4E`, extraídos do próprio logo). O aviso
  de notificação também passou a aparecer centralizado no topo, entre
  o logo e os ícones de admin/notificação (já durava 3 segundos).
- **Atualização automática após deploy**: o servidor agora se
  identifica com um id único a cada vez que sobe (cada deploy no
  Railway derruba e sobe o processo de novo). Se o navegador de alguém
  reconectar num id diferente do que já tinha visto, a página recarrega
  sozinha — sem isso, quem já estava com a aba aberta continuava
  rodando a versão antiga até lembrar de dar F5.
- **Avatares dos assentos um pouco maiores**: a redução de 30% (item
  acima) tinha ficado grande demais — ajustado pra um meio-termo entre
  o tamanho original e o reduzido.
- **Corrige bug: aceitar pedido de entrada não movia a pessoa pra
  sala**: o `moveToRoom`/`chooseSeat` estavam sendo chamados de dentro
  de um handler de socket registrado só uma vez no carregamento da
  página — presos numa versão "congelada" dessas funções, de antes do
  usuário estar carregado (`currentUserId` ainda nulo), então nunca
  faziam nada de verdade. Passaram a rodar num efeito à parte,
  disparado por uma mudança de estado, sempre com a versão atual.
- **Avisos de convite e pedido de entrada centralizados no topo**: os
  banners de "fulano te chamou" e "fulano quer entrar" agora aparecem
  empilhados no centro do topo, junto com o aviso de notificação
  (cutucar), em vez de no canto direito.
- **Notificação e botões "Chamar"/"Enviar" com fundo branco**: trocado
  o azul/rosa da marca (testado na leva anterior) por fundo branco e
  texto escuro, a pedido.
- **Administração abre em modal**: clicar no ⚙️ não navega mais pra
  `/admin` (o que desmontava a página inteira e derrubava a chamada de
  vídeo em andamento) — abre um modal por cima do escritório, sem sair
  de lugar nenhum. A página `/admin` avulsa (acesso direto por URL)
  continua existindo, agora reaproveitando o mesmo componente
  (`components/AdminPanel.tsx`).
- **Corrige: quem entra na chamada depois do compartilhamento de tela
  já ter começado não conseguia ver a tela**: o navegador de quem já
  estava compartilhando não conseguia encaixar essa faixa extra na
  resposta inicial pro recém-chegado (a oferta dele só previa
  áudio+câmera) — precisava de uma segunda rodada de negociação
  específica pra tela, que não estava acontecendo. Agora acontece logo
  depois da negociação inicial completar.
- **Chamada de vídeo só na sala atual**: sair da sala (navegar pra
  outra) agora encerra a participação na chamada automaticamente — não
  existe mais o dock "preso" numa sala enquanto navega por outras. Só
  dá pra participar da chamada da sala em que você está.
- **Corrige: câmera desligada não virava avatar pros outros
  participantes** (ficava com o último quadro congelado) — antes
  dependia só do navegador de quem recebia detectar a falta de vídeo,
  que não era confiável/rápido o bastante. Agora tem um aviso explícito
  de liga/desliga de câmera pelo socket, no mesmo molde do que já
  existia pro microfone e pro fim do compartilhamento de tela.
- **Lista "Online" mais enxuta**: não mostra mais em qual sala cada
  pessoa está (só nome + status), com fonte bem menor.
- **Recepção removida**: só restam Sala de Reunião e Espaço Natureza
  como salas comuns. Quem entra no escritório agora cai direto no
  Espaço Natureza.
- **Espaço Natureza é o primeiro card, com visual próprio**: fundo
  verde escuro (sempre, não muda com o tema claro/escuro do resto do
  app) e assentos num verde mais claro — visual diferenciado desse
  espaço de descontração. Como sobrou só 1 sala comum ao lado dela
  (Sala de Reunião), o primeiro espaço pessoal (entre quem está online)
  ocupa a terceira posição da fileira de cima, pra não sobrar buraco no
  layout.
- **Chat de texto (segunda leva)**: histórico persistente (mensagens
  sobrevivem a recarregar a página ou reiniciar o servidor — arquivo
  `data/mensagens-db.json`, mesmo padrão do arquivo de usuários),
  conversas privadas (1:1) — botão 💬 em cada pessoa da lista "Online"
  abre um modal de conversa direta, com aviso quando chega mensagem nova
  e a conversa não está aberta — e autocomplete de @menção (digitar "@"
  sugere nomes de verdade em vez de precisar acertar o primeiro nome de
  cabeça), tanto no chat de sala quanto nas conversas privadas.
- **Corrige: recompartilhar tela na mesma chamada não aparecia pros
  outros**: parar e depois compartilhar de novo reusa o mesmo canal de
  envio (não dispara sinalização nova de vídeo), então dependia só do
  navegador de quem recebia perceber a volta — não confiável o
  bastante. Agora tem um aviso explícito de "compartilhamento
  (re)começou" pelo socket, no mesmo molde do que já existia pro fim do
  compartilhamento.
- **Picture-in-picture pra tela compartilhada**: tanto no card da fita
  quanto no modal que abre ao clicar. Usa a Document Picture-in-Picture
  API do navegador quando disponível — permite várias telas
  compartilhadas em PiP ao mesmo tempo, cada uma na sua janelinha; sem
  suporte a essa API, cai pro PiP padrão do navegador (aí só uma por
  vez, limitação do próprio navegador, não do app).
- **Só admin remove alguém da chamada, e admin não pode ser removido**:
  antes qualquer participante podia expulsar qualquer outro. Agora o
  botão ❌ só aparece pra quem é admin, nunca aparece pra remover outro
  admin, e o servidor confere de novo (não só o cliente).
- **Selo de mensagens não lidas no botão 💬**: mostra de 1 a 9, e "9+"
  a partir daí — zera assim que abre a conversa com a pessoa.
- **Cutucar gente offline**: antes só dava pra cutucar quem estava
  online. Agora dá pra cutucar mesmo offline (clicando na marcação dela
  no mapa) — quando ela conectar, aparece uma mensagem no chat direto
  entre os dois avisando quantas vezes foi cutucada enquanto estava
  fora, uma por remetente.
- **Entra na chamada com a câmera desligada**: antes a câmera ligava
  sozinha ao entrar (pedindo permissão de vídeo na hora). Agora todo
  mundo entra com ela desligada por padrão e liga manualmente quando
  quiser — o microfone continua ligando normalmente ao entrar, como
  sempre foi.
- **Corrige picture-in-picture com tela preta**: o botão ⧉ abria uma
  janela de PiP sem altura de verdade (`html`/`body` sem altura
  definida, então o vídeo com `height: 100%` também ficava 0px) —
  parecia tela preta mesmo com o vídeo certo por trás. Corrigido com um
  estilo próprio pra essa janela e reprodução explícita do vídeo.
- **Headers de segurança**: adiciona Content-Security-Policy,
  Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy e Permissions-Policy em todas as respostas (antes
  nenhum desses existia — reprovação nos scanners de segurança
  externos). CSP liberado especificamente pro que o app usa (WebRTC,
  Socket.IO, avatares em data:/blob:), sem nonce (o app não carrega
  script de terceiro).
- **Tela de login sempre escura**: seguindo o mesmo padrão interno do
  resto do app, independente do tema escolhido (igual o cabeçalho já
  fazia).
- **Corrige menu de menções atrás da barra lateral**: o dropdown do
  sino de notificações tinha o mesmo z-index da barra lateral direita
  — como ela vem depois no HTML, ficava por cima. Dropdown subiu de
  camada.
- **Chat Geral**: um chat só, visível pra empresa inteira, independente
  de sala — ícone 💬 próprio no cabeçalho (azul do logo, redondo, um
  pouco maior que os outros ícones), ao lado do botão de Administração.
  Tem histórico persistente (mesma infraestrutura do chat de
  sala/DM) e um editorzinho pequeno com negrito, sublinhado e link.
  Só o usuário "Marcio Celestino" pode limpar o histórico — checado
  pelo nome no servidor, não por ser admin. A formatação usa uma
  marcação própria e simples (`**negrito**`, `__sublinhado__`,
  `[texto](link)`) interpretada direto em elementos React — nunca HTML
  cru — então não tem risco de injeção de script por aí.
- **@Menção no Chat Geral**: autocomplete de "@" (mesmo componente por
  trás do chat de sala/DM, reaproveitado) e notificação no sino quando
  alguém te menciona ali — mesmo com o modal do Chat Geral fechado.
  Clicar na menção no sino abre o Chat Geral (em vez de tentar navegar
  pra uma sala, que não existe nesse caso).
- **Spotify — mostrar a música tocando no card**: cada pessoa conecta a
  própria conta (OAuth, em "Meus Dados") e a faixa que estiver tocando
  aparece no card dela pra todo mundo ("🎵 nome - artista"), atualizando
  sozinho enquanto muda de música. Escopo combinado com o cliente: só
  mostrar o nome da faixa, sem redistribuir/tocar o áudio pra quem mais
  está na sala — o próprio Spotify não permite isso (restrição de
  licenciamento do serviço, não uma limitação técnica). Só o refresh
  token de cada pessoa fica gravado (`data/usuarios-db.json`); o access
  token de curta duração vive só em memória no servidor, renovado por
  uma consulta periódica (a cada 15s, só de quem está online e
  conectado).
- **Música do Spotify sai da lista lateral "Online"**: fica só no
  card/sala do dono no mapa, a pedido — a lista lateral volta a mostrar
  só nome + status.
- **Correções do relatório de segurança (23/07/2026), itens Alto e
  Médio**:
  - `GET /api/users` passou a exigir sessão válida (qualquer pessoa
    logada, não precisa ser admin) — antes qualquer um com o link
    baixava nome, e-mail, sala, foto e se é admin de todo mundo.
  - Limite de tentativas no login (5 erradas → 15 min de espera,
    por e-mail) e no "esqueci minha senha" (1 pedido a cada 2 minutos
    por e-mail) — ambos guardados só em memória (reinicia com o
    servidor).
  - Foto de perfil só aceita imagem de verdade enviada (data URI),
    não mais qualquer texto/URL — uma URL externa ali virava um jeito
    de descobrir quando alguém está online.
  - Mutar/ligar-desligar mic e câmera de outra pessoa (o "to"
    direcionado) agora só funciona se quem pede e o alvo estiverem na
    mesma chamada — antes confiava sem checar em quem o navegador
    dizia ser o destinatário.
  - Removido o log que imprimia os 6 primeiros caracteres da chave do
    Resend a cada boot do servidor.
  - Em produção, o servidor agora recusa subir (encerra o processo)
    se `SESSION_SECRET` não estiver definido, em vez de seguir com o
    valor de reserva inseguro escrito no código-fonte.
  - **Não mudado, por decisão do próprio relatório** ("não é urgente"):
    sessão sem revogação de verdade (trocar senha/sair não invalida um
    token já emitido, só a expiração em 12h resolve) — exigiria guardar
    sessões ativas em algum lugar, hoje é tudo sem estado.
  - **Não mudado, por decisão minha**: sinalização bruta de WebRTC
    (`offer`/`answer`/`ice-candidate`) não ganhou a mesma checagem de
    "mesma chamada" que mic/câmera/mutar — mexer nisso sem poder testar
    ao vivo com múltiplos navegadores reais (limitação já conhecida
    deste ambiente) é arriscado demais pra fazer sem validação de
    verdade.
- **Token de sessão sai da URL nas rotas GET**: `/api/users`, `/api/me` e
  `/api/admin/users` agora recebem o token pelo header `Authorization:
  Bearer` em vez de `?token=...` na query string — evita ele ficar
  gravado em histórico do navegador e em logs de acesso (foi o que
  disparou um bloqueio do Malwarebytes Browser Guard num dos
  computadores da equipe). A única exceção que continua com token na
  URL é `/api/spotify/authorize`, porque ali é uma navegação de verdade
  (clique num link), não um fetch — não tem como anexar um header
  nesse caso. De quebra, `/api/admin/users` parou de expor o
  `spotifyRefreshToken` de cada pessoa pra qualquer admin.
- **Termo do Dia**: joguinho novo pro sistema geral, ícone 🔤 no
  cabeçalho (visível pra todo mundo, sem exigir admin). Palavra de 5
  letras igual pra todo mundo, muda à meia-noite (UTC), 6 tentativas,
  feedback verde/amarelo/cinza como o Wordle/Termo — cobre "jogar
  sozinho" (cada um joga a própria tentativa em privado) e "2 ou mais
  pessoas" (todo mundo disputa a mesma palavra, com um placar de quem
  já acertou hoje e em quantas tentativas). Guarda sequência de dias
  seguidos acertando (streak), recorde e taxa de vitórias por pessoa.
  Botão de compartilhar resultado gera o texto no estilo emoji
  (🟩🟨⬛) do Wordle original, pra colar em outro lugar se quiser.
  Lista de palavras (~130, sem acento de propósito, pra simplificar
  digitação) curada à mão para esta primeira versão — dá pra crescer
  depois. Duelo ao vivo entre 2 pessoas (correndo pra resolver a mesma
  palavra em tempo real) ficou de fora desta leva, é uma evolução
  natural pra depois usando a mesma infraestrutura de socket já
  existente.
- **PWA instalável + notificação do computador**: dá pra instalar o
  Internit Office como um app de verdade (ícone/janela própria, fixável
  na barra de tarefas/tela inicial) — `app/manifest.ts` + ícones
  gerados (192/512) + um service worker mínimo (só existe pra habilitar
  a instalação nos navegadores que exigem isso; não faz cache nem
  funciona offline, o app depende de WebSocket em tempo real). Menção,
  DM, cutucão, convite de sala e pedido/resposta de entrada agora
  também disparam uma notificação do sistema (Windows/Mac/Linux), não
  só o aviso dentro da aba — só quando a aba não está em foco, pra não
  duplicar aviso com quem já está olhando a tela. Pede permissão uma
  vez (banner, na primeira vez que abre) e fica com um controle
  permanente em "Meus Dados" pra ativar depois se recusar/fechar sem
  responder. Escopo combinado: só funciona com o navegador/aba aberta
  em algum lugar (mesmo minimizada) — notificação push de verdade, com
  o navegador todo fechado, ficou de fora (precisaria de infraestrutura
  nova: chaves de assinatura, guardar quem autorizou por dispositivo).

## Ainda por fazer

### PWA e notificações (evolução)

- **Notificação push de verdade** (com o navegador fechado): precisa de
  `web-push`/chaves VAPID, um service worker que trate o evento `push`
  de fato, e o servidor guardando a inscrição de cada dispositivo/
  usuário — bem mais infraestrutura que o modelo atual (Notification
  API direta, só com a aba aberta em algum lugar).

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

### Termo do Dia (evolução)

- **Duelo ao vivo entre 2 pessoas**: correr pra resolver a mesma
  palavra em tempo real, vendo o progresso (quantas tentativas) da
  outra pessoa na hora — usaria a mesma infraestrutura de socket que
  já existe pra chamada/chat.
- **Lista de palavras maior**: a lista atual (~130 palavras) é curada à
  mão pra essa primeira versão — dá pra crescer com mais palavras
  depois.

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

### Gravação de reuniões

- Gravar a chamada (câmeras + tela compartilhada) usando a API
  `MediaRecorder` do navegador de quem inicia a gravação.
- Combinar múltiplos streams remotos num único vídeo é a parte mais
  complexa (normalmente via `<canvas>` + `AudioContext` para mixar).
- Precisa de armazenamento para os arquivos gerados (o volume persistente
  que já configuramos no Railway serve, mas vídeo ocupa bem mais espaço
  que os dados de usuário — vale pensar num limite de tamanho/retenção).
