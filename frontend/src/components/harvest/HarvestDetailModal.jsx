import React from 'react'
import Modal from '../common/Modal'

const HarvestDetailModal = ({ isOpen, onClose, harvestPlan, sector, pricing }) => {
  if (!isOpen || !harvestPlan) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const calculateEstimatedRevenue = (plan) => {
    if (!plan.sizeDistribution || !pricing.length) return 0
    
    let total = 0
    Object.entries(plan.sizeDistribution).forEach(([size, quantity]) => {
      const price = pricing.find(p => p.sizeCategory === size && p.isActive)
      if (price && quantity) {
        total += quantity * price.pricePerUnit
      }
    })
    
    return total
  }

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.planned
  }

  const getStatusText = (status) => {
    const texts = {
      planned: 'Planificado',
      in_progress: 'En Progreso',
      completed: 'Completado',
      cancelled: 'Cancelado'
    }
    return texts[status] || status
  }

  const revenue = calculateEstimatedRevenue(harvestPlan)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎣 Detalle de Cosecha"
      subtitle={`${sector?.name} - ${new Date(harvestPlan.plannedDate).toLocaleDateString('es-PE')}`}
      size="lg"
    >
      <Modal.Content>
        <div className="space-y-6">
          {/* Estado y fechas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">📅 Información General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <span className={`inline-flex px-2 py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(harvestPlan.status)}`}>
                  {getStatusText(harvestPlan.status)}
                </span>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <p className="text-xs sm:text-sm text-gray-900">{sector?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha Planificada
                </label>
                <p className="text-xs sm:text-sm text-gray-900">
                  {new Date(harvestPlan.plannedDate).toLocaleDateString('es-PE')}
                </p>
              </div>
              {harvestPlan.actualDate && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Fecha Real
                  </label>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {new Date(harvestPlan.actualDate).toLocaleDateString('es-PE')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cantidades */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🐚 Cantidades</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-2">Cantidad Estimada</h4>
                <p className="text-xl sm:text-2xl font-bold text-blue-800">
                  {harvestPlan.estimatedQuantity?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-blue-600">mallas planificadas</p>
              </div>
              {harvestPlan.actualQuantity && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-green-900 mb-2">Cantidad Real</h4>
                  <p className="text-xl sm:text-2xl font-bold text-green-800">
                    {harvestPlan.actualQuantity?.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">mallas cosechadas</p>
                </div>
              )}
              {harvestPlan.manojos && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-purple-900 mb-2">Manojos Producidos</h4>
                  <p className="text-xl sm:text-2xl font-bold text-purple-800">
                    {harvestPlan.manojos}
                  </p>
                  <p className="text-xs text-purple-600">96 conchas/manojo</p>
                </div>
              )}
            </div>
          </div>

          {/* Distribución por tallas */}
          {harvestPlan.sizeDistribution && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📏 Distribución por Tallas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                {Object.entries(harvestPlan.sizeDistribution)
                  .filter(([, count]) => count > 0)
                  .map(([size, count]) => (
                    <div key={size} className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-sm sm:text-base font-medium text-gray-900">{size}</div>
                      <div className="text-base sm:text-lg font-bold text-gray-800">{count.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">
                        {size === 'XS' && '< 35mm'}
                        {size === 'S' && '35-44mm'}
                        {size === 'M' && '45-54mm'}
                        {size === 'L' && '55-64mm'}
                        {size === 'XL' && '> 64mm'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Ingresos estimados */}
          {revenue > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">💰 Ingresos Estimados</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-medium text-gray-900">Total Estimado:</span>
                  <span className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {formatCurrency(revenue)}
                  </span>
                </div>
                {harvestPlan.actualQuantity && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    Precio promedio por malla: {formatCurrency(revenue / harvestPlan.actualQuantity)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Costos */}
          {harvestPlan.totalActualCost && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">💸 Costos de Cosecha</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-medium text-gray-900">Total Gastos:</span>
                  <span className="text-xl sm:text-2xl font-bold text-red-600">
                    {formatCurrency(harvestPlan.totalActualCost)}
                  </span>
                </div>
                {harvestPlan.costPerManojo && (
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    Costo por manojo: {formatCurrency(harvestPlan.costPerManojo)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {harvestPlan.notes && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📝 Observaciones</h3>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-900">{harvestPlan.notes}</p>
              </div>
            </div>
          )}
        </div>
      </Modal.Content>
      
      <Modal.Actions>
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Cerrar
        </button>
      </Modal.Actions>
    </Modal>
  )
}

export default HarvestDetailModal