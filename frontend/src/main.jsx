import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
// Cleanup storage ya no necesario - migrado a JSON Server

// Función global para limpiar localStorage (útil para debugging)
window.clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Limpiar también datos viejos de MockAPI
  Object.keys(localStorage)
    .filter(key => key.startsWith('conchas-abanico:'))
    .forEach(key => localStorage.removeItem(key))
  window.location.reload()
}

// Función para cargar inventario manualmente (DEBUG)
window.loadInventory = async () => {
  try {
    const response = await fetch('http://localhost:4077/inventory')
    const data = await response.json()
    // Actualizar el store directamente
    const { useInventoryStore } = await import('./stores')
    useInventoryStore.setState({ inventory: data })
    return data
  } catch (error) {
    return null
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)