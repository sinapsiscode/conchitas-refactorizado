import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { mockAPI } from '../../services/mock/server'
import { UI_TEXTS } from '../../constants/ui'
import InvestmentInvitationCard from './InvestmentInvitationCard'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

const InvestorInvitationsList = () => {
  const { user } = useAuthStore()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, responded

  useEffect(() => {
    if (user?.id) {
      fetchInvitations()
    }
  }, [user?.id])

  const fetchInvitations = async () => {
    setLoading(true)
    try {
      const result = await mockAPI.getInvestorInvitations(user.id, 'investor')
      if (result.success) {
        setInvitations(result.data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationResponse = (updatedInvitation) => {
    // Update the invitation in the list
    setInvitations(prev => 
      prev.map(inv => 
        inv.id === updatedInvitation.id ? updatedInvitation : inv
      )
    )
  }

  const getFilteredInvitations = () => {
    switch (filter) {
      case 'pending':
        return invitations.filter(inv => inv.status === 'pending' && new Date(inv.expirationDate) >= new Date())
      case 'responded':
        return invitations.filter(inv => ['accepted', 'rejected', 'expired'].includes(inv.status))
      default:
        return invitations
    }
  }

  const filteredInvitations = getFilteredInvitations()
  const pendingCount = invitations.filter(inv => inv.status === 'pending' && new Date(inv.expirationDate) >= new Date()).length

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <LoadingSpinner size="lg" message="Cargando invitaciones..." />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {UI_TEXTS.investorInvitations.title}
          </h2>
          <p className="text-gray-600 mt-1">
            Invitaciones para participar en proyectos de maricultura
          </p>
          {pendingCount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                {pendingCount} invitación{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas ({invitations.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors w-full sm:w-auto ${
              filter === 'responded'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Respondidas ({invitations.length - pendingCount})
          </button>
        </div>
      </div>

      {/* Invitations List */}
      {filteredInvitations.length === 0 ? (
        <EmptyState
          title={
            filter === 'pending' 
              ? UI_TEXTS.investorInvitations.noInvitations
              : filter === 'responded'
                ? 'No hay invitaciones respondidas'
                : UI_TEXTS.investorInvitations.noInvitations
          }
          message={
            filter === 'pending'
              ? 'No tienes invitaciones de inversión pendientes en este momento.'
              : filter === 'responded'
                ? 'Aún no has respondido a ninguna invitación.'
                : 'Los maricultores pueden invitarte a participar en sus proyectos. Las invitaciones aparecerán aquí.'
          }
          icon={filter === 'pending' ? '⏳' : filter === 'responded' ? '✅' : '📬'}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredInvitations.map((invitation) => (
            <InvestmentInvitationCard
              key={invitation.id}
              invitation={invitation}
              onResponse={handleInvitationResponse}
            />
          ))}
        </div>
      )}

      {/* Help Section */}
      <div className="card bg-blue-50">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ¿Cómo funcionan las invitaciones?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Los maricultores pueden invitarte a invertir en sus proyectos de cultivo de conchas de abanico</li>
                <li>Las invitaciones incluyen detalles del proyecto, monto sugerido y porcentaje de participación</li>
                <li>Tienes 7 días para responder a cada invitación antes de que expire</li>
                <li>Al aceptar, puedes ajustar el monto y porcentaje según tu interés</li>
                <li>Tu inversión se registra automáticamente al aceptar la invitación</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestorInvitationsList