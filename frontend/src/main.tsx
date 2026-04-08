import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ThemeProvider } from './theme/ThemeContext'
import { applyTheme, loadTheme } from './theme/theme'
import { ToastProvider } from './components/ui/Toast'

applyTheme(loadTheme())

const routerBase = (() => {
  const rawBase = (import.meta.env.BASE_URL || "/").trim();
  if (rawBase === "/") return "/";
  return rawBase.replace(/\/+$/, "");
})();

const appTree = (
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={routerBase}>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')!).render(appTree)
