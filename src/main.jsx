import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './index.css'

window.addEventListener('load', () => {
  const savedZoom = parseInt(localStorage.getItem('uiZoom') || '100', 10)
  if (savedZoom !== 100) {
    const root = document.getElementById('zoom-root')
    if (root) {
      const scale = savedZoom / 100
      root.style.transform = `scale(${scale})`
      root.style.transformOrigin = 'top left'
      root.style.width = `${100 / scale}%`
      root.style.height = `${100 / scale}vh`
    }
  }
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
