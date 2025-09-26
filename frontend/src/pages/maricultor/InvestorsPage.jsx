import React, { useEffect, useState } from 'react'
import { useAuthStore, useInvestmentStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatCard from '../../components/common/StatCard'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import axios from 'axios'

const MySwal = withReactContent(Swal)
const API_URL = 'http://localhost:4077'

const InvestorsPage = () => {
  const { user } = useAuthStore()
  const {
    investments,
    loading,
    fetchInvestments,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    getInvestmentSummary
  } = useInvestmentStore()
  const [investors, setInvestors] = useState([])
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  useEffect(() => {
    // Cuando las inversiones cambian, actualizar la lista de inversores
    processInvestors()
  }, [investments])

  const loadData = async () => {
    console.log('📊 [InvestorsPage] Loading data for user:', user.id)

    // Cargar inversiones
    const investmentsResult = await fetchInvestments(user.id)
    if (investmentsResult.success) {
      console.log('✅ [InvestorsPage] Investments loaded:', investmentsResult.data.length)
    }

    // Cargar usuarios para mapear nombres
    try {
      const response = await axios.get(`${API_URL}/users`)
      setAllUsers(response.data)
      console.log('✅ [InvestorsPage] Users loaded:', response.data.length)
    } catch (error) {
      console.error('❌ [InvestorsPage] Error loading users:', error)
    }
  }

  const processInvestors = () => {
    // Agrupar inversiones por inversor y calcular totales
    const investorMap = {}

    investments.forEach(investment => {
      const investorId = investment.investorId || investment.userId

      if (!investorId) return

      if (!investorMap[investorId]) {
        const investorUser = allUsers.find(u => u.id === investorId)

        investorMap[investorId] = {
          id: investorId,
          email: investorUser?.email || investment.investorEmail || `investor${investorId}@example.com`,
          firstName: investorUser?.firstName || investment.investorName?.split(' ')[0] || 'Inversor',
          lastName: investorUser?.lastName || investment.investorName?.split(' ')[1] || investorId,
          phone: investorUser?.phone || investment.investorPhone || 'N/A',
          location: investorUser?.location || investment.investorLocation || 'N/A',
          totalInvestment: 0,
          activeInvestments: 0,
          status: 'active',
          joinedDate: investment.createdAt || new Date().toISOString()
        }
      }

      investorMap[investorId].totalInvestment += investment.amount || 0
      if (investment.status === 'active') {
        investorMap[investorId].activeInvestments += 1
      }
    })

    const investorsList = Object.values(investorMap)
    console.log('📊 [InvestorsPage] Processed investors:', investorsList.length)
    setInvestors(investorsList)
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
              <input id="investor-first-name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input id="investor-last-name" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input id="investor-email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <input id="investor-password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input id="investor-phone" type="tel" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Monto Inicial de Inversión
            </label>
            <input id="investor-amount" type="number" step="100" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0.00">
          </div>
        </div>
      `,
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
        const amount = parseFloat(document.getElementById('investor-amount').value) || 0

        if (!firstName || !lastName || !email || !password) {
          Swal.showValidationMessage('Por favor complete todos los campos requeridos')
          return false
        }

        if (password.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres')
          return false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage('Por favor ingrese un email válido')
          return false
        }

        return { firstName, lastName, email, password, phone, amount }
      }
    })

    if (formValues) {
      try {
        // Verificar si el email ya existe
        const { data: existingUsers } = await axios.get(`${API_URL}/users?email=${formValues.email}`)

        if (existingUsers.length > 0) {
          MySwal.fire({
            icon: 'error',
            title: 'Email ya existe',
            text: 'Ya existe un usuario con este email'
          })
          return
        }

        // Crear el usuario inversor
        const newInvestor = await axios.post(`${API_URL}/users`, {
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          password: formValues.password,
          phone: formValues.phone || '',
          role: 'investor',
          status: 'approved',
          location: 'N/A',
          totalHectares: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        console.log('✅ [InvestorsPage] Investor created:', newInvestor.data)

        // Si hay un monto inicial, crear la inversión
        if (formValues.amount > 0) {
          const investmentResult = await createInvestment({
            investorId: newInvestor.data.id,
            userId: user.id,
            amount: formValues.amount,
            status: 'active',
            description: `Inversión inicial de ${formValues.firstName} ${formValues.lastName}`,
            investorEmail: formValues.email,
            investorName: `${formValues.firstName} ${formValues.lastName}`
          })

          if (investmentResult.success) {
            console.log('✅ [InvestorsPage] Initial investment created')
          }
        }

        // Recargar datos
        await loadData()

        MySwal.fire({
          icon: 'success',
          title: '¡Inversor creado!',
          text: `Se ha creado el inversor ${formValues.firstName} ${formValues.lastName} exitosamente${formValues.amount > 0 ? ' con una inversión inicial de ' + formatCurrency(formValues.amount) : ''}.`
        })
      } catch (error) {
        console.error('❌ [InvestorsPage] Error creating investor:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear el inversor. Por favor intente nuevamente.'
        })
      }
    }
  }

  const handleAddInvestment = async (investor) => {
    const { value: amount } = await MySwal.fire({
      title: `Agregar Inversión para ${investor.firstName} ${investor.lastName}`,
      input: 'number',
      inputLabel: 'Monto de inversión (S/)',
      inputPlaceholder: 'Ingrese el monto',
      inputAttributes: {
        step: '100',
        min: '0'
      },
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) {
          return 'Por favor ingrese un monto válido'
        }
      }
    })

    if (amount) {
      try {
        const result = await createInvestment({
          investorId: investor.id,
          userId: user.id,
          amount: parseFloat(amount),
          status: 'active',
          description: `Nueva inversión de ${investor.firstName} ${investor.lastName}`,
          investorEmail: investor.email,
          investorName: `${investor.firstName} ${investor.lastName}`
        })

        if (result.success) {
          await loadData()
          MySwal.fire({
            icon: 'success',
            title: 'Inversión agregada',
            text: `Se ha agregado una inversión de ${formatCurrency(amount)} para ${investor.firstName} ${investor.lastName}`
          })
        }
      } catch (error) {
        console.error('❌ [InvestorsPage] Error adding investment:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo agregar la inversión'
        })
      }
    }
  }

  const handleDeleteInvestor = async (investor) => {
    const result = await MySwal.fire({
      title: '¿Eliminar Inversor?',
      text: `¿Está seguro de eliminar a ${investor.firstName} ${investor.lastName}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        // Eliminar todas las inversiones del inversor
        const investorInvestments = investments.filter(inv => inv.investorId === investor.id)

        for (const investment of investorInvestments) {
          await deleteInvestment(investment.id)
        }

        // Eliminar el usuario inversor
        await axios.delete(`${API_URL}/users/${investor.id}`)

        await loadData()

        MySwal.fire(
          '¡Eliminado!',
          `El inversor ${investor.firstName} ${investor.lastName} ha sido eliminado.`,
          'success'
        )
      } catch (error) {
        console.error('❌ [InvestorsPage] Error deleting investor:', error)
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el inversor'
        })
      }
    }
  }

  const summary = getInvestmentSummary()

  if (loading) {
    return <LoadingSpinner fullScreen={true} />
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {UI_TEXTS.investments.title}
        </h1>
        <p className="text-gray-600">
          Gestiona tus inversores y sus participaciones
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Inversores"
          value={investors.length}
          icon="👥"
          color="bg-blue-500"
        />
        <StatCard
          title="Inversión Total"
          value={formatCurrency(summary.totalInvested)}
          icon="💰"
          color="bg-green-500"
        />
        <StatCard
          title="Inversiones Activas"
          value={summary.activeCount}
          icon="📈"
          color="bg-purple-500"
        />
        <StatCard
          title="ROI Promedio"
          value={`${summary.averageROI.toFixed(1)}%`}
          icon="📊"
          color="bg-orange-500"
        />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Lista de Inversores
          </h2>
          <button
            onClick={handleCreateInvestor}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Agregar Inversor
          </button>
        </div>
      </div>

      {/* Investors List */}
      {investors.length === 0 ? (
        <EmptyState
          message="No hay inversores registrados"
          description="Agrega tu primer inversor para comenzar a gestionar las inversiones"
          actionText="Agregar Inversor"
          onAction={handleCreateInvestor}
        />
      ) : (
        <div className="grid gap-6">
          {investors.map(investor => (
            <div key={investor.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {investor.firstName} {investor.lastName}
                  </h3>
                  <p className="text-gray-600">{investor.email}</p>
                  <p className="text-sm text-gray-500">
                    Miembro desde: {formatDate(investor.joinedDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddInvestment(investor)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    + Inversión
                  </button>
                  <button
                    onClick={() => handleDeleteInvestor(investor)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Inversión Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(investor.totalInvestment)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Inversiones Activas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {investor.activeInvestments}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Estado</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    investor.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {investor.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {investor.phone !== 'N/A' && (
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span>📞 {investor.phone}</span>
                  {investor.location !== 'N/A' && (
                    <span>📍 {investor.location}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InvestorsPage