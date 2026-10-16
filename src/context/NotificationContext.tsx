import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsAsRead as markAllApi,
  markNotificationAsRead as markReadApi,
  type NotificationItem,
} from "../api/notificationApi";
import { useWebSocket } from "../hooks/useWebSocket";
import { isAuthenticated } from "../lib/auth";
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "../lib/pushSubscription";
import { getProfile, updateEmailNotifications } from "../api/profileApi";

export interface NotificationContextType {
  notifications: NotificationItem[];  //the list of messages (title, message, date)
  unreadCount: number;  // the red badge number (e.g., 5) when there are unread messages
  markAsRead: (id: number) => Promise<void>; // mark a notification as read
  markAllAsRead: () => Promise<void>; // mark all notifications as read
  refreshNotifications: () => Promise<void>; // refresh the notifications
  isConnected: boolean; // check if WebSocket is connected
  pushSupported: boolean; // check if push notifications are supported
  pushSubscribed: boolean; // Did user subscribe to push notifications? 
  enablePushNotifications: () => Promise<{ success: boolean; error?: string }>; // Enable push notifications
  disablePushNotifications: () => Promise<boolean>; // Disable push notifications
  emailNotifications: boolean; // User email notifications toggle state
  emailNotificationsLoading: boolean; // Updating email notifications setting
  toggleEmailNotifications: () => Promise<boolean>; // Toggle email notifications on/off
}

const NotificationContext = createContext<NotificationContextType | null>(null);

type NotificationWebSocketEvent = // this is the type of the messages that will be sent from the backend to the frontend via WebSocket
  | {
      type: "new_notification";
      notification: NotificationItem;
      unread_count?: number;
    }
  | {
      type: "notification_read";
      id: number;
      unread_count?: number;
    }
  | {
      type: "notification_all_read";
      unread_count: 0;
    };

export function NotificationProvider({ children }: { children: ReactNode }) {
  const location = useLocation(); // Get current page
  const [notifications, setNotifications] = useState<NotificationItem[]>([]); // all notifications (read + unread)  
  const [unreadCount, setUnreadCount] = useState<number>(0); // the red badge number (e.g., 5) when there are unread messages

  const isPublicPage =
    location.pathname === "/login" || location.pathname === "/register"; // Check if current page is public page
  const shouldConnect = isAuthenticated() && !isPublicPage; // Connect to WebSocket if authenticated and not on public page

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // Silently fail if network drops
    }
  }, []);

  const handleSocketMessage = useCallback((data: NotificationWebSocketEvent) => {
    if (data.type === "new_notification") {
      const newNotif = data.notification;
      setNotifications((prev) => {
        if (prev.some((item) => item.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });

      if (typeof data.unread_count === "number") {
        setUnreadCount(data.unread_count);
      } else {
        setUnreadCount((prev) => prev + 1);
      }
    } else if (data.type === "notification_read") {
      const readId = Number(data.id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === readId ? { ...item, is_read: true } : item
        )
      );
      if (typeof data.unread_count === "number") {
        setUnreadCount(data.unread_count);
      } else {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } else if (data.type === "notification_all_read") {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );
      setUnreadCount(0);
    }
  }, []);

  const { isConnected } = useWebSocket<NotificationWebSocketEvent>({
    endpoint: "/ws/notifications/",
    enabled: shouldConnect,
    onConnectStart: refreshNotifications,
    onMessage: handleSocketMessage,
  });

  const markAsRead = useCallback(async (id: number) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markReadApi(id);
    } catch {
      // Ignore API errors, state can be refreshed if needed
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllApi();
    } catch {
      // Ignore API errors
    }
  }, []);

  const [pushSupported] = useState<boolean>(() => isPushSupported());
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);

  useEffect(() => {
    if (pushSupported && isAuthenticated()) {
      void getExistingPushSubscription().then((sub) => {
        setPushSubscribed(Boolean(sub));
      });
    }
  }, [pushSupported]);

  const enablePushNotifications = useCallback(async () => {
    const res = await subscribeToPushNotifications();
    if (res.success) {
      setPushSubscribed(true);
    }
    return res;
  }, []);

  const disablePushNotifications = useCallback(async () => {
    const success = await unsubscribeFromPushNotifications();
    if (success) {
      setPushSubscribed(false);
    }
    return success;
  }, []);

  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [emailNotificationsLoading, setEmailNotificationsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated()) {
      void getProfile()
        .then((profile) => {
          if (typeof profile.email_notifications_enabled === "boolean") {
            setEmailNotifications(profile.email_notifications_enabled);
          }
        })
        .catch(() => {
          // Ignore background fetch error
        });
    }
  }, [location.pathname]);

  const toggleEmailNotifications = useCallback(async () => {
    const nextVal = !emailNotifications;
    setEmailNotifications(nextVal);
    setEmailNotificationsLoading(true);
    try {
      await updateEmailNotifications(nextVal);
      return true;
    } catch (err) {
      console.error("Failed to update email notifications:", err);
      setEmailNotifications(!nextVal);
      return false;
    } finally {
      setEmailNotificationsLoading(false);
    }
  }, [emailNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        isConnected,
        pushSupported,
        pushSubscribed,
        enablePushNotifications,
        disablePushNotifications,
        emailNotifications,
        emailNotificationsLoading,
        toggleEmailNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
