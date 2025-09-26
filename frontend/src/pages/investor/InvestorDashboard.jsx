import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores'
import { useInvestmentStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const InvestorDashboard = ({ onNavigate }) => {
  const { user } = useAuthStore()
  const { 
    investments, 
    distributions,
    investorReturns,
    fetchInvestments, 
    fetchInvestorReturns,
    getInvestorSummary, 
    loading 
  } = useInvestmentStore()
  const { sectors, fetchSectors } = useSectorStore()
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (user?.id) {
      fetchInvestments(user.id, 'investor')
      fetchInvestorReturns(user.id) // Fetch distributions and returns
      fetchSectors() // To get lot information
    }
  }, [user?.id, fetchInvestments, fetchInvestorReturns, fetchSectors])

  useEffect(() => {
    if (user?.id && (investments.length > 0 || investorReturns)) {
      // Use investorReturns if available, otherwise calculate from investments
      if (investorReturns) {
        setSummary({
          totalInvested: investorReturns.totalInvested,
          totalReturns: investorReturns.totalReturned,
          overallROI: investorReturns.averageROI,
          activeInvestments: investorReturns.activeInvestments,
          completedInvestments: investorReturns.completedInvestments,
          netProfit: investorReturns.netProfit,
          investments: investments
        })
      } else {
        const investorSummary = getInvestorSummary(user.id)
        setSummary(investorSummary)
      }
    }
  }, [user?.id, investments, investorReturns, getInvestorSummary])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.active
  }

  const getStatusText = (status) => {
    const texts = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return texts[status] || status
  }

  // Get lot details for each investment
  const getInvestmentWithDetails = (investment) => {
    const allLots = sectors.flatMap(s => s.lots || [])
    const lot = allLots.find(l => l.id === investment.lotId)
    const sector = sectors.find(s => s.lots?.some(l => l.id === investment.lotId))
    
    return {
      ...investment,
      lotName: lot?.lineName || lot?.origin || 'Sin nombre',
      sectorName: sector?.name || 'Sin sector',
      entryDate: lot?.entryDate,
      projectedHarvestDate: lot?.projectedHarvestDate,
      cultivationSystem: lot?.cultivationSystem,
      currentQuantity: lot?.currentQuantity || lot?.initialQuantity,
      lotStatus: lot?.status
    }
  }

  if (loading && !summary) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <LoadingSpinner size="lg" message="Cargando inversiones..." />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel del Inversor</h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total Invertido"
            value={formatCurrency(summary.totalInvested)}
            subtitle="Capital comprometido"
            icon="💰"
            color="primary"
          />
          
          <StatCard
            title="Retornos Totales"
            value={formatCurrency(summary.totalReturns)}
            subtitle="Ganancias distribuidas"
            icon="💵"
            color="green"
          />
          
          <StatCard
            title="Ganancia Neta"
            value={formatCurrency(summary.netProfit || 0)}
            subtitle="Retorno - Inversión"
            icon="💸"
            color={summary.netProfit >= 0 ? "green" : "red"}
          />
          
          <StatCard
            title="ROI Global"
            value={`${(summary.overallROI || 0).toFixed(2)}%`}
            subtitle="Retorno sobre inversión"
            icon="📈"
            color={summary.overallROI >= 0 ? "green" : "red"}
          />
          
          <StatCard
            title="Inversiones Activas"
            value={summary.activeInvestments}
            subtitle={`De ${summary.investments.length} total`}
            icon="🌱"
            color="blue"
          />
        </div>
      )}

      {/* Investments Table */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Mis Inversiones</h2>
          <p className="text-sm text-gray-600">
            Detalle de todas tus participaciones en siembras
          </p>
        </div>

        {investments.length === 0 ? (
          <EmptyState
            title="No tienes inversiones registradas"
            message="Contacta con un maricultor para participar en sus siembras"
            icon="💼"
          />
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siembra / Sector
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Inversión
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Invertido
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participación
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retornos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => {
                  const details = getInvestmentWithDetails(investment)
                  const roi = investment.amount > 0 
                    ? (((investment.totalDistributed || 0) - investment.amount) / investment.amount) * 100
                    : 0

                  return (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {details.lotName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Sector: {details.sectorName}
                          </div>
                          {details.entryDate && (
                            <div className="text-xs text-gray-400">
                              Siembra: {new Date(details.entryDate).toLocaleDateString('es-PE')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(investment.investmentDate).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(investment.amount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {investment.percentage.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(investment.totalDistributed || 0)}
                      </td>
                      <td className="px-4 py-4 text-sm text-right">
                        <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roi.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(investment.status)}`}>
                          {getStatusText(investment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => onNavigate('investment-details', investment.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {UI_TEXTS.investor.actions.viewDetails}
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
  )
}

export default InvestorDashboard