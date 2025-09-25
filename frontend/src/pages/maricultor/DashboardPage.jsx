import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useSectorStore } from '../../stores/sectorStore'
import { UI_TEXTS } from '../../constants/ui'
import { calculateMetrics } from '../../utils/metrics'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const DashboardPage = ({ onNavigate }) => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors, loading } = useSectorStore()
  const [metrics, setMetrics] = useState({})
  
  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
    }
  }, [user?.id, fetchSectors])
  
  useEffect(() => {
    if (sectors.length > 0) {
      const sectorMetrics = calculateMetrics(sectors, 'sector-summary')
      const lots = sectors.flatMap(sector => sector.lots || [])
      const mortalityMetrics = calculateMetrics(lots, 'mortality-rate')
      
      setMetrics({
        sectors: sectorMetrics,
        mortality: mortalityMetrics
      })
    }
  }, [sectors])
  
  const quickActions = [
    { id: 'sectors', title: 'Gestionar Sectores', icon: '🏭', description: 'Administrar tus sectores de cultivo' },
    { id: 'monitoring', title: 'Nuevo Monitoreo', icon: '🔍', description: 'Registrar parámetros de cultivo' },
    { id: 'harvest', title: 'Programar Cosecha', icon: '🎣', description: 'Planificar actividades de cosecha' },
    { id: 'inventory', title: 'Inventario', icon: '📦', description: 'Gestionar materiales y equipos' },
    { id: 'reports', title: 'Ver Reportes', icon: '📋', description: 'Generar informes de producción' }
  ]
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <LoadingSpinner size="lg" message="Cargando dashboard..." />
      </div>
    )
  }
  
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 sm:p-6 sm:space-y-8 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">
            {UI_TEXTS.dashboard.welcome}, {user?.firstName}
          </h1>
          <p className="text-base text-slate-600 mt-2 sm:text-lg">
            Resumen de tus actividades de cultivo de conchas de abanico
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 lg:gap-6">
        <StatCard
          title={UI_TEXTS.dashboard.totalSectors}
          value={metrics.sectors?.data?.totalSectors || 0}
          subtitle="Sectores activos"
          icon="🏭"
          color="primary"
          loading={!metrics.sectors}
          error={metrics.sectors?.status === 'insufficient-data' ? 'Sin datos' : null}
        />
        
        <StatCard
          title="Siembras Activas"
          value={metrics.sectors?.data?.activeLots || 0}
          subtitle="Lotes en crecimiento"
          icon="📈"
          color="secondary"
          loading={!metrics.sectors}
          error={metrics.sectors?.status === 'insufficient-data' ? 'Sin datos' : null}
        />

        <StatCard
          title={UI_TEXTS.dashboard.mortalityRate}
          value={metrics.mortality?.data?.mortalityRate ? `${metrics.mortality.data.mortalityRate}%` : 'N/A'}
          subtitle="Tasa actual"
          icon="📊"
          color={metrics.mortality?.data?.mortalityRate > 15 ? 'red' : 'yellow'}
          loading={!metrics.mortality}
          error={metrics.mortality?.status === 'insufficient-data' ? 'Datos insuficientes' : null}
        />
        
        <StatCard
          title="Lote Total"
          value={user?.totalHectares ? `${user.totalHectares} ha` : 'No especificado'}
          subtitle="Total registrado"
          icon="📏"
          color="blue"
          loading={false}
          error={null}
        />
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 sm:text-xl sm:mb-6 tracking-tight">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="card-compact hover:shadow-lg hover:border-primary-200 transition-all duration-200 hover:scale-[1.02] text-left group"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-200">{action.icon}</div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900 mb-1 sm:text-lg group-hover:text-primary-700 transition-colors">{action.title}</h3>
                  <p className="text-sm text-slate-600 sm:text-base">{action.description}</p>
                </div>
                <div className="text-slate-400 group-hover:text-primary-500 transition-colors">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {sectors.length === 0 && !loading && (
        <EmptyState
          title="¡Comienza tu cultivo!"
          message="No tienes sectores registrados. Crea tu primer sector para comenzar a gestionar tu cultivo de conchas de abanico."
          icon="🌊"
          action={
            <button
              onClick={() => onNavigate('sectors')}
              className="btn-primary"
            >
              Crear primer sector
            </button>
          }
        />
      )}
    </div>
  )
}

export default DashboardPage