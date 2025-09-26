import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const LoginPage = ({ onLoginSuccess }) => {
  const { login, loading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  useEffect(() => {
    clearError()
  }, [clearError])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa todos los campos'
      })
      return
    }
    
    const result = await login(formData.email, formData.password)
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Bienvenido',
        text: 'Inicio de sesión exitoso',
        timer: 1500,
        showConfirmButton: false
      })
      onLoginSuccess('login', result.user)
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: result.error
      })
    }
  }
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) clearError()
  }
  
  const handleQuickLogin = (email, password) => {
    setFormData({ email, password })
    // Auto-submit the form after a short delay to show the credentials
    setTimeout(() => {
      const result = login(email, password)
      result.then(res => {
        if (res.success) {
          MySwal.fire({
            icon: 'success',
            title: 'Bienvenido',
            text: 'Inicio de sesión exitoso',
            timer: 1500,
            showConfirmButton: false
          })
          onLoginSuccess('login', res.user)
        }
      })
    }, 500)
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo Conchas de Abanico"
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 object-contain"
          />
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:mt-6 sm:text-3xl">
            {UI_TEXTS.auth.login}
          </h2>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">
            {UI_TEXTS.app.subtitle}
          </p>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="text-center">
            <h3 className="text-base font-medium text-gray-900 mb-2 sm:text-lg sm:mb-3">Acceso Rápido</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('maricultor1@conchas.com', 'password123')}
                className="w-full btn-secondary text-left flex items-center space-x-2 py-2 sm:space-x-3 sm:py-3"
                disabled={loading}
              >
                <img src="/logo.png" alt="Maricultor" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                <div className="flex-1">
                  <div className="text-sm font-medium sm:text-base">Maricultor 1</div>
                  <div className="text-xs text-gray-600 sm:text-sm">Juan - 12.5 hectáreas</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('inversor@example.com', 'password123')}
                className="w-full btn-secondary text-left flex items-center space-x-2 py-2 sm:space-x-3 sm:py-3"
                disabled={loading}
              >
                <div className="text-xl sm:text-2xl">💰</div>
                <div className="flex-1">
                  <div className="text-sm font-medium sm:text-base">Inversor</div>
                  <div className="text-xs text-gray-600 sm:text-sm">María Investidora - Lima</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-primary-50 to-secondary-50 text-gray-500">
                O ingresa manualmente
              </span>
            </div>
          </div>
        </div>
        
        <form className="mt-6 space-y-6 sm:mt-8" onSubmit={handleSubmit}>
          <div className="card">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXTS.auth.email}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXTS.auth.password}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" message="" />
                ) : (
                  UI_TEXTS.auth.login
                )}
              </button>
            </div>
          </div>
        </form>
        
        <div className="text-center space-y-4">
          <div>
            <p className="text-xs text-gray-600 mb-2 sm:text-sm">
              ¿No tienes cuenta?
            </p>
            <button
              onClick={() => onLoginSuccess('register')}
              className="text-primary-600 hover:text-primary-800 text-xs font-medium underline sm:text-sm"
            >
              Regístrate como maricultor
            </button>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 text-center">
              Usa los botones de acceso rápido arriba para probar el sistema
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="mt-2 w-full text-xs text-red-600 hover:text-red-800 underline"
            >
              🔄 Limpiar datos y reiniciar aplicación (Debug)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage