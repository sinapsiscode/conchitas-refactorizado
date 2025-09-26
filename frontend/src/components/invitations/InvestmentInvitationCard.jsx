import React, { useState } from 'react'
// import { mockAPI } from '../../services/mock/server' // DESACTIVADO - Migrado a JSON Server
import { UI_TEXTS } from '../../constants/ui'
// import { INVITATION_STATUSES } from '../../services/mock/schemas/investorInvitation' // DESACTIVADO - Migrado a JSON Server
import LoadingSpinner from '../common/LoadingSpinner'
import Swal from 'sweetalert2'

const InvestmentInvitationCard = ({ invitation, onResponse }) => {
  const [responding, setResponding] = useState(false)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseData, setResponseData] = useState({
    status: '',
    amount: invitation.invitedAmount || '',
    percentage: invitation.invitedPercentage || '',
    message: ''
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilExpiration = (expirationDate) => {
    const now = new Date()
    const expiration = new Date(expirationDate)
    const diffTime = expiration - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Expirada'
    if (diffDays === 0) return 'Expira hoy'
    if (diffDays === 1) return 'Expira mañana'
    return `Expira en ${diffDays} días`
  }

  const handleInitialResponse = (status) => {
    if (status === 'rejected') {
      // Para rechazar, permitir mensaje opcional
      setResponseData({ ...responseData, status })
      setShowResponseForm(true)
    } else if (status === 'accepted') {
      // Para aceptar, mostrar formulario completo
      setResponseData({ ...responseData, status })
      setShowResponseForm(true)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    
    if (responseData.status === 'accepted') {
      // Validar campos requeridos para aceptación
      if (!responseData.amount && !responseData.percentage) {
        Swal.fire({
          icon: 'warning',
          title: 'Datos Requeridos',
          text: 'Debes especificar al menos un monto o porcentaje de inversión',
          confirmButtonColor: '#f59e0b'
        })
        return
      }
    }

    setResponding(true)
    try {
      const response = {
        status: responseData.status,
        amount: responseData.amount ? parseFloat(responseData.amount) : null,
        percentage: responseData.percentage ? parseFloat(responseData.percentage) : null,
        message: responseData.message.trim()
      }

      // const result = await mockAPI.respondToInvestorInvitation(invitation.id, response) // TODO: Migrar a nuevo store con JSON Server
      
      if (result.success) {
        const statusText = responseData.status === 'accepted' 
          ? UI_TEXTS.investorInvitations.invitationAccepted
          : UI_TEXTS.investorInvitations.invitationRejected
        
        Swal.fire({
          icon: 'success',
          title: statusText,
          text: `Tu respuesta ha sido enviada al maricultor`,
          confirmButtonColor: '#3b82f6'
        })

        setShowResponseForm(false)
        
        // Notify parent component
        if (onResponse) {
          onResponse(result.data)
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo enviar la respuesta. Inténtalo de nuevo.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setResponding(false)
    }
  }

  const status = INVITATION_STATUSES[invitation.status] || INVITATION_STATUSES.pending
  const isPending = invitation.status === 'pending'
  const isExpired = new Date(invitation.expirationDate) < new Date()

  return (
    <div className={`card border-l-4 ${
      invitation.status === 'accepted' ? 'border-l-green-500' :
      invitation.status === 'rejected' ? 'border-l-red-500' :
      invitation.status === 'expired' ? 'border-l-gray-500' :
      'border-l-blue-500'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Invitación de {invitation.maricultorName || 'Maricultor'}
          </h3>
          <p className="text-sm text-gray-600">
            {UI_TEXTS.investorInvitations.invitedOn}: {formatDate(invitation.invitationDate)}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
          <span className="mr-1">{status.icon}</span>
          {status.label}
        </span>
      </div>

      {/* Project Details */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-blue-900 mb-3">
          {UI_TEXTS.investorInvitations.projectDetails}
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-blue-600 font-medium">{UI_TEXTS.investorInvitations.sectorLocation}:</span>
            <div className="text-blue-900">{invitation.sectorName || 'No especificado'}</div>
          </div>
          {invitation.invitedAmount && (
            <div>
              <span className="text-blue-600 font-medium">Monto Sugerido:</span>
              <div className="text-blue-900 font-semibold">{formatCurrency(invitation.invitedAmount)}</div>
            </div>
          )}
          {invitation.invitedPercentage && (
            <div>
              <span className="text-blue-600 font-medium">Participación Sugerida:</span>
              <div className="text-blue-900 font-semibold">{invitation.invitedPercentage}%</div>
            </div>
          )}
          <div>
            <span className="text-blue-600 font-medium">Estado:</span>
            <div className={`text-sm font-medium ${
              isPending && !isExpired ? 'text-orange-600' : 
              isExpired ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {isPending && !isExpired ? getDaysUntilExpiration(invitation.expirationDate) : status.label}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Message */}
      {invitation.message && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-1">Mensaje del Maricultor:</h5>
          <p className="text-sm text-gray-600 italic">"{invitation.message}"</p>
        </div>
      )}

      {/* Response Message (if already responded) */}
      {invitation.responseMessage && invitation.responseDate && (
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-1">
            Tu Respuesta ({formatDate(invitation.responseDate)}):
          </h5>
          <p className="text-sm text-gray-600 italic">"{invitation.responseMessage}"</p>
        </div>
      )}

      {/* Action Buttons */}
      {isPending && !isExpired && !showResponseForm && (
        <div className="flex gap-2">
          <button
            onClick={() => handleInitialResponse('accepted')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            {UI_TEXTS.investorInvitations.acceptInvitation}
          </button>
          <button
            onClick={() => handleInitialResponse('rejected')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {UI_TEXTS.investorInvitations.rejectInvitation}
          </button>
        </div>
      )}

      {/* Response Form */}
      {showResponseForm && (
        <form onSubmit={handleSubmitResponse} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">
            {responseData.status === 'accepted' ? 'Confirmar Aceptación' : 'Confirmar Rechazo'}
          </h4>

          {responseData.status === 'accepted' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXTS.investorInvitations.confirmAmount}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={responseData.amount}
                  onChange={(e) => setResponseData({
                    ...responseData, 
                    amount: e.target.value
                  })}
                  className="input-field"
                  placeholder="Monto a invertir en soles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {UI_TEXTS.investorInvitations.confirmPercentage}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={responseData.percentage}
                  onChange={(e) => setResponseData({
                    ...responseData, 
                    percentage: e.target.value
                  })}
                  className="input-field"
                  placeholder="Porcentaje de participación"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXTS.investorInvitations.responseMessage}
            </label>
            <textarea
              value={responseData.message}
              onChange={(e) => setResponseData({
                ...responseData, 
                message: e.target.value
              })}
              className="input-field"
              rows="3"
              placeholder={
                responseData.status === 'accepted' 
                  ? "Mensaje opcional de confirmación..."
                  : "Mensaje opcional explicando el rechazo..."
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={responding}
              className={`flex-1 px-4 py-2 rounded-md text-white ${
                responseData.status === 'accepted' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {responding ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                responseData.status === 'accepted' ? 'Confirmar Aceptación' : 'Confirmar Rechazo'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowResponseForm(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {UI_TEXTS.common.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Expired Message */}
      {isPending && isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Esta invitación expiró el {formatDate(invitation.expirationDate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestmentInvitationCard