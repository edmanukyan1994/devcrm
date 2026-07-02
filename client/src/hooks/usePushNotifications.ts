import { useCallback, useState } from "react";
import { api } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported] = useState(
    () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
  );

  const subscribe = useCallback(async () => {
    if (!supported) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const { publicKey } = await api.notifications.getVapidKey();
    if (!publicKey) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await api.notifications.subscribePush(subscription.toJSON());
    setSubscribed(true);
    return true;
  }, [supported]);

  return { supported, subscribed, subscribe };
}
