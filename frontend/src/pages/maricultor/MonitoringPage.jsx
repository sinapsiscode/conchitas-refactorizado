import React, { useEffect, useState } from 'react'
import { useAuthStore, useSectorStore, useSeedingStore } from '../../stores'
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
  const { lots, fetchLots } = useSeedingStore()
  const [selectedLot, setSelectedLot] = useState(null)
  const [lotStatuses, setLotStatuses] = useState([])
  const [pageConfig, setPageConfig] = useState(null)
  const [tableHeaders, setTableHeaders] = useState([])
  const [statCards, setStatCards] = useState([])
  const [statusColors, setStatusColors] = useState([])

  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
    }
    fetchLots()

    // Load all monitoring page configuration from API
    Promise.all([
      fetch('http://localhost:4077/lotStatuses').then(res => res.json()),
      fetch('http://localhost:4077/monitoringPageConfig').then(res => res.json()),
      fetch('http://localhost:4077/monitoringTableHeaders').then(res => res.json()),
      fetch('http://localhost:4077/monitoringStatCards').then(res => res.json()),
      fetch('http://localhost:4077/lotStatusColors').then(res => res.json())
    ])
    .then(([statuses, configs, headers, cards, colors]) => {
      setLotStatuses(statuses)
      setPageConfig(configs[0] || {})
      setTableHeaders(headers.filter(h => h.isActive).sort((a, b) => a.order - b.order))
      setStatCards(cards.filter(c => c.isActive).sort((a, b) => a.order - b.order))
      setStatusColors(colors.filter(c => c.isActive))
    })
    .catch(err => console.error('Error loading monitoring configuration:', err))
  }, [user?.id, fetchSectors, fetchLots])
  
  // Obtener todos los lotes del store de seeding y agregar información de sector
  const allLots = lots.map(lot => {
    const sector = sectors.find(s => s.id === lot.sectorId);
    return {
      ...lot,
      sectorName: sector?.name || pageConfig?.fallbackTexts?.sectorNotFound || 'Sector no encontrado',
      sectorLocation: sector?.location || pageConfig?.fallbackTexts?.locationNotAvailable || 'Ubicación no disponible'
    };
  })
  
  const activeLots = allLots.filter(lot => lot.status !== 'harvested')
  
  
  const handleViewComparison = (lot) => {
    onNavigateToLot(lot.id)
  }
  
  const formatCurrency = (amount) => {
    const locale = pageConfig?.currency?.locale || 'es-PE'
    const currency = pageConfig?.currency?.currency || 'PEN'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  const getStatusColor = (status) => {
    const statusColor = statusColors.find(sc => sc.statusCode === status)
    if (statusColor) {
      return statusColor.colorClass
    }
    // Fallback to hardcoded colors if API not loaded yet
    const colors = {
      seeded: 'bg-blue-100 text-blue-800',
      growing: 'bg-green-100 text-green-800',
      ready: 'bg-yellow-100 text-yellow-800',
      harvested: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.seeded
  }
  
  const getStatusText = (status) => {
    // Get status text from API data
    const statusData = lotStatuses.find(s => s.code === status)
    if (statusData) {
      return statusData.label
    }
    // Fallback to hardcoded values if API not loaded yet
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
        <LoadingSpinner size="lg" message={pageConfig?.loadingMessage || "Cargando monitoreo..."} />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{pageConfig?.title || "Monitoreo de Siembras"}</h1>
          <p className="text-gray-600 mt-1">
            {pageConfig?.subtitle || "Supervisa y rastrea el crecimiento de todas las siembras activas"}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
        {statCards.map((card) => {
          let value = 0

          switch (card.key) {
            case 'activeLots':
              value = activeLots.length
              break
            case 'totalSpecimens':
              value = activeLots.reduce((sum, lot) => sum + (lot.currentQuantity || lot.initialQuantity), 0).toLocaleString()
              break
            case 'sectorsWithLots':
              value = sectors.filter(s => s.lots && s.lots.length > 0).length
              break
          }

          return (
            <StatCard
              key={card.id}
              title={card.title}
              value={value}
              subtitle={card.subtitle}
              icon={card.icon}
              color={card.color}
              loading={false}
              error={null}
            />
          )
        })}
      </div>
      
      {activeLots.length === 0 ? (
        <EmptyState
          title={pageConfig?.noDataTitle || "No hay siembras para monitorear"}
          message={pageConfig?.noDataMessage || "Crea siembras en la sección de Siembras para comenzar el monitoreo y seguimiento."}
          icon={pageConfig?.noDataIcon || "🔍"}
          action={
            <button className="btn-secondary" disabled>
              Ir a Siembras
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{pageConfig?.tableTitle || "Tabla de Siembras por Sector"}</h2>
            <p className="text-sm text-gray-600">
              {pageConfig?.tableSubtitle || "Haz clic en \"Ver Detalles\" para acceder al monitoreo detallado de cada lote"}
            </p>
          </div>
          
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header.id} className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.width}`}>
                      {header.label}
                    </th>
                  ))}
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
                          📍 {lot.sectorLocation || pageConfig?.fallbackTexts?.noLocation || 'Sin ubicación'}
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
                          {pageConfig?.fallbackTexts?.initialQuantity || 'Inicial'}: {lot.initialQuantity?.toLocaleString()}
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
                          <div className="text-gray-400">{pageConfig?.fallbackTexts?.noMeasurements || 'Sin mediciones'}</div>
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