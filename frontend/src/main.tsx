import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import { applyTheme, loadTheme } from './theme/theme'
import { config } from './config'

applyTheme(loadTheme())

const appTree = (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter basename="/Hireflow">
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {config.googleClientId ? (
      <GoogleOAuthProvider clientId={config.googleClientId}>{appTree}</GoogleOAuthProvider>
    ) : (
      appTree
    )}
  </StrictMode>,
)
