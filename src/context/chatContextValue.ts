import { createContext } from 'react'
import type { ChatMessage, RecentChat } from '../types/chat'

export interface ChatContextValue {
  recentChats: RecentChat[]
  unreadTotal: number
  messagesByUser: Record<number, ChatMessage[]>
  socketReady: boolean
  loadMessages: (userId: number) => Promise<ChatMessage[]>
  sendMessage: (receiverId: number, content: string) => void
  markChatAsRead: (userId: number) => Promise<void>
}

export const ChatContext = createContext<ChatContextValue | null>(null)
