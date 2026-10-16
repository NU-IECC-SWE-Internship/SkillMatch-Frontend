import { apiRequest } from "./api";
import { getAccessToken, isAuthenticated } from "./auth";

/**
 * Converts a base64 or URL-safe base64 string to a Uint8Array
 * required by the browser's PushManager.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether WebPush is supported in the current browser.
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Gets the current notification permission ('default' | 'granted' | 'denied').
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Checks if there is an active PushSubscription in this browser.
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Requests permission, registers the service worker, subscribes to the browser's
 * push service with the backend's public VAPID key, and syncs the subscription with Django.
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isPushSupported()) {
    return {
      success: false,
      error: "Push notifications are not supported in this browser or device.",
    };
  }

  if (!isAuthenticated()) {
    return {
      success: false,
      error: "You must be logged in to enable notifications.",
    };
  }

  try {
    // 1. Request permission from user
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error:
          permission === "denied"
            ? "Notification permission was denied. Please reset permissions in your browser/device settings."
            : "Notification permission was not granted.",
      };
    }

    // 2. Register service worker if not already registered
    await navigator.serviceWorker.register("/sw.js");
    const registration = await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from Django
    const token = getAccessToken();
    const res = await apiRequest<{ public_key: string }>(
      "/api/notifications/push-subscribe/",
      {
        method: "GET",
        token,
      }
    );

    if (!res.public_key) {
      return {
        success: false,
        error: "Backend VAPID public key is missing or not configured.",
      };
    }

    // 4. Subscribe with PushManager
    const applicationServerKey = urlBase64ToUint8Array(res.public_key);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 5. Send subscription to Django backend
    await apiRequest("/api/notifications/push-subscribe/", {
      method: "POST",
      token,
      body: subscription.toJSON(),
    });

    return { success: true };
  } catch (err: unknown) {
    let message = err instanceof Error ? err.message : "Failed to subscribe.";
    if (message.toLowerCase().includes("push service error")) {
      message =
        "Push service error. If you are using Brave, enable 'Use Google services for push messaging' in brave://settings/privacy.";
    }
    return { success: false, error: message };
  }
}

/**
 * Unsubscribes from browser push and notifies Django to delete the subscription.
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      if (isAuthenticated()) {
        const token = getAccessToken();
        await apiRequest("/api/notifications/push-subscribe/", {
          method: "DELETE",
          token,
          body: { endpoint },
        });
      }
    }
    return true;
  } catch {
    return false;
  }
}
