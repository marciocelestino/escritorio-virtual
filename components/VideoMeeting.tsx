"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getSocket } from "@/lib/socket";

type OfferPayload = {
  from: string;
  offer: RTCSessionDescriptionInit;
};

type AnswerPayload = {
  from: string;
  answer: RTCSessionDescriptionInit;
};

type IceCandidatePayload = {
  from: string;
  candidate: RTCIceCandidateInit;
};

type RosterUser = {
  id: number;
  nome: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
};

type Props = {
  room: string;
  autoJoin?: boolean;
  onNotify?: (message: string) => void;
  myNome?: string;
  myAvatarTipo?: string | null;
  myAvatarValor?: string | null;
  roster?: RosterUser[];
  // Largura atual da barra lateral (Chat/Usuários) em app/office/page.tsx —
  // a barra da chamada reserva esse espaço pra não ficar por baixo dela, e
  // precisa saber quando ela está fechada pra ocupar a tela toda.
  sidebarWidthPx?: number;
  onOpenChat?: () => void;
};

// Prefixo usado no id "expandido" pra distinguir a tela compartilhada de um
// participante da câmera dele — ambas podem estar visíveis ao mesmo tempo.
const SCREEN_PREFIX = "screen-";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

// Sempre mudo — o áudio de cada participante toca por um <RemoteAudio>
// dedicado (ver mais abaixo), não pelo elemento de vídeo. Isso faz o
// áudio continuar tocando mesmo quando mostramos o avatar no lugar do
// vídeo (câmera desligada).
function VideoTile({
  stream,
  large = false,
  small = false,
  speaking = false,
  micMuted = false,
  onClick,
  onElement,
}: {
  stream: MediaStream;
  large?: boolean;
  small?: boolean;
  speaking?: boolean;
  micMuted?: boolean;
  onClick?: () => void;
  onElement?: (
    el: HTMLVideoElement | null
  ) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {

    onElement?.(ref.current);

    return () => onElement?.(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`
        relative
        ${
          large
            ? "w-full"
            : small
            ? "aspect-square w-full shrink-0"
            : "w-full max-w-md"
        }
        rounded-xl
        ${
          speaking
            ? "ring-2 ring-green-500"
            : ""
        }
      `}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        onClick={onClick}
        className={
          large
            ? `
              max-h-[65vh]
              w-full
              cursor-pointer
              rounded-xl
              border
              bg-black
              object-contain
            `
            : `
              h-full
              w-full
              cursor-pointer
              rounded-xl
              border
              object-cover
            `
        }
      />

      {micMuted && (
        <span
          className="
            absolute
            bottom-2
            left-2
            rounded-full
            bg-black/60
            px-2
            py-1
            text-xs
            text-white
          "
        >
          🔇
        </span>
      )}
    </div>
  );
}

function CameraOffAvatar({
  nome,
  avatarTipo,
  avatarValor,
  micMuted = false,
  speaking = false,
  small = false,
}: {
  nome?: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  micMuted?: boolean;
  speaking?: boolean;
  small?: boolean;
}) {

  const initials =
    (nome ?? "")
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      className={`
        relative
        flex
        items-center
        justify-center
        rounded-xl
        border
        bg-slate-100
        dark:border-slate-600
        dark:bg-slate-700
        ${
          speaking
            ? "ring-2 ring-green-500"
            : ""
        }
        ${
          small
            ? "aspect-square w-full shrink-0"
            : "h-40 w-full"
        }
      `}
    >

      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          overflow-hidden
          rounded-full
          bg-blue-600
          font-bold
          text-white
          text-lg
          shadow-md
        "
      >

        {avatarTipo === "foto" && avatarValor ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarValor}
            alt={nome ?? ""}
            className="h-full w-full object-cover"
          />
        ) : avatarTipo === "emoji" && avatarValor ? (
          <span className="text-3xl">
            {avatarValor}
          </span>
        ) : (
          initials
        )}

      </div>

      {micMuted && (
        <span
          className={`
            absolute
            rounded-full
            bg-black/60
            text-white
            ${
              small
                ? "bottom-1 left-1 px-1 text-[9px]"
                : "bottom-2 left-2 px-2 py-1 text-xs"
            }
          `}
        >
          🔇
        </span>
      )}

    </div>
  );
}

// Áudio de um participante remoto, sempre montado enquanto ele estiver na
// chamada — independente de estarmos mostrando o vídeo dele ou o avatar
// (câmera desligada). Antes, o som só tocava através do elemento de
// vídeo; quando a câmera estava desligada não renderizávamos nenhum
// vídeo, e o áudio da pessoa parava de tocar pra todo mundo (mesmo ela
// falando normalmente). Separar o áudio do vídeo resolve isso — o vídeo
// (quando mostrado) sempre fica mudo, esse elemento é quem realmente
// toca o som.
function RemoteAudio({
  stream,
  sinkId,
}: {
  stream: MediaStream;
  sinkId?: string;
}) {

  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {

    const el = ref.current as
      | (HTMLAudioElement & {
          setSinkId?: (
            id: string
          ) => Promise<void>;
        })
      | null;

    if (
      el &&
      sinkId &&
      typeof el.setSinkId === "function"
    ) {
      el.setSinkId(sinkId).catch(() => {});
    }

  }, [sinkId]);

  return (
    <audio
      ref={ref}
      autoPlay
      style={{ display: "none" }}
    />
  );
}

// Botão da barra de chamada — ícone em cima, rótulo embaixo, num "chip"
// arredondado (mesma linguagem visual do Zoom/Meet), em vez de ícone e
// texto lado a lado como antes.
function CallBarButton({
  icon,
  label,
  active = false,
  danger = false,
  onClick,
  title,
}: {
  icon: string;
  label?: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        flex
        min-w-[56px]
        flex-col
        items-center
        gap-1
        rounded-xl
        px-3
        py-2
        text-[11px]
        font-medium
        transition
        ${
          danger
            ? "bg-red-600 text-white hover:bg-red-700"
            : active
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        }
      `}
    >
      <span className="text-lg leading-none">
        {icon}
      </span>

      {label && <span>{label}</span>}
    </button>
  );
}

export default function VideoMeeting({
  room,
  autoJoin = false,
  onNotify,
  myNome,
  myAvatarTipo,
  myAvatarValor,
  roster,
  sidebarWidthPx = 320,
  onOpenChat,
}: Props) {

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const screenStreamRef =
    useRef<MediaStream | null>(null);

  const peersRef =
    useRef<Map<string, RTCPeerConnection>>(
      new Map()
    );

  // Guarda o sender de vídeo (câmera) já criado por participante — permite
  // ligar/desligar a câmera com replaceTrack, sem precisar renegociar de
  // novo a cada troca.
  const videoSendersRef =
    useRef<Map<string, RTCRtpSender>>(
      new Map()
    );

  // Sender DEDICADO de compartilhamento de tela por participante — separado
  // do sender de câmera de propósito, pra tela e câmera poderem ir juntas
  // (duas faixas de vídeo por conexão) em vez de uma substituir a outra.
  const screenSendersRef =
    useRef<Map<string, RTCRtpSender>>(
      new Map()
    );

  // Marca, por participante remoto, o id da stream de vídeo reconhecida
  // como "câmera" (a primeira que chegar) — qualquer outra stream de vídeo
  // que aparecer depois é tratada como tela compartilhada.
  const remoteCameraStreamIdRef =
    useRef<Map<string, string>>(new Map());

  const joiningRef =
    useRef(false);

  const joinedRef =
    useRef(false);

  const roomRef =
    useRef(room);

  const expandedVideoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  const micOnRef =
    useRef(true);

  const cameraOnRef =
    useRef(true);

  // Detecção de quem está falando: um AnalyserNode por participante (local
  // e remotos), nunca conectado ao destino de áudio — só lemos o volume,
  // sem tocar o som de volta (senão o próprio microfone ecoaria).
  const audioContextRef =
    useRef<AudioContext | null>(null);

  const analysersRef =
    useRef<
      Map<
        string,
        {
          analyser: AnalyserNode;
          data: Uint8Array<ArrayBuffer>;
        }
      >
    >(new Map());

  const speakingRef =
    useRef<Set<string>>(new Set());

  const [joined, setJoined] =
    useState(false);

  const [stream, setStream] =
    useState<MediaStream | null>(
      null
    );

  const [cameraOn, setCameraOn] =
    useState(true);

  const [micOn, setMicOn] =
    useState(true);

  const [sharingScreen, setSharingScreen] =
    useState(false);

  const [autoJoined, setAutoJoined] =
    useState(false);

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [
    remoteStreams,
    setRemoteStreams,
  ] = useState<
    Record<string, MediaStream>
  >({});

  // Tela compartilhada de cada participante remoto — guardada separada da
  // câmera (remoteStreams) pra poder mostrar as duas ao mesmo tempo, em
  // cards diferentes.
  const [
    remoteScreenStreams,
    setRemoteScreenStreams,
  ] = useState<
    Record<string, MediaStream>
  >({});

  // Pré-visualização da própria tela sendo compartilhada — sem isso, quem
  // compartilha não via a própria tela (só quem recebia).
  const [screenStream, setScreenStream] =
    useState<MediaStream | null>(null);

  const [
    participantNames,
    setParticipantNames,
  ] = useState<
    Record<string, string>
  >({});

  const [
    participantUserIds,
    setParticipantUserIds,
  ] = useState<
    Record<string, number>
  >({});

  const [
    remoteMicOff,
    setRemoteMicOff,
  ] = useState<
    Record<string, boolean>
  >({});

  // Câmera desligada (ou nunca ligada — ex.: entrou só com áudio) de cada
  // participante remoto. Sem isso, o vídeo remoto continuava mostrando o
  // último quadro recebido (congelado) ou uma tela em branco quando a
  // pessoa não tinha faixa de vídeo nenhuma.
  const [
    remoteCameraOff,
    setRemoteCameraOff,
  ] = useState<
    Record<string, boolean>
  >({});

  const [speakingIds, setSpeakingIds] =
    useState<Set<string>>(new Set());

  const [showDeviceSettings, setShowDeviceSettings] =
    useState(false);

  const [audioInputs, setAudioInputs] =
    useState<MediaDeviceInfo[]>([]);

  const [audioOutputs, setAudioOutputs] =
    useState<MediaDeviceInfo[]>([]);

  const [selectedMicId, setSelectedMicId] =
    useState("");

  const [selectedSpeakerId, setSelectedSpeakerId] =
    useState("");

  function removePeer(
    remoteSocketId: string
  ) {

    const peer =
      peersRef.current.get(
        remoteSocketId
      );

    if (peer) {
      peer.close();
      peersRef.current.delete(
        remoteSocketId
      );
    }

    videoSendersRef.current.delete(
      remoteSocketId
    );

    screenSendersRef.current.delete(
      remoteSocketId
    );

    remoteCameraStreamIdRef.current.delete(
      remoteSocketId
    );

    detachAnalyser(remoteSocketId);

    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setRemoteScreenStreams((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setParticipantNames((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setParticipantUserIds((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setRemoteMicOff((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setRemoteCameraOff((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setExpandedId((current) =>
      current === remoteSocketId ||
      current ===
        `${SCREEN_PREFIX}${remoteSocketId}`
        ? null
        : current
    );
  }

  function getAudioContext() {

    if (!audioContextRef.current) {
      audioContextRef.current =
        new AudioContext();
    }

    return audioContextRef.current;
  }

  function attachAnalyser(
    id: string,
    mediaStream: MediaStream
  ) {

    if (
      analysersRef.current.has(id)
    ) {
      return;
    }

    if (
      mediaStream.getAudioTracks()
        .length === 0
    ) {
      return;
    }

    const ctx = getAudioContext();

    const source =
      ctx.createMediaStreamSource(
        mediaStream
      );

    const analyser =
      ctx.createAnalyser();

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;

    source.connect(analyser);

    analysersRef.current.set(id, {
      analyser,
      data: new Uint8Array(
        new ArrayBuffer(
          analyser.frequencyBinCount
        )
      ),
    });
  }

  function detachAnalyser(id: string) {
    analysersRef.current.delete(id);
  }

  async function restartIce(
    remoteSocketId: string,
    peer: RTCPeerConnection
  ) {

    try {

      const offer =
        await peer.createOffer({
          iceRestart: true,
        });

      await peer.setLocalDescription(
        offer
      );

      getSocket().emit(
        "offer",
        {
          to: remoteSocketId,
          offer,
        }
      );

    } catch (error) {

      console.error(
        "Erro ao tentar recuperar conexão com",
        remoteSocketId,
        error
      );

    }
  }

  function createPeerConnection(
    remoteSocketId: string
  ) {

    const socket = getSocket();

    const peer = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    peer.ontrack = (event) => {

      const incomingStream =
        event.streams[0];

      // O áudio (microfone) sempre viaja junto da câmera na mesma stream
      // original — nunca junto da tela compartilhada (que não manda
      // áudio nesse app). Usa isso pra aprender qual stream id é "a
      // câmera" desse participante assim que o áudio chegar, mesmo que a
      // faixa de vídeo chegue antes ou depois dela.
      if (
        event.track.kind === "audio" &&
        incomingStream &&
        !remoteCameraStreamIdRef.current.has(
          remoteSocketId
        )
      ) {
        remoteCameraStreamIdRef.current.set(
          remoteSocketId,
          incomingStream.id
        );
      }

      if (event.track.kind === "video") {

        const videoTrack = event.track;

        const knownCameraStreamId =
          remoteCameraStreamIdRef.current.get(
            remoteSocketId
          );

        const isScreenShare = Boolean(
          knownCameraStreamId &&
            incomingStream &&
            incomingStream.id !==
              knownCameraStreamId
        );

        if (isScreenShare) {

          setRemoteScreenStreams((prev) => ({
            ...prev,
            [remoteSocketId]: incomingStream,
          }));

          // Chama atenção pra tela recém-compartilhada, mostrando ela em
          // destaque assim que aparece (em vez de só um card discreto na
          // fita).
          setExpandedId(
            `${SCREEN_PREFIX}${remoteSocketId}`
          );

          videoTrack.onmute = () => {
            setRemoteScreenStreams((prev) => {
              const next = { ...prev };
              delete next[remoteSocketId];
              return next;
            });
          };

          videoTrack.onunmute = () => {
            setRemoteScreenStreams((prev) => ({
              ...prev,
              [remoteSocketId]: incomingStream,
            }));
          };

          return;
        }

        if (
          !knownCameraStreamId &&
          incomingStream
        ) {
          remoteCameraStreamIdRef.current.set(
            remoteSocketId,
            incomingStream.id
          );
        }

        // A câmera desligar/ligar depois de conectado não dispara um novo
        // "ontrack" (o remetente só troca a faixa com replaceTrack) — quem
        // recebe percebe isso pelo próprio evento de mute/unmute da faixa
        // de vídeo. Sem isso, o lado remoto ficava com o último quadro
        // recebido "congelado" em vez de trocar pro avatar.
        setRemoteCameraOff((prev) => ({
          ...prev,
          [remoteSocketId]:
            videoTrack.muted,
        }));

        videoTrack.onmute = () => {
          setRemoteCameraOff((prev) => ({
            ...prev,
            [remoteSocketId]: true,
          }));
        };

        videoTrack.onunmute = () => {
          setRemoteCameraOff((prev) => ({
            ...prev,
            [remoteSocketId]: false,
          }));
        };

      }

      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: incomingStream,
      }));

    };

    peer.onicecandidate = (event) => {

      if (event.candidate) {
        socket.emit(
          "ice-candidate",
          {
            to: remoteSocketId,
            candidate: event.candidate,
          }
        );
      }

    };

    // Sem isso, uma queda de rede no meio da chamada (wifi instável,
    // troca de rede etc.) deixa a conexão "travada" mostrando o último
    // quadro recebido pra sempre — o WebRTC não recupera sozinho sem uma
    // renegociação explícita.
    peer.oniceconnectionstatechange = () => {

      const state = peer.iceConnectionState;

      if (state === "failed") {

        console.warn(
          "Conexão com",
          remoteSocketId,
          "falhou, tentando recuperar..."
        );

        restartIce(
          remoteSocketId,
          peer
        );

      }

      if (state === "disconnected") {

        // "disconnected" pode se recuperar sozinho em poucos segundos —
        // só desiste (remove o participante) se continuar assim.
        setTimeout(() => {

          if (
            peer.iceConnectionState ===
              "disconnected" ||
            peer.iceConnectionState ===
              "failed"
          ) {
            removePeer(remoteSocketId);
          }

        }, 8000);

      }

    };

    const localStream =
      localStreamRef.current;

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {

          const sender = peer.addTrack(
            track,
            localStream
          );

          if (track.kind === "video") {
            videoSendersRef.current.set(
              remoteSocketId,
              sender
            );
          }

        });
    }

    peersRef.current.set(
      remoteSocketId,
      peer
    );

    return peer;
  }

  // Envia a faixa de vídeo da câmera pra um participante: reusa o sender já
  // existente com replaceTrack (não precisa renegociar) ou, se ainda não
  // existir nenhum sender de vídeo com esse participante (ex.: quem entrou
  // só com áudio via portas abertas), cria um novo e renegocia a conexão.
  async function sendVideoTrackToPeer(
    remoteId: string,
    peer: RTCPeerConnection,
    track: MediaStreamTrack
  ) {

    const existingSender =
      videoSendersRef.current.get(
        remoteId
      );

    if (existingSender) {
      await existingSender.replaceTrack(
        track
      );
      return;
    }

    const sender = peer.addTrack(
      track,
      localStreamRef.current ??
        new MediaStream([track])
    );

    videoSendersRef.current.set(
      remoteId,
      sender
    );

    try {

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      getSocket().emit(
        "offer",
        {
          to: remoteId,
          offer,
        }
      );

    } catch (error) {

      console.error(
        "Erro ao renegociar vídeo com",
        remoteId,
        error
      );

    }
  }

  // Envia a faixa de vídeo da TELA compartilhada pra um participante — usa
  // um sender dedicado (screenSendersRef), separado do sender de câmera,
  // pra tela e câmera chegarem como duas faixas independentes do outro
  // lado (dois cards), em vez de uma substituir a outra.
  async function sendScreenTrackToPeer(
    remoteId: string,
    peer: RTCPeerConnection,
    track: MediaStreamTrack | null
  ) {

    const existingSender =
      screenSendersRef.current.get(
        remoteId
      );

    if (existingSender) {
      await existingSender.replaceTrack(
        track
      );
      return;
    }

    if (!track) {
      return;
    }

    const sender = peer.addTrack(
      track,
      screenStreamRef.current ??
        new MediaStream([track])
    );

    screenSendersRef.current.set(
      remoteId,
      sender
    );

    try {

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      getSocket().emit(
        "offer",
        {
          to: remoteId,
          offer,
        }
      );

    } catch (error) {

      console.error(
        "Erro ao renegociar compartilhamento de tela com",
        remoteId,
        error
      );

    }
  }

  function stopAllTracks() {

    localStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    localStreamRef.current = null;
    screenStreamRef.current = null;

    analysersRef.current.clear();
    speakingRef.current = new Set();
    setSpeakingIds(new Set());

    audioContextRef.current
      ?.close()
      .catch(() => {});
    audioContextRef.current = null;
  }

  function leaveMeeting() {

    const socket = getSocket();

    socket.emit("leave-meeting");

    peersRef.current.forEach(
      (peer) => peer.close()
    );

    peersRef.current.clear();
    videoSendersRef.current.clear();
    screenSendersRef.current.clear();
    remoteCameraStreamIdRef.current.clear();

    setRemoteStreams({});
    setRemoteScreenStreams({});
    setRemoteMicOff({});
    setExpandedId(null);

    stopAllTracks();

    setStream(null);
    setScreenStream(null);
    setJoined(false);
    setSharingScreen(false);
    setAutoJoined(false);
    setCameraOn(true);
    setMicOn(true);
    setShowDeviceSettings(false);

    joiningRef.current = false;
  }

  async function joinMeeting(
    options: { audioOnly?: boolean } = {}
  ) {

    if (
      joiningRef.current ||
      joined
    ) {
      return;
    }

    joiningRef.current = true;

    try {

      let mediaStream: MediaStream;
      let joinedAudioOnly = Boolean(
        options.audioOnly
      );

      try {

        mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: !options.audioOnly,
            audio: true,
          });

      } catch (error) {

        // Muitos computadores de escritório não têm câmera (só monitor +
        // teclado), e sem isso o pedido acima falha por inteiro — mesmo a
        // pessoa tendo microfone e podendo entrar só com áudio. Se o pedido
        // era por câmera e o motivo foi falta/uso indevido do dispositivo
        // de vídeo (não recusa de permissão), tenta de novo só com áudio
        // em vez de simplesmente barrar a entrada na chamada.
        const errorName = (
          error as DOMException
        )?.name;

        const cameraUnavailable =
          !options.audioOnly &&
          (errorName === "NotFoundError" ||
            errorName === "NotReadableError" ||
            errorName === "OverconstrainedError");

        if (!cameraUnavailable) {
          throw error;
        }

        mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });

        joinedAudioOnly = true;

        onNotify?.(
          "📷 Câmera não encontrada — você entrou na chamada só com áudio."
        );

      }

      localStreamRef.current =
        mediaStream;

      setStream(mediaStream);
      setCameraOn(!joinedAudioOnly);
      setMicOn(true);
      setAutoJoined(
        Boolean(options.audioOnly)
      );
      setJoined(true);

      const socket =
        getSocket();

      socket.emit(
        "join-meeting",
        { room }
      );

    } catch (error) {

      console.error(
        "Erro ao acessar câmera/microfone:",
        error
      );

      if (!options.audioOnly) {

        const errorName = (
          error as DOMException
        )?.name;

        const message =
          errorName === "NotFoundError"
            ? "Nenhuma câmera ou microfone encontrado neste computador."
            : errorName === "NotAllowedError"
            ? "Permissão de câmera/microfone negada. Verifique as permissões do site no navegador."
            : errorName === "NotReadableError"
            ? "A câmera ou microfone já está sendo usado por outro programa."
            : "Não foi possível acessar câmera ou microfone.";

        alert(message);

      }

    } finally {

      joiningRef.current = false;

    }
  }

  async function enableCamera() {

    try {

      const camStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      const videoTrack =
        camStream.getVideoTracks()[0];

      const localStream =
        localStreamRef.current;

      if (!localStream) {
        return;
      }

      localStream.addTrack(
        videoTrack
      );

      for (const [
        remoteId,
        peer,
      ] of peersRef.current.entries()) {

        await sendVideoTrackToPeer(
          remoteId,
          peer,
          videoTrack
        );

      }

      setStream(localStream);
      setCameraOn(true);

      getSocket().emit("camera-state", {
        cameraOn: true,
      });

    } catch (error) {

      console.error(
        "Erro ao ligar câmera:",
        error
      );

      alert(
        "Não foi possível acessar a câmera."
      );

    }
  }

  function toggleCamera() {

    const localStream =
      localStreamRef.current;

    const track =
      localStream?.getVideoTracks()[0];

    if (track) {

      // Desliga de verdade (para a captura) — só marcar enabled=false
      // mantém a câmera acesa fisicamente (a luz do notebook continua
      // ligada) mesmo sem enviar imagem para ninguém.
      track.stop();

      localStream?.removeTrack(track);

      videoSendersRef.current.forEach(
        (sender) => {
          sender.replaceTrack(null);
        }
      );

      setCameraOn(false);

      setExpandedId((current) =>
        current === "local"
          ? null
          : current
      );

      getSocket().emit("camera-state", {
        cameraOn: false,
      });

      return;
    }

    enableCamera();
  }

  function toggleMic() {

    const track =
      localStreamRef.current
        ?.getAudioTracks()[0];

    if (!track) {
      return;
    }

    track.enabled = !track.enabled;

    setMicOn(track.enabled);

    getSocket().emit("mic-state", {
      micOn: track.enabled,
    });
  }

  async function refreshAudioDevices() {

    try {

      const devices =
        await navigator.mediaDevices.enumerateDevices();

      setAudioInputs(
        devices.filter(
          (device) => device.kind === "audioinput"
        )
      );

      setAudioOutputs(
        devices.filter(
          (device) => device.kind === "audiooutput"
        )
      );

      // Pré-seleciona o microfone que já está em uso (senão o menu
      // mostraria o primeiro da lista, que pode não ser o ativo).
      setSelectedMicId((current) => {

        if (current) {
          return current;
        }

        const activeId =
          localStreamRef.current
            ?.getAudioTracks()[0]
            ?.getSettings().deviceId;

        return activeId ?? current;

      });

    } catch (error) {

      console.error(
        "Erro ao listar dispositivos de áudio:",
        error
      );

    }
  }

  async function switchMicrophone(
    deviceId: string
  ) {

    setSelectedMicId(deviceId);

    const localStream =
      localStreamRef.current;

    if (!localStream || !deviceId) {
      return;
    }

    try {

      const newStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
          },
        });

      const newTrack =
        newStream.getAudioTracks()[0];

      if (!newTrack) {
        return;
      }

      newTrack.enabled = micOnRef.current;

      const oldTrack =
        localStream.getAudioTracks()[0];

      if (oldTrack) {
        oldTrack.stop();
        localStream.removeTrack(oldTrack);
      }

      localStream.addTrack(newTrack);

      for (const peer of peersRef.current.values()) {

        const sender = peer
          .getSenders()
          .find(
            (s) => s.track?.kind === "audio"
          );

        if (sender) {
          await sender.replaceTrack(newTrack);
        }

      }

      // O analisador de volume foi criado a partir da faixa de áudio
      // antiga — precisa recriar pra acompanhar a faixa nova.
      detachAnalyser("local");
      attachAnalyser("local", localStream);

    } catch (error) {

      console.error(
        "Erro ao trocar microfone:",
        error
      );

    }
  }

  function muteRemoteParticipant(
    remoteSocketId: string
  ) {

    getSocket().emit(
      "mute-user",
      { to: remoteSocketId }
    );
  }

  function kickParticipant(
    remoteSocketId: string
  ) {

    getSocket().emit(
      "kick-from-meeting",
      { to: remoteSocketId }
    );
  }

  async function startScreenShare() {

    try {

      const newScreenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

      const screenTrack =
        newScreenStream.getVideoTracks()[0];

      screenStreamRef.current =
        newScreenStream;

      setScreenStream(newScreenStream);

      // Sender dedicado por participante — a câmera continua sendo
      // enviada normalmente ao mesmo tempo, num sender separado, então a
      // tela aparece como um card A MAIS, não no lugar da câmera.
      for (const [
        remoteId,
        peer,
      ] of peersRef.current.entries()) {

        await sendScreenTrackToPeer(
          remoteId,
          peer,
          screenTrack
        );

      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setSharingScreen(true);

    } catch (error) {

      console.error(
        "Erro ao compartilhar tela:",
        error
      );

    }
  }

  function stopScreenShare() {

    screenSendersRef.current.forEach(
      (sender) => {
        sender.replaceTrack(null);
      }
    );

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    screenStreamRef.current = null;
    setScreenStream(null);

    setSharingScreen(false);

    // Avisa direto pelo socket em vez de confiar só no replaceTrack(null)
    // virar "mute" do lado de quem recebe — isso não é imediato nem
    // garantido em todo navegador, e deixava o card da tela compartilhada
    // "grudado" na tela de quem recebia mesmo depois do fim.
    getSocket().emit("screen-share-stopped");
  }

  function toggleScreenShare() {

    if (sharingScreen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }

  function toggleExpanded(id: string) {

    setExpandedId((current) =>
      current === id ? null : id
    );
  }

  function goFullscreen() {

    expandedVideoRef.current
      ?.requestFullscreen?.()
      .catch((error) => {

        console.error(
          "Erro ao entrar em tela cheia:",
          error
        );

      });
  }

  // "Portas abertas": conecta áudio automaticamente (sem vídeo) quando o
  // colega presente na sala também está de portas abertas — sem pedir
  // clique em "Entrar na Chamada".
  useEffect(() => {

    if (autoJoin && !joined) {
      // joinMeeting só chama setState depois do await em getUserMedia —
      // não é uma atualização síncrona dentro do efeito.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      joinMeeting({ audioOnly: true });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoin]);

  // Sai da chamada ao trocar de sala ou ao desmontar — sem isso a câmera
  // ficaria ligada e a conexão permaneceria aberta na sala anterior.
  useEffect(() => {

    return () => {
      leaveMeeting();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    joinedRef.current = joined;
  }, [joined]);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  useEffect(() => {
    cameraOnRef.current = cameraOn;
  }, [cameraOn]);

  // Anexa/remove o analisador de volume da própria câmera quando ela
  // liga/desliga (o áudio local continua ativo mesmo com a câmera
  // desligada, então o analisador acompanha o `stream`, não a câmera).
  useEffect(() => {

    if (stream) {
      attachAnalyser("local", stream);
    } else {
      detachAnalyser("local");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  // Anexa/remove o analisador de volume de cada participante remoto
  // conforme eles entram/saem da chamada.
  useEffect(() => {

    Object.entries(remoteStreams).forEach(
      ([id, remoteStream]) => {
        attachAnalyser(id, remoteStream);
      }
    );

    const currentIds = new Set(
      Object.keys(remoteStreams)
    );

    analysersRef.current.forEach(
      (_value, id) => {
        if (
          id !== "local" &&
          !currentIds.has(id)
        ) {
          detachAnalyser(id);
        }
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStreams]);

  // Sondagem periódica do volume de cada analisador — decide quem está
  // "falando" agora (RMS do sinal de áudio acima de um limiar simples).
  useEffect(() => {

    if (!joined) {
      speakingRef.current = new Set();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSpeakingIds(new Set());
      return;
    }

    const interval = setInterval(() => {

      const next = new Set<string>();

      analysersRef.current.forEach(
        ({ analyser, data }, id) => {

          analyser.getByteTimeDomainData(
            data
          );

          let sumSquares = 0;

          for (
            let i = 0;
            i < data.length;
            i++
          ) {
            const value =
              (data[i] - 128) / 128;
            sumSquares +=
              value * value;
          }

          const rms = Math.sqrt(
            sumSquares / data.length
          );

          if (rms > 0.02) {
            next.add(id);
          }

        }
      );

      const prev = speakingRef.current;

      const changed =
        next.size !== prev.size ||
        Array.from(next).some(
          (id) => !prev.has(id)
        );

      if (changed) {
        speakingRef.current = next;
        setSpeakingIds(next);
      }

    }, 200);

    return () => clearInterval(interval);

  }, [joined]);

  // Os rótulos dos dispositivos só vêm preenchidos depois que a permissão
  // de microfone já foi concedida (o que só acontece depois de entrar na
  // chamada) — por isso só busca a lista aqui, e reescuta o evento de
  // dispositivo plugado/removido enquanto a chamada durar.
  useEffect(() => {

    if (!joined) {
      return;
    }

    // refreshAudioDevices só chama setState depois do await em
    // enumerateDevices() — não é uma atualização síncrona dentro do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAudioDevices();

    navigator.mediaDevices.addEventListener(
      "devicechange",
      refreshAudioDevices
    );

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        refreshAudioDevices
      );
    };

  }, [joined]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {

    const socket =
      getSocket();

    // Se a conexão cair e voltar (deploy no servidor, queda de rede etc.)
    // enquanto estávamos numa chamada, as conexões antigas ficam órfãs —
    // o servidor não sabe mais quem éramos. Em vez de ficar "mudo" até
    // recarregar a página, entra de novo do zero na chamada da sala atual.
    function handleReconnect() {

      if (!joinedRef.current) {
        return;
      }

      peersRef.current.forEach(
        (peer) => peer.close()
      );

      peersRef.current.clear();
      videoSendersRef.current.clear();
      screenSendersRef.current.clear();
      remoteCameraStreamIdRef.current.clear();

      setRemoteStreams({});
      setRemoteScreenStreams({});

      socket.emit(
        "join-meeting",
        { room: roomRef.current }
      );

    }

    socket.on(
      "connect",
      handleReconnect
    );

    socket.on(
      "muted-by-someone",
      ({
        fromNome,
      }: {
        fromNome: string;
      }) => {

        const track =
          localStreamRef.current
            ?.getAudioTracks()[0];

        if (track) {
          track.enabled = false;
          setMicOn(false);

          socket.emit("mic-state", {
            micOn: false,
          });
        }

        onNotify?.(
          `🔇 ${fromNome} mutou seu microfone.`
        );

      }
    );

    socket.on(
      "kicked-from-meeting",
      ({
        fromNome,
      }: {
        fromNome: string;
      }) => {

        onNotify?.(
          `${fromNome} removeu você da chamada.`
        );

        leaveMeeting();

      }
    );

    socket.on(
      "mic-state-changed",
      ({
        socketId,
        micOn: remoteMicOn,
      }: {
        socketId: string;
        micOn: boolean;
      }) => {

        setRemoteMicOff((prev) => ({
          ...prev,
          [socketId]: !remoteMicOn,
        }));

      }
    );

    socket.on(
      "camera-state-changed",
      ({
        socketId,
        cameraOn: remoteCameraOn,
      }: {
        socketId: string;
        cameraOn: boolean;
      }) => {

        // Sinal explícito — mais confiável do que só esperar o
        // navegador detectar a falta de vídeo (track.muted), que podia
        // demorar ou nunca disparar, deixando a pessoa "congelada" no
        // último quadro pros outros participantes.
        setRemoteCameraOff((prev) => ({
          ...prev,
          [socketId]: !remoteCameraOn,
        }));

      }
    );

    socket.on(
      "screen-share-stopped",
      ({
        socketId,
      }: {
        socketId: string;
      }) => {

        setRemoteScreenStreams((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });

        setExpandedId((current) =>
          current ===
          `${SCREEN_PREFIX}${socketId}`
            ? null
            : current
        );

      }
    );

    socket.on(
      "existing-participants",
      async (
        participants: Array<{
          socketId: string;
          userId?: number;
          nome?: string;
        }>
      ) => {

        setParticipantNames((prev) => {

          const next = { ...prev };

          participants.forEach(
            ({ socketId, nome }) => {
              if (nome) {
                next[socketId] = nome;
              }
            }
          );

          return next;

        });

        setParticipantUserIds((prev) => {

          const next = { ...prev };

          participants.forEach(
            ({ socketId, userId }) => {
              if (
                typeof userId === "number"
              ) {
                next[socketId] = userId;
              }
            }
          );

          return next;

        });

        for (const {
          socketId: remoteId,
        } of participants) {

          const peer =
            createPeerConnection(
              remoteId
            );

          try {

            const offer =
              await peer.createOffer();

            await peer.setLocalDescription(
              offer
            );

            socket.emit(
              "offer",
              {
                to: remoteId,
                offer,
              }
            );

          } catch (error) {

            console.error(
              "Erro ao criar oferta para",
              remoteId,
              error
            );

          }

        }

      }
    );

    socket.on(
      "user-joined-meeting",
      ({
        socketId,
        userId,
        nome,
      }: {
        socketId: string;
        userId?: number;
        nome?: string;
      }) => {

        if (nome) {
          setParticipantNames((prev) => ({
            ...prev,
            [socketId]: nome,
          }));
        }

        if (typeof userId === "number") {
          setParticipantUserIds((prev) => ({
            ...prev,
            [socketId]: userId,
          }));
        }

        // Quem já está na chamada avisa o recém-chegado do próprio estado
        // do microfone e da câmera — esses estados não são transmitidos
        // por padrão, só nas mudanças, então sem isso os selos ficariam
        // incorretos até a próxima vez que a pessoa mutar/desmutar ou
        // ligar/desligar a câmera.
        socket.emit("mic-state", {
          to: socketId,
          micOn: micOnRef.current,
        });

        socket.emit("camera-state", {
          to: socketId,
          cameraOn: cameraOnRef.current,
        });

      }
    );

    socket.on(
      "user-left-meeting",
      ({
        socketId,
      }: {
        socketId: string;
      }) => {

        removePeer(socketId);

      }
    );

    socket.on(
      "offer",
      async ({
        from,
        offer,
      }: OfferPayload) => {

        const peer =
          peersRef.current.get(from) ||
          createPeerConnection(from);

        try {

          await peer.setRemoteDescription(
            new RTCSessionDescription(
              offer
            )
          );

          const answer =
            await peer.createAnswer();

          await peer.setLocalDescription(
            answer
          );

          socket.emit(
            "answer",
            {
              to: from,
              answer,
            }
          );

          // Se eu já estiver compartilhando a tela, quem acabou de
          // entrar na chamada não tinha como prever essa faixa extra na
          // oferta dele (só previu áudio + câmera) — o navegador não
          // consegue encaixar a tela na resposta inicial, precisa de uma
          // segunda rodada de negociação, específica pra ela, agora que
          // a primeira já deixou a conexão em signalingState "stable".
          // Sem isso, quem entra depois do compartilhamento começar
          // nunca recebe a tela.
          const screenTrack =
            screenStreamRef.current?.getVideoTracks()[0];

          if (screenTrack) {
            await sendScreenTrackToPeer(
              from,
              peer,
              screenTrack
            );
          }

        } catch (error) {

          console.error(
            "Erro ao processar oferta recebida:",
            error
          );

        }

      }
    );

    socket.on(
      "answer",
      async ({
        from,
        answer,
      }: AnswerPayload) => {

        const peer =
          peersRef.current.get(from);

        if (!peer) {
          return;
        }

        try {

          await peer.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

        } catch (error) {

          console.error(
            "Erro ao processar resposta recebida:",
            error
          );

        }

      }
    );

    socket.on(
      "ice-candidate",
      async ({
        from,
        candidate,
      }: IceCandidatePayload) => {

        const peer =
          peersRef.current.get(from);

        if (!peer || !candidate) {
          return;
        }

        try {

          await peer.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (error) {

          console.error(
            "Erro ao adicionar candidato ICE:",
            error
          );

        }

      }
    );

    return () => {

      socket.off("existing-participants");
      socket.off("user-joined-meeting");
      socket.off("user-left-meeting");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("muted-by-someone");
      socket.off("kicked-from-meeting");
      socket.off("mic-state-changed");
      socket.off("camera-state-changed");
      socket.off("screen-share-stopped");
      socket.off(
        "connect",
        handleReconnect
      );

    };

    // Registra os listeners do socket uma única vez — onNotify só é usado
    // dentro do handler de "muted-by-someone" e não precisa disparar um
    // re-registro a cada render (evitaria duplicar os outros listeners).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remoteEntries =
    Object.entries(remoteStreams);

  const isExpandedScreen = Boolean(
    expandedId?.startsWith(SCREEN_PREFIX)
  );

  const expandedScreenOwnerId =
    isExpandedScreen && expandedId
      ? expandedId.slice(
          SCREEN_PREFIX.length
        )
      : null;

  const expandedStream =
    expandedId === "local"
      ? stream
      : expandedId ===
        `${SCREEN_PREFIX}local`
      ? screenStream
      : expandedScreenOwnerId
      ? remoteScreenStreams[
          expandedScreenOwnerId
        ]
      : expandedId
      ? remoteStreams[expandedId]
      : null;

  const expandedRosterUser =
    expandedId &&
    expandedId !== "local" &&
    expandedId !== `${SCREEN_PREFIX}local`
      ? roster?.find(
          (user) =>
            user.id ===
            participantUserIds[
              expandedScreenOwnerId ??
                expandedId
            ]
        )
      : undefined;

  const expandedCameraOff =
    isExpandedScreen
      ? false
      : expandedId === "local"
      ? !cameraOn
      : expandedId !== null &&
        remoteCameraOff[expandedId] !== false;

  const participantCount =
    (joined ? 1 : 0) +
    remoteEntries.length;

  return (

    <>

    {remoteEntries.map(
      ([socketId, remoteStream]) => (

        <RemoteAudio
          key={socketId}
          stream={remoteStream}
          sinkId={
            selectedSpeakerId || undefined
          }
        />

      )
    )}

    {/* O deslocamento à direita reserva o espaço da barra lateral de Chat/
        Usuários (app/office/page.tsx) + 16px de respiro — quando ela está
        fechada, sidebarWidthPx vem 0 e esses elementos fixos ocupam a
        largura toda. */}
    {!joined && (

      <div
        style={{
          right: sidebarWidthPx + 16,
        }}
        className="
          fixed
          bottom-4
          z-40
          w-72
          rounded-2xl
          border
          bg-white
          p-4
          shadow-xl
          dark:border-white/10
          dark:bg-slate-900
        "
      >

        <h3
          className="
            truncate
            text-sm
            font-semibold
            text-slate-900
            dark:text-slate-100
          "
        >
          🎥 {room}
        </h3>

        {autoJoin && (

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            🚪 Conectando áudio automaticamente
            (portas abertas)...
          </p>

        )}

        {!autoJoin && (

          <button
            onClick={() => joinMeeting()}
            className="
              mt-3
              rounded-lg
              bg-blue-600
              px-4
              py-2
              text-sm
              text-white
            "
          >
            Entrar na Chamada
          </button>

        )}

      </div>

    )}

    {joined && (

      <div
        className="
          flex
          h-full
          min-h-0
          w-64
          shrink-0
          flex-col
          border-r
          bg-white/95
          backdrop-blur
          dark:border-white/10
          dark:bg-slate-900/95
        "
      >

        <div
          className="
            shrink-0
            border-b
            px-3
            py-3
            dark:border-white/10
          "
        >

          <span
            className="
              block
              text-xs
              font-semibold
              text-slate-900
              dark:text-slate-100
            "
          >
            🎥 {room} · {participantCount}
            {" "}participante(s)
          </span>

        </div>

          <div
            className="
              flex
              min-h-0
              flex-1
              flex-col
              items-center
              gap-3
              overflow-y-auto
              px-3
              py-3
            "
          >

            <div className="flex w-full flex-col items-center">

              {cameraOn && stream ? (

                <VideoTile
                  stream={stream}
                  small
                  speaking={speakingIds.has(
                    "local"
                  )}
                  micMuted={!micOn}
                  onClick={() =>
                    toggleExpanded("local")
                  }
                />

              ) : (

                <CameraOffAvatar
                  nome={myNome}
                  avatarTipo={myAvatarTipo}
                  avatarValor={myAvatarValor}
                  speaking={speakingIds.has(
                    "local"
                  )}
                  micMuted={!micOn}
                  small
                />

              )}

              <span
                className="
                  mt-1
                  max-w-full
                  truncate
                  text-center
                  text-[10px]
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Você
                {autoJoined && " (áudio)"}
              </span>

            </div>

            {screenStream && (

              <div className="flex w-full flex-col items-center">

                <VideoTile
                  stream={screenStream}
                  small
                  onClick={() =>
                    toggleExpanded(
                      `${SCREEN_PREFIX}local`
                    )
                  }
                />

                <span
                  className="
                    mt-1
                    max-w-full
                    truncate
                    text-center
                    text-[10px]
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  🖥️ Sua tela
                </span>

              </div>

            )}

            {remoteEntries.map(
              ([socketId, remoteStream]) => {

                const remoteUser = roster?.find(
                  (user) =>
                    user.id ===
                    participantUserIds[socketId]
                );

                const cameraIsOff =
                  remoteCameraOff[
                    socketId
                  ] !== false;

                const remoteScreenStream =
                  remoteScreenStreams[
                    socketId
                  ];

                return [

                <div
                  key={`cam-${socketId}`}
                  className="
                    group
                    relative
                    flex
                    w-full
                    flex-col
                    items-center
                  "
                >

                  {cameraIsOff ? (

                    <CameraOffAvatar
                      nome={
                        remoteUser?.nome ??
                        participantNames[
                          socketId
                        ]
                      }
                      avatarTipo={
                        remoteUser?.avatarTipo
                      }
                      avatarValor={
                        remoteUser?.avatarValor
                      }
                      speaking={speakingIds.has(
                        socketId
                      )}
                      micMuted={
                        remoteMicOff[
                          socketId
                        ] === true
                      }
                      small
                    />

                  ) : (

                    <VideoTile
                      stream={remoteStream}
                      small
                      speaking={speakingIds.has(
                        socketId
                      )}
                      micMuted={
                        remoteMicOff[
                          socketId
                        ] === true
                      }
                      onClick={() =>
                        toggleExpanded(
                          socketId
                        )
                      }
                    />

                  )}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      -top-1
                      right-0
                      flex
                      gap-1
                      opacity-0
                      transition
                      group-hover:pointer-events-auto
                      group-hover:opacity-100
                    "
                  >

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        muteRemoteParticipant(
                          socketId
                        );
                      }}
                      title="Mutar"
                      className="
                        rounded
                        bg-black/70
                        px-1
                        text-[10px]
                        text-white
                        hover:bg-black/90
                      "
                    >
                      🔇
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        kickParticipant(
                          socketId
                        );
                      }}
                      title="Remover da chamada"
                      className="
                        rounded
                        bg-black/70
                        px-1
                        text-[10px]
                        text-white
                        hover:bg-black/90
                      "
                    >
                      ❌
                    </button>

                  </div>

                  <span
                    className="
                      mt-1
                      max-w-full
                      truncate
                      text-center
                      text-[10px]
                      text-slate-500
                      dark:text-slate-400
                    "
                  >
                    {remoteUser?.nome ??
                      participantNames[
                        socketId
                      ] ??
                      "Participante"}
                  </span>

                </div>,

                remoteScreenStream && (

                  <div
                    key={`screen-${socketId}`}
                    className="flex w-full flex-col items-center"
                  >

                    <VideoTile
                      stream={remoteScreenStream}
                      small
                      onClick={() =>
                        toggleExpanded(
                          `${SCREEN_PREFIX}${socketId}`
                        )
                      }
                    />

                    <span
                      className="
                        mt-1
                        max-w-full
                        truncate
                        text-center
                        text-[10px]
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      🖥️{" "}
                      {remoteUser?.nome ??
                        participantNames[
                          socketId
                        ] ??
                        "Participante"}
                    </span>

                  </div>

                ),

                ];

              }
            )}

          </div>

        <div
          className="
            shrink-0
            border-t
            px-3
            py-3
            dark:border-white/10
          "
        >

          <div
            className="
              grid
              grid-cols-3
              gap-2
            "
          >

            <CallBarButton
              icon="🎙️"
              label="Microfone"
              active={!micOn}
              onClick={toggleMic}
              title={
                micOn
                  ? "Desligar microfone"
                  : "Ligar microfone"
              }
            />

            <CallBarButton
              icon="📷"
              label="Câmera"
              active={!cameraOn}
              onClick={toggleCamera}
              title={
                cameraOn
                  ? "Desligar câmera"
                  : "Ligar câmera"
              }
            />

            <CallBarButton
              icon="🖥️"
              label="Compartilhar"
              active={sharingScreen}
              onClick={toggleScreenShare}
              title={
                sharingScreen
                  ? "Parar compartilhamento"
                  : "Compartilhar tela"
              }
            />

            {onOpenChat && (

              <CallBarButton
                icon="💬"
                label="Chat"
                onClick={onOpenChat}
                title="Abrir o chat da sala"
              />

            )}

            <CallBarButton
              icon="⚙️"
              onClick={() =>
                setShowDeviceSettings(
                  (current) => !current
                )
              }
              active={showDeviceSettings}
              title="Escolher dispositivos de áudio"
            />

            <CallBarButton
              icon="📞"
              label="Sair"
              danger
              onClick={leaveMeeting}
              title="Sair da chamada"
            />

          </div>

          {showDeviceSettings && (

            <div
              className="
                mt-3
                flex
                flex-col
                gap-3
                border-t
                pt-3
                dark:border-slate-700
              "
            >

            <label
              className="
                flex
                flex-col
                gap-1
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              🎙️ Microfone

              <select
                value={selectedMicId}
                onChange={(e) =>
                  switchMicrophone(
                    e.target.value
                  )
                }
                className="
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-2
                  py-1
                  text-xs
                  text-slate-700
                  dark:border-slate-600
                  dark:bg-slate-900
                  dark:text-slate-200
                "
              >

                {audioInputs.map(
                  (device, index) => (

                    <option
                      key={
                        device.deviceId ||
                        index
                      }
                      value={device.deviceId}
                    >
                      {device.label ||
                        `Microfone ${index + 1}`}
                    </option>

                  )
                )}

              </select>
            </label>

            {audioOutputs.length > 0 && (

              <label
                className="
                  flex
                  flex-col
                  gap-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                🔊 Alto-falante

                <select
                  value={selectedSpeakerId}
                  onChange={(e) =>
                    setSelectedSpeakerId(
                      e.target.value
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-2
                    py-1
                    text-xs
                    text-slate-700
                    dark:border-slate-600
                    dark:bg-slate-900
                    dark:text-slate-200
                  "
                >

                  {audioOutputs.map(
                    (device, index) => (

                      <option
                        key={
                          device.deviceId ||
                          index
                        }
                        value={device.deviceId}
                      >
                        {device.label ||
                          `Alto-falante ${index + 1}`}
                      </option>

                    )
                  )}

                </select>
              </label>

            )}

            </div>

          )}

        </div>

      </div>

    )}

    {expandedStream && (

      <div
        onClick={() => setExpandedId(null)}
        className="
          fixed
          inset-0
          z-[70]
          flex
          items-center
          justify-center
          bg-black/70
          p-6
        "
      >

        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl"
        >

          {expandedCameraOff ? (

            <CameraOffAvatar
              nome={
                expandedId === "local"
                  ? myNome
                  : expandedRosterUser?.nome ??
                    (expandedId
                      ? participantNames[
                          expandedId
                        ]
                      : undefined)
              }
              avatarTipo={
                expandedId === "local"
                  ? myAvatarTipo
                  : expandedRosterUser?.avatarTipo
              }
              avatarValor={
                expandedId === "local"
                  ? myAvatarValor
                  : expandedRosterUser?.avatarValor
              }
              speaking={
                expandedId
                  ? speakingIds.has(
                      expandedId
                    )
                  : false
              }
              micMuted={
                expandedId === "local"
                  ? !micOn
                  : expandedId !== null &&
                    remoteMicOff[expandedId] ===
                      true
              }
            />

          ) : (

            <VideoTile
              stream={expandedStream}
              large
              speaking={
                expandedId
                  ? speakingIds.has(
                      expandedId
                    )
                  : false
              }
              micMuted={
                expandedId === "local"
                  ? !micOn
                  : expandedId !== null &&
                    remoteMicOff[expandedId] === true
              }
              onClick={() =>
                setExpandedId(null)
              }
              onElement={(el) => {
                expandedVideoRef.current = el;
              }}
            />

          )}

          <div className="mt-3 flex justify-center gap-4">

            <button
              onClick={() =>
                setExpandedId(null)
              }
              className="text-sm text-white hover:underline"
            >
              ↙️ Ver em grade
            </button>

            <button
              onClick={goFullscreen}
              className="text-sm text-white hover:underline"
            >
              ⛶ Tela cheia
            </button>

          </div>

        </div>

      </div>

    )}

    </>

  );
}
