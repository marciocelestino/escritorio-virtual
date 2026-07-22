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
};

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

function VideoTile({
  stream,
  muted = false,
  large = false,
  onClick,
}: {
  stream: MediaStream;
  muted?: boolean;
  large?: boolean;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
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
            rounded-xl
            border
            bg-black
            object-contain
          `
          : `
            w-full
            max-w-md
            cursor-pointer
            rounded-xl
            border
            object-cover
          `
      }
    />
  );
}

export default function VideoMeeting({
  room,
  autoJoin = false,
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

    setRemoteStreams((prev) => {
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
  }

  function leaveMeeting() {

    const socket = getSocket();

    socket.emit("leave-meeting");

    peersRef.current.forEach(
      (peer) => peer.close()
    );

    peersRef.current.clear();
    videoSendersRef.current.clear();

    setRemoteStreams({});
    setExpandedId(null);

    stopAllTracks();

    setStream(null);
    setJoined(false);
    setSharingScreen(false);
    setAutoJoined(false);
    setCameraOn(true);
    setMicOn(true);

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

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: !options.audioOnly,
          audio: true,
        });

      localStreamRef.current =
        mediaStream;

      setStream(mediaStream);
      setCameraOn(!options.audioOnly);
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
        alert(
          "Não foi possível acessar câmera ou microfone."
        );
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

    const socket =
      getSocket();

    socket.on(
      "existing-participants",
      async (
        participantIds: string[]
      ) => {

        for (const remoteId of participantIds) {

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
      socket.off("user-left-meeting");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");

    };

  }, []);

  const remoteEntries =
    Object.entries(remoteStreams);

  const expandedStream =
    expandedId === "local"
      ? stream
      : expandedId
      ? remoteStreams[expandedId]
      : null;

  return (

    <div
      className="
        mt-6
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
      "
    >

      <h3
        className="
          mb-4
          text-xl
          font-semibold
        "
      >
        Chamada de voz e vídeo
      </h3>

      {!joined && autoJoin && (

        <p className="text-sm text-slate-500">
          🚪 Conectando áudio automaticamente
          (portas abertas)...
        </p>

      )}

      {!joined && !autoJoin && (

        <button
          onClick={() => joinMeeting()}
          className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
          "
        >
          Entrar na Chamada
        </button>

      )}

      {joined && (

        <div>

          {expandedStream && (

            <div className="mb-4">

              <VideoTile
                stream={expandedStream}
                muted={expandedId === "local"}
                large
                onClick={() =>
                  setExpandedId(null)
                }
              />

              <button
                onClick={() =>
                  setExpandedId(null)
                }
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                ↙️ Ver em grade
              </button>

            </div>

          )}

          <p className="mb-2 text-xs text-slate-400">
            Clique em um vídeo para ver maior.
          </p>

          <div
            className="
              grid
              gap-4
              md:grid-cols-2
              xl:grid-cols-3
            "
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
                  onClick={() =>
                    toggleExpanded("local")
                  }
                />

              ) : (

                <div
                  className="
                    flex
                    h-40
                    w-full
                    max-w-md
                    items-center
                    justify-center
                    rounded-xl
                    border
                    bg-slate-100
                    text-sm
                    text-slate-500
                  "
                >
                  Câmera desligada
                </div>

              )}

            </div>

            {remoteEntries.map(
              ([socketId, remoteStream]) => (

                <div key={socketId}>

                  <p
                    className="
                      mb-3
                      text-sm
                      text-slate-500
                    "
                  >
                    Participante
                  </p>

                  <VideoTile
                    stream={remoteStream}
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

        </div>

      )}

    </div>

  );
}
