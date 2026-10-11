import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useChat } from '../../context/useChat'
import ChatPanel from './ChatPanel'
import './FloatingChat.css'

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false)
  const [initialUserId, setInitialUserId] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)
  const { unreadTotal } = useChat()
  const location = useLocation()

  useEffect(() => {
    const userId = Number((location.state as { openChatUserId?: number } | null)?.openChatUserId)
    if (!Number.isInteger(userId) || userId <= 0) return
    setInitialUserId(userId)
    setExpanded(false)
    setOpen(true)
  }, [location.key, location.state])

  useEffect(() => {
    const openChat = (event: Event) => {
      const userId = (event as CustomEvent<number>).detail
      if (!Number.isInteger(userId) || userId <= 0) return
      setInitialUserId(userId)
      setExpanded(false)
      setOpen(true)
    }
    window.addEventListener('skillmatch-open-chat', openChat)
    return () => window.removeEventListener('skillmatch-open-chat', openChat)
  }, [])

  function closePanel() {
    setOpen(false)
    setInitialUserId(null)
    setExpanded(false)
  }

  return (
    <div className="floating-chat-root">
      {open && <ChatPanel onClose={closePanel} initialUserId={initialUserId} expanded={expanded} onToggleExpanded={() => setExpanded((value) => !value)} />}
      <button
        type="button"
        className="floating-chat-button"
        aria-label={open ? 'Close recent chats' : 'Open recent chats'}
        aria-expanded={open}
        onClick={() => { if (open) closePanel(); else { setInitialUserId(null); setExpanded(false); setOpen(true) } }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.8A2.8 2.8 0 0 1 6.8 3h10.4A2.8 2.8 0 0 1 20 5.8v7.4a2.8 2.8 0 0 1-2.8 2.8H11l-4.8 4v-4.1A2.8 2.8 0 0 1 4 13.2V5.8Z" />
        </svg>
        {unreadTotal > 0 && <span className="floating-chat-badge">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
      </button>
    </div>
  )
}
