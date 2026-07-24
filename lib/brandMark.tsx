// Marca usada nos ícones gerados (PWA 192/512, apple-icon) — círculo
// azul com o "i" branco (bolinha + haste), igual ao favicon final
// (app/icon.png). Tudo em porcentagem do tamanho total, então funciona
// em qualquer resolução sem precisar recalcular nada.
export function brandMarkElement(sizePx: number) {

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
          width: "88%",
          height: "88%",
          borderRadius: "50%",
          background: "#007CB2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(sizePx * 0.06),
          }}
        >
          <div
            style={{
              width: Math.round(sizePx * 0.16),
              height: Math.round(sizePx * 0.16),
              borderRadius: "50%",
              background: "#ffffff",
            }}
          />

          <div
            style={{
              width: Math.round(sizePx * 0.18),
              height: Math.round(sizePx * 0.42),
              borderRadius: 9999,
              background: "#ffffff",
            }}
          />
        </div>
      </div>
    </div>
  );

}
