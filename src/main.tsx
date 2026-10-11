import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/effects.css'
import App from './App.tsx'
import { ChatProvider } from './context/ChatContext'
import { NotificationProvider } from './context/NotificationContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ChatProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ChatProvider>
    </BrowserRouter>
  </StrictMode>,
)
