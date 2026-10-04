import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, type PublicUserProfile } from '../api/profileApi'
import { useChat } from '../context/useChat'
import type { ChatMessage } from '../types/chat'
import './Chat.css'

export default function Chat() {
  const { userId } = useParams()
  return <ChatConversation key={userId} otherUserId={Number(userId)} />
}

const EMPTY_MESSAGES: ChatMessage[] = []

function ChatConversation({ otherUserId }: { otherUserId: number }) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const { messagesByUser, loadMessages, markChatAsRead, sendMessage, socketReady } = useChat()
  const messages = messagesByUser[otherUserId] ?? EMPTY_MESSAGES
  const validUserId = Number.isInteger(otherUserId) && otherUserId > 0
  const visibleError = validUserId ? error : 'Invalid user ID.'

  useEffect(() => {
    if (!validUserId) return

    let cancelled = false
    Promise.all([
      loadMessages(otherUserId),
      getUserProfile(otherUserId),
      markChatAsRead(otherUserId),
    ]).then(([, userProfile]) => {
      if (!cancelled) setProfile(userProfile)
    }).catch(() => {
      if (!cancelled) setError('Could not open this conversation.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [otherUserId, validUserId, loadMessages, markChatAsRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = text.trim()
    if (!content || !socketReady) return
    sendMessage(otherUserId, content)
    setText('')
  }

  return (
    <main className="chat-page">
      <section className="chat-panel">
        <header className="chat-header">
          <Link to={`/users/${otherUserId}`}>← Profile</Link>
          <h1>{profile ? `Chat with ${profile.username}` : 'Chat'}</h1>
          <Link to="/dashboard">Dashboard</Link>
        </header>

        {visibleError && <p className="chat-error" role="alert">{visibleError}</p>}
        <div className="chat-messages" aria-live="polite">
          {loading ? <p className="chat-empty">Loading conversation…</p> : null}
          {!loading && messages.length === 0 && <p className="chat-empty">No messages yet. Say hello!</p>}
          {messages.map((message) => (
            <article
              className={`chat-message ${message.sender_id === otherUserId ? 'received' : 'sent'}`}
              key={message.id}
            >
              <p className="chat-message-route">
                {message.sender_username} → {message.receiver_username}
              </p>
              <p className="chat-message-content">{message.content}</p>
              <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="chat-compose" onSubmit={submitMessage}>
          <input
            aria-label="Message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message…"
            maxLength={5000}
            disabled={!socketReady}
          />
          <button type="submit" disabled={!socketReady || !text.trim()}>Send</button>
        </form>
      </section>
    </main>
  )
}
