import {
  createContext,
  useCallback,
  useContext,
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

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

type NotificationWebSocketEvent =
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
  const location = useLocation(); // Get current location
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0); 

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

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        isConnected,
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
