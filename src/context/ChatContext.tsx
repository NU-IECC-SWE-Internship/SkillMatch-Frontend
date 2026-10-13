import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  getConversationMessages,
  getRecentChats,
  markChatAsRead as markChatReadApi,
} from "../api/chatApi";
import { useWebSocket } from "../hooks/useWebSocket";
import { apiRequest } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import type { ChatMessage, RecentChat } from "../types/chat";
import { ChatContext } from "./chatContextValue";

function otherUserId(message: ChatMessage, currentUserId: number): number {
  return message.sender_id === currentUserId
    ? message.receiver_id
    : message.sender_id;
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id
  );
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [messagesByUser, setMessagesByUser] = useState<
    Record<number, ChatMessage[]>
  >({});
  const currentUserIdRef = useRef<number | null>(null);

  const pathUserId =
    Number(location.pathname.match(/^\/chat\/(\d+)/)?.[1]) || null;
  const isPublicPage =
    location.pathname === "/login" || location.pathname === "/register";
  const shouldConnect = isAuthenticated() && !isPublicPage;
  const activeUserIdRef = useRef<number | null>(pathUserId);

  useEffect(() => {
    activeUserIdRef.current = pathUserId;
  }, [pathUserId]);

  useEffect(() => {
    const updateActiveChat = (event: Event) => {
      activeUserIdRef.current = (event as CustomEvent<number | null>).detail;
    };
    window.addEventListener("skillmatch-active-chat", updateActiveChat);
    return () =>
      window.removeEventListener("skillmatch-active-chat", updateActiveChat);
  }, []);

  const markChatAsRead = useCallback(async (userId: number) => {
    await markChatReadApi(userId);
    setRecentChats((chats) =>
      chats.map((chat) =>
        chat.user_id === userId ? { ...chat, unread_count: 0 } : chat
      )
    );
  }, []);

  const receiveMessage = useCallback(
    (message: ChatMessage) => {
      const currentUserId = currentUserIdRef.current;
      if (!currentUserId) return;
      const userId = otherUserId(message, currentUserId);

      setMessagesByUser((current) => {
        const existing = current[userId] ?? [];
        if (existing.some((item) => item.id === message.id)) return current;
        return { ...current, [userId]: sortMessages([...existing, message]) };
      });

      setRecentChats((chats) => {
        const previous = chats.find((chat) => chat.user_id === userId);
        const active = activeUserIdRef.current === userId;
        const updated: RecentChat = {
          user_id: userId,
          username:
            message.sender_id === currentUserId
              ? message.receiver_username
              : message.sender_username,
          last_message: message.content,
          last_message_at: message.created_at,
          unread_count: active
            ? 0
            : (previous?.unread_count ?? 0) +
              (message.sender_id === currentUserId ? 0 : 1),
        };
        return [updated, ...chats.filter((chat) => chat.user_id !== userId)];
      });

      if (
        activeUserIdRef.current === userId &&
        message.sender_id !== currentUserId
      ) {
        void markChatAsRead(userId).catch(() => undefined);
      }
    },
    [markChatAsRead]
  );

  const initChatData = useCallback(async () => {
    if (!shouldConnect) {
      setRecentChats([]);
      setMessagesByUser({});
      currentUserIdRef.current = null;
      return;
    }
    const [chats, me] = await Promise.all([
      getRecentChats(),
      apiRequest<{ id: number }>("/api/auth/me/"),
    ]);
    currentUserIdRef.current = me.id;
    setRecentChats(chats);
  }, [shouldConnect]);

  const { isConnected: socketReady, sendMessage: sendRaw } =
    useWebSocket<ChatMessage>({
      endpoint: "/ws/chat/",
      enabled: shouldConnect,
      onConnectStart: initChatData,
      onMessage: receiveMessage,
    });

  const loadMessages = useCallback(async (userId: number) => {
    const history = await getConversationMessages(userId);
    let combined: ChatMessage[] = history;
    setMessagesByUser((current) => {
      const byId = new Map<number, ChatMessage>();
      for (const message of [...history, ...(current[userId] ?? [])])
        byId.set(message.id, message);
      combined = sortMessages([...byId.values()]);
      return { ...current, [userId]: combined };
    });
    return combined;
  }, []);

  const sendMessage = useCallback(
    (receiverId: number, content: string) => {
      if (!content.trim()) return;
      sendRaw({
        receiver_id: receiverId,
        content: content.trim(),
      });
    },
    [sendRaw]
  );

  const unreadTotal = useMemo(
    () => recentChats.reduce((total, chat) => total + chat.unread_count, 0),
    [recentChats]
  );

  const value = useMemo(
    () => ({
      recentChats,
      unreadTotal,
      messagesByUser,
      socketReady,
      loadMessages,
      sendMessage,
      markChatAsRead,
    }),
    [
      recentChats,
      unreadTotal,
      messagesByUser,
      socketReady,
      loadMessages,
      sendMessage,
      markChatAsRead,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
