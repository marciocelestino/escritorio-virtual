import commonRooms from "../data/salas.json";

export type Room = {
  id: string;
  nome: string;
};

export const getRooms = () => commonRooms;

// Recepção e Espaço Natureza são espaços de passagem/descontração sem
// chamada de vídeo própria — só a Sala de Reunião e as salas pessoais
// (uma por usuário) suportam chamada.
export function roomSupportsCall(
  room: string
): boolean {
  return (
    room !== "Recepção" &&
    room !== "Espaço Natureza"
  );
}

export function buildRoomList(
  users: {
    id: number;
    nome: string;
    salaNome?: string | null;
  }[]
): Room[] {

  const personalRooms = users.map(
    (user) => ({
      id: `pessoal-${user.id}`,
      nome:
        user.salaNome ||
        `Espaço ${user.nome}`,
    })
  );

  return [
    ...commonRooms,
    ...personalRooms,
  ];
}
