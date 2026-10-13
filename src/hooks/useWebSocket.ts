import { useCallback, useEffect, useRef, useState } from "react";
import {
  getValidAccessToken,
  isAuthenticated,
  refreshAccessToken,
} from "../lib/auth";

export interface UseWebSocketOptions<T = unknown> {
  endpoint: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onConnectStart?: () => Promise<void> | void;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (payload: unknown) => boolean;
  reconnect: (forceTokenRefresh?: boolean) => void;
}

function buildWebSocketUrl(endpoint: string, token: string): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  const base = configuredBase || window.location.origin;
  const url = new URL(endpoint, base);
  if (url.protocol === "https:" || url.protocol === "wss:") {
    url.protocol = "wss:";
  } else {
    url.protocol = "ws:";
  }
  url.searchParams.set("token", token);
  return url.toString();
}

/**
 * Reusable WebSocket hook that handles:
 * - JWT token resolution & refresh
 * - Exponential backoff reconnection
 * - Close code 4401 (auth failure) recovery
 * - Window focus and online re-synchronization
 * - Safe unmount cleanup (StrictMode compatible)
 */
export function useWebSocket<T = unknown>({
  endpoint,
  enabled = true,
  onMessage,
  onOpen,
  onClose,
  onError,
  onConnectStart,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryDelayRef = useRef(2000);

  // Store latest callbacks in refs to avoid reconnecting when callbacks change
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const onConnectStartRef = useRef(onConnectStart);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
    onConnectStartRef.current = onConnectStart;
  });

  // Track auth changes (login / logout)
  const [authVersion, setAuthVersion] = useState(0);
  useEffect(() => {
    const handleAuthChange = () => setAuthVersion((v) => v + 1);
    window.addEventListener("skillmatch-auth-change", handleAuthChange);
    return () =>
      window.removeEventListener("skillmatch-auth-change", handleAuthChange);
  }, []);

  const shouldConnect = enabled && isAuthenticated();

  const connectSocket = useCallback(
    async (forceTokenRefresh = false) => {
      if (!shouldConnect) return;

      // Close any existing socket before opening a new one
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      try {
        const [token] = await Promise.all([
          forceTokenRefresh ? refreshAccessToken() : getValidAccessToken(),
          onConnectStartRef.current ? onConnectStartRef.current() : Promise.resolve(),
        ]);

        if (!token) {
          setIsConnected(false);
          return;
        }

        const ws = new WebSocket(buildWebSocketUrl(endpoint, token));
        socketRef.current = ws;

        ws.onopen = () => {
          retryDelayRef.current = 2000;
          setIsConnected(true);
          onOpenRef.current?.();
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            onMessageRef.current?.(parsed);
          } catch {
            // Non-JSON frames ignored
          }
        };

        ws.onerror = (event) => {
          setIsConnected(false);
          onErrorRef.current?.(event);
        };

        ws.onclose = (event) => {
          setIsConnected(false);
          socketRef.current = null;
          onCloseRef.current?.(event);

          if (shouldConnect) {
            const isAuthError = event.code === 4401 || event.code === 4001;
            const delay = retryDelayRef.current;
            retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 15000);

            reconnectTimeoutRef.current = window.setTimeout(() => {
              void connectSocket(isAuthError);
            }, delay);
          }
        };
      } catch {
        setIsConnected(false);
        if (shouldConnect) {
          const delay = retryDelayRef.current;
          retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, 15000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            void connectSocket(true);
          }, delay);
        }
      }
    },
    [endpoint, shouldConnect]
  );

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
      setIsConnected(false);
      return;
    }

    void connectSocket();

    // Re-sync and reconnect when tab becomes active or network recovers
    const handleActive = () => {
      if (!shouldConnect || cancelled) return;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        void connectSocket();
      } else if (onConnectStartRef.current) {
        void onConnectStartRef.current();
      }
    };

    window.addEventListener("focus", handleActive);
    window.addEventListener("online", handleActive);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleActive);
      window.removeEventListener("online", handleActive);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [shouldConnect, authVersion, connectSocket]);

  const sendMessage = useCallback((payload: unknown): boolean => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    ws.send(message);
    return true;
  }, []);

  const reconnect = useCallback(
    (forceTokenRefresh = false) => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      void connectSocket(forceTokenRefresh);
    },
    [connectSocket]
  );

  return {
    isConnected,
    sendMessage,
    reconnect,
  };
}
