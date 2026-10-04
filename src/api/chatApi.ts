import { apiRequest } from '../lib/api'
import type { ChatMessage, RecentChat } from '../types/chat'

export function getRecentChats(): Promise<RecentChat[]> {
  return apiRequest<RecentChat[]>('/api/chat/recent/')
}

export function getConversationMessages(userId: number): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/api/chat/messages/?user_id=${userId}`)
}

export async function markChatAsRead(userId: number): Promise<void> {
  await apiRequest(`/api/chat/${userId}/read/`, { method: 'POST' })
}
