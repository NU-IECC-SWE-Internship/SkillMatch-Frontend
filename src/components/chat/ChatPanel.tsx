import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getUserProfile, type PublicUserProfile } from '../../api/profileApi'
import { useChat } from '../../context/useChat'
import type { ChatMessage } from '../../types/chat'
import '../../pages/Chat.css'

const EMPTY_MESSAGES: ChatMessage[] = []

function formatChatTime(value: string) {
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ChatPanel({ onClose, initialUserId, expanded, onToggleExpanded }: {
  onClose: () => void
  initialUserId: number | null
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const { recentChats, messagesByUser, loadMessages, markChatAsRead, sendMessage, socketReady } = useChat()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId)
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const messages = selectedUserId ? messagesByUser[selectedUserId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('skillmatch-active-chat', { detail: selectedUserId }))
    return () => {
      window.dispatchEvent(new CustomEvent('skillmatch-active-chat', { detail: null }))
    }
  }, [selectedUserId])

  useEffect(() => {
    if (initialUserId) setSelectedUserId(initialUserId)
  }, [initialUserId])

  useEffect(() => {
    if (!selectedUserId) return
    let cancelled = false
    setLoading(true)
    setError('')
    setProfile(null)
    Promise.all([loadMessages(selectedUserId), getUserProfile(selectedUserId), markChatAsRead(selectedUserId)])
      .then(([, userProfile]) => { if (!cancelled) setProfile(userProfile) })
      .catch(() => { if (!cancelled) setError('Could not open this conversation.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedUserId, loadMessages, markChatAsRead])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = text.trim()
    if (!content || !selectedUserId || !socketReady) return
    sendMessage(selectedUserId, content)
    setText('')
  }

  return (
    <section className={`floating-chat-panel${selectedUserId ? ' has-conversation' : ''}${expanded ? ' is-expanded' : ''}`} aria-label="Chat">
      <header className="floating-chat-header">
        <div className="floating-chat-title">
          {selectedUserId && <button className="floating-chat-back" type="button" onClick={() => setSelectedUserId(null)} aria-label="Back to recent chats">‹</button>}
          <h2>{selectedUserId ? profile?.username ?? 'Chat' : 'Recent Chats'}</h2>
        </div>
        <div className="floating-chat-actions">
          <button type="button" aria-label={expanded ? 'Shrink chat' : 'Expand chat'} title={expanded ? 'Shrink chat' : 'Expand chat'} onClick={onToggleExpanded}>{expanded ? '↙' : '↗'}</button>
          <button type="button" aria-label="Close recent chats" onClick={onClose}>×</button>
        </div>
      </header>
      {!selectedUserId ? <div className="floating-chat-list">
        {recentChats.length === 0 ? (
          <p className="floating-chat-empty">Your conversations will appear here.</p>
        ) : recentChats.map((chat) => (
          <button
            className="floating-chat-item"
            key={chat.user_id}
            type="button"
            onClick={() => setSelectedUserId(chat.user_id)}
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
      </div> : <>
        {error && <p className="chat-error" role="alert">{error}</p>}
        <div className="chat-messages" aria-live="polite">
          {loading && <p className="chat-empty">Loading conversation…</p>}
          {!loading && messages.length === 0 && <p className="chat-empty">No messages yet. Say hello!</p>}
          {messages.map((message) => 
          <article className={`chat-message ${message.sender_id === selectedUserId ? 'received' : 'sent'}`} key={message.id}>
            <p className="chat-message-route">{message.sender_username}</p>
            <p className="chat-message-content">{message.content}</p>
            <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
          </article>
        )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-compose" onSubmit={submitMessage}>
          <input aria-label="Message" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message…" maxLength={5000} disabled={!socketReady} />
          <button type="submit" disabled={!socketReady || !text.trim()}>Send</button>
        </form>
      </>}
    </section>
  )
}
