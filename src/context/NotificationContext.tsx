import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
import { isAuthenticated, refreshAccessToken } from "../lib/auth";

export interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

function getWebSocketUrl(token: string): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  const base = configuredBase || window.location.origin;
  const url = new URL("/ws/notifications/", base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);
  return url.toString();
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [authVersion, setAuthVersion] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const isPublicPage =
    location.pathname === "/login" || location.pathname === "/register";
  const shouldConnect = isAuthenticated() && !isPublicPage;

  // Listen to auth changes (login / logout)
  useEffect(() => {
    const updateAuth = () => setAuthVersion((v) => v + 1);
    window.addEventListener("skillmatch-auth-change", updateAuth);
    return () => window.removeEventListener("skillmatch-auth-change", updateAuth);
  }, []);

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

  const markAsRead = useCallback(async (id: number) => {
    // Optimistic local state update
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
    // Optimistic local state update
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);

    try {
      await markAllApi();
    } catch {
      // Ignore API errors
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!shouldConnect) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    async function connectSocket() {
      if (cancelled) return;

      try {
        const [token] = await Promise.all([
          refreshAccessToken(),
          refreshNotifications(),
        ]);

        if (cancelled) return;

        const ws = new WebSocket(getWebSocketUrl(token));
        socketRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "new_notification") {
              const newNotif = data.notification as NotificationItem;
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
          } catch {
            // Ignore malformed frames
          }
        };

        ws.onerror = () => {
          if (cancelled) return;
          setIsConnected(false);
        };

        ws.onclose = () => {
          if (cancelled) return;
          setIsConnected(false);
          socketRef.current = null;

          // Attempt reconnection after 3 seconds if still authenticated
          if (shouldConnect) {
            reconnectTimeoutRef.current = window.setTimeout(() => {
              void connectSocket();
            }, 3000);
          }
        };
      } catch {
        if (!cancelled) {
          setIsConnected(false);
          // Retry connecting in 5 seconds if token refresh or initial fetch failed
          reconnectTimeoutRef.current = window.setTimeout(() => {
            void connectSocket();
          }, 5000);
        }
      }
    }

    void connectSocket();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [shouldConnect, authVersion, refreshNotifications]);

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
