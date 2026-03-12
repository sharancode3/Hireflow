import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import { applyTheme, loadTheme } from './theme/theme'

applyTheme(loadTheme())

const appTree = (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {appTree}
  </StrictMode>,
)
