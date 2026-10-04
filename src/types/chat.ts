export interface ChatMessage {
  id: number
  sender_id: number
  sender_username: string
  receiver_id: number
  receiver_username: string
  content: string
  created_at: string
  is_read: boolean
}

export interface RecentChat {
  user_id: number
  username: string
  last_message: string
  last_message_at: string
  unread_count: number
}
