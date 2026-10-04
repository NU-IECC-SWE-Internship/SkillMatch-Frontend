import { useState } from 'react'
import { useChat } from '../../context/useChat'
import ChatPanel from './ChatPanel'
import './FloatingChat.css'

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false)
  const { unreadTotal } = useChat()

  return (
    <div className="floating-chat-root">
      {open && <ChatPanel onClose={() => setOpen(false)} />}
      <button
        type="button"
        className="floating-chat-button"
        aria-label={open ? 'Close recent chats' : 'Open recent chats'}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v7.4a2.8 2.8 0 0 1-2.8 2.8H11l-4.8 4v-4.1A2.8 2.8 0 0 1 4 13.2V5.8Z" />
        </svg>
        {unreadTotal > 0 && <span className="floating-chat-badge">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
      </button>
    </div>
  )
}
