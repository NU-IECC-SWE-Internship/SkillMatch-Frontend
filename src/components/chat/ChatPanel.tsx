import { useNavigate } from 'react-router-dom'
import { useChat } from '../../context/useChat'

function formatChatTime(value: string) {
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { recentChats } = useChat()
  const navigate = useNavigate()

  return (
    <section className="floating-chat-panel" aria-label="Recent chats">
      <header className="floating-chat-header">
        <h2>Recent Chats</h2>
        <button type="button" aria-label="Close recent chats" onClick={onClose}>×</button>
      </header>
      <div className="floating-chat-list">
        {recentChats.length === 0 ? (
          <p className="floating-chat-empty">Your conversations will appear here.</p>
        ) : recentChats.map((chat) => (
          <button
            className="floating-chat-item"
            key={chat.user_id}
            type="button"
            onClick={() => {
              onClose()
              navigate(`/chat/${chat.user_id}`)
            }}
          >
            <span className="floating-chat-copy">
              <strong>{chat.username}</strong>
              <span className="floating-chat-last-message">{chat.last_message}</span>
            </span>
            <span className="floating-chat-meta">
              <time dateTime={chat.last_message_at}>{formatChatTime(chat.last_message_at)}</time>
              {chat.unread_count > 0 && <span className="floating-chat-unread">{chat.unread_count}</span>}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
