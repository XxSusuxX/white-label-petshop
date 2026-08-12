// Service Worker do SaaS Petshop para Notificações Push e PWA
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "SaaS Petshop";
    const options = {
      body: data.body || "Você tem uma nova atualização sobre seu pet!",
      icon: data.icon || "/favicon.ico",
      badge: "/favicon.ico",
      data: data.url || "/",
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.warn("Erro ao exibir push notification no SW:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data || "/");
      }
    })
  );
});
