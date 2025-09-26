import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../stores'
import { useInvestmentStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { useMonitoringStore } from '../../stores'
import StatCard from '../common/StatCard'
import EmptyState from '../common/EmptyState'
import LoadingSpinner from '../common/LoadingSpinner'

const InvestorSeedings = () => {
  const { user } = useAuthStore()
  const { investments, fetchInvestments, loading: investmentLoading } = useInvestmentStore()
  const { sectors, fetchAllSectors, loading: sectorLoading } = useSectorStore()
  const { monitoringRecords, fetchAllMonitoring, loading: monitoringLoading } = useMonitoringStore()
  
  const [selectedSeeding, setSelectedSeeding] = useState(null)
  const [filters, setFilters] = useState({
    status: 'all', // all, active, ready, harvested
    sector: 'all',
    period: 'all' // all, recent, older
  })
  const [sortBy, setSortBy] = useState({
    field: 'entryDate',
    direction: 'desc'
  })

  useEffect(() => {
    if (user?.id) {
      fetchInvestments(user.id, 'investor')
      fetchAllSectors()
      fetchAllMonitoring()
    }
  }, [user?.id, fetchInvestments, fetchAllSectors, fetchAllMonitoring])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get investor's seedings with full details
  const investorSeedings = useMemo(() => {
    if (!investments.length || !sectors.length) return []
    
    const seedingsData = []
    
    investments.forEach(investment => {
      // Find the lot and sector for this investment
      let lotData = null
      let sectorData = null
      
      sectors.forEach(sector => {
        const lot = sector.lots?.find(l => l.id === investment.lotId)
        if (lot) {
          lotData = lot
          sectorData = sector
        }
      })
      
      if (lotData && sectorData) {
        // Get monitoring records for this lot
        const lotMonitoring = monitoringRecords.filter(m => m.lotId === investment.lotId)
        
        // Calculate current value and growth
        const daysFromEntry = Math.floor((new Date() - new Date(lotData.entryDate)) / (1000 * 60 * 60 * 24))
        const monthsFromEntry = Math.floor(daysFromEntry / 30)
        
        // Determine status based on lot status and harvest plans
        let seedingStatus = lotData.status
        if (lotData.status === 'seeded' && monthsFromEntry >= 1) seedingStatus = 'growing'
        if (lotData.status === 'growing' && lotData.averageSize >= 45) seedingStatus = 'ready'
        
        seedingsData.push({
          id: investment.id,
          investmentId: investment.id,
          lotId: investment.lotId,
          sectorId: sectorData.id,
          sectorName: sectorData.name,
          location: sectorData.location,
          lotData: lotData,
          investment: investment,
          
          // Seeding details
          origin: lotData.origin,
          entryDate: lotData.entryDate,
          projectedHarvestDate: lotData.projectedHarvestDate,
          initialQuantity: lotData.initialQuantity,
          currentQuantity: lotData.currentQuantity,
          
          // Growth metrics
          averageSize: lotData.averageSize,
          minSize: lotData.minSize,
          maxSize: lotData.maxSize,
          monthsFromEntry,
          daysFromEntry,
          status: seedingStatus,
          
          // Investment details
          investmentAmount: investment.amount,
          investmentPercentage: investment.percentage,
          investmentDate: investment.investmentDate,
          investmentStatus: investment.status,
          
          // Monitoring
          monitoringCount: lotMonitoring.length,
          lastMonitoring: lotMonitoring.length > 0 
            ? lotMonitoring.reduce((latest, current) => 
                new Date(current.recordDate) > new Date(latest.recordDate) ? current : latest
              )
            : null,
          allMonitoring: lotMonitoring.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate)),
          
          // Financial tracking
          totalDistributed: investment.totalDistributed || 0,
          expectedReturn: investment.expectedReturn || 0,
          actualReturn: investment.actualReturn || 0,
          
          // Calculated metrics
          mortalityRate: lotData.initialQuantity > 0 
            ? ((lotData.initialQuantity - lotData.currentQuantity) / lotData.initialQuantity * 100)
            : 0,
          growthProgress: lotData.projectedHarvestDate 
            ? Math.min(100, (daysFromEntry / (new Date(lotData.projectedHarvestDate) - new Date(lotData.entryDate))) * 100 / (1000 * 60 * 60 * 24))
            : 0
        })
      }
    })
    
    return seedingsData
  }, [investments, sectors, monitoringRecords])

  // Filter and sort seedings
  const filteredAndSortedSeedings = useMemo(() => {
    let filtered = [...investorSeedings]

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(seeding => seeding.status === filters.status)
    }

    if (filters.sector !== 'all') {
      filtered = filtered.filter(seeding => seeding.sectorId === filters.sector)
    }

    if (filters.period !== 'all') {
      const now = new Date()
      if (filters.period === 'recent') {
        filtered = filtered.filter(seeding => 
          (now - new Date(seeding.entryDate)) / (1000 * 60 * 60 * 24 * 30) <= 6 // Last 6 months
        )
      } else if (filters.period === 'older') {
        filtered = filtered.filter(seeding => 
          (now - new Date(seeding.entryDate)) / (1000 * 60 * 60 * 24 * 30) > 6 // Older than 6 months
        )
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortBy
      let aValue, bValue

      switch (field) {
        case 'entryDate':
          aValue = new Date(a.entryDate)
          bValue = new Date(b.entryDate)
          break
        case 'investmentAmount':
          aValue = a.investmentAmount
          bValue = b.investmentAmount
          break
        case 'currentQuantity':
          aValue = a.currentQuantity
          bValue = b.currentQuantity
          break
        case 'averageSize':
          aValue = a.averageSize
          bValue = b.averageSize
          break
        case 'monitoringCount':
          aValue = a.monitoringCount
          bValue = b.monitoringCount
          break
        default:
          return 0
      }

      if (direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [investorSeedings, filters, sortBy])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (investorSeedings.length === 0) return {
      totalInvested: 0,
      totalSeedings: 0,
      activeSeedings: 0,
      totalQuantity: 0,
      avgGrowthProgress: 0,
      totalMonitorings: 0
    }

    const totalInvested = investorSeedings.reduce((sum, s) => sum + s.investmentAmount, 0)
    const activeSeedings = investorSeedings.filter(s => ['seeded', 'growing', 'ready'].includes(s.status)).length
    const totalQuantity = investorSeedings.reduce((sum, s) => sum + s.currentQuantity, 0)
    const avgGrowthProgress = investorSeedings.reduce((sum, s) => sum + s.growthProgress, 0) / investorSeedings.length
    const totalMonitorings = investorSeedings.reduce((sum, s) => sum + s.monitoringCount, 0)

    return {
      totalInvested,
      totalSeedings: investorSeedings.length,
      activeSeedings,
      totalQuantity,
      avgGrowthProgress,
      totalMonitorings
    }
  }, [investorSeedings])

  const getStatusColor = (status) => {
    const colors = {
      seeded: 'bg-blue-100 text-blue-800',
      growing: 'bg-green-100 text-green-800',
      ready: 'bg-yellow-100 text-yellow-800',
      harvested: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || colors.seeded
  }

  const getStatusText = (status) => {
    const texts = {
      seeded: 'Sembrado',
      growing: 'En Crecimiento',
      ready: 'Listo para Cosecha',
      harvested: 'Cosechado'
    }
    return texts[status] || status
  }

  const handleSort = (field) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIcon = ({ field }) => {
    if (sortBy.field !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      )
    }
    
    return (
      <svg className={`w-4 h-4 text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={sortBy.direction === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    )
  }

  if (investmentLoading || sectorLoading || monitoringLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando tus siembras..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Siembras</h2>
        <p className="text-gray-600 mt-1">
          Seguimiento completo de las siembras en las que has invertido
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Invertido"
          value={formatCurrency(summaryStats.totalInvested)}
          subtitle="En todas las siembras"
          icon="💰"
          color="blue"
        />
        
        <StatCard
          title="Siembras Activas"
          value={summaryStats.activeSeedings}
          subtitle={`de ${summaryStats.totalSeedings} totales`}
          icon="🌱"
          color="green"
        />
        
        <StatCard
          title="Cantidad Total"
          value={summaryStats.totalQuantity.toLocaleString()}
          subtitle="Ejemplares actuales"
          icon="🐚"
          color="primary"
        />
        
        <StatCard
          title="Monitoreos"
          value={summaryStats.totalMonitorings}
          subtitle="Registros totales"
          icon="📊"
          color="yellow"
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de la Siembra
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="seeded">Sembrado</option>
              <option value="growing">En Crecimiento</option>
              <option value="ready">Listo para Cosecha</option>
              <option value="harvested">Cosechado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sector
            </label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos los sectores</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos los períodos</option>
              <option value="recent">Últimos 6 meses</option>
              <option value="older">Más de 6 meses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Seedings Table */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Mis Siembras ({filteredAndSortedSeedings.length})
            </h3>
            <p className="text-sm text-gray-600">
              Historial completo de tus inversiones en siembras
            </p>
          </div>
        </div>

        {filteredAndSortedSeedings.length === 0 ? (
          <EmptyState
            title="No hay siembras registradas"
            message="Aún no tienes inversiones en siembras o no coinciden con los filtros aplicados"
            icon="🌱"
            action={
              filters.status !== 'all' || filters.sector !== 'all' || filters.period !== 'all' ? (
                <button
                  onClick={() => setFilters({ status: 'all', sector: 'all', period: 'all' })}
                  className="btn-secondary"
                >
                  Limpiar Filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('entryDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha Siembra</span>
                      <SortIcon field="entryDate" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siembra / Sector
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('investmentAmount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Mi Inversión</span>
                      <SortIcon field="investmentAmount" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('currentQuantity')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Cantidad Actual</span>
                      <SortIcon field="currentQuantity" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('averageSize')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Talla Promedio</span>
                      <SortIcon field="averageSize" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('monitoringCount')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Monitoreos</span>
                      <SortIcon field="monitoringCount" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedSeedings.map((seeding) => (
                  <tr key={seeding.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {formatDate(seeding.entryDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {seeding.monthsFromEntry} meses
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {seeding.origin}
                        </div>
                        <div className="text-sm text-gray-500">
                          Sector: {seeding.sectorName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {seeding.investmentPercentage}% del lote
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      <div className="font-medium">
                        {formatCurrency(seeding.investmentAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(seeding.investmentDate)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      <div className="font-medium">
                        {seeding.currentQuantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        de {seeding.initialQuantity.toLocaleString()} inicial
                      </div>
                      {seeding.mortalityRate > 0 && (
                        <div className="text-xs text-red-500">
                          -{seeding.mortalityRate.toFixed(1)}% mortalidad
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-right">
                      <div className="font-medium">
                        {parseFloat(seeding.averageSize).toFixed(2)} mm
                      </div>
                      <div className="text-xs text-gray-500">
                        {parseFloat(seeding.minSize).toFixed(2)}-{parseFloat(seeding.maxSize).toFixed(2)} mm
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seeding.status)}`}>
                        {getStatusText(seeding.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {seeding.monitoringCount}
                      </div>
                      {seeding.lastMonitoring && (
                        <div className="text-xs text-gray-500">
                          Último: {formatDate(seeding.lastMonitoring.recordDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedSeeding(seeding)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seeding Detail Modal */}
      {selectedSeeding && (
        <SeedingDetailModal 
          seeding={selectedSeeding} 
          onClose={() => setSelectedSeeding(null)} 
        />
      )}
    </div>
  )
}

// Seeding Detail Modal Component
const SeedingDetailModal = ({ seeding, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedMonitoring, setExpandedMonitoring] = useState(null)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-4 sm:my-8 min-h-0 flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              Detalle de Siembra: {seeding.origin}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Sector {seeding.sectorName} • {seeding.investmentPercentage}% de participación
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs - Fixed */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Resumen General
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📈 Monitoreos ({seeding.monitoringCount})
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📅 Línea de Tiempo
            </button>
          </nav>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                      Mi Inversión
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(seeding.investmentAmount)}
                    </div>
                    <div className="text-xs text-blue-700">
                      {seeding.investmentPercentage}% del lote
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                      Cantidad Actual
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {seeding.currentQuantity.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-700">
                      de {seeding.initialQuantity.toLocaleString()} inicial
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                      Retornos Recibidos
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(seeding.totalDistributed)}
                    </div>
                    <div className="text-xs text-purple-700">
                      ROI: {seeding.investmentAmount > 0 ? ((seeding.totalDistributed - seeding.investmentAmount) / seeding.investmentAmount * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Seeding Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Información de la Siembra</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Origen:</span>
                        <span className="font-medium">{seeding.origin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha de Siembra:</span>
                        <span className="font-medium">{formatDate(seeding.entryDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cosecha Proyectada:</span>
                        <span className="font-medium">{formatDate(seeding.projectedHarvestDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Meses Transcurridos:</span>
                        <span className="font-medium">{seeding.monthsFromEntry} meses</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estado Actual:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          seeding.status === 'growing' ? 'bg-green-100 text-green-800' :
                          seeding.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                          seeding.status === 'harvested' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {seeding.status === 'growing' ? 'En Crecimiento' :
                           seeding.status === 'ready' ? 'Listo para Cosecha' :
                           seeding.status === 'harvested' ? 'Cosechado' : 'Sembrado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Métricas de Crecimiento</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Talla Promedio:</span>
                        <span className="font-medium">{parseFloat(seeding.averageSize).toFixed(2)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rango de Tallas:</span>
                        <span className="font-medium">{parseFloat(seeding.minSize).toFixed(2)} - {parseFloat(seeding.maxSize).toFixed(2)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tasa de Mortalidad:</span>
                        <span className={`font-medium ${seeding.mortalityRate > 15 ? 'text-red-600' : 'text-green-600'}`}>
                          {seeding.mortalityRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Monitoreos Realizados:</span>
                        <span className="font-medium">{seeding.monitoringCount} registros</span>
                      </div>
                      {seeding.lastMonitoring && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Último Monitoreo:</span>
                          <span className="font-medium">{formatDate(seeding.lastMonitoring.recordDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Growth Progress */}
                {seeding.growthProgress > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Progreso de Crecimiento</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, seeding.growthProgress)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.min(100, seeding.growthProgress).toFixed(1)}% completado
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-4">
                {seeding.allMonitoring.length === 0 ? (
                  <EmptyState
                    title="No hay monitoreos registrados"
                    message="Aún no se han realizado monitoreos para esta siembra"
                    icon="📊"
                  />
                ) : (
                  <div className="space-y-3">
                    {seeding.allMonitoring.map((monitoring, index) => (
                      <div key={monitoring.id} className="border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
                        {/* Main Monitoring Header - Clickable */}
                        <div 
                          className="p-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 rounded-lg"
                          onClick={() => setExpandedMonitoring(
                            expandedMonitoring === monitoring.id ? null : monitoring.id
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 flex items-center">
                                <span>Monitoreo {formatDate(monitoring.recordDate)}</span>
                                <svg 
                                  className={`ml-2 w-4 h-4 text-gray-400 transition-transform ${
                                    expandedMonitoring === monitoring.id ? 'rotate-180' : ''
                                  }`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </h5>
                              <p className="text-xs text-gray-500">
                                Registrado por: {monitoring.recordedBy}
                              </p>
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatDateTime(monitoring.recordDate)}
                            </div>
                          </div>
                          
                          {/* Summary Metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Cantidad:</span>
                              <div className="font-medium">{monitoring.currentQuantity?.toLocaleString() || 'N/A'}</div>
                              {monitoring.previousQuantity && (
                                <div className="text-xs text-gray-400">
                                  de {monitoring.previousQuantity.toLocaleString()} anterior
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-500">Talla Promedio:</span>
                              <div className="font-medium">
                                {monitoring.averageSize ? `${parseFloat(monitoring.averageSize).toFixed(2)} mm` : 'N/A'}
                              </div>
                              {monitoring.maxSize && monitoring.minSize && (
                                <div className="text-xs text-gray-400">
                                  {parseFloat(monitoring.minSize).toFixed(1)}-{parseFloat(monitoring.maxSize).toFixed(1)} mm
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-500">Pisos Muestreados:</span>
                              <div className="font-medium">{monitoring.totalPoints || monitoring.measurementPoints?.length || 'N/A'}</div>
                              {monitoring.mortalityData?.averageMortalityRate && (
                                <div className="text-xs text-gray-400">
                                  Mortalidad: {monitoring.mortalityData.averageMortalityRate}%
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-gray-500">Observaciones:</span>
                              <div className="font-medium">
                                {monitoring.observations ? 'Sí' : 'No'}
                              </div>
                              {monitoring.recordedBy && (
                                <div className="text-xs text-gray-400">
                                  Por: {monitoring.recordedBy}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-blue-700 font-medium">
                              Click para ver {monitoring.measurementPoints?.length || monitoring.totalPoints || 'los'} pisos muestreados →
                            </div>
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                              #{index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details - Sampling Points */}
                        {expandedMonitoring === monitoring.id && (
                          <div className="border-t border-blue-200 bg-gradient-to-r from-slate-50 to-gray-50">
                            <div className="p-4">
                              {/* Pisos Muestreados */}
                              {monitoring.measurementPoints && monitoring.measurementPoints.length > 0 ? (
                                <div className="space-y-4">
                                  <h6 className="text-sm font-medium text-gray-900 mb-3">
                                    Pisos Muestreados ({monitoring.measurementPoints.length})
                                  </h6>
                                  
                                  <div className="grid gap-3">
                                    {monitoring.measurementPoints.map((point, index) => (
                                      <div key={point.pointNumber || index} className="bg-white border border-gray-200 rounded p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="text-sm font-medium text-gray-800">
                                            📍 Piso {point.pointNumber}
                                            {point.lineName && (
                                              <span className="ml-2 text-xs text-blue-600">
                                                Línea {point.lineName}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {point.ropeNumber && `Sistema ${point.ropeNumber}`}
                                            {point.floorNumber && ` - Piso ${point.floorNumber}`}
                                          </div>
                                        </div>
                                        
                                        {/* Campos de Ubicación */}
                                        {(point.lineName || point.ropeNumber || point.floorNumber) && (
                                          <div className="mb-3 p-2 bg-blue-50 rounded">
                                            <div className="text-xs text-gray-600 mb-1">
                                              <strong>Ubicación:</strong>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                              <div>
                                                <span className="text-gray-500">Línea:</span>
                                                <div className="font-medium">{point.lineName || 'N/A'}</div>
                                              </div>
                                              <div>
                                                <span className="text-gray-500">Sistema:</span>
                                                <div className="font-medium">{point.ropeNumber || 'N/A'}</div>
                                              </div>
                                              <div>
                                                <span className="text-gray-500">Piso:</span>
                                                <div className="font-medium">{point.floorNumber || 'N/A'}</div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Campos de Tallas */}
                                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                          <div>
                                            <span className="text-gray-500">Talla Promedio:</span>
                                            <div className="font-medium">
                                              {point.averageSize ? `${parseFloat(point.averageSize).toFixed(2)} mm` : 'N/A'}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Talla Máxima:</span>
                                            <div className="font-medium">
                                              {point.maxSize ? `${parseFloat(point.maxSize).toFixed(2)} mm` : 'N/A'}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Talla Mínima:</span>
                                            <div className="font-medium">
                                              {point.minSize ? `${parseFloat(point.minSize).toFixed(2)} mm` : 'N/A'}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Campos de Mortalidad y Densidad */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>
                                            <span className="text-gray-500">Ejemplares Totales:</span>
                                            <div className="font-medium">
                                              {point.totalSpecimens || 'N/A'}
                                            </div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Densidad (ind/piso):</span>
                                            <div className="font-medium">
                                              {point.aliveSpecimens || point.averageDensity || 'N/A'}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Cálculo de mortalidad por punto */}
                                        {point.totalSpecimens && point.aliveSpecimens && (
                                          <div className="mt-2 p-2 bg-yellow-50 rounded text-center">
                                            <span className="text-xs text-gray-600">
                                              Mortalidad del piso: {' '}
                                              <span className="font-medium text-yellow-800">
                                                {(((parseFloat(point.totalSpecimens) - parseFloat(point.aliveSpecimens)) / parseFloat(point.totalSpecimens)) * 100).toFixed(2)}%
                                              </span>
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <div className="text-gray-400 text-sm">
                                    No hay pisos muestreados registrados para este monitoreo
                                  </div>
                                </div>
                              )}

                              {/* General Notes */}
                              {(monitoring.observations || monitoring.notes) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="text-sm font-medium text-gray-900 mb-2">Observaciones Generales</h6>
                                  <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                    {monitoring.observations || monitoring.notes}
                                  </p>
                                </div>
                              )}

                              {/* Resumen de Mortalidad */}
                              {monitoring.mortalityData && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h6 className="text-sm font-medium text-gray-900 mb-2">Resumen de Mortalidad</h6>
                                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                      <div>
                                        <span className="text-gray-500">Mortalidad Promedio:</span>
                                        <div className="font-medium text-yellow-800">
                                          {monitoring.mortalityData.averageMortalityRate}%
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Cantidad Anterior:</span>
                                        <div className="font-medium text-yellow-800">
                                          {monitoring.previousQuantity?.toLocaleString() || 'N/A'}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Cantidad Actual:</span>
                                        <div className="font-medium text-yellow-800">
                                          {monitoring.currentQuantity?.toLocaleString() || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                    {monitoring.mortalityData.pointMortalities && monitoring.mortalityData.pointMortalities.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-yellow-300">
                                        <div className="text-xs text-gray-600">
                                          <strong>Por pisos:</strong> {' '}
                                          {monitoring.mortalityData.pointMortalities.map(pm => `${pm.mortalityRate.toFixed(1)}%`).join(', ')}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Investment Event */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        💰 Inversión Realizada
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(seeding.investmentDate)} - {formatCurrency(seeding.investmentAmount)} ({seeding.investmentPercentage}%)
                      </p>
                    </div>
                  </div>
                  
                  {/* Seeding Event */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        🌱 Siembra Iniciada
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(seeding.entryDate)} - {seeding.initialQuantity.toLocaleString()} ejemplares de {seeding.origin}
                      </p>
                    </div>
                  </div>

                  {/* Monitoring Events */}
                  {seeding.allMonitoring.slice(0, 5).map((monitoring, index) => (
                    <div key={monitoring.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 bg-yellow-600 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          📊 Monitoreo #{seeding.monitoringCount - index}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(monitoring.recordDate)} - Talla: {monitoring.averageSize ? `${parseFloat(monitoring.averageSize).toFixed(2)}mm` : 'N/A'}, Cantidad: {monitoring.currentQuantity?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Future Harvest */}
                  {seeding.status !== 'harvested' && (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 mt-2 bg-purple-400 rounded-full border-2 border-purple-200"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-400">
                          🐚 Cosecha Proyectada
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(seeding.projectedHarvestDate)} - Fecha estimada
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Close Button - Fixed */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestorSeedings