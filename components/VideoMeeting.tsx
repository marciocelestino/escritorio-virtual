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

type Props = {
  room: string;
  autoJoin?: boolean;
  onNotify?: (message: string) => void;
  onJoined?: () => void;
  onLeft?: () => void;
  myNome?: string;
  myAvatarTipo?: string | null;
  myAvatarValor?: string | null;
  viewingDifferentRoom?: boolean;
  onGoToCallRoom?: () => void;
};

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

function VideoTile({
  stream,
  muted = false,
  large = false,
  speaking = false,
  micMuted = false,
  sinkId,
  onClick,
  onElement,
}: {
  stream: MediaStream;
  muted?: boolean;
  large?: boolean;
  speaking?: boolean;
  micMuted?: boolean;
  sinkId?: string;
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

  // setSinkId (escolher o alto-falante de saída) é uma API não-padrão,
  // hoje só disponível em navegadores baseados em Chromium — ignora
  // silenciosamente se o navegador não suportar.
  useEffect(() => {

    const el = ref.current as
      | (HTMLVideoElement & {
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
    <div
      className={`
        relative
        ${large ? "w-full" : "w-full max-w-md"}
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
        muted={muted}
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
}: {
  nome?: string;
  avatarTipo?: string | null;
  avatarValor?: string | null;
  micMuted?: boolean;
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
      className="
        relative
        flex
        h-40
        w-full
        items-center
        justify-center
        rounded-xl
        border
        bg-slate-100
      "
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
          text-lg
          font-bold
          text-white
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

export default function VideoMeeting({
  room,
  autoJoin = false,
  onNotify,
  onJoined,
  onLeft,
  myNome,
  myAvatarTipo,
  myAvatarValor,
  viewingDifferentRoom = false,
  onGoToCallRoom,
}: Props) {

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const screenStreamRef =
    useRef<MediaStream | null>(null);

  const peersRef =
    useRef<Map<string, RTCPeerConnection>>(
      new Map()
    );

  // Guarda o sender de vídeo já criado por participante — permite trocar
  // o que está sendo enviado (câmera ↔ tela ↔ nada) com replaceTrack, sem
  // precisar renegociar de novo a cada troca.
  const videoSendersRef =
    useRef<Map<string, RTCRtpSender>>(
      new Map()
    );

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

  const [
    participantNames,
    setParticipantNames,
  ] = useState<
    Record<string, string>
  >({});

  const [
    remoteMicOff,
    setRemoteMicOff,
  ] = useState<
    Record<string, boolean>
  >({});

  const [speakingIds, setSpeakingIds] =
    useState<Set<string>>(new Set());

  const [minimized, setMinimized] =
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

    detachAnalyser(remoteSocketId);

    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setParticipantNames((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setRemoteMicOff((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });

    setExpandedId((current) =>
      current === remoteSocketId
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

      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]:
          event.streams[0],
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

  // Envia uma faixa de vídeo (câmera ou tela) para um participante: reusa
  // o sender já existente com replaceTrack (não precisa renegociar) ou,
  // se ainda não existir nenhum sender de vídeo com esse participante
  // (ex.: quem entrou só com áudio via portas abertas), cria um novo e
  // renegocia a conexão.
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

    const wasJoined = joinedRef.current;

    const socket = getSocket();

    socket.emit("leave-meeting");

    peersRef.current.forEach(
      (peer) => peer.close()
    );

    peersRef.current.clear();
    videoSendersRef.current.clear();

    setRemoteStreams({});
    setRemoteMicOff({});
    setExpandedId(null);

    stopAllTracks();

    setStream(null);
    setJoined(false);
    setSharingScreen(false);
    setAutoJoined(false);
    setCameraOn(true);
    setMicOn(true);
    setMinimized(false);

    joiningRef.current = false;

    if (wasJoined) {
      onLeft?.();
    }
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

      onJoined?.();

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

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

      const screenTrack =
        screenStream.getVideoTracks()[0];

      screenStreamRef.current =
        screenStream;

      for (const [
        remoteId,
        peer,
      ] of peersRef.current.entries()) {

        await sendVideoTrackToPeer(
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

    const cameraTrack =
      localStreamRef.current
        ?.getVideoTracks()[0] ??
      null;

    videoSendersRef.current.forEach(
      (sender) => {
        sender.replaceTrack(
          cameraTrack
        );
      }
    );

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    screenStreamRef.current = null;

    setSharingScreen(false);
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

      setRemoteStreams({});

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
      "existing-participants",
      async (
        participants: Array<{
          socketId: string;
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
        nome,
      }: {
        socketId: string;
        nome?: string;
      }) => {

        if (nome) {
          setParticipantNames((prev) => ({
            ...prev,
            [socketId]: nome,
          }));
        }

        // Quem já está na chamada avisa o recém-chegado do próprio estado
        // do microfone — esse estado não é transmitido por padrão, só nas
        // mudanças, então sem isso o selo de "mutado" ficaria incorreto
        // até a próxima vez que a pessoa mutar/desmutar.
        socket.emit("mic-state", {
          to: socketId,
          micOn: micOnRef.current,
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

  const expandedStream =
    expandedId === "local"
      ? stream
      : expandedId
      ? remoteStreams[expandedId]
      : null;

  const participantCount =
    (joined ? 1 : 0) +
    remoteEntries.length;

  // Colunas da grade expandida: escala com o número de participantes em
  // vez de forçar uma coluna única (que virava uma lista enorme e
  // ilegível assim que a sala passou a caber até 15 pessoas).
  const gridColumns =
    participantCount <= 2
      ? 1
      : participantCount <= 4
      ? 2
      : participantCount <= 9
      ? 3
      : participantCount <= 16
      ? 4
      : 5;

  const anyoneSpeaking = speakingIds.size > 0;

  return (

    <>

    {!joined && (

      <div
        className="
          fixed
          bottom-4
          right-4
          z-40
          w-72
          rounded-2xl
          border
          bg-white
          p-4
          shadow-xl
        "
      >

        <h3
          className="
            truncate
            text-sm
            font-semibold
            text-slate-900
          "
        >
          🎥 {room}
        </h3>

        {autoJoin && (

          <p className="mt-3 text-xs text-slate-500">
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

    {joined && minimized && (

      <button
        onClick={() => setMinimized(false)}
        title="Expandir chamada"
        className="
          fixed
          bottom-4
          right-4
          z-40
          flex
          items-center
          gap-2
          rounded-full
          border
          bg-white
          px-4
          py-2
          text-sm
          font-medium
          text-slate-700
          shadow-xl
          hover:bg-slate-50
        "
      >

        <span
          className={`
            h-2
            w-2
            rounded-full
            ${
              anyoneSpeaking
                ? "bg-green-500"
                : "bg-slate-300"
            }
          `}
        />

        🎥 {participantCount} participante(s)
        {" "}· {room}

      </button>

    )}

    {joined && !minimized && (

      <div
        className="
          fixed
          inset-x-6
          bottom-6
          z-40
          flex
          h-[75vh]
          max-h-[720px]
          flex-col
          rounded-2xl
          border
          bg-white
          p-4
          shadow-2xl
        "
      >

        <div
          className="
            flex
            items-start
            justify-between
            gap-2
          "
        >

          <div>

            <h3
              className="
                text-sm
                font-semibold
                text-slate-900
              "
            >
              🎥 {room} · {participantCount}
              {" "}participante(s)
            </h3>

            {viewingDifferentRoom &&
              onGoToCallRoom && (

                <button
                  onClick={onGoToCallRoom}
                  className="
                    mt-1
                    text-xs
                    text-blue-600
                    hover:underline
                  "
                >
                  ↩️ Voltar pra sala da chamada
                </button>

              )}

          </div>

          <button
            onClick={() => setMinimized(true)}
            title="Minimizar chamada"
            className="
              shrink-0
              rounded-lg
              border
              border-slate-300
              px-2
              py-1
              text-xs
              text-slate-500
              hover:bg-slate-50
            "
          >
            ▾ Minimizar
          </button>

        </div>

        <p className="mb-2 mt-2 shrink-0 text-xs text-slate-400">
          Clique em um vídeo para ver maior.
        </p>

        <div
          className="
            grid
            flex-1
            content-start
            gap-3
            overflow-y-auto
          "
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          }}
        >

            <div>

              <p
                className="
                  mb-3
                  text-sm
                  text-slate-500
                "
              >
                {autoJoined &&
                  "🚪 Chamada automática (só áudio) — "}
                Sua câmera
                {sharingScreen &&
                  " (compartilhando tela)"}
              </p>

              {cameraOn && stream ? (

                <VideoTile
                  stream={stream}
                  muted
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
                  micMuted={!micOn}
                />

              )}

            </div>

            {remoteEntries.map(
              ([socketId, remoteStream]) => (

                <div key={socketId}>

                  <p
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                      text-sm
                      text-slate-500
                    "
                  >
                    {participantNames[
                      socketId
                    ] ?? "Participante"}

                    <span className="flex shrink-0 gap-1">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          muteRemoteParticipant(
                            socketId
                          );
                        }}
                        className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                      >
                        🔇 Mutar
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          kickParticipant(
                            socketId
                          );
                        }}
                        title="Remover da chamada"
                        className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        ❌
                      </button>

                    </span>
                  </p>

                  <VideoTile
                    stream={remoteStream}
                    speaking={speakingIds.has(
                      socketId
                    )}
                    micMuted={
                      remoteMicOff[
                        socketId
                      ] === true
                    }
                    sinkId={
                      selectedSpeakerId ||
                      undefined
                    }
                    onClick={() =>
                      toggleExpanded(
                        socketId
                      )
                    }
                  />

                </div>

              )
            )}

          </div>

          <div
            className="
              mt-4
              flex
              flex-wrap
              gap-2
            "
          >

            <button
              onClick={toggleCamera}
              className={`
                rounded-lg
                px-4
                py-2
                ${
                  cameraOn
                    ? "bg-slate-200 text-slate-800"
                    : "bg-red-100 text-red-700"
                }
              `}
            >
              {cameraOn
                ? "📷 Desligar câmera"
                : "📷 Ligar câmera"}
            </button>

            <button
              onClick={toggleMic}
              className={`
                rounded-lg
                px-4
                py-2
                ${
                  micOn
                    ? "bg-slate-200 text-slate-800"
                    : "bg-red-100 text-red-700"
                }
              `}
            >
              {micOn
                ? "🎙️ Desligar microfone"
                : "🎙️ Ligar microfone"}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`
                rounded-lg
                px-4
                py-2
                ${
                  sharingScreen
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-800"
                }
              `}
            >
              {sharingScreen
                ? "🖥️ Parar compartilhamento"
                : "🖥️ Compartilhar tela"}
            </button>

            <button
              onClick={leaveMeeting}
              className="
                rounded-lg
                bg-red-600
                px-4
                py-2
                text-white
              "
            >
              Sair da Chamada
            </button>

          </div>

          <div
            className="
              mt-3
              flex
              flex-col
              gap-2
            "
          >

            <label
              className="
                flex
                flex-col
                gap-1
                text-xs
                text-slate-500
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

        </div>

      )}

    {expandedStream && (

      <div
        onClick={() => setExpandedId(null)}
        className="
          fixed
          inset-0
          z-50
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

          <VideoTile
            stream={expandedStream}
            muted={expandedId === "local"}
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
            sinkId={
              selectedSpeakerId || undefined
            }
            onClick={() =>
              setExpandedId(null)
            }
            onElement={(el) => {
              expandedVideoRef.current = el;
            }}
          />

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
