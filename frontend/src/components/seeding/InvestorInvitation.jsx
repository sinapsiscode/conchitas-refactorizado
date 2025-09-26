import React, { useState } from 'react'
// import { mockAPI } from '../../services/mock/server' // DESACTIVADO - usar JSON Server personalizado
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../common/LoadingSpinner'
import Swal from 'sweetalert2'

const InvestorInvitation = ({ seedingData, onInvitationSent, skipActualSending = false }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  const [invitationData, setInvitationData] = useState({
    invitedAmount: '',
    invitedPercentage: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setSearching(true)
    try {
      const result = await mockAPI.searchInvestor(searchTerm.trim())
      setSearchResults(result.data)
      
      if (result.data.found) {
        setSelectedInvestor(result.data.investor)
      } else {
        setSelectedInvestor(null)
      }
    } catch (error) {
      console.error('Error searching investor:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error de Búsqueda',
        text: 'No se pudo realizar la búsqueda. Inténtalo de nuevo.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSearching(false)
    }
  }

  const handleSendInvitation = async (e) => {
    e.preventDefault()
    
    if (!selectedInvestor) {
      Swal.fire({
        icon: 'warning',
        title: 'Inversor Requerido',
        text: 'Debes buscar y seleccionar un inversor primero',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    // Validar que al menos uno de los campos esté lleno
    if (!invitationData.invitedAmount && !invitationData.invitedPercentage) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Debes especificar al menos un monto sugerido o porcentaje de participación',
        confirmButtonColor: '#f59e0b'
      })
      return
    }

    setSending(true)
    try {
      if (skipActualSending) {
        // Solo preparar los datos y llamar al callback
        const invitationPayload = {
          investorId: selectedInvestor.id,
          investorEmail: selectedInvestor.email,
          investorName: selectedInvestor.name,
          invitedAmount: invitationData.invitedAmount ? parseFloat(invitationData.invitedAmount) : null,
          invitedPercentage: invitationData.invitedPercentage ? parseFloat(invitationData.invitedPercentage) : null,
          message: invitationData.message.trim()
        }

        Swal.fire({
          icon: 'info',
          title: 'Invitación preparada',
          text: `La invitación para ${selectedInvestor.name} se enviará cuando se complete la siembra.`,
          confirmButtonColor: '#3b82f6'
        })

        // Reset form
        setSearchTerm('')
        setSearchResults(null)
        setSelectedInvestor(null)
        setInvitationData({
          invitedAmount: '',
          invitedPercentage: '',
          message: ''
        })

        // Notify parent component with the prepared data
        if (onInvitationSent) {
          onInvitationSent(invitationPayload)
        }
      } else {
        // Flujo normal: enviar inmediatamente
        const invitationPayload = {
          seedingId: seedingData.id,
          maricultorId: seedingData.userId,
          maricultorName: seedingData.maricultorName,
          investorId: selectedInvestor.id,
          investorEmail: selectedInvestor.email,
          investorName: selectedInvestor.name,
          sectorName: seedingData.sectorName,
          invitedAmount: invitationData.invitedAmount ? parseFloat(invitationData.invitedAmount) : null,
          invitedPercentage: invitationData.invitedPercentage ? parseFloat(invitationData.invitedPercentage) : null,
          message: invitationData.message.trim()
        }

        const result = await mockAPI.createInvestorInvitation(invitationPayload)
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: UI_TEXTS.investorInvitations.invitationSent,
            text: UI_TEXTS.investorInvitations.invitationSentMessage,
            confirmButtonColor: '#3b82f6'
          })

          // Reset form
          setSearchTerm('')
          setSearchResults(null)
          setSelectedInvestor(null)
          setInvitationData({
            invitedAmount: '',
            invitedPercentage: '',
            message: ''
          })

          // Notify parent component
          if (onInvitationSent) {
            onInvitationSent(result.data)
          }
        }
      }
    } catch (error) {
      console.error('Error processing invitation:', error)
      Swal.fire({
        icon: 'error',
        title: UI_TEXTS.investorInvitations.invitationError,
        text: error.message || 'No se pudo procesar la invitación. Inténtalo de nuevo.',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSending(false)
    }
  }

  const resetSearch = () => {
    setSearchTerm('')
    setSearchResults(null)
    setSelectedInvestor(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {UI_TEXTS.investorInvitations.title}
        </h3>
        <div className="text-sm text-gray-500">
          Opcional
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXTS.investorInvitations.searchInvestor}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 input-field"
                placeholder={UI_TEXTS.investorInvitations.searchPlaceholder}
              />
              <button
                type="submit"
                disabled={searching || !searchTerm.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? <LoadingSpinner size="sm" message="" /> : '🔍'}
              </button>
              {searchResults && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-3">
              {searchResults.found ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">
                        {UI_TEXTS.investorInvitations.investorFound}
                      </h4>
                      <div className="mt-1 text-sm text-green-700">
                        <strong>{selectedInvestor.name}</strong> ({selectedInvestor.email})
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        {UI_TEXTS.investorInvitations.investorNotFound}
                      </h4>
                      <div className="mt-1 text-sm text-yellow-700">
                        {UI_TEXTS.investorInvitations.createAccount}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Invitation Details */}
      {selectedInvestor && (
        <form onSubmit={handleSendInvitation} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900">
            Detalles de la Invitación para {selectedInvestor.name}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXTS.investorInvitations.inviteAmount}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={invitationData.invitedAmount}
                onChange={(e) => setInvitationData({
                  ...invitationData, 
                  invitedAmount: e.target.value
                })}
                className="input-field"
                placeholder="Ej: 25000.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto sugerido en soles peruanos
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {UI_TEXTS.investorInvitations.invitePercentage}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={invitationData.invitedPercentage}
                onChange={(e) => setInvitationData({
                  ...invitationData, 
                  invitedPercentage: e.target.value
                })}
                className="input-field"
                placeholder="Ej: 25.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje de participación sugerido
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {UI_TEXTS.investorInvitations.personalMessage}
            </label>
            <textarea
              value={invitationData.message}
              onChange={(e) => setInvitationData({
                ...invitationData, 
                message: e.target.value
              })}
              className="input-field"
              rows="3"
              placeholder="Mensaje personalizado para el inversor..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {sending ? (
                <LoadingSpinner size="sm" message="" />
              ) : (
                UI_TEXTS.investorInvitations.sendInvitation
              )}
            </button>
            <button
              type="button"
              onClick={() => setSelectedInvestor(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {UI_TEXTS.common.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Project Details Summary */}
      {seedingData && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            {UI_TEXTS.investorInvitations.projectDetails}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{UI_TEXTS.investorInvitations.sectorLocation}:</span>
              <div className="font-medium">{seedingData.sectorName}</div>
            </div>
            <div>
              <span className="text-gray-600">{UI_TEXTS.investorInvitations.seedingDate}:</span>
              <div className="font-medium">
                {new Date(seedingData.entryDate).toLocaleDateString('es-PE')}
              </div>
            </div>
            <div>
              <span className="text-gray-600">{UI_TEXTS.investorInvitations.projectedHarvest}:</span>
              <div className="font-medium">
                {seedingData.projectedHarvestDate 
                  ? new Date(seedingData.projectedHarvestDate).toLocaleDateString('es-PE')
                  : 'No especificada'
                }
              </div>
            </div>
            <div>
              <span className="text-gray-600">{UI_TEXTS.investorInvitations.totalInvestment}:</span>
              <div className="font-medium">
                {new Intl.NumberFormat('es-PE', {
                  style: 'currency',
                  currency: 'PEN'
                }).format(seedingData.cost || 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestorInvitation