import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import logoSekolah from './assets/logo.png'

const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
link.setAttribute('rel', 'icon')
link.setAttribute('type', 'image/png')
link.setAttribute('href', logoSekolah)
document.head.appendChild(link)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
