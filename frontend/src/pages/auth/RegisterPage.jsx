import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const RegisterPage = ({ onBackToLogin, onRegistrationSuccess }) => {
  const { register, loading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    totalHectares: '',
    role: 'investor'
  })
  
  useEffect(() => {
    clearError()
  }, [clearError])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      MySwal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: 'Por favor completa todos los campos obligatorios'
      })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      MySwal.fire({
        icon: 'error',
        title: 'Error de contraseña',
        text: 'Las contraseñas no coinciden'
      })
      return
    }
    
    if (formData.password.length < 6) {
      MySwal.fire({
        icon: 'error',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres'
      })
      return
    }
    
    const userData = {
      ...formData,
      totalHectares: 0
    }
    delete userData.confirmPassword
    
    const result = await register(userData)
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Tu cuenta ha sido registrada y está lista para usar.',
        timer: 3000,
        showConfirmButton: false
      })
      onRegistrationSuccess()
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error en el registro',
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 text-3xl sm:h-12 sm:w-12 sm:text-4xl">🐚</div>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900 sm:mt-6 sm:text-3xl">
            Registro de Inversor
          </h2>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">
            Completa tus datos para comenzar a invertir
          </p>
        </div>
        
        <form className="mt-6 space-y-6 sm:mt-8" onSubmit={handleSubmit}>
          <div className="card">
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                    Nombre *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Juan"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                    Apellido *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="input-field"
                    placeholder="Pérez"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                  {UI_TEXTS.auth.email} *
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
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                  {UI_TEXTS.auth.password} *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                  Confirmar Contraseña *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input-field"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                  Teléfono
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input-field"
                  placeholder="+51 999 999 999"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1 sm:text-sm">
                  Ubicación
                </label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  className="input-field"
                  placeholder="Ej: Piura-Sechura"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              
            </div>
            
            <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" message="" />
                ) : (
                  'Registrarse'
                )}
              </button>
              
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full btn-secondary"
                disabled={loading}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage