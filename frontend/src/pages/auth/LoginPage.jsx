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
            alt="Logo MarApp"
            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 object-contain"
          />
          <h1 className="mt-2 text-3xl font-bold text-primary-600 sm:text-4xl">
            MarApp
          </h1>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:mt-6 sm:text-3xl">
            {UI_TEXTS.auth.login}
          </h2>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">
            {UI_TEXTS.app.subtitle}
          </p>
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
        
        <div className="text-center">
          <p className="text-xs text-gray-500 mt-4">
            Sistema de Gestión de Cultivo de Conchas de Abanico
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage