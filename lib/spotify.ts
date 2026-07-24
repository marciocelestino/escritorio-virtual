export type SpotifyTrackDisplay = {
  nome: string;
  artista: string;
};

const MAX_LABEL_LENGTH = 50;

// Rótulo curto "faixa - artista" pra mostrar ao lado do nome da sala —
// cortado em 50 caracteres (+ "...") pra não estourar o card mesmo com
// nome de música/artista longo.
export function formatSpotifyTrackLabel(
  track: SpotifyTrackDisplay
): string {

  const full = track.artista
    ? `${track.nome} - ${track.artista}`
    : track.nome;

  return full.length > MAX_LABEL_LENGTH
    ? `${full.slice(0, MAX_LABEL_LENGTH)}...`
    : full;

}
