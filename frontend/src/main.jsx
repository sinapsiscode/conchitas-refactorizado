import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { MockDB } from './services/mock/db.js'
import { seedData } from './services/mock/seeder.js'

// Función global para resetear la base de datos mock
window.resetMockDB = () => {
  console.log('🔄 Resetting mock database...')
  MockDB.clearAll()
  seedData()
  console.log('✅ Mock database reset complete. Please refresh the page.')
  return 'Database reset. Please refresh the page to see changes.'
}

console.log('🛠️ Development utils available:')
console.log('• resetMockDB() - Reset the mock database')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)