import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { applyZoom } from './utils/zoom'
import App from './App'
import './index.css'

window.addEventListener('load', () => {
  const savedZoom = parseInt(localStorage.getItem('uiZoom') || '100', 10)
  if (savedZoom !== 100) applyZoom(savedZoom)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
