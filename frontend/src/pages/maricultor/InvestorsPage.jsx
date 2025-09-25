import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatCard from '../../components/common/StatCard'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const InvestorsPage = () => {
  const { user } = useAuthStore()
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvestors()
    
    // Debug: Log existing users on component mount
    const debugUsers = () => {
      const users1 = JSON.parse(localStorage.getItem('conchas-abanico:users') || '[]')
      const users2 = JSON.parse(localStorage.getItem('mock_users') || '[]')
      console.log('🔍 [InvestorsPage] Debug - Users in conchas-abanico:users:', users1.length, users1.map(u => ({ email: u.email, role: u.role })))
      console.log('🔍 [InvestorsPage] Debug - Users in mock_users:', users2.length, users2.map(u => ({ email: u.email, role: u.role })))
    }
    debugUsers()
  }, [user?.id])

  const fetchInvestors = async () => {
    if (!user?.id) {
      console.log('🔍 [InvestorsPage] fetchInvestors: No user ID available')
      return
    }
    
    console.log('🔍 [InvestorsPage] fetchInvestors: Starting fetch for maricultor:', user.id)
    setLoading(true)
    try {
      // Get all users that are investors associated with this maricultor
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
      console.log('🔍 [InvestorsPage] fetchInvestors: Total users in localStorage:', users.length)
      console.log('🔍 [InvestorsPage] fetchInvestors: All users:', users.map(u => ({ id: u.id, email: u.email, role: u.role, maricultorId: u.maricultorId })))
      
      const maricultorInvestors = users.filter(u => 
        u.role === 'investor' && u.maricultorId === user.id
      )
      console.log('🔍 [InvestorsPage] fetchInvestors: Found investors for this maricultor:', maricultorInvestors.length)
      console.log('🔍 [InvestorsPage] fetchInvestors: Investors details:', maricultorInvestors)
      
      setInvestors(maricultorInvestors)
    } catch (error) {
      console.error('❌ [InvestorsPage] Error al cargar inversores:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const handleCreateInvestor = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Crear Nuevo Inversor',
      html: `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input type="text" id="investor-first-name" class="swal2-input" placeholder="Juan" style="margin: 0;">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input type="text" id="investor-last-name" class="swal2-input" placeholder="Pérez" style="margin: 0;">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input type="email" id="investor-email" class="swal2-input" placeholder="inversor@email.com" style="margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Temporal *
            </label>
            <input type="password" id="investor-password" class="swal2-input" placeholder="Mínimo 6 caracteres" style="margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input type="tel" id="investor-phone" class="swal2-input" placeholder="+51 999 999 999" style="margin: 0;">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear Inversor',
      cancelButtonText: UI_TEXTS.common.cancel,
      width: '600px',
      customClass: {
        htmlContainer: 'text-left'
      },
      preConfirm: () => {
        const firstName = document.getElementById('investor-first-name').value
        const lastName = document.getElementById('investor-last-name').value
        const email = document.getElementById('investor-email').value
        const password = document.getElementById('investor-password').value
        const phone = document.getElementById('investor-phone').value

        if (!firstName || !lastName || !email || !password) {
          Swal.showValidationMessage('Por favor complete todos los campos requeridos')
          return false
        }

        if (password.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres')
          return false
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Por favor ingrese un email válido')
          return false
        }

        return { firstName, lastName, email, password, phone }
      }
    })

    if (formValues) {
      console.log('🔍 [InvestorsPage] handleCreateInvestor: Starting creation process with values:', formValues)
      console.log('🔍 [InvestorsPage] handleCreateInvestor: Current user:', { id: user.id, email: user.email, role: user.role })
      
      try {
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        console.log('🔍 [InvestorsPage] handleCreateInvestor: Checking against existing users:', users.length)
        
        const existingUser = users.find(u => u.email === formValues.email)
        
        if (existingUser) {
          console.log('❌ [InvestorsPage] handleCreateInvestor: Email already exists:', existingUser)
          MySwal.fire({
            icon: 'error',
            title: 'Email ya existe',
            text: 'Ya existe un usuario con este email'
          })
          return
        }

        // Create investor user data
        const investorData = {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          password: formValues.password,
          phone: formValues.phone || '',
          role: 'investor',
          maricultorId: user.id,
          status: 'approved'
        }
        console.log('🔍 [InvestorsPage] handleCreateInvestor: Investor data to be sent:', investorData)

        // Register the new investor using MockAPI
        const { MockAPI } = await import('../../services/mock/server')
        console.log('🔍 [InvestorsPage] handleCreateInvestor: Calling MockAPI.register')
        
        let registerResult
        try {
          registerResult = await MockAPI.register(investorData)
          console.log('🔍 [InvestorsPage] handleCreateInvestor: MockAPI register result:', registerResult)
        } catch (apiError) {
          console.error('❌ [InvestorsPage] handleCreateInvestor: MockAPI threw error:', apiError)
          
          // Handle the case where MockAPI throws an error response
          if (apiError.success === false) {
            MySwal.fire({
              icon: 'error',
              title: 'Error al crear usuario',
              text: apiError.message || 'No se pudo crear el inversor'
            })
            return
          } else {
            // Re-throw if it's not our expected error format
            throw apiError
          }
        }
        
        if (!registerResult.success) {
          console.error('❌ [InvestorsPage] handleCreateInvestor: Registration failed:', registerResult)
          MySwal.fire({
            icon: 'error',
            title: 'Error al crear usuario',
            text: registerResult.message || 'No se pudo crear el inversor'
          })
          return
        }

        console.log('✅ [InvestorsPage] handleCreateInvestor: Registration successful, created user:', registerResult.data)

        // Check localStorage after creation
        const usersAfterCreation = JSON.parse(localStorage.getItem('mock_users') || '[]')
        console.log('🔍 [InvestorsPage] handleCreateInvestor: Users in localStorage after creation:', usersAfterCreation.length)
        console.log('🔍 [InvestorsPage] handleCreateInvestor: New user in localStorage?', 
          usersAfterCreation.find(u => u.email === formValues.email))

        MySwal.fire({
          icon: 'success',
          title: 'Éxito',
          html: `
            <p>Inversor creado exitosamente:</p>
            <div class="mt-2 p-3 bg-gray-50 rounded text-left">
              <strong>${formValues.firstName} ${formValues.lastName}</strong><br>
              Email: ${formValues.email}<br>
              Estado: Aprobado
            </div>
            <p class="mt-2 text-sm text-gray-600">El inversor puede acceder al sistema con su email y contraseña.</p>
          `,
          timer: 5000,
          showConfirmButton: true
        })
        
        console.log('🔍 [InvestorsPage] handleCreateInvestor: About to refresh investors list')
        // Refresh investors list
        await fetchInvestors()
        console.log('🔍 [InvestorsPage] handleCreateInvestor: Investors list refreshed')
        
      } catch (error) {
        console.error('❌ [InvestorsPage] handleCreateInvestor: Caught error:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear el inversor: ' + error.message
        })
      }
    }
  }

  const handleEditInvestor = async (investor) => {
    const { value: formValues } = await MySwal.fire({
      title: 'Editar Inversor',
      html: `
        <div class="space-y-4 text-left">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input type="text" id="edit-investor-first-name" class="swal2-input" value="${investor.firstName || ''}" placeholder="Juan" style="margin: 0;">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input type="text" id="edit-investor-last-name" class="swal2-input" value="${investor.lastName || ''}" placeholder="Pérez" style="margin: 0;">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input type="email" id="edit-investor-email" class="swal2-input" value="${investor.email || ''}" placeholder="inversor@email.com" style="margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña (opcional)
            </label>
            <input type="password" id="edit-investor-password" class="swal2-input" placeholder="Dejar en blanco para mantener la actual" style="margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input type="tel" id="edit-investor-phone" class="swal2-input" value="${investor.phone || ''}" placeholder="+51 999 999 999" style="margin: 0;">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Actualizar Inversor',
      cancelButtonText: UI_TEXTS.common.cancel,
      width: '600px',
      customClass: {
        htmlContainer: 'text-left'
      },
      preConfirm: () => {
        const firstName = document.getElementById('edit-investor-first-name').value
        const lastName = document.getElementById('edit-investor-last-name').value
        const email = document.getElementById('edit-investor-email').value
        const password = document.getElementById('edit-investor-password').value
        const phone = document.getElementById('edit-investor-phone').value

        if (!firstName || !lastName || !email) {
          Swal.showValidationMessage('Por favor complete todos los campos requeridos')
          return false
        }

        // If password is provided, validate it
        if (password && password.length < 6) {
          Swal.showValidationMessage('La nueva contraseña debe tener al menos 6 caracteres')
          return false
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Por favor ingrese un email válido')
          return false
        }

        return { firstName, lastName, email, password, phone }
      }
    })

    if (formValues) {
      try {
        // Check if email already exists (excluding current investor)
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const existingUser = users.find(u => u.email === formValues.email && u.id !== investor.id)

        if (existingUser) {
          MySwal.fire({
            icon: 'error',
            title: 'Email ya existe',
            text: 'Ya existe otro usuario con este email'
          })
          return
        }

        // Update investor in localStorage
        const updatedUsers = users.map(u => {
          if (u.id === investor.id) {
            const updatedInvestor = {
              ...u,
              firstName: formValues.firstName,
              lastName: formValues.lastName,
              email: formValues.email,
              phone: formValues.phone,
              updatedAt: new Date().toISOString()
            }

            // Only update password if a new one was provided
            if (formValues.password) {
              updatedInvestor.password = formValues.password
            }

            return updatedInvestor
          }
          return u
        })

        localStorage.setItem('mock_users', JSON.stringify(updatedUsers))

        MySwal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'El inversor ha sido actualizado exitosamente',
          timer: 2000,
          showConfirmButton: false
        })

        // Refresh investors list
        fetchInvestors()
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar el inversor: ' + error.message
        })
      }
    }
  }

  const handleDeleteInvestor = async (investorId, investorName) => {
    const result = await MySwal.fire({
      title: '¿Eliminar Inversor?',
      html: `
        <p>¿Estás seguro de que deseas eliminar a <strong>${investorName}</strong>?</p>
        <p class="text-sm text-gray-600 mt-2">Esta acción no se puede deshacer.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: UI_TEXTS.common.delete,
      cancelButtonText: UI_TEXTS.common.cancel
    })

    if (result.isConfirmed) {
      try {
        // Remove investor from localStorage
        const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
        const updatedUsers = users.filter(u => u.id !== investorId)
        localStorage.setItem('mock_users', JSON.stringify(updatedUsers))

        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El inversor ha sido eliminado exitosamente',
          timer: 2000,
          showConfirmButton: false
        })

        // Refresh investors list
        fetchInvestors()
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: UI_TEXTS.common.error,
          text: 'Error al eliminar el inversor: ' + error.message
        })
      }
    }
  }

  // Debug function to clear duplicate users
  const clearDuplicateUsers = () => {
    const users1 = JSON.parse(localStorage.getItem('conchas-abanico:users') || '[]')
    const users2 = JSON.parse(localStorage.getItem('mock_users') || '[]')
    
    console.log('🔍 [InvestorsPage] Before cleanup:')
    console.log('  - conchas-abanico:users:', users1.length)
    console.log('  - mock_users:', users2.length)
    
    // Remove all investors from both storage locations
    const cleanedUsers1 = users1.filter(u => u.role !== 'investor')
    const cleanedUsers2 = users2.filter(u => u.role !== 'investor')
    
    localStorage.setItem('conchas-abanico:users', JSON.stringify(cleanedUsers1))
    localStorage.setItem('mock_users', JSON.stringify(cleanedUsers2))
    
    console.log('✅ [InvestorsPage] After cleanup:')
    console.log('  - conchas-abanico:users:', cleanedUsers1.length)
    console.log('  - mock_users:', cleanedUsers2.length)
    
    // Refresh the investors list
    fetchInvestors()
    
    MySwal.fire({
      icon: 'success',
      title: 'Limpieza completada',
      text: 'Se eliminaron todos los inversores duplicados',
      timer: 2000
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', label: 'Aprobado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazado' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando inversores..." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Inversores</h1>
          <p className="text-gray-600 mt-1">
            Administra los inversores asociados a tu operación
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearDuplicateUsers}
            className="btn-secondary flex items-center text-sm"
            title="Limpiar inversores duplicados (Debug)"
          >
            🧹 Limpiar DB
          </button>
          <button
            onClick={handleCreateInvestor}
            className="btn-primary flex items-center"
          >
            <span className="mr-2">👥</span>
            Crear Inversor
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Inversores"
          value={investors.length}
          subtitle="Registrados en el sistema"
          icon="👥"
          color="primary"
        />
        
        <StatCard
          title="Inversores Activos"
          value={investors.filter(inv => inv.status === 'approved').length}
          subtitle="Con estado aprobado"
          icon="✅"
          color="green"
        />
        
        <StatCard
          title="Registros Recientes"
          value={investors.filter(inv => {
            const created = new Date(inv.createdAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return created >= weekAgo
          }).length}
          subtitle="Últimos 7 días"
          icon="📅"
          color="blue"
        />
      </div>

      {/* Investors Table */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inversores Registrados</h2>
          <p className="text-sm text-gray-600">
            Lista de todos los inversores asociados a tu operación
          </p>
        </div>

        {investors.length === 0 ? (
          <EmptyState
            title="No hay inversores registrados"
            message="Comienza creando tu primer inversor haciendo clic en el botón 'Crear Inversor'"
            icon="👥"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inversor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investors.map((investor) => (
                  <tr key={investor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {investor.firstName?.charAt(0)}{investor.lastName?.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {investor.firstName} {investor.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {investor.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{investor.email}</div>
                      {investor.phone && (
                        <div className="text-sm text-gray-500">{investor.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(investor.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {formatDate(investor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditInvestor(investor)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteInvestor(investor.id, `${investor.firstName} ${investor.lastName}`)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {UI_TEXTS.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvestorsPage