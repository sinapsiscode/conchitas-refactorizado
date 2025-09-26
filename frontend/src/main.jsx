import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import './utils/cleanupStorage' // Limpiar localStorage viejo al iniciar

// Función global para limpiar localStorage (útil para debugging)
window.clearAuth = () => {
  console.log('🔄 Limpiando autenticación...')
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Limpiar también datos viejos de MockAPI
  Object.keys(localStorage)
    .filter(key => key.startsWith('conchas-abanico:'))
    .forEach(key => localStorage.removeItem(key))
  console.log('✅ Autenticación limpiada. Por favor recarga la página.')
  window.location.reload()
}

console.log('🛠️ Utilidades de desarrollo:')
console.log('• clearAuth() - Limpiar autenticación y recargar')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)