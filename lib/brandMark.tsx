// Marca abstrata reaproveitada nos ícones do PWA (192/512) — mesma
// composição do app/apple-icon.tsx (bolinha rosa + barra azul, cores do
// logo da Internit), só que parametrizada por tamanho pra manter as
// proporções em qualquer resolução.
export function brandMarkElement(sizePx: number) {

  const scale = sizePx / 180;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: Math.round(10 * scale),
        }}
      >
        <div
          style={{
            width: Math.round(28 * scale),
            height: Math.round(28 * scale),
            borderRadius: "50%",
            background: "#C32E4E",
          }}
        />

        <div
          style={{
            width: Math.round(34 * scale),
            height: Math.round(84 * scale),
            borderRadius: Math.round(17 * scale),
            background: "#007CB2",
          }}
        />
      </div>
    </div>
  );

}
