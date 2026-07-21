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

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
];

function RemoteVideo({
  stream,
}: {
  stream: MediaStream;
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
      className="
        w-full
        max-w-md
        rounded-xl
        border
      "
    />
  );
}

export default function VideoMeeting() {

  const videoRef =
    useRef<HTMLVideoElement>(null);

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const peersRef =
    useRef<Map<string, RTCPeerConnection>>(
      new Map()
    );

  const [joined, setJoined] =
    useState(false);

  const [stream, setStream] =
    useState<MediaStream | null>(
      null
    );

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

    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteSocketId];
      return next;
    });
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
          peer.addTrack(
            track,
            localStream
          );
        });
    }

    peersRef.current.set(
      remoteSocketId,
      peer
    );

    return peer;
  }

  async function joinMeeting() {

    try {

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      localStreamRef.current =
        mediaStream;

      setStream(mediaStream);

      setJoined(true);

      const socket =
        getSocket();

      socket.emit(
        "join-meeting"
      );

    } catch (error) {

      console.error(
        "Erro ao acessar câmera:",
        error
      );

      alert(
        "Não foi possível acessar câmera ou microfone."
      );
    }
  }

  function leaveMeeting() {

    const socket = getSocket();

    socket.emit("leave-meeting");

    peersRef.current.forEach(
      (peer) => peer.close()
    );

    peersRef.current.clear();

    setRemoteStreams({});

    localStreamRef.current
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    localStreamRef.current = null;

    setStream(null);

    setJoined(false);
  }

  useEffect(() => {

    if (
      stream &&
      videoRef.current
    ) {

      videoRef.current.srcObject =
        stream;

    }

  }, [stream]);

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
        Sala de Reunião
      </h3>

      {!joined && (

        <button
          onClick={joinMeeting}
          className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
          "
        >
          Entrar na Reunião
        </button>

      )}

      {joined && (

        <div>

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
                Sua câmera
              </p>

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="
                  w-full
                  max-w-md
                  rounded-xl
                  border
                "
              />

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

                  <RemoteVideo
                    stream={remoteStream}
                  />

                </div>

              )
            )}

          </div>

          <button
            onClick={leaveMeeting}
            className="
              mt-4
              rounded-lg
              bg-slate-200
              px-4
              py-2
              text-slate-800
            "
          >
            Sair da Reunião
          </button>

        </div>

      )}

    </div>

  );
}
