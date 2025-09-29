import React, { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../stores'
import { useHarvestStore } from '../../stores/harvestStoreNew'
import { UI_TEXTS } from '../../constants/ui'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import HarvestPlanningModal from '../../components/harvest/HarvestPlanningModal'
import HarvestExecutionModal from '../../components/harvest/HarvestExecutionModal'
import HarvestDetailModal from '../../components/harvest/HarvestDetailModal'
import LotSelectionModal from '../../components/harvest/LotSelectionModal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const HarvestPage = () => {
  const { user } = useAuthStore()
  const { harvestPlans, pricing, sectors: harvestSectors, fetchHarvestPlans, fetchPricing, fetchSectorsWithLots, createHarvestPlan, updateHarvestPlan, deleteHarvestPlan, loading } = useHarvestStore()
  const [showLotSelectionModal, setShowLotSelectionModal] = useState(false)
  const [showPlanningModal, setShowPlanningModal] = useState(false)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLot, setSelectedLot] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [activeTab, setActiveTab] = useState('plans')
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())
  const [minSizeThreshold, setMinSizeThreshold] = useState(75) // Talla mínima configurable
  
  useEffect(() => {
    if (user?.id) {
      fetchSectorsWithLots(user.id)
      fetchHarvestPlans(user.id)
      fetchPricing()
    } else {
      }
  }, [user?.id, fetchSectorsWithLots, fetchHarvestPlans, fetchPricing])

  // Log de cambios en estados principales
  useEffect(() => {
    }, [harvestSectors?.length || 0, harvestPlans?.length || 0, pricing?.length || 0, loading, activeTab])
  
  
  // Obtener líneas con sistemas listos para cosecha basado en talla mínima
  const readyLines = useMemo(() => {
    const linesWithSystems = [];

    if (!harvestSectors) return [];

    harvestSectors.forEach(sector => {
      // Procesar cada lote del sector
      (sector.lots || []).forEach(lot => {
        // Solo procesar lotes con cultivo suspendido que tengan líneas
        if (lot.cultivationSystem === 'Cultivo suspendido' || lot.cultivationSystem === 'suspended') {
          // Verificar si la talla promedio supera el umbral
          const hasRequiredSize = lot.averageSize && lot.averageSize >= minSizeThreshold
          
          if (hasRequiredSize) {
            // Procesar líneas múltiples (formato nuevo)
            if (lot.lines && lot.lines.length > 0) {
              lot.lines.forEach(line => {
                linesWithSystems.push({
                  id: `${lot.id}-${line.lineId}`,
                  lotId: lot.id,
                  sectorId: sector.id,
                  sectorName: sector.name,
                  lineId: line.lineId,
                  lineName: line.lineName,
                  systems: line.systems || [],
                  origin: lot.origin,
                  entryDate: lot.entryDate,
                  averageSize: lot.averageSize,
                  maxSize: lot.maxSize,
                  minSize: lot.minSize,
                  currentQuantity: Math.round((lot.currentQuantity || lot.initialQuantity) / (lot.lines?.length || 1)),
                  status: lot.status,
                  monthsOld: Math.round((new Date() - new Date(lot.entryDate)) / (1000 * 60 * 60 * 24 * 30) * 10) / 10,
                  cultivationSystem: lot.cultivationSystem
                })
              })
            }
            // Procesar línea individual (formato antiguo)
            else if (lot.lineName && lot.systems) {
              linesWithSystems.push({
                id: `${lot.id}-single`,
                lotId: lot.id,
                sectorId: sector.id,
                sectorName: sector.name,
                lineId: lot.lineId,
                lineName: lot.lineName,
                systems: lot.systems,
                origin: lot.origin,
                entryDate: lot.entryDate,
                averageSize: lot.averageSize,
                maxSize: lot.maxSize,
                minSize: lot.minSize,
                currentQuantity: lot.currentQuantity || lot.initialQuantity,
                status: lot.status,
                monthsOld: Math.round((new Date() - new Date(lot.entryDate)) / (1000 * 60 * 60 * 24 * 30) * 10) / 10,
                cultivationSystem: lot.cultivationSystem
              })
            }
          }
        }
      })
    })
    
    return linesWithSystems
  }, [harvestSectors, minSizeThreshold]) // Recalcular cuando cambien los sectores o el umbral de talla

  // Filtrar planes por estado
  const plannedHarvests = harvestPlans.filter(plan => plan.status === 'planned')
  
  const upcomingHarvests = plannedHarvests.filter(plan =>
    new Date(plan.plannedDate) >= new Date()
  ).slice(0, 5)

  const completedHarvests = harvestPlans.filter(plan => plan.status === 'completed')
  
  // Manejar la apertura del modal de selección de lotes
  const handleOpenLotSelection = () => {
    setShowLotSelectionModal(true)
  }

  // Manejar el cierre del modal de selección de lotes
  const handleCloseLotSelection = () => {
    setShowLotSelectionModal(false)
  }

  // Manejar la selección de un lote específico
  const handleLotSelect = (lot) => {
    setSelectedLot(lot)
    setShowLotSelectionModal(false)
    setShowPlanningModal(true)
  }

  const handleClosePlanningModal = () => {
    setSelectedLot(null)
    setShowPlanningModal(false)
    // Refrescar la lista de planes
    fetchHarvestPlans(user.id)
  }

  const handleStartExecution = (plan) => {
    setSelectedPlan(plan)
    setShowExecutionModal(true)
  }

  const handleCloseExecutionModal = () => {
    setSelectedPlan(null)
    setShowExecutionModal(false)
    // Refrescar la lista de planes
    fetchHarvestPlans(user.id)
  }

  const handleShowDetail = (plan) => {
    setSelectedPlan(plan)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setSelectedPlan(null)
    setShowDetailModal(false)
  }



  const handleDeletePlan = async (plan) => {
    const result = await MySwal.fire({
      title: '¿Eliminar planificación?',
      text: `Se eliminará permanentemente la planificación del lote ${plan.lotId}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        const deleteResult = await deleteHarvestPlan(plan.id)
        
        if (deleteResult.success) {
          MySwal.fire({
            icon: 'success',
            title: 'Planificación eliminada',
            text: 'La planificación se eliminó exitosamente',
            timer: 2000,
            showConfirmButton: false
          })
          fetchHarvestPlans(user.id)
        }
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Error al eliminar la planificación'
        })
      }
    }
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
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
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

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Adjust so Monday = 0
  }

  const getMonthName = (date) => {
    return date.toLocaleDateString('es-PE', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  const navigateMonth = (direction) => {
    setCurrentCalendarDate(prevDate => {
      const newDate = new Date(prevDate)
      newDate.setMonth(prevDate.getMonth() + direction)
      return newDate
    })
  }

  const getHarvestsForDate = (day) => {
    const dateString = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day)
      .toISOString().split('T')[0]
    
    return harvestPlans.filter(plan => {
      const planDate = new Date(plan.actualDate || plan.plannedDate).toISOString().split('T')[0]
      return planDate === dateString
    })
  }
  
  const totalRevenue = completedHarvests.reduce((sum, plan) => 
    sum + calculateEstimatedRevenue(plan), 0
  )
  
  const totalHarvested = completedHarvests.reduce((sum, plan) => 
    sum + (plan.actualQuantity || 0), 0
  )
  
  if (loading && harvestPlans.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando planes de cosecha..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Cosecha</h1>
          <p className="text-gray-600 mt-1">
            Planifica y registra las actividades de cosecha de tus lotes
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Talla mínima:</label>
            <input
              type="number"
              min="50"
              max="100"
              value={minSizeThreshold}
              onChange={(e) => setMinSizeThreshold(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-sm text-gray-500">mm</span>
          </div>
          <button
            onClick={handleOpenLotSelection}
            className="btn-primary w-full sm:w-auto"
            disabled={readyLines.length === 0}
            title={readyLines.length === 0 ? 'No hay líneas con la talla mínima requerida' : `${readyLines.length} líneas disponibles para planificar`}
          >
            ➕ Nueva Planificación {readyLines.length > 0 && `(${readyLines.length})`}
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Líneas Listas"
          value={readyLines.length}
          subtitle={`Talla > ${minSizeThreshold}mm`}
          icon="🎯"
          color="green"
        />
        
        
        <StatCard
          title="Cosechas Planificadas"
          value={plannedHarvests.length}
          subtitle="Listas para ejecutar"
          icon="📅"
          color="blue"
        />
        
        <StatCard
          title="Total Cosechado"
          value={totalHarvested.toLocaleString()}
          subtitle="Ejemplares"
          icon="🐚"
          color="secondary"
        />
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2 sm:space-x-8 sm:gap-0">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Próximas Cosechas
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📅 Calendario
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Historial
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Próximas Cosechas */}
          <div className="card">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🎯 Próximas Cosechas</h2>
              <p className="text-sm text-gray-600">Cosechas planificadas para los próximos días</p>
            </div>
            
            {upcomingHarvests.length === 0 ? (
              <EmptyState
                title="No hay cosechas planificadas"
                message="Planifica tu primera cosecha para lotes listos."
                icon="📅"
                className="py-8"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Planificada
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sector/Lote
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad Estimada
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingHarvests.map((plan) => {
                      const sector = harvestSectors?.find(s => s.id === plan.sectorId)
                      const lot = sector?.lots?.find(l => l.id === plan.lotId)
                      
                      return (
                        <tr key={plan.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(plan.plannedDate).toLocaleDateString('es-PE')}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{sector?.name}</div>
                              <div className="text-xs text-gray-500">
                                Origen: {lot?.origin}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {(() => {
                                  // Intentar obtener la cantidad de diferentes fuentes
                                  const rawQuantity = plan.estimatedQuantity || plan.survivalQuantity || 0
                                  const quantity = parseFloat(rawQuantity) || 0

                                  if (quantity > 0) {
                                    const manojos = Math.round(quantity / 96)
                                    return `${manojos.toLocaleString()} manojos`
                                  } else {
                                    // Si no hay cantidad, mostrar información del lote
                                    const sector = harvestSectors?.find(s => s.id === plan.sectorId)
                                    const lot = sector?.lots?.find(l => l.id === plan.lotId)
                                    if (lot?.currentQuantity > 0) {
                                      const fallbackManojos = Math.round(lot.currentQuantity / 96)
                                      return `~${fallbackManojos.toLocaleString()} manojos (est.)`
                                    }
                                    return 'Cantidad no definida'
                                  }
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  const rawQuantity = plan.estimatedQuantity || plan.survivalQuantity || 0
                                  const quantity = parseFloat(rawQuantity) || 0

                                  if (quantity > 0) {
                                    return `${quantity.toLocaleString()} unidades`
                                  } else {
                                    const sector = harvestSectors?.find(s => s.id === plan.sectorId)
                                    const lot = sector?.lots?.find(l => l.id === plan.lotId)
                                    if (lot?.currentQuantity > 0) {
                                      return `~${lot.currentQuantity.toLocaleString()} unidades (est.)`
                                    }
                                    return 'Cantidad no disponible'
                                  }
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                              {getStatusText(plan.status)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleStartExecution(plan)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs transition-colors"
                            >
                              🎣 Ejecutar Cosecha
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <div className="card">
          {/* Calendar Header */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">📅 Calendario de Cosechas</h2>
              <p className="text-sm text-gray-600">Vista mensual de todas las cosechas programadas</p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="btn-secondary px-3 py-1 text-sm"
              >
                ← Anterior
              </button>
              <h3 className="text-xl font-semibold text-gray-900 capitalize min-w-[200px] text-center">
                {getMonthName(currentCalendarDate)}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="btn-secondary px-3 py-1 text-sm"
              >
                Siguiente →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: getFirstDayOfMonth(currentCalendarDate) }, (_, index) => (
                <div key={`empty-${index}`} className="h-24 border-b border-r border-gray-100"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: getDaysInMonth(currentCalendarDate) }, (_, index) => {
                const day = index + 1
                const harvests = getHarvestsForDate(day)
                const today = new Date()
                const currentDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day)
                const isToday = currentDate.toDateString() === today.toDateString()

                return (
                  <div
                    key={day}
                    className={`h-24 border-b border-r border-gray-100 p-1 relative ${
                      isToday ? 'bg-blue-50' : 'bg-white'
                    } ${harvests.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  >
                    <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'} mb-1`}>
                      {day}
                    </div>
                    
                    {/* Harvest indicators */}
                    <div className="space-y-0.5">
                      {harvests.slice(0, 2).map((plan) => {
                        const sector = harvestSectors?.find(s => s.id === plan.sectorId)
                        return (
                          <div
                            key={plan.id}
                            onClick={() => handleShowDetail(plan)}
                            className={`text-xs px-1 py-0.5 rounded text-white cursor-pointer hover:opacity-80 ${
                              plan.status === 'completed' ? 'bg-green-500' :
                              plan.status === 'planned' ? 'bg-blue-500' :
                              plan.status === 'in_progress' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            title={`${sector?.name || 'N/A'} - ${getStatusText(plan.status)}`}
                          >
                            {sector?.name?.substring(0, 8) || 'N/A'}
                          </div>
                        )
                      })}
                      {harvests.length > 2 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{harvests.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Planificado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>En progreso</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Día actual</span>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📊 Historial de Cosechas</h2>
            <p className="text-sm text-gray-600">Registro completo de cosechas realizadas</p>
          </div>
          
          {completedHarvests.length === 0 ? (
            <EmptyState
              title="No hay cosechas completadas"
              message="Las cosechas completadas aparecerán aquí con su información detallada."
              icon="📊"
              className="py-8"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Real
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distribución por Tallas
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos Est.
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedHarvests.map((plan) => {
                    const sector = harvestSectors?.find(s => s.id === plan.sectorId)
                    const revenue = calculateEstimatedRevenue(plan)
                    
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {plan.actualDate ? new Date(plan.actualDate).toLocaleDateString('es-PE') : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sector?.name}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.actualQuantity?.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {plan.sizeDistribution ? (
                            <div className="text-xs space-y-1">
                              {Object.entries(plan.sizeDistribution)
                                .filter(([, count]) => count > 0)
                                .map(([size, count]) => (
                                  <div key={size}>
                                    {size}: {count}
                                  </div>
                                ))}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(revenue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Lot Selection Modal */}
      <LotSelectionModal
        isOpen={showLotSelectionModal}
        onClose={handleCloseLotSelection}
        readyLots={readyLines}
        onLotSelect={handleLotSelect}
      />
      
      {/* Planning Modal */}
      <HarvestPlanningModal
        isOpen={showPlanningModal}
        onClose={handleClosePlanningModal}
        selectedLot={selectedLot}
        user={user}
      />
      
      {/* Execution Modal */}
      <HarvestExecutionModal
        isOpen={showExecutionModal}
        onClose={handleCloseExecutionModal}
        selectedPlan={selectedPlan}
        user={user}
      />

      {/* Detail Modal */}
      <HarvestDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        harvestPlan={selectedPlan}
        sector={selectedPlan ? harvestSectors?.find(s => s.id === selectedPlan.sectorId) : null}
        pricing={pricing}
      />
    </div>
  )
}

export default HarvestPage