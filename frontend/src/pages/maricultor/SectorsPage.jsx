import React, { useEffect, useState } from 'react'
import { useAuthStore, useSectorStore } from '../../stores' // Importación centralizada
import { UI_TEXTS } from '../../constants/ui'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import CultivationLineManager from '../../components/sectors/CultivationLineManager'
import BatteryManager from '../../components/sectors/BatteryManager'
import LineManager from '../../components/sectors/LineManager'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const SectorsPage = () => {
  const { user } = useAuthStore()
  const {
    sectors,
    batteries,
    cultivationLines,
    fetchSectors,
    createSector,
    deleteSector,
    fetchBatteries,
    fetchCultivationLines,
    selectSector,
    selectBattery,
    loading
  } = useSectorStore()
  const [showSectorForm, setShowSectorForm] = useState(false)
  const [editingSector, setEditingSector] = useState(null)
  const [selectedSectorForBatteries, setSelectedSectorForBatteries] = useState(null)
  const [selectedBatteryForLines, setSelectedBatteryForLines] = useState(null)
  const [expandedSectors, setExpandedSectors] = useState({})
  const [expandedBatteries, setExpandedBatteries] = useState({})
  const [loadingBatteries, setLoadingBatteries] = useState({})
  const [loadingLines, setLoadingLines] = useState({})
  const [sectorBatteries, setSectorBatteries] = useState({})
  const [batteryLines, setBatteryLines] = useState({})
  const [sectorForm, setSectorForm] = useState({
    name: '',
    location: '',
    hectares: ''
  })
  
  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
    }
  }, [user?.id, fetchSectors])
  
  const toggleSectorExpansion = async (sectorId) => {
    const isExpanded = expandedSectors[sectorId]

    if (!isExpanded && !sectorBatteries[sectorId]) {
      setLoadingBatteries(prev => ({ ...prev, [sectorId]: true }))
      const result = await fetchBatteries(sectorId)
      if (result.success) {
        setSectorBatteries(prev => ({ ...prev, [sectorId]: result.data || [] }))
      }
      setLoadingBatteries(prev => ({ ...prev, [sectorId]: false }))
    }

    setExpandedSectors(prev => ({ ...prev, [sectorId]: !isExpanded }))
  }

  const toggleBatteryExpansion = async (batteryId) => {
    const isExpanded = expandedBatteries[batteryId]

    if (!isExpanded && !batteryLines[batteryId]) {
      setLoadingLines(prev => ({ ...prev, [batteryId]: true }))
      const result = await fetchCultivationLines(null, batteryId)
      if (result.success) {
        setBatteryLines(prev => ({ ...prev, [batteryId]: result.data || [] }))
      }
      setLoadingLines(prev => ({ ...prev, [batteryId]: false }))
    }

    setExpandedBatteries(prev => ({ ...prev, [batteryId]: !isExpanded }))
  }
  
  const handleCreateSector = async (e) => {
    e.preventDefault()
    
    const result = await createSector({
      ...sectorForm,
      userId: user.id,
      hectares: sectorForm.hectares ? parseFloat(sectorForm.hectares) : null
    })
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Sector creado',
        text: 'El sector se creó exitosamente',
        timer: 1500,
        showConfirmButton: false
      })
      resetForm()
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }
  
  const handleEditSector = (sector) => {
    setEditingSector(sector)
    setSectorForm({
      name: sector.name,
      location: sector.location || '',
      hectares: sector.hectares ? sector.hectares.toString() : ''
    })
    setShowSectorForm(true)
  }
  
  const handleDeleteSector = async (sector) => {
    const lotCount = sector.lots ? sector.lots.length : 0
    
    if (lotCount > 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: `Este sector tiene ${lotCount} siembra${lotCount > 1 ? 's' : ''} registrada${lotCount > 1 ? 's' : ''}. Elimina primero las siembras.`
      })
      return
    }
    
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará el sector "${sector.name}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
      const deleteResult = await deleteSector(sector.id)
      if (deleteResult.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Sector eliminado',
          text: 'El sector se eliminó exitosamente',
          timer: 1500,
          showConfirmButton: false
        })
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: deleteResult.error
        })
      }
    }
  }
  
  const resetForm = () => {
    setSectorForm({ name: '', location: '', hectares: '' })
    setShowSectorForm(false)
    setEditingSector(null)
  }
  
  
  
  if (loading && sectors.length === 0) {
    return (
      <div className="p-3 sm:p-4 lg:p-6">
        <LoadingSpinner size="lg" message="Cargando sectores..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 space-y-4 sm:p-4 sm:space-y-6 lg:p-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Gestión de Sectores</h1>
          <p className="text-sm text-gray-600 mt-1 sm:text-base">
            Administra tus sectores de cultivo - ubicaciones físicas donde realizas las siembras
          </p>
        </div>
        <button
          onClick={() => setShowSectorForm(true)}
          className="btn-primary w-full sm:w-auto"
          disabled={loading}
        >
          {UI_TEXTS.sectors.addSector}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {sectors.map((sector) => {
            const batteries = sectorBatteries[sector.id] || []
            const isExpanded = expandedSectors[sector.id]
            const isLoadingBatteries = loadingBatteries[sector.id]
            
            return (
            <div key={sector.id} className="card hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 sm:text-lg">{sector.name}</h3>
                  <div className="space-y-1 text-xs text-gray-600 sm:text-sm">
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span>{sector.location || 'Sin ubicación especificada'}</span>
                    </div>
                    {sector.hectares && (
                      <div className="flex items-center">
                        <span className="mr-2">📏</span>
                        <span>{sector.hectares} hectáreas</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="mr-2">🌱</span>
                      <span>{sector.lots?.length || 0} siembra{(sector.lots?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row space-x-1 sm:flex-col sm:space-x-0 sm:space-y-1">
                  <button
                    onClick={() => handleEditSector(sector)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar sector"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSector(sector)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Eliminar sector"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Baterías Section */}
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSectorExpansion(sector.id)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group"
                  >
                    <span className="mr-2 transition-transform duration-200 inline-block"
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                    <span className="mr-2">🔋</span>
                    Baterías
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                      {isLoadingBatteries ? '...' : (batteries.length || 0)}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSectorForBatteries(sector)
                      setExpandedSectors(prev => ({ ...prev, [sector.id]: true }))
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Agregar Batería
                  </button>
                </div>
                
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {isLoadingBatteries ? (
                      <div className="text-center py-4">
                        <LoadingSpinner size="sm" message="Cargando baterías..." />
                      </div>
                    ) : batteries.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {batteries.map((battery) => {
                          const lines = batteryLines[battery.id] || []
                          const isBatteryExpanded = expandedBatteries[battery.id]
                          const isLoadingLines = loadingLines[battery.id]

                          return (
                            <div key={battery.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleBatteryExpansion(battery.id)}
                                    className="flex items-center text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                                  >
                                    <span className="mr-2 transition-transform duration-200 inline-block"
                                          style={{ transform: isBatteryExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                      ▶
                                    </span>
                                    <span className="text-lg mr-2">🔋</span>
                                    <div>
                                      <span className="font-medium text-sm text-gray-800">{battery.name}</span>
                                      <span className="ml-2 text-xs text-gray-500">Batería {battery.letter}</span>
                                    </div>
                                  </button>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                    {isLoadingLines ? '...' : lines.length} líneas
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedBatteryForLines(battery)
                                      setExpandedBatteries(prev => ({ ...prev, [battery.id]: true }))
                                    }}
                                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                                    title="Gestionar líneas"
                                  >
                                    + Línea
                                  </button>
                                </div>
                              </div>

                              {isBatteryExpanded && (
                                <div className="mt-3 pl-6 space-y-2">
                                  {isLoadingLines ? (
                                    <div className="text-center py-2">
                                      <LoadingSpinner size="sm" message="Cargando líneas..." />
                                    </div>
                                  ) : lines.length > 0 ? (
                                    <div className="space-y-2">
                                      {lines.map((line) => {
                                        const occupied = line.occupiedSystems?.length || 0
                                        const total = line.totalSystems || 100
                                        const available = total - occupied
                                        const occupancyPercent = (occupied / total) * 100

                                        return (
                                          <div key={line.id} className="bg-white rounded-lg p-2 border border-gray-200">
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center">
                                                <span className="text-sm mr-2">🚢</span>
                                                <span className="font-medium text-xs text-gray-800">{line.name}</span>
                                              </div>
                                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                                line.status === 'available' ? 'bg-green-100 text-green-700' :
                                                line.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                line.status === 'full' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                              }`}>
                                                {line.status === 'available' ? 'Disponible' :
                                                 line.status === 'partial' ? 'Parcial' :
                                                 line.status === 'full' ? 'Completa' : 'Mantenimiento'}
                                              </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                              <span>Sistemas: {available}/{total}</span>
                                              <span>{line.floorsPerSystem} pisos/sistema</span>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 rounded p-2 text-center">
                                      <p className="text-xs text-gray-600">No hay líneas configuradas</p>
                                      <button
                                        onClick={() => setSelectedBatteryForLines(battery)}
                                        className="text-xs text-purple-600 hover:text-purple-800 font-medium underline mt-1"
                                      >
                                        Agregar línea
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <span className="text-4xl mb-2 block">🔋</span>
                        <p className="text-sm text-gray-600 mb-2">No hay baterías configuradas</p>
                        <button
                          onClick={() => setSelectedSectorForBatteries(sector)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Crear primera batería
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              <div className="border-t pt-3 mt-3 sm:pt-4">
                <div className="text-xs text-gray-500 mb-2 sm:text-sm sm:mb-3">
                  Creado {sector.createdAt ? new Date(sector.createdAt).toLocaleDateString('es-PE') : 'recientemente'}
                </div>
                {sector.lots && sector.lots.length > 0 && (
                  <div className="text-xs text-gray-600 sm:text-sm">
                    <div className="font-medium mb-1">Últimas siembras:</div>
                    <div className="space-y-1">
                      {sector.lots.slice(-2).map(lot => (
                        <div key={lot.id} className="text-xs bg-gray-50 p-1 rounded sm:p-2">
                          <div className="flex justify-between">
                            <span>{lot.origin}</span>
                            <span>{new Date(lot.entryDate).toLocaleDateString('es-PE')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        </div>
      )}
      
      <Modal
        isOpen={showSectorForm}
        onClose={resetForm}
        title={editingSector ? '🏭 Editar Sector' : '🏭 Agregar Nuevo Sector'}
        subtitle={editingSector ? 'Modifica los datos del sector seleccionado' : 'Crea un nuevo sector para organizar tus cultivos'}
        size="md"
        footer={
          <Modal.Actions>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              disabled={loading}
            >
              {UI_TEXTS.common.cancel}
            </button>
            <button
              type="submit"
              form="sector-form"
              className="btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" message="" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">{editingSector ? '✏️' : '➕'}</span>
                  {editingSector ? 'Actualizar Sector' : 'Crear Sector'}
                </>
              )}
            </button>
          </Modal.Actions>
        }
      >
        <form id="sector-form" onSubmit={handleCreateSector}>
          <Modal.Content>
            <div className="space-y-6">
              {/* Nombre del Sector */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">📝</span>
                  {UI_TEXTS.sectors.sectorName}
                  <span className="text-danger-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={sectorForm.name}
                  onChange={(e) => setSectorForm({...sectorForm, name: e.target.value})}
                  placeholder="Ej: Sector Norte, Zona A, Muelle Principal..."
                />
                <p className="text-xs text-slate-500">
                  Nombre descriptivo para identificar fácilmente este sector
                </p>
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">📍</span>
                  Ubicación Geográfica
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={sectorForm.location}
                  onChange={(e) => setSectorForm({...sectorForm, location: e.target.value})}
                  placeholder="Ej: Bahía de Sechura, Paracas, Pisco..."
                />
                <p className="text-xs text-slate-500">
                  Ubicación física donde se encuentra este sector (opcional)
                </p>
              </div>

              {/* Hectáreas */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">📏</span>
                  Área en Hectáreas
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field pr-12"
                    value={sectorForm.hectares}
                    onChange={(e) => setSectorForm({...sectorForm, hectares: e.target.value})}
                    placeholder="2.5"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-slate-400 text-sm">ha</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Extensión del sector para calcular densidades (opcional)
                </p>
              </div>

              {/* Info adicional para edición */}
              {editingSector && (
                <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-info-600 mr-3 mt-0.5">ℹ️</span>
                    <div>
                      <h4 className="text-sm font-medium text-info-800 mb-1">
                        Información del Sector
                      </h4>
                      <div className="text-xs text-info-700 space-y-1">
                        <p>• {editingSector.lots?.length || 0} siembra{(editingSector.lots?.length || 0) !== 1 ? 's' : ''} registrada{(editingSector.lots?.length || 0) !== 1 ? 's' : ''}</p>
                        <p>• Creado: {editingSector.createdAt ? new Date(editingSector.createdAt).toLocaleDateString('es-PE') : 'Fecha no disponible'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Modal.Content>
        </form>
      </Modal>
      
      {selectedSectorForBatteries && (
        <BatteryManager
          sector={selectedSectorForBatteries}
          onClose={() => {
            // Actualizar las baterías del sector cuando se cierre el modal
            fetchBatteries(selectedSectorForBatteries.id).then(result => {
              if (result.success) {
                setSectorBatteries(prev => ({
                  ...prev,
                  [selectedSectorForBatteries.id]: result.data || []
                }))
              }
            })
            setSelectedSectorForBatteries(null)
          }}
        />
      )}

      {selectedBatteryForLines && (
        <LineManager
          battery={selectedBatteryForLines}
          onClose={() => {
            // Actualizar las líneas de la batería cuando se cierre el modal
            fetchCultivationLines(selectedBatteryForLines.sectorId, selectedBatteryForLines.id).then(result => {
              if (result.success) {
                setBatteryLines(prev => ({
                  ...prev,
                  [selectedBatteryForLines.id]: result.data || []
                }))
              }
            })
            setSelectedBatteryForLines(null)
          }}
        />
      )}
    </div>
  )
}

export default SectorsPage