import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { getConversationMessages, getRecentChats, markChatAsRead as markChatReadApi } from '../api/chatApi'
import { apiRequest } from '../lib/api'
import { isAuthenticated, refreshAccessToken } from '../lib/auth'
import type { ChatMessage, RecentChat } from '../types/chat'
import { ChatContext } from './chatContextValue'

function websocketUrl(token: string) {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  const base = configuredBase || window.location.origin
  const url = new URL('/ws/chat/', base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

function otherUserId(message: ChatMessage, currentUserId: number): number {
  return message.sender_id === currentUserId ? message.receiver_id : message.sender_id
}

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) =>
    a.created_at.localeCompare(b.created_at) || a.id - b.id,
  )
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [authVersion, setAuthVersion] = useState(0)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [messagesByUser, setMessagesByUser] = useState<Record<number, ChatMessage[]>>({})
  const [socketReady, setSocketReady] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const currentUserIdRef = useRef<number | null>(null)
  const pathUserId = Number(location.pathname.match(/^\/chat\/(\d+)/)?.[1]) || null
  const isPublicPage = location.pathname === '/login' || location.pathname === '/register'
  const shouldConnect = isAuthenticated() && !isPublicPage
  const activeUserIdRef = useRef<number | null>(pathUserId)

  useEffect(() => {
    activeUserIdRef.current = pathUserId
  }, [pathUserId])

  useEffect(() => {
    const updateAuth = () => setAuthVersion((version) => version + 1)
    window.addEventListener('skillmatch-auth-change', updateAuth)
    return () => window.removeEventListener('skillmatch-auth-change', updateAuth)
  }, [])

  const markChatAsRead = useCallback(async (userId: number) => {
    await markChatReadApi(userId)
    setRecentChats((chats) => chats.map((chat) =>
      chat.user_id === userId ? { ...chat, unread_count: 0 } : chat,
    ))
  }, [])

  const receiveMessage = useCallback((message: ChatMessage) => {
    const currentUserId = currentUserIdRef.current
    if (!currentUserId) return
    const userId = otherUserId(message, currentUserId)

    setMessagesByUser((current) => {
      const existing = current[userId] ?? []
      if (existing.some((item) => item.id === message.id)) return current
      return { ...current, [userId]: sortMessages([...existing, message]) }
    })

    setRecentChats((chats) => {
      const previous = chats.find((chat) => chat.user_id === userId)
      const active = activeUserIdRef.current === userId
      const updated: RecentChat = {
        user_id: userId,
        username: message.sender_id === currentUserId
          ? message.receiver_username
          : message.sender_username,
        last_message: message.content,
        last_message_at: message.created_at,
        unread_count: active
          ? 0
          : (previous?.unread_count ?? 0) + (message.sender_id === currentUserId ? 0 : 1),
      }
      return [updated, ...chats.filter((chat) => chat.user_id !== userId)]
    })

    if (activeUserIdRef.current === userId && message.sender_id !== currentUserId) {
      void markChatAsRead(userId).catch(() => undefined)
    }
  }, [markChatAsRead])

  useEffect(() => {
    let cancelled = false
    let socket: WebSocket | null = null

    async function connect() {
      if (!shouldConnect) {
        setRecentChats([])
        setMessagesByUser({})
        currentUserIdRef.current = null
        setSocketReady(false)
        return
      }

      try {
        const [token, chats, me] = await Promise.all([
          refreshAccessToken(),
          getRecentChats(),
          apiRequest<{ id: number }>('/api/auth/me/'),
        ])
        if (cancelled) return
        currentUserIdRef.current = me.id
        setRecentChats(chats)
        socket = new WebSocket(websocketUrl(token))
        socketRef.current = socket
        socket.onopen = () => { if (!cancelled) setSocketReady(true) }
        socket.onmessage = (event) => {
          try { receiveMessage(JSON.parse(event.data) as ChatMessage) } catch { /* Ignore invalid frames. */ }
        }
        socket.onerror = () => { if (!cancelled) setSocketReady(false) }
        socket.onclose = () => { if (!cancelled) setSocketReady(false) }
      } catch {
        if (!cancelled) setSocketReady(false)
      }
    }

    void connect()
    return () => {
      cancelled = true
      socket?.close()
      if (socketRef.current === socket) socketRef.current = null
      setSocketReady(false)
    }
  }, [authVersion, receiveMessage, shouldConnect])

  const loadMessages = useCallback(async (userId: number) => {
    const history = await getConversationMessages(userId)
    let combined: ChatMessage[] = history
    setMessagesByUser((current) => {
      const byId = new Map<number, ChatMessage>()
      for (const message of [...history, ...(current[userId] ?? [])]) byId.set(message.id, message)
      combined = sortMessages([...byId.values()])
      return { ...current, [userId]: combined }
    })
    return combined
  }, [])

  const sendMessage = useCallback((receiverId: number, content: string) => {
    const socket = socketRef.current
    if (!content.trim() || !socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ receiver_id: receiverId, content: content.trim() }))
  }, [])

  const unreadTotal = useMemo(
    () => recentChats.reduce((total, chat) => total + chat.unread_count, 0),
    [recentChats],
  )

  const value = useMemo(() => ({
    recentChats,
    unreadTotal,
    messagesByUser,
    socketReady,
    loadMessages,
    sendMessage,
    markChatAsRead,
  }), [recentChats, unreadTotal, messagesByUser, socketReady, loadMessages, sendMessage, markChatAsRead])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

