import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '../../stores'
import { useInvestmentStore } from '../../stores'
import { useSectorStore } from '../../stores'
import StatCard from '../common/StatCard'
import EmptyState from '../common/EmptyState'
import LoadingSpinner from '../common/LoadingSpinner'

const InvestorReturns = () => {
  const { user } = useAuthStore()
  const { 
    investments, 
    distributions, 
    investorReturns,
    fetchInvestorReturns,
    loading 
  } = useInvestmentStore()
  const { sectors } = useSectorStore()
  
  const [filters, setFilters] = useState({
    status: 'all', // all, paid, pending
    period: 'all', // all, month, quarter, semester, year
    investment: 'all' // all, specific investment ID
  })
  
  const [sortBy, setSortBy] = useState({
    field: 'distributionDate',
    direction: 'desc'
  })

  useEffect(() => {
    if (user?.id) {
      fetchInvestorReturns(user.id)
    }
  }, [user?.id, fetchInvestorReturns])

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

  // Get investment details
  const getInvestmentDetails = (investmentId) => {
    const investment = investments.find(inv => inv.id === investmentId)
    if (!investment) return { lotName: 'Inversión no encontrada', sectorName: 'N/A' }
    
    const allLots = sectors.flatMap(s => s.lots || [])
    const lot = allLots.find(l => l.id === investment.lotId)
    const sector = sectors.find(s => s.lots?.some(l => l.id === investment.lotId))
    
    return {
      ...investment,
      lotName: lot?.lineName || lot?.origin || 'Sin nombre',
      sectorName: sector?.name || 'Sin sector',
      entryDate: lot?.entryDate,
      harvestDate: lot?.harvestDate,
      lotStatus: lot?.status
    }
  }

  // Calculate returns summary
  const returnsSummary = useMemo(() => {
    if (!distributions || distributions.length === 0) {
      return {
        totalDistributed: 0,
        totalInvested: 0,
        netProfit: 0,
        avgROI: 0,
        totalDistributions: 0,
        paidDistributions: 0,
        pendingDistributions: 0,
        lastDistribution: null
      }
    }

    const totalDistributed = distributions.reduce((sum, dist) => sum + (dist.distributedAmount || 0), 0)
    const totalInvested = distributions.reduce((sum, dist) => sum + (dist.originalInvestment || 0), 0)
    const paidDistributions = distributions.filter(dist => dist.status === 'paid').length
    const pendingDistributions = distributions.filter(dist => dist.status === 'pending').length
    const lastDistribution = distributions.length > 0 
      ? distributions.reduce((latest, dist) => 
          new Date(dist.distributionDate) > new Date(latest.distributionDate) ? dist : latest
        )
      : null

    const avgROI = distributions.length > 0
      ? distributions.reduce((sum, dist) => sum + (dist.roi || 0), 0) / distributions.length
      : 0

    return {
      totalDistributed,
      totalInvested,
      netProfit: totalDistributed - totalInvested,
      avgROI,
      totalDistributions: distributions.length,
      paidDistributions,
      pendingDistributions,
      lastDistribution
    }
  }, [distributions])

  // Filter and sort distributions
  const filteredAndSortedDistributions = useMemo(() => {
    if (!distributions) return []
    
    let filtered = [...distributions]

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(dist => dist.status === filters.status)
    }

    if (filters.investment !== 'all') {
      filtered = filtered.filter(dist => dist.investmentId === filters.investment)
    }

    if (filters.period !== 'all') {
      const now = new Date()
      let cutoffDate

      switch (filters.period) {
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'semester':
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = null
      }

      if (cutoffDate) {
        filtered = filtered.filter(dist => new Date(dist.distributionDate) >= cutoffDate)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortBy
      let aValue, bValue

      switch (field) {
        case 'distributionDate':
          aValue = new Date(a.distributionDate)
          bValue = new Date(b.distributionDate)
          break
        case 'amount':
          aValue = a.distributedAmount || 0
          bValue = b.distributedAmount || 0
          break
        case 'roi':
          aValue = a.roi || 0
          bValue = b.roi || 0
          break
        case 'originalInvestment':
          aValue = a.originalInvestment || 0
          bValue = b.originalInvestment || 0
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
  }, [distributions, filters, sortBy])

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

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800'
    }
    return colors[status] || colors.pending
  }

  const getStatusText = (status) => {
    const texts = {
      paid: 'Pagado',
      pending: 'Pendiente',
      processing: 'Procesando'
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando retornos..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Retornos</h2>
        <p className="text-gray-600 mt-1">
          Historial completo de distribuciones y ganancias de tus inversiones
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Distribuido"
          value={formatCurrency(returnsSummary.totalDistributed)}
          subtitle="Ganancias recibidas"
          icon="💵"
          color="green"
        />
        
        <StatCard
          title="Ganancia Neta"
          value={formatCurrency(returnsSummary.netProfit)}
          subtitle="Retorno - Inversión"
          icon="💸"
          color={returnsSummary.netProfit >= 0 ? "green" : "red"}
        />
        
        <StatCard
          title="ROI Promedio"
          value={`${returnsSummary.avgROI.toFixed(2)}%`}
          subtitle="Rendimiento promedio"
          icon="📈"
          color={returnsSummary.avgROI >= 0 ? "green" : "red"}
        />
        
        <StatCard
          title="Distribuciones"
          value={returnsSummary.totalDistributions}
          subtitle={`${returnsSummary.paidDistributions} pagadas, ${returnsSummary.pendingDistributions} pendientes`}
          icon="📊"
          color="blue"
        />
      </div>

      {/* Last Distribution Alert */}
      {returnsSummary.lastDistribution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Último Retorno Recibido
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <span className="font-semibold">{formatCurrency(returnsSummary.lastDistribution.distributedAmount)}</span>
                <span className="mx-2">•</span>
                <span>{formatDate(returnsSummary.lastDistribution.distributionDate)}</span>
                <span className="mx-2">•</span>
                <span>ROI: {returnsSummary.lastDistribution.roi?.toFixed(2) || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado de Pago
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todos los estados</option>
              <option value="paid">Pagados</option>
              <option value="pending">Pendientes</option>
              <option value="processing">Procesando</option>
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
              <option value="all">Todo el período</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
              <option value="semester">Último semestre</option>
              <option value="year">Último año</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inversión Específica
            </label>
            <select
              value={filters.investment}
              onChange={(e) => setFilters(prev => ({ ...prev, investment: e.target.value }))}
              className="input-field"
            >
              <option value="all">Todas las inversiones</option>
              {investments.map(investment => {
                const details = getInvestmentDetails(investment.id)
                return (
                  <option key={investment.id} value={investment.id}>
                    {details.lotName} - {details.sectorName}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Historial de Retornos ({filteredAndSortedDistributions.length})
            </h3>
            <p className="text-sm text-gray-600">
              Distribuciones de ganancias de tus inversiones
            </p>
          </div>
          
          {distributions && distributions.length > 0 && (
            <div className="text-sm text-gray-500">
              Total mostrado: {formatCurrency(
                filteredAndSortedDistributions.reduce((sum, dist) => sum + (dist.distributedAmount || 0), 0)
              )}
            </div>
          )}
        </div>

        {!distributions || distributions.length === 0 ? (
          <EmptyState
            title="No hay retornos registrados"
            message="Aún no has recibido distribuciones de ganancias de tus inversiones"
            icon="💵"
          />
        ) : filteredAndSortedDistributions.length === 0 ? (
          <EmptyState
            title="No hay retornos con los filtros aplicados"
            message="Intenta cambiar los filtros para ver más resultados"
            icon="🔍"
            action={
              <button
                onClick={() => setFilters({ status: 'all', period: 'all', investment: 'all' })}
                className="btn-secondary"
              >
                Limpiar Filtros
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('distributionDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha</span>
                      <SortIcon field="distributionDate" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siembra / Sector
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('originalInvestment')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Inversión Original</span>
                      <SortIcon field="originalInvestment" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Retorno Distribuido</span>
                      <SortIcon field="amount" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('roi')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>ROI</span>
                      <SortIcon field="roi" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDistributions.map((distribution) => {
                  const investmentDetails = getInvestmentDetails(distribution.investmentId)
                  
                  return (
                    <tr key={distribution.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">
                            {formatDate(distribution.distributionDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(distribution.distributionDate).toLocaleTimeString('es-PE', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {investmentDetails.lotName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Sector: {investmentDetails.sectorName}
                          </div>
                          {investmentDetails.entryDate && (
                            <div className="text-xs text-gray-400">
                              Siembra: {formatDate(investmentDetails.entryDate)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(distribution.originalInvestment)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <div className="font-medium text-green-600">
                          +{formatCurrency(distribution.distributedAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((distribution.distributedAmount / distribution.originalInvestment) * 100).toFixed(1)}% del total
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <span className={`font-medium ${distribution.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {distribution.roi?.toFixed(2) || '0.00'}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(distribution.status)}`}>
                          {getStatusText(distribution.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {distribution.notes && (
                            <div className="text-xs text-gray-600">
                              💬 {distribution.notes}
                            </div>
                          )}
                          {distribution.paymentMethod && (
                            <div className="text-xs text-gray-500">
                              💳 {distribution.paymentMethod}
                            </div>
                          )}
                          {distribution.transactionId && (
                            <div className="text-xs text-gray-400 font-mono">
                              #{distribution.transactionId.slice(-8)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Returns Analytics */}
      {distributions && distributions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Returns Chart */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Retornos por Mes
            </h3>
            
            <div className="space-y-3">
              {(() => {
                const monthlyData = {}
                filteredAndSortedDistributions.forEach(dist => {
                  const monthYear = new Date(dist.distributionDate).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'short'
                  })
                  
                  if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { amount: 0, count: 0 }
                  }
                  
                  monthlyData[monthYear].amount += dist.distributedAmount || 0
                  monthlyData[monthYear].count += 1
                })
                
                return Object.entries(monthlyData)
                  .slice(-6) // Last 6 months
                  .map(([month, data]) => (
                    <div key={month} className="flex items-center justify-between py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{month}</span>
                        <span className="ml-2 text-xs text-gray-500">({data.count} distribuciones)</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(data.amount)}
                      </span>
                    </div>
                  ))
              })()}
            </div>
          </div>

          {/* Top Performing Investments */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Mejores Inversiones por ROI
            </h3>
            
            <div className="space-y-3">
              {(() => {
                const investmentPerformance = {}
                
                filteredAndSortedDistributions.forEach(dist => {
                  if (!investmentPerformance[dist.investmentId]) {
                    const details = getInvestmentDetails(dist.investmentId)
                    investmentPerformance[dist.investmentId] = {
                      ...details,
                      totalDistributed: 0,
                      distributionCount: 0,
                      avgROI: 0
                    }
                  }
                  
                  investmentPerformance[dist.investmentId].totalDistributed += dist.distributedAmount || 0
                  investmentPerformance[dist.investmentId].distributionCount += 1
                })
                
                // Calculate average ROI for each investment
                Object.values(investmentPerformance).forEach(inv => {
                  if (inv.amount > 0) {
                    inv.avgROI = ((inv.totalDistributed - inv.amount) / inv.amount) * 100
                  }
                })
                
                return Object.values(investmentPerformance)
                  .sort((a, b) => b.avgROI - a.avgROI)
                  .slice(0, 5)
                  .map((investment, index) => (
                    <div key={investment.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {investment.lotName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {investment.sectorName} • {investment.distributionCount} distribuciones
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${investment.avgROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {investment.avgROI.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(investment.totalDistributed)}
                        </div>
                      </div>
                    </div>
                  ))
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvestorReturns