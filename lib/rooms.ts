import commonRooms from "../data/salas.json";

export type Room = {
  id: string;
  nome: string;
};

export const getRooms = () => commonRooms;

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
