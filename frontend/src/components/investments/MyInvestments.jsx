import React, { useState, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useInvestmentStore } from '../../stores/investmentStore'
import { useSectorStore } from '../../stores/sectorStore'
import { UI_TEXTS } from '../../constants/ui'
import { mockAPI } from '../../services/mock/server'
import StatCard from '../common/StatCard'
import EmptyState from '../common/EmptyState'
import LoadingSpinner from '../common/LoadingSpinner'

const MyInvestments = ({ onNavigate }) => {
  const { user } = useAuthStore()
  const { investments, distributions, loading } = useInvestmentStore()
  const { sectors } = useSectorStore()
  const [filters, setFilters] = useState({
    status: 'all',
    sector: 'all',
    dateRange: 'all'
  })
  const [sortBy, setSortBy] = useState({
    field: 'investmentDate',
    direction: 'desc'
  })
  const [selectedInvestment, setSelectedInvestment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const texts = UI_TEXTS.myInvestments

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

  // Get lot details for investments
  const getInvestmentWithDetails = (investment) => {
    const allLots = sectors.flatMap(s => s.lots || [])
    const lot = allLots.find(l => l.id === investment.lotId)
    const sector = sectors.find(s => s.lots?.some(l => l.id === investment.lotId))
    
    return {
      ...investment,
      lotName: lot?.lineName || lot?.origin || texts.noName,
      sectorName: sector?.name || texts.noSector,
      sectorLocation: sector?.location || texts.noLocation,
      entryDate: lot?.entryDate,
      projectedHarvestDate: lot?.projectedHarvestDate,
      cultivationSystem: lot?.cultivationSystem,
      currentQuantity: lot?.currentQuantity || lot?.initialQuantity,
      lotStatus: lot?.status,
      initialQuantity: lot?.initialQuantity,
      maricultorName: sector?.maricultorName || texts.notAvailable
    }
  }

  // Calculate investment metrics
  const investmentMetrics = useMemo(() => {
    const detailedInvestments = investments.map(getInvestmentWithDetails)
    
    const totalInvested = detailedInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalReturns = detailedInvestments.reduce((sum, inv) => sum + (inv.totalDistributed || 0), 0)
    const activeInvestments = detailedInvestments.filter(inv => inv.status === 'active').length
    const completedInvestments = detailedInvestments.filter(inv => inv.status === 'completed').length
    const avgROI = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0
    const netProfit = totalReturns - totalInvested

    return {
      totalInvested,
      totalReturns,
      netProfit,
      avgROI,
      activeInvestments,
      completedInvestments,
      totalInvestments: detailedInvestments.length
    }
  }, [investments, sectors])

  // Filter and sort investments
  const filteredAndSortedInvestments = useMemo(() => {
    let filtered = investments.map(getInvestmentWithDetails)

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(inv => inv.status === filters.status)
    }

    if (filters.sector !== 'all') {
      filtered = filtered.filter(inv => inv.sectorName === filters.sector)
    }

    if (filters.dateRange !== 'all') {
      const now = new Date()
      let cutoffDate

      switch (filters.dateRange) {
        case '30days':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '3months':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case '6months':
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = null
      }

      if (cutoffDate) {
        filtered = filtered.filter(inv => new Date(inv.investmentDate) >= cutoffDate)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortBy
      let aValue, bValue

      switch (field) {
        case 'investmentDate':
          aValue = new Date(a.investmentDate)
          bValue = new Date(b.investmentDate)
          break
        case 'amount':
          aValue = a.amount || 0
          bValue = b.amount || 0
          break
        case 'returns':
          aValue = a.totalDistributed || 0
          bValue = b.totalDistributed || 0
          break
        case 'roi':
          aValue = a.amount > 0 ? (((a.totalDistributed || 0) - a.amount) / a.amount) * 100 : 0
          bValue = b.amount > 0 ? (((b.totalDistributed || 0) - b.amount) / b.amount) * 100 : 0
          break
        case 'sector':
          aValue = a.sectorName || ''
          bValue = b.sectorName || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
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
  }, [investments, sectors, filters, sortBy])

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.active
  }

  const handleViewDetails = async (investment) => {
    const detailedInvestment = getInvestmentWithDetails(investment)

    // Obtener distribuciones para mostrar información de cosecha específica del lote
    try {
      const distributionsResponse = await mockAPI.getDistributions({ lotId: investment.lotId })
      const distributions = distributionsResponse.data || []

      // Filtrar solo las distribuciones de esta inversión específica
      const investmentDistributions = distributions.filter(dist => dist.investmentId === investment.id)

      // Obtener la distribución más reciente para mostrar información de esa cosecha
      const latestDistribution = investmentDistributions.sort((a, b) =>
        new Date(b.distributionDate) - new Date(a.distributionDate)
      )[0]

      if (latestDistribution) {
        // Calcular el retorno distribuido correcto basado en la utilidad neta y porcentaje
        const correctDistribution = ((latestDistribution.netProfit || 0) * (investment.percentage || 0)) / 100

        detailedInvestment.harvestData = {
          harvestRevenue: latestDistribution.harvestRevenue || 0,
          harvestExpenses: latestDistribution.harvestExpenses || 0,
          netProfit: latestDistribution.netProfit || 0,
          distributionDate: latestDistribution.distributionDate,
          distributionsCount: investmentDistributions.length,
          // Usar el cálculo correcto en lugar del valor almacenado
          calculatedDistribution: correctDistribution
        }
      } else {
        detailedInvestment.harvestData = {
          harvestRevenue: 0,
          harvestExpenses: 0,
          netProfit: 0,
          distributionDate: null,
          distributionsCount: 0,
          calculatedDistribution: 0
        }
      }
    } catch (error) {
      console.warn('Error obteniendo distribuciones:', error)
      detailedInvestment.harvestData = {
        harvestRevenue: 0,
        harvestExpenses: 0,
        netProfit: 0,
        distributionDate: null,
        distributionsCount: 0,
        calculatedDistribution: 0
      }
    }

    setSelectedInvestment(detailedInvestment)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setSelectedInvestment(null)
    setShowDetailsModal(false)
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
      <svg className={`w-4 h-4 ${sortBy.direction === 'asc' ? 'text-blue-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={sortBy.direction === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    )
  }

  const uniqueSectors = [...new Set(investments.map(getInvestmentWithDetails).map(inv => inv.sectorName))].filter(sector => sector !== texts.noSector)

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message={UI_TEXTS.common.loading} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{texts.title}</h2>
        <p className="text-gray-600 mt-1">
          {texts.subtitle}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={texts.totalInvested}
          value={formatCurrency(investmentMetrics.totalInvested)}
          subtitle={texts.totalInvestmentsSubtitle.replace('{count}', investmentMetrics.totalInvestments)}
          icon="💰"
          color="primary"
        />
        
        <StatCard
          title={texts.totalReturns}
          value={formatCurrency(investmentMetrics.totalReturns)}
          subtitle={texts.distributedReturnsSubtitle}
          icon="💵"
          color="green"
        />
        
        <StatCard
          title={texts.netProfit}
          value={formatCurrency(investmentMetrics.netProfit)}
          subtitle={texts.netProfitSubtitle}
          icon="💸"
          color={investmentMetrics.netProfit >= 0 ? "green" : "red"}
        />
        
        <StatCard
          title={texts.avgROI}
          value={`${investmentMetrics.avgROI.toFixed(2)}%`}
          subtitle={texts.activeInvestmentsSubtitle.replace('{count}', investmentMetrics.activeInvestments)}
          icon="📈"
          color={investmentMetrics.avgROI >= 0 ? "green" : "red"}
        />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.filtersTitle}</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.statusFilter}
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="all">{texts.statusOptions.all}</option>
              <option value="active">{texts.statusOptions.active}</option>
              <option value="completed">{texts.statusOptions.completed}</option>
              <option value="cancelled">{texts.statusOptions.cancelled}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.sectorFilter}
            </label>
            <select
              value={filters.sector}
              onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
              className="input-field"
            >
              <option value="all">{texts.sectorOptions.all}</option>
              {uniqueSectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {texts.periodFilter}
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="input-field"
            >
              <option value="all">{texts.periodOptions.all}</option>
              <option value="30days">{texts.periodOptions.thirtyDays}</option>
              <option value="3months">{texts.periodOptions.threeMonths}</option>
              <option value="6months">{texts.periodOptions.sixMonths}</option>
              <option value="year">{texts.periodOptions.year}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {texts.investmentsCount.replace('{count}', filteredAndSortedInvestments.length)}
            </h3>
            <p className="text-sm text-gray-600">
              {texts.investmentsDetails}
            </p>
          </div>
        </div>

        {filteredAndSortedInvestments.length === 0 ? (
          <EmptyState
            title={texts.noInvestments}
            message={
              filters.status === 'all' && filters.sector === 'all' && filters.dateRange === 'all'
                ? texts.noInvestmentsMessage
                : texts.noFilteredInvestments
            }
            icon="💼"
            action={
              filters.status !== 'all' || filters.sector !== 'all' || filters.dateRange !== 'all' ? (
                <button
                  onClick={() => setFilters({ status: 'all', sector: 'all', dateRange: 'all' })}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {texts.clearFilters}
                </button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sector')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{texts.projectSector}</span>
                      <SortIcon field="sector" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('investmentDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{texts.investmentDate}</span>
                      <SortIcon field="investmentDate" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>{texts.investedAmount}</span>
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.participation}
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('returns')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>{texts.returns}</span>
                      <SortIcon field="returns" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('roi')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>{texts.roi}</span>
                      <SortIcon field="roi" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{texts.status}</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {texts.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedInvestments.map((investment) => {
                  const roi = investment.amount > 0 
                    ? (((investment.totalDistributed || 0) - investment.amount) / investment.amount) * 100
                    : 0

                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {investment.lotName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {texts.sector} {investment.sectorName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {investment.sectorLocation}
                          </div>
                          {investment.maricultorName !== texts.notAvailable && (
                            <div className="text-xs text-gray-400">
                              {texts.maricultor} {investment.maricultorName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {formatDate(investment.investmentDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(investment.amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {investment.percentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                        <span className={investment.totalDistributed > 0 ? 'text-green-600' : 'text-gray-900'}>
                          {formatCurrency(investment.totalDistributed || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roi.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(investment.status)}`}>
                          {texts.statusLabels[investment.status] || investment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleViewDetails(investment)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {texts.viewDetails}
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

      {/* Investment Details Modal */}
      {showDetailsModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Inversión</h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Investment Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Información de la Inversión</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Invertido:</span>
                      <span className="font-semibold">{formatCurrency(selectedInvestment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Inversión:</span>
                      <span>{formatDate(selectedInvestment.investmentDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Porcentaje de Participación:</span>
                      <span className="font-semibold">{selectedInvestment.percentage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvestment.status)}`}>
                        {texts.statusLabels[selectedInvestment.status] || selectedInvestment.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-3">Información de la Cosecha</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Total Cosecha:</span>
                      <span className="font-semibold text-orange-700">
                        {formatCurrency(selectedInvestment.harvestData?.harvestRevenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gastos de Cosecha:</span>
                      <span className="text-gray-700">
                        {formatCurrency(selectedInvestment.harvestData?.harvestExpenses || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilidad Neta:</span>
                      <span className="font-semibold text-orange-700">
                        {formatCurrency(selectedInvestment.harvestData?.netProfit || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Cosecha:</span>
                      <span className="text-gray-700">
                        {selectedInvestment.harvestData?.distributionDate ? formatDate(selectedInvestment.harvestData.distributionDate) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-3">Retornos y Rentabilidad</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mi Participación (%):</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency((selectedInvestment.harvestData?.netProfit || 0) * (selectedInvestment.percentage || 0) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retornos Distribuidos:</span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(selectedInvestment.harvestData?.calculatedDistribution || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ganancia Neta:</span>
                      <span className={`font-semibold ${((selectedInvestment.harvestData?.calculatedDistribution || 0) - selectedInvestment.amount) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency((selectedInvestment.harvestData?.calculatedDistribution || 0) - selectedInvestment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ROI:</span>
                      <span className={`font-semibold ${(((selectedInvestment.harvestData?.calculatedDistribution || 0) - selectedInvestment.amount) / selectedInvestment.amount * 100) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {((((selectedInvestment.harvestData?.calculatedDistribution || 0) - selectedInvestment.amount) / selectedInvestment.amount) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha Último Pago:</span>
                      <span>{selectedInvestment.lastDistributionDate ? formatDate(selectedInvestment.lastDistributionDate) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lot Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Lote</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sector:</span>
                      <span className="font-medium">{selectedInvestment.sectorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ubicación:</span>
                      <span>{selectedInvestment.sectorLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lote:</span>
                      <span className="font-medium">{selectedInvestment.lotName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sistema de Cultivo:</span>
                      <span>{selectedInvestment.cultivationSystem || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Siembra:</span>
                      <span>{selectedInvestment.entryDate ? formatDate(selectedInvestment.entryDate) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha Proyectada Cosecha:</span>
                      <span>{selectedInvestment.projectedHarvestDate ? formatDate(selectedInvestment.projectedHarvestDate) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cantidad Inicial:</span>
                      <span>{selectedInvestment.initialQuantity?.toLocaleString() || 'N/A'} unidades</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cantidad Actual:</span>
                      <span>{selectedInvestment.currentQuantity?.toLocaleString() || 'N/A'} unidades</span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Additional Information */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">Información Adicional</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maricultor:</span>
                    <span className="font-medium">{selectedInvestment.maricultorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retorno Esperado:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvestment.expectedReturn || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retorno Real:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvestment.actualReturn || 0)}</span>
                  </div>
                  {selectedInvestment.notes && (
                    <div>
                      <span className="text-gray-600 block mb-1">Notas:</span>
                      <p className="text-gray-700 bg-white rounded p-2">{selectedInvestment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyInvestments