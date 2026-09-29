import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getUserProfile, type PublicUserProfile } from '../api/profileApi'
import { apiRequest } from '../lib/api'
import { refreshAccessToken } from '../lib/auth'
import './Chat.css'

type ChatMessage = {
  id: number
  sender_id: number
  sender_username: string
  receiver_id: number
  receiver_username: string
  content: string
  created_at: string
}

function websocketUrl(token: string) {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  const base = configuredBase || window.location.origin
  const url = new URL('/ws/chat/', base)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

export default function Chat() {
  const { userId } = useParams()
  const otherUserId = Number(userId)
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [socketReady, setSocketReady] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!Number.isInteger(otherUserId) || otherUserId < 1) {
      setError('Invalid user ID.')
      setLoading(false)
      return
    }

    let cancelled = false
    let socket: WebSocket | null = null

    async function openConversation() {
      setLoading(true)
      setError('')
      setSocketReady(false)
      setProfile(null)
      setMessages([])
      try {
        const [history, userProfile] = await Promise.all([
          apiRequest<ChatMessage[]>(`/api/chat/messages/?user_id=${otherUserId}`),
          getUserProfile(otherUserId),
        ])
        if (cancelled) return
        setMessages(history)
        setProfile(userProfile)

        const token = await refreshAccessToken()
        if (cancelled) return
        socket = new WebSocket(websocketUrl(token))
        socketRef.current = socket
        socket.onopen = () => !cancelled && setSocketReady(true)
        socket.onmessage = (event) => {
          const message = JSON.parse(event.data) as ChatMessage
          if (message.sender_id === otherUserId || message.receiver_id === otherUserId) {
            setMessages((current) => current.some((item) => item.id === message.id)
              ? current
              : [...current, message])
          }
        }
        socket.onerror = () => {
          if (!cancelled) setError('Could not connect to chat. Please try again.')
        }
        socket.onclose = () => !cancelled && setSocketReady(false)
      } catch {
        if (!cancelled) setError('Could not open this conversation.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void openConversation()
    return () => {
      cancelled = true
      socket?.close()
      socketRef.current = null
    }
  }, [otherUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = text.trim()
    const socket = socketRef.current
    if (!content || !socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ receiver_id: otherUserId, content }))
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

        {error && <p className="chat-error" role="alert">{error}</p>}
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
              <time dateTime={message.created_at}>
                {new Date(message.created_at).toLocaleString()}
              </time>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="chat-compose" onSubmit={sendMessage}>
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
