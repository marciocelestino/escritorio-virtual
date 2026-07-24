"use client";
import { getSocket }
from "@/lib/socket";
import Notification from "@/components/Notification";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header, {
  type Mention,
} from "@/components/Header";
import UserCard from "@/components/UserCard";
import RoomPanel, {
  type ChatMessage,
} from "@/components/RoomPanel";
import StatusSelector from "@/components/StatusSelector";
import DirectMessageModal from "@/components/DirectMessageModal";
import { getSessionUser, getSessionToken } from "@/lib/session";
import { useMounted } from "@/lib/useMounted";
import OfficeMap from "@/components/OfficeMap";
import VideoMeeting from "@/components/VideoMeeting";
import { roomSupportsCall } from "@/lib/rooms";
import { playPingSound } from "@/lib/sound";

type StatusValue =
  | "Disponivel"
  | "Ausente"
  | "Reuniao"
  | "Almoco"
  | "Ocioso";

type SpotifyTrack = {
  nome: string;
  artista: string;
};

type UserItem = {
  id: number;
  nome: string;
  email?: string;
  status?: StatusValue;
  online?: boolean;
  room: string;
  portasAbertas?: boolean;
  salaTrancada?: boolean;
  seat?: number | null;
  salaNome?: string | null;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  isAdmin?: boolean;
  spotifyTrack?: SpotifyTrack | null;
};

type LivePresence = {
  room: string;
  status?: StatusValue;
  portasAbertas?: boolean;
  salaTrancada?: boolean;
  seat?: number | null;
  spotifyTrack?: SpotifyTrack | null;
};

type EntryRequest = {
  requesterId: number;
  requesterNome: string;
  room: string;
  seat: number | null;
};

function escapeRegExp(text: string) {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// Menção simples por primeiro nome (@primeironome) — sem lista de
// sugestão nem negrito no texto por enquanto, só o suficiente pra
// disparar a notificação.
function messageMentionsName(
  message: string,
  nome: string
) {

  const firstName = nome
    .trim()
    .split(" ")[0];

  if (!firstName) {
    return false;
  }

  const pattern = new RegExp(
    `@${escapeRegExp(firstName)}\\b`,
    "i"
  );

  return pattern.test(message);
}

export default function OfficePage() {
  const router = useRouter();

  const [currentRoom, setCurrentRoom] =
    useState("Espaço Natureza");

  const [status, setStatus] =
    useState<StatusValue>("Disponivel");

    const [currentUserId, setCurrentUserId] =
  useState<number | null>(null);

  const [portasAbertas, setPortasAbertas] =
  useState(false);

  // Tranca a própria sala pessoal: só o dono pode entrar livremente
  // quando ligada — qualquer outra pessoa precisa ser convidada ou pedir
  // entrada e ser aceita.
  const [salaTrancada, setSalaTrancada] =
  useState(false);

  const [entryRequest, setEntryRequest] =
  useState<EntryRequest | null>(null);

  // Conversa privada (DM) aberta agora, se houver — só uma por vez, num
  // modal por cima do resto da tela.
  const [activeDm, setActiveDm] = useState<{
    id: number;
    nome: string;
    avatarTipo?: string | null;
    avatarValor?: string | null;
  } | null>(null);

  // Espelha activeDm pra uso dentro do handler de socket registrado só
  // uma vez no mount (currentUserId-style closure presa) — decide se
  // mostra notificação de DM nova ou não (não mostra se a conversa já
  // está aberta na tela).
  const activeDmRef = useRef<
    number | null
  >(null);

  useEffect(() => {
    activeDmRef.current =
      activeDm?.id ?? null;
  }, [activeDm]);

  // Quantas mensagens diretas não lidas de cada pessoa — mostrado como
  // selo no botão 💬 dela na lista "Online". Zera ao abrir a conversa.
  const [unreadDms, setUnreadDms] = useState<
    Record<number, number>
  >({});

  function openDm(user: {
    id: number;
    nome: string;
    avatarTipo?: string | null;
    avatarValor?: string | null;
  }) {

    setActiveDm(user);

    setUnreadDms((prev) => ({
      ...prev,
      [user.id]: 0,
    }));

  }

  // Pedido de entrada aceito, aguardando ser processado — não dá pra
  // chamar moveToRoom/chooseSeat direto de dentro do handler de socket
  // (registrado uma única vez no mount, com closure presa no
  // currentUserId daquele primeiro render, ainda nulo). Guardar aqui e
  // reagir num efeito à parte usa sempre a versão atual dessas funções.
  const [acceptedEntry, setAcceptedEntry] =
  useState<{
    room: string;
    seat: number;
  } | null>(null);

  // Guarda o pedido de entrada que EU fiz, pra completar a troca de sala
  // (moveToRoom + chooseSeat) só depois que o dono aceitar — não precisa
  // ser state porque não afeta o que é renderizado.
  const pendingEntryRef = useRef<{
    room: string;
    seat: number;
  } | null>(null);

  // Identifica qual "execução" do servidor respondeu por último — se
  // mudar (o servidor reiniciou, ex.: novo deploy), recarrega a página
  // sozinho pra pegar a versão nova, em vez de deixar a pessoa rodando o
  // código antigo até ela mesma lembrar de dar F5.
  const serverBootIdRef = useRef<
    string | null
  >(null);

  // Salas cujo histórico persistido já foi pedido nesta sessão — evita
  // pedir de novo toda vez que a pessoa volta pra uma sala em que já
  // esteve.
  const loadedRoomHistoryRef = useRef<
    Set<string>
  >(new Set());

  const [notification, setNotification] =
  useState("");

  const [roomInvite, setRoomInvite] =
  useState<{
    fromNome: string;
    room: string;
  } | null>(null);

  // Chat de texto por sala, sem persistência — as mensagens somem ao
  // recarregar a página, mas ficam guardadas por sala enquanto a pessoa
  // navega entre salas na mesma sessão.
  const [chatMessages, setChatMessages] =
  useState<
    Record<string, ChatMessage[]>
  >({});

  const [mentions, setMentions] =
  useState<Mention[]>([]);

  function sendChatMessage(text: string) {

    if (!currentUserId || !text.trim()) {
      return;
    }

    getSocket().emit("chat-message", {
      room: currentRoom,
      message: text,
    });
  }

  function clearChat() {

    if (!currentUserId) {
      return;
    }

    getSocket().emit("clear-chat", {
      room: currentRoom,
    });
  }

  const [
    usuariosColapsados,
    setUsuariosColapsados,
  ] = useState(() =>
    typeof window !== "undefined" &&
    localStorage.getItem(
      "usuariosColapsados"
    ) === "true"
  );

  useEffect(() => {

    localStorage.setItem(
      "usuariosColapsados",
      String(usuariosColapsados)
    );

  }, [usuariosColapsados]);

  // Minimiza só o corpo do chat, mantendo o cabeçalho da seção visível
  // (mesma ideia do minimizar de Usuários, mas independente).
  const [chatMinimizado, setChatMinimizado] =
    useState(() =>
      typeof window !== "undefined" &&
      localStorage.getItem(
        "chatMinimizado"
      ) === "true"
    );

  useEffect(() => {

    localStorage.setItem(
      "chatMinimizado",
      String(chatMinimizado)
    );

  }, [chatMinimizado]);

  // Fecha a barra lateral inteira (Chat + Usuários Online), devolvendo
  // toda a largura pro mapa — diferente de minimizar cada seção por
  // dentro, isso esconde a coluna toda.
  const [
    barraLateralFechada,
    setBarraLateralFechada,
  ] = useState(() =>
    typeof window !== "undefined" &&
    localStorage.getItem(
      "barraLateralFechada"
    ) === "true"
  );

  useEffect(() => {

    localStorage.setItem(
      "barraLateralFechada",
      String(barraLateralFechada)
    );

  }, [barraLateralFechada]);

  // Guarda o estado de presença mais recente pra poder reanunciar ao
  // servidor sempre que o socket reconectar (ex.: depois de uma queda de
  // rede ou um deploy no servidor) — sem isso, o socket volta com um id
  // novo que o servidor não associa a nenhum usuário, e toda troca de
  // sala/status/portas passa a ser rejeitada silenciosamente até a
  // pessoa recarregar a página.
  const presenceRef = useRef({
    room: "Espaço Natureza",
    status: "Disponivel" as StatusValue,
    portasAbertas: false,
    salaTrancada: false,
  });

function moveToRoom(
  room: string
) {

  if (!currentUserId) {
    return;
  }

  setCurrentRoom(room);

  const socket =
  getSocket();

if (
  socket &&
  currentUserId
) {
  socket.emit(
    "room-change",
    {
      userId:
        currentUserId,
      room,
    }
  );
}

  setLiveUsers((prev) => {

    const current =
      prev[currentUserId];

    if (!current) {
      return prev;
    }

    return {
      ...prev,
      [currentUserId]: {
        ...current,
        room,
        // O servidor reatribui um lugar livre na sala nova assim que o
        // room-change chegar — zera aqui pra não mostrar por um instante
        // a pessoa "sentada" num lugar da sala antiga.
        seat: null,
      },
    };
  });
}

function chooseSeat(seat: number) {

  if (!currentUserId) {
    return;
  }

  const socket =
    getSocket();

  socket.emit(
    "seat-change",
    {
      userId: currentUserId,
      seat,
    }
  );

  setLiveUsers((prev) => {

    const current =
      prev[currentUserId];

    if (!current) {
      return prev;
    }

    return {
      ...prev,
      [currentUserId]: {
        ...current,
        seat,
      },
    };
  });
}

function showNotification(
  message: string
) {
  setNotification(message);

  setTimeout(() => {
    setNotification("");
  }, 3000);
}

  const mounted = useMounted();

 const [roster, setRoster] =
  useState<UserItem[]>([]);

  const [liveUsers, setLiveUsers] =
  useState<
    Record<number, LivePresence>
  >({});

  const allUsers = useMemo(() => {
    return roster.map((user) => {
      const live = liveUsers[user.id];

      if (!live) {
        return {
          ...user,
          online: false,
        };
      }

      return {
        ...user,
        room: live.room,
        status: live.status,
        portasAbertas: live.portasAbertas,
        salaTrancada: live.salaTrancada,
        seat: live.seat,
        spotifyTrack: live.spotifyTrack ?? null,
        online: true,
      };
    });
  }, [roster, liveUsers]);

  const onlineUsers = useMemo(() => {
  return allUsers.filter(
    (user) => user.online !== false
  );
}, [allUsers]);

// Como o mapa mostra todas as salas ao mesmo tempo, clicar num lugar
// vazio de uma sala em que a pessoa ainda não está precisa fazer as duas
// coisas: mudar de sala e já sentar no lugar clicado (não só sentar em
// qualquer lugar livre, que é o que aconteceria só com moveToRoom).
function handleSeatClick(
  room: string,
  seat: number
) {

  if (room !== currentRoom) {

    const owner = allUsers.find(
      (candidate) =>
        (candidate.salaNome ||
          `Espaço ${candidate.nome}`) ===
        room
    );

    const isLocked = Boolean(
      owner &&
        owner.id !== currentUserId &&
        owner.salaTrancada
    );

    if (isLocked && owner) {

      pendingEntryRef.current = {
        room,
        seat,
      };

      getSocket().emit(
        "request-room-entry",
        { room, seat }
      );

      showNotification(
        `🔒 Pedido de entrada enviado a ${owner.nome}. Aguarde a aprovação.`
      );

      return;
    }

    moveToRoom(room);
  }

  chooseSeat(seat);
}

  useEffect(() => {

  const socket =
  getSocket();

  const user =
  getSessionUser();

if (!user) {
  router.push("/");
  return;
}

fetch("/api/users", {
  headers: {
    Authorization: `Bearer ${
      getSessionToken() ?? ""
    }`,
  },
})
  .then((res) => res.json())
  .then((users) => {
    setRoster(
      Array.isArray(users)
        ? (users as UserItem[])
        : []
    );
  })
  .catch((error) => {
    console.error(
      "Erro ao carregar usuários:",
      error
    );
  });

  const savedStatus =
    localStorage.getItem("status");

  const validStatuses: StatusValue[] = [
    "Disponivel",
    "Ausente",
    "Reuniao",
    "Almoco",
    "Ocioso",
  ];

  const initialStatus: StatusValue =
    validStatuses.includes(
      savedStatus as StatusValue
    )
      ? (savedStatus as StatusValue)
      : "Disponivel";

  const initialPortasAbertas =
    localStorage.getItem("portasAbertas") ===
    "true";

  const initialSalaTrancada =
    localStorage.getItem("salaTrancada") ===
    "true";

  presenceRef.current = {
    room: currentRoom,
    status: initialStatus,
    portasAbertas: initialPortasAbertas,
    salaTrancada: initialSalaTrancada,
  };

  function announcePresence() {

    socket.emit(
      "user-connected",
      {
        id: user.id,
        nome: user.nome,
        room: presenceRef.current.room,
        status: presenceRef.current.status,
        portasAbertas:
          presenceRef.current
            .portasAbertas,
        salaTrancada:
          presenceRef.current
            .salaTrancada,
        token: getSessionToken(),
      }
    );

  }

socket.on(
  "server-info",
  ({
    bootId,
  }: {
    bootId: string;
  }) => {

    const previous =
      serverBootIdRef.current;

    serverBootIdRef.current = bootId;

    // Só recarrega se JÁ tínhamos visto um bootId antes e ele mudou —
    // na primeira conexão (previous === null) não há nada pra
    // atualizar, é só o carregamento normal da página.
    if (previous && previous !== bootId) {

      showNotification(
        "🔄 Nova versão disponível — atualizando..."
      );

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    }

  }
);

socket.on(
  "connect",
  () => {

    console.log(
      "Socket conectado:",
      socket.id
    );

    // Também roda em reconexões (não só na primeira vez) — sem isso, o
    // servidor não reassocia o socket novo ao usuário, e room-change/
    // status-change passam a ser rejeitados até a página ser recarregada.
    announcePresence();

  }
);

if (socket.connected) {
  announcePresence();
}

socket.on(
  "presence-update",
  (users: Array<{
    id: number;
    room: string;
    status?: LivePresence["status"];
    portasAbertas?: boolean;
    salaTrancada?: boolean;
    seat?: number | null;
    spotifyTrack?: SpotifyTrack | null;
  }>) => {

    const map: Record<
      number,
      LivePresence
    > = {};

    users.forEach((liveUser) => {
      map[liveUser.id] = {
        room: liveUser.room,
        status: liveUser.status,
        portasAbertas: liveUser.portasAbertas,
        salaTrancada: liveUser.salaTrancada,
        seat: liveUser.seat,
        spotifyTrack: liveUser.spotifyTrack,
      };
    });

    setLiveUsers(map);

  }
);

socket.on(
  "room-change-denied",
  ({ room }: { room: string }) => {

    showNotification(
      `🔒 Você não tem permissão pra entrar em ${room} agora.`
    );

  }
);

socket.on(
  "room-entry-requested",
  (payload: EntryRequest) => {

    playPingSound();

    setEntryRequest(payload);

  }
);

socket.on(
  "room-entry-response",
  ({
    room,
    approved,
    reason,
  }: {
    room: string;
    approved: boolean;
    reason?: string;
  }) => {

    const pending =
      pendingEntryRef.current;

    if (!pending || pending.room !== room) {
      return;
    }

    pendingEntryRef.current = null;

    if (approved) {

      setAcceptedEntry({
        room,
        seat: pending.seat,
      });

      showNotification(
        `✅ Pedido aceito — você entrou em ${room}.`
      );

    } else {

      showNotification(
        reason === "offline"
          ? `🔒 O dono de ${room} está offline no momento.`
          : `🔒 Seu pedido de entrada em ${room} foi recusado.`
      );

    }

  }
);

socket.on(
  "poked",
  ({
    fromNome,
  }: {
    fromNome: string;
  }) => {

    playPingSound();

    showNotification(
      `🔔 ${fromNome} quer falar com você!`
    );

  }
);

socket.on(
  "invited-to-room",
  ({
    fromNome,
    room,
  }: {
    fromNome: string;
    room: string;
  }) => {

    playPingSound();

    setRoomInvite({ fromNome, room });

  }
);

socket.on(
  "chat-message",
  (msg: ChatMessage & { room: string }) => {

    setChatMessages((prev) => {

      const existing = prev[msg.room] ?? [];

      if (
        existing.some(
          (m) => m.id === msg.id
        )
      ) {
        return prev;
      }

      return {
        ...prev,
        [msg.room]: [
          ...existing,
          {
            id: msg.id,
            fromId: msg.fromId,
            fromNome: msg.fromNome,
            message: msg.message,
            at: msg.at,
          },
        ].slice(-200),
      };

    });

    if (
      msg.fromId !== user.id &&
      messageMentionsName(
        msg.message,
        user.nome
      )
    ) {

      setMentions((prev) =>
        [
          {
            id: msg.id,
            room: msg.room,
            fromNome: msg.fromNome,
            message: msg.message,
            at: msg.at,
          },
          ...prev,
        ].slice(0, 20)
      );

    }

  }
);

// O Chat Geral tem seu próprio histórico/tela (GeneralChatModal), mas a
// notificação de @menção precisa existir mesmo com o modal fechado —
// por isso esse listener global, igual ao de "chat-message" acima.
socket.on(
  "general-chat-message",
  (msg: {
    id: string;
    fromId: number;
    fromNome: string;
    message: string;
    at: number;
  }) => {

    if (
      msg.fromId !== user.id &&
      messageMentionsName(
        msg.message,
        user.nome
      )
    ) {

      setMentions((prev) =>
        [
          {
            id: msg.id,
            room: "Chat Geral",
            fromNome: msg.fromNome,
            message: msg.message,
            at: msg.at,
            kind: "general" as const,
          },
          ...prev,
        ].slice(0, 20)
      );

    }

  }
);

// Histórico persistido de uma sala, carregado ao entrar nela pela
// primeira vez nesta sessão (ver loadedRoomHistoryRef). Mescla com o
// que já tiver chegado em tempo real nesse meio-tempo, sem duplicar.
socket.on(
  "chat-history",
  ({
    room,
    messages,
  }: {
    room?: string;
    withUserId?: number;
    messages: ChatMessage[];
  }) => {

    if (!room) {
      return;
    }

    setChatMessages((prev) => {

      const existing = prev[room] ?? [];
      const existingIds = new Set(
        existing.map((m) => m.id)
      );

      const merged = [
        ...messages.filter(
          (m) => !existingIds.has(m.id)
        ),
        ...existing,
      ];

      merged.sort((a, b) => a.at - b.at);

      return {
        ...prev,
        [room]: merged.slice(-200),
      };

    });

  }
);

// Notifica mensagem direta nova só se a conversa com essa pessoa não
// estiver aberta na tela agora (o próprio modal, quando aberto, escuta
// esse mesmo evento pra atualizar a lista de mensagens dele).
socket.on(
  "dm-message",
  (msg: ChatMessage & {
    toUserId: number;
  }) => {

    const otherPartyId =
      msg.fromId === user.id
        ? msg.toUserId
        : msg.fromId;

    if (
      msg.fromId !== user.id &&
      activeDmRef.current !== otherPartyId
    ) {

      playPingSound();

      showNotification(
        `💬 ${msg.fromNome}: ${msg.message.slice(
          0,
          60
        )}`
      );

      setUnreadDms((prev) => ({
        ...prev,
        [otherPartyId]:
          (prev[otherPartyId] ?? 0) + 1,
      }));

    }

  }
);

socket.on(
  "chat-cleared",
  ({ room }: { room: string }) => {

    setChatMessages((prev) => ({
      ...prev,
      [room]: [],
    }));

  }
);

socket.on(
  "chat-clear-denied",
  () => {

    showNotification(
      "Você não tem permissão pra limpar o chat dessa sala."
    );

  }
);

setCurrentUserId(
  user.id
);

  setStatus(initialStatus);
  setPortasAbertas(initialPortasAbertas);
  setSalaTrancada(initialSalaTrancada);

  // Conecta o socket uma única vez, no valor de currentRoom no momento da
  // montagem — incluir currentRoom nas deps re-registraria os listeners do
  // socket a cada troca de sala, duplicando-os.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [router]);

  // Volta do redirect de autorização do Spotify (?spotify=conectado|
  // negado|erro|nao-configurado) — mostra um aviso e limpa a query da
  // URL. Lido direto de window.location em vez de useSearchParams pra
  // não exigir um Suspense boundary só por causa disso.
  useEffect(() => {

    const params = new URLSearchParams(
      window.location.search
    );

    const spotifyResult =
      params.get("spotify");

    if (!spotifyResult) {
      return;
    }

    const messages: Record<string, string> = {
      conectado:
        "🎵 Spotify conectado! A música que você tocar vai aparecer no seu card.",
      negado:
        "Conexão com o Spotify cancelada.",
      erro:
        "Não foi possível conectar ao Spotify. Tente novamente.",
      "nao-configurado":
        "Integração com Spotify ainda não configurada neste ambiente.",
    };

    // setTimeout em vez de chamar showNotification direto: o lint acusa
    // "setState síncrono dentro de efeito" (cascata de renders) —
    // adiar pra depois do commit deste efeito evita isso.
    const timeoutId = setTimeout(() => {

      showNotification(
        messages[spotifyResult] ??
          "Spotify: " + spotifyResult
      );

      router.replace("/office");

    }, 0);

    return () => clearTimeout(timeoutId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Processa um pedido de entrada aceito com as funções "de agora"
  // (currentUserId/currentRoom atuais) — ver comentário na declaração de
  // acceptedEntry. moveToRoom/chooseSeat de propósito não entram nas
  // deps: são recriadas a cada render, e só queremos reagir de fato
  // quando acceptedEntry muda.
  useEffect(() => {

    if (!acceptedEntry) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    moveToRoom(acceptedEntry.room);
    chooseSeat(acceptedEntry.seat);

    setAcceptedEntry(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedEntry]);

  useEffect(() => {

    presenceRef.current = {
      room: currentRoom,
      status,
      portasAbertas,
      salaTrancada,
    };

  }, [
    currentRoom,
    status,
    portasAbertas,
    salaTrancada,
  ]);

  // Pede o histórico persistido da sala assim que a pessoa entra nela
  // pela primeira vez nesta sessão (troca de sala ou carregamento
  // inicial da página).
  useEffect(() => {

    if (
      loadedRoomHistoryRef.current.has(
        currentRoom
      )
    ) {
      return;
    }

    loadedRoomHistoryRef.current.add(
      currentRoom
    );

    getSocket().emit("load-chat-history", {
      room: currentRoom,
    });

  }, [currentRoom]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "status",
      status
    );

  }, [status, mounted]);

  useEffect(() => {

    if (!mounted || !currentUserId) return;

    const socket = getSocket();

    socket.emit(
      "status-change",
      {
        userId: currentUserId,
        status,
      }
    );

  }, [status, currentUserId, mounted]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "portasAbertas",
      String(portasAbertas)
    );

  }, [portasAbertas, mounted]);

  useEffect(() => {

    if (!mounted || !currentUserId) return;

    const socket = getSocket();

    socket.emit(
      "door-toggle",
      {
        userId: currentUserId,
        aberta: portasAbertas,
      }
    );

  }, [portasAbertas, currentUserId, mounted]);

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "salaTrancada",
      String(salaTrancada)
    );

  }, [salaTrancada, mounted]);

  useEffect(() => {

    if (!mounted || !currentUserId) return;

    const socket = getSocket();

    socket.emit(
      "sala-lock-change",
      {
        userId: currentUserId,
        trancada: salaTrancada,
      }
    );

  }, [salaTrancada, currentUserId, mounted]);

  // O status só muda quando a própria pessoa escolhe no seletor — já
  // tivemos um comportamento automático aqui (mudar pra "Disponível" ao
  // mexer o mouse, "Ausente" depois de inatividade) que foi removido a
  // pedido: o status é uma escolha da pessoa, não algo que o sistema
  // decide por ela.

  if (!mounted) {
    return null;
  }

  // A chamada de vídeo só existe na sala em que a pessoa está agora — sair
  // da sala (mudar de sala) encerra a participação na chamada
  // automaticamente (o componente desmonta/remonta com o `room` novo, e o
  // efeito de limpeza do VideoMeeting cuida de sair da chamada anterior).
  const showVideoDock =
    roomSupportsCall(currentRoom);

  const currentRoomUsers =
    onlineUsers.filter(
      (user) => user.room === currentRoom
    );

  const someoneElseWithOpenDoor =
    currentRoomUsers.some(
      (user) =>
        user.id !== currentUserId &&
        user.portasAbertas
    );

  const autoJoinCall = Boolean(
    roomSupportsCall(currentRoom) &&
      currentRoomUsers.find(
        (user) => user.id === currentUserId
      )?.portasAbertas &&
      someoneElseWithOpenDoor
  );

  const myself = allUsers.find(
    (user) => user.id === currentUserId
  );

  return (

    <main className="flex h-screen flex-col bg-slate-100 dark:bg-slate-950">
      {notification && (
        <Notification
          message={notification}
        />
)}

      {roomInvite && (

        <div
          className="
            fixed
            top-24
            left-1/2
            z-[60]
            -translate-x-1/2
            rounded-xl
            bg-indigo-600
            px-5
            py-4
            text-white
            shadow-xl
          "
        >

          <p>
            🔔 {roomInvite.fromNome} te
            chamou para {roomInvite.room}
          </p>

          <div className="mt-3 flex gap-2">

            <button
              onClick={() => {
                moveToRoom(roomInvite.room);
                setRoomInvite(null);
              }}
              className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Ir até lá
            </button>

            <button
              onClick={() =>
                setRoomInvite(null)
              }
              className="rounded-lg bg-indigo-500 px-3 py-1 text-sm hover:bg-indigo-400"
            >
              Ignorar
            </button>

          </div>

        </div>

      )}

      {entryRequest && (

        <div
          className="
            fixed
            top-44
            left-1/2
            z-[60]
            -translate-x-1/2
            rounded-xl
            bg-amber-600
            px-5
            py-4
            text-white
            shadow-xl
          "
        >

          <p>
            🔒 {entryRequest.requesterNome}
            {" "}quer entrar na sua sala.
          </p>

          <div className="mt-3 flex gap-2">

            <button
              onClick={() => {

                getSocket().emit(
                  "respond-room-entry",
                  {
                    requesterId:
                      entryRequest.requesterId,
                    room: entryRequest.room,
                    approve: true,
                  }
                );

                setEntryRequest(null);

              }}
              className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50"
            >
              Aceitar
            </button>

            <button
              onClick={() => {

                getSocket().emit(
                  "respond-room-entry",
                  {
                    requesterId:
                      entryRequest.requesterId,
                    room: entryRequest.room,
                    approve: false,
                  }
                );

                setEntryRequest(null);

              }}
              className="rounded-lg bg-amber-500 px-3 py-1 text-sm hover:bg-amber-400"
            >
              Recusar
            </button>

          </div>

        </div>

      )}

      <Header
        mentions={mentions}
        onMentionClick={(room) => {
          moveToRoom(room);
          setMentions([]);
        }}
        onClearMentions={() =>
          setMentions([])
        }
        roster={allUsers}
      />

      <div className="flex flex-1 overflow-hidden">

        {showVideoDock && (

          <VideoMeeting
            room={currentRoom}
            autoJoin={autoJoinCall}
            onNotify={showNotification}
            myNome={myself?.nome}
            myAvatarTipo={myself?.avatarTipo}
            myAvatarValor={myself?.avatarValor}
            myIsAdmin={myself?.isAdmin}
            roster={allUsers}
            sidebarWidthPx={
              barraLateralFechada ? 0 : 320
            }
            onOpenChat={() => {
              setBarraLateralFechada(false);
              setChatMinimizado(false);
            }}
          />

        )}

        <section
          className="
            flex-1
            overflow-y-auto
            p-5
          "
        >

          <div
            className="
              mb-4
              flex
              items-center
              justify-end
              gap-4
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <span
                className="
                  text-sm
                  font-medium
                  text-slate-700
                  dark:text-slate-300
                "
              >
                Meu status
              </span>

              <StatusSelector
                status={status}
                setStatus={setStatus}
              />

              <button
                onClick={() =>
                  setPortasAbertas(
                    (prev) => !prev
                  )
                }
                title="Quando ligado, colegas que também estiverem com as portas abertas na mesma sala conectam áudio automaticamente com você, sem precisar clicar em Entrar na Chamada."
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-sm
                  font-medium
                  ${
                    portasAbertas
                      ? "border-green-300 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                `}
              >
                {portasAbertas
                  ? "🚪 Portas abertas"
                  : "🚪 Portas fechadas"}
              </button>

              <button
                onClick={() =>
                  setSalaTrancada(
                    (prev) => !prev
                  )
                }
                title="Quando trancada, só entra na sua sala pessoal quem você chamar ou aceitar um pedido de entrada."
                className={`
                  rounded-lg
                  border
                  px-3
                  py-2
                  text-sm
                  font-medium
                  ${
                    salaTrancada
                      ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                `}
              >
                {salaTrancada
                  ? "🔒 Minha sala trancada"
                  : "🔓 Minha sala destrancada"}
              </button>

              <button
                onClick={() =>
                  setBarraLateralFechada(
                    (current) => !current
                  )
                }
                title={
                  barraLateralFechada
                    ? "Mostrar barra lateral"
                    : "Fechar barra lateral"
                }
                className="
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-slate-600
                  hover:bg-slate-100
                  dark:border-slate-600
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                {barraLateralFechada
                  ? "»"
                  : "«"}
              </button>

            </div>

          </div>

          <div className="mb-4">

            <OfficeMap
              users={allUsers}
              currentUserId={currentUserId ?? 0}
              onUserClick={(userId, name) => {

                getSocket().emit(
                  "poke",
                  { to: userId }
                );

                showNotification(
                  `Você chamou ${name}`
                );

              }}
              onSeatClick={handleSeatClick}
            />

          </div>

        </section>

        <aside
          className={`
            relative
            z-50
            flex
            shrink-0
            flex-col
            overflow-hidden
            bg-white
            transition-all
            dark:bg-slate-900
            ${
              barraLateralFechada
                ? "w-0"
                : "w-80 border-l dark:border-white/10"
            }
          `}
        >

          <div className="shrink-0 overflow-y-auto p-4">

            <RoomPanel
              room={currentRoom}
              users={allUsers}
              currentUserId={currentUserId}
              messages={
                chatMessages[currentRoom] ?? []
              }
              onSendMessage={sendChatMessage}
              onClearChat={clearChat}
              minimized={chatMinimizado}
              onToggleMinimized={() =>
                setChatMinimizado(
                  (current) => !current
                )
              }
            />

          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t dark:border-white/10">

            <button
              onClick={() =>
                setUsuariosColapsados(
                  (current) => !current
                )
              }
              className="
                flex
                w-full
                shrink-0
                items-center
                justify-between
                border-b
                p-4
                font-bold
                text-slate-900
                hover:bg-slate-50
                dark:border-white/10
                dark:text-slate-100
                dark:hover:bg-slate-800
              "
            >
              Online ({onlineUsers.length})

              <span
                className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-200
                  text-sm
                  leading-none
                  text-slate-600
                  dark:bg-slate-700
                  dark:text-slate-300
                "
              >
                {usuariosColapsados ? "+" : "−"}
              </span>
            </button>

            {!usuariosColapsados &&
              onlineUsers.map((user) => (

              <UserCard
                key={user.id}
                nome={user.nome}
                status={user.status}
                unreadDmCount={
                  unreadDms[user.id] ?? 0
                }
                onOpenDm={
                  user.id !== currentUserId
                    ? () =>
                        openDm({
                          id: user.id,
                          nome: user.nome,
                          avatarTipo:
                            user.avatarTipo,
                          avatarValor:
                            user.avatarValor,
                        })
                    : undefined
                }
                onInvite={
                  user.id !== currentUserId &&
                  user.room !== currentRoom
                    ? () => {

                        getSocket().emit(
                          "invite-to-room",
                          {
                            to: user.id,
                            room: currentRoom,
                          }
                        );

                        showNotification(
                          `Convite enviado para ${user.nome}.`
                        );

                      }
                    : undefined
                }
              />

            ))}

          </div>

        </aside>

      </div>

      {activeDm && currentUserId && (

        <DirectMessageModal
          currentUserId={currentUserId}
          otherUser={activeDm}
          roster={allUsers}
          onClose={() => setActiveDm(null)}
        />

      )}

    </main>
  );
}