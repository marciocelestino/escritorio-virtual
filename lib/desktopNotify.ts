// Notificação do sistema (Windows/Mac/Linux), não só o aviso dentro da
// aba — pra não passar batido quando o Internit Office está aberto
// numa aba minimizada/em segundo plano no meio de várias outras.
// Usa a Notification API direto (sem Web Push): só funciona enquanto o
// navegador/aba estiver aberto em algum lugar, não com tudo fechado —
// escopo combinado com o cliente pra essa primeira leva.
const ICON_PATH = "/pwa-icon-192";

export function isDesktopNotifySupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window
  );
}

export function getDesktopNotifyPermission():
  | NotificationPermission
  | "unsupported" {

  if (!isDesktopNotifySupported()) {
    return "unsupported";
  }

  return Notification.permission;

}

export async function requestDesktopNotifyPermission() {

  if (!isDesktopNotifySupported()) {
    return "unsupported" as const;
  }

  return Notification.requestPermission();

}

// Só dispara quando a aba não está em foco/visível — se a pessoa já
// está olhando a tela, o aviso interno (toast) já é suficiente; dobrar
// com uma notificação do sistema só iria incomodar.
export function notifyDesktop(
  title: string,
  body?: string
) {

  if (!isDesktopNotifySupported()) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  if (
    document.visibilityState === "visible" &&
    document.hasFocus()
  ) {
    return;
  }

  try {

    const notification = new Notification(
      title,
      { body, icon: ICON_PATH }
    );

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

  } catch {
    // Alguns navegadores lançam em certas circunstâncias (ex.: fora de
    // um gesto do usuário, dependendo da política interna) — ignora,
    // não é crítico o suficiente pra travar nada.
  }

}
