import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { StatusPage } from './pages/StatusPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StatusPage />
  </StrictMode>,
)
