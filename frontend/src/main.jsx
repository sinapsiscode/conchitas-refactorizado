import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
// Cleanup storage ya no necesario - migrado a JSON Server

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

// Función para cargar inventario manualmente (DEBUG)
window.loadInventory = async () => {
  console.log('📦 Cargando inventario manualmente...')
  try {
    const response = await fetch('http://localhost:4077/inventory')
    const data = await response.json()
    console.log('📦 Datos del servidor:', data)

    // Actualizar el store directamente
    const { useInventoryStore } = await import('./stores')
    useInventoryStore.setState({ inventory: data })
    console.log('✅ Inventario cargado:', data.length, 'items')
    return data
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

console.log('🛠️ Utilidades de desarrollo:')
console.log('• clearAuth() - Limpiar autenticación y recargar')
console.log('• loadInventory() - Cargar inventario manualmente')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)