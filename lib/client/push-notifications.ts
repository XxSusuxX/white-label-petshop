"use client";

/**
 * Solicita permissão para notificações nativas do sistema/navegador (Push/Web Notifications)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (err) {
    console.warn("Erro ao solicitar permissão de notificação:", err);
  }

  return false;
}

/**
 * Dispara uma notificação nativa no SO/celular/navegador do usuário
 */
export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn("Erro ao instanciar Notification:", err);
    }
  }
}

/**
 * Registra o Service Worker para suporte a PWA e background push
 */
export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("Erro ao registrar Service Worker:", err);
        });
    });
  }
}
