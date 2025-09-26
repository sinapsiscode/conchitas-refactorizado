import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const MonitoringPage = ({ onNavigateToLot }) => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors, loading } = useSectorStore()
  const [selectedLot, setSelectedLot] = useState(null)
  
  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
    }
  }, [user?.id, fetchSectors])
  
  // Obtener todos los lotes de todos los sectores
  const allLots = sectors.flatMap(sector => 
    (sector.lots || []).map(lot => ({
      ...lot,
      sectorName: sector.name,
      sectorLocation: sector.location
    }))
  )
  
  const activeLots = allLots.filter(lot => lot.status !== 'harvested')
  
  
  const handleViewComparison = (lot) => {
    onNavigateToLot(lot.id)
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }
  
  const getStatusColor = (status) => {
    const colors = {
      seeded: 'bg-blue-100 text-blue-800',
      growing: 'bg-green-100 text-green-800',
      ready: 'bg-yellow-100 text-yellow-800',
      harvested: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.seeded
  }
  
  const getStatusText = (status) => {
    const texts = {
      seeded: 'Sembrado',
      growing: 'Crecimiento',
      ready: 'Listo',
      harvested: 'Cosechado'
    }
    return texts[status] || status
  }
  
  if (loading && sectors.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando monitoreo..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Monitoreo de Siembras</h1>
          <p className="text-gray-600 mt-1">
            Registra mediciones y compara el progreso real vs teórico de tus siembras
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Siembras Activas"
          value={activeLots.length}
          subtitle="En seguimiento"
          icon="🔍"
          color="primary"
          loading={false}
          error={null}
        />
        
        <StatCard
          title="Total Ejemplares"
          value={activeLots.reduce((sum, lot) => sum + (lot.currentQuantity || lot.initialQuantity), 0).toLocaleString()}
          subtitle="En monitoreo"
          icon="🐚"
          color="secondary"
          loading={false}
          error={null}
        />
        
        <StatCard
          title="Sectores con Siembras"
          value={sectors.filter(s => s.lots && s.lots.length > 0).length}
          subtitle="Activos"
          icon="🏭"
          color="green"
          loading={false}
          error={null}
        />
      </div>
      
      {activeLots.length === 0 ? (
        <EmptyState
          title="No hay siembras para monitorear"
          message="Crea siembras en la sección de Siembras para comenzar el monitoreo y seguimiento."
          icon="🔍"
          action={
            <button className="btn-secondary" disabled>
              Ir a Siembras
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tabla de Siembras por Sector</h2>
            <p className="text-sm text-gray-600">
              Registra mediciones y compara datos reales vs teóricos de cada siembra
            </p>
          </div>
          
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Siembra/Sector
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Líneas/Sistemas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tallas (mm)
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
                {activeLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {(() => {
                            // Priorizar el nombre de línea si existe
                            if (lot.lineName) {
                              return lot.lineName
                            }
                            // Mostrar múltiples líneas si existen
                            if (lot.multipleLines && lot.multipleLines.length > 0) {
                              if (lot.multipleLines.length === 1) {
                                return lot.multipleLines[0].lineName
                              } else {
                                return `${lot.multipleLines.length} líneas`
                              }
                            }
                            // Fallback al formato original
                            return `${lot.origin} - ${new Date(lot.entryDate).toLocaleDateString('es-PE')}`
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Sector: {lot.sectorName}
                        </div>
                        <div className="text-sm text-gray-500">
                          📍 {lot.sectorLocation || 'Sin ubicación'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Origen: {lot.origin}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(lot.entryDate).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {(() => {
                          // Mostrar información de múltiples líneas
                          if (lot.multipleLines && lot.multipleLines.length > 0) {
                            return (
                              <div>
                                {lot.multipleLines.map((line, index) => (
                                  <div key={index} className="mb-2">
                                    <div className="font-medium text-blue-600">
                                      📍 Línea {line.lineName}
                                    </div>
                                    {line.systems && line.systems.length > 0 && (
                                      <div className="text-xs text-gray-600">
                                        <span className="font-semibold">Sistemas:</span> 
                                        {line.systems.length === 1 
                                          ? ` ${line.systems[0].systemNumber}`
                                          : line.systems.length <= 5
                                            ? ` ${line.systems.map(s => s.systemNumber).join(', ')}`
                                            : ` ${line.systems[0].systemNumber}-${line.systems[line.systems.length - 1].systemNumber} (${line.systems.length} total)`
                                        }
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          }
                          
                          // Mostrar línea individual (formato anterior)
                          if (lot.lineName) {
                            return (
                              <div>
                                <div className="font-medium text-blue-600">
                                  📍 {lot.lineName}
                                </div>
                                {lot.systems && lot.systems.length > 0 && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    <span className="font-semibold">Sistemas:</span> 
                                    {lot.systems.length === 1 
                                      ? ` ${lot.systems[0].systemNumber}`
                                      : lot.systems.length <= 5
                                        ? ` ${lot.systems.map(s => s.systemNumber).join(', ')}`
                                        : ` ${lot.systems[0].systemNumber}-${lot.systems[lot.systems.length - 1].systemNumber} (${lot.systems.length} total)`
                                    }
                                  </div>
                                )}
                                {lot.systems && lot.systems[0]?.floors && (
                                  <div className="text-xs text-gray-500">
                                    Pisos: {lot.systems[0].floors.length} por sistema
                                  </div>
                                )}
                              </div>
                            )
                          }
                          
                          // Sin líneas asignadas
                          return (
                            <div className="text-xs text-gray-400 italic">
                              Sin línea asignada
                            </div>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{(lot.currentQuantity || lot.initialQuantity).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          Inicial: {lot.initialQuantity?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mortalidad: {lot.expectedMonthlyMortality}% mensual
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs space-y-1">
                        {lot.averageSize && <div>Prom: {lot.averageSize}mm</div>}
                        {lot.maxSize && <div>Max: {lot.maxSize}mm</div>}
                        {lot.minSize && <div>Min: {lot.minSize}mm</div>}
                        {!lot.averageSize && !lot.maxSize && !lot.minSize && (
                          <div className="text-gray-400">Sin mediciones</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                        {getStatusText(lot.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewComparison(lot)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 rounded text-xs transition-colors"
                      >
                        📈 Ver Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonitoringPage