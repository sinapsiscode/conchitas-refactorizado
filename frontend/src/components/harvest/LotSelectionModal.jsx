import React, { useState } from 'react'
import Modal from '../common/Modal'

const LotSelectionModal = ({ isOpen, onClose, readyLots, onLotSelect }) => {
  const [selectedLineId, setSelectedLineId] = useState(null)
  const [selectedSystems, setSelectedSystems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  // readyLots ahora son readyLines (líneas con sistemas listos)
  const readyLines = readyLots || []
  
  // Filtrar líneas por búsqueda
  const filteredLines = readyLines.filter(line => 
    line.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.sectorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    line.lineName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectLine = () => {
    const selectedLine = readyLines.find(line => line.id === selectedLineId)
    if (selectedLine && selectedSystems.length > 0) {
      // Enviar la línea con los sistemas seleccionados
      const lineWithSelectedSystems = {
        ...selectedLine,
        selectedSystems: selectedSystems
      }
      onLotSelect(lineWithSelectedSystems)
      onClose()
    }
  }
  
  const handleSystemToggle = (systemNumber) => {
    setSelectedSystems(prev => {
      if (prev.includes(systemNumber)) {
        return prev.filter(s => s !== systemNumber)
      } else {
        return [...prev, systemNumber]
      }
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE')
  }

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-green-100 text-green-800',
      growing: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      ready: 'Listo',
      growing: 'En Crecimiento'
    }
    return texts[status] || status
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🎯 Seleccionar Línea y Sistemas para Cosecha"
      subtitle="Elige la línea de cultivo y los sistemas específicos que deseas cosechar"
      size="xl"
      footer={
        <Modal.Actions>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSelectLine}
            disabled={!selectedLineId || selectedSystems.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar con la Planificación ({selectedSystems.length} sistemas)
          </button>
        </Modal.Actions>
      }
    >
      <Modal.Content className="flex flex-col h-full min-h-0">
          {/* Barra de búsqueda */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por origen, sector o nombre de línea..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Lista de líneas */}
          <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {filteredLines.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-medium">
                  {searchTerm ? 
                    'No se encontraron líneas' : 
                    'No hay líneas con la talla mínima requerida'
                  }
                </p>
                <p className="text-sm mt-2">
                  {searchTerm ? 
                    'Intenta con otros términos de búsqueda' : 
                    'Revisa el estado de tus cultivos'
                  }
                </p>
              </div>
            ) : (
              filteredLines.map((line) => (
                <div
                  key={line.id}
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    selectedLineId === line.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedLineId(line.id)
                    setSelectedSystems([]) // Resetear sistemas al cambiar de línea
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-xs sm:text-sm">
                              📍
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Línea {line.lineName}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">{line.sectorName}</span> • {line.origin}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Cantidad</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {line.currentQuantity?.toLocaleString() || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.round(line.currentQuantity / 96).toLocaleString()} manojos
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Siembra</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {formatDate(line.entryDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Edad</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            {line.monthsOld} meses
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Tallas (mm)</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                            Prom: {line.averageSize || 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Min: {line.minSize || 'N/A'} - Max: {line.maxSize || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Sección de selección de sistemas */}
                      {selectedLineId === line.id && line.systems && line.systems.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg max-h-64 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">
                              Selecciona los sistemas a cosechar:
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const allSystemNumbers = line.systems.map(s => s.systemNumber)
                                if (selectedSystems.length === line.systems.length) {
                                  // Si todos están seleccionados, deseleccionar todos
                                  setSelectedSystems([])
                                } else {
                                  // Si no todos están seleccionados, seleccionar todos
                                  setSelectedSystems(allSystemNumbers)
                                }
                              }}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              {selectedSystems.length === line.systems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                            </button>
                          </div>
                          <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {line.systems.map((system) => (
                              <button
                                key={system.systemNumber}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSystemToggle(system.systemNumber)
                                }}
                                className={`p-1.5 sm:p-2 text-xs font-medium rounded transition-all ${
                                  selectedSystems.includes(system.systemNumber)
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                {system.systemNumber}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-600">
                              {selectedSystems.length} de {line.systems.length} sistemas seleccionados
                            </span>
                            {selectedSystems.length > 0 && (
                              <span className="text-xs font-medium text-blue-600">
                                ✓ {Math.round((selectedSystems.length / line.systems.length) * 100)}% seleccionado
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-3">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(line.status)}`}>
                            {getStatusText(line.status)}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {line.systems?.length || 0} sistemas
                          </span>
                        </div>
                        
                        {/* Indicadores de preparación */}
                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                          {line.averageSize >= 75 && (
                            <span className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Talla óptima
                            </span>
                          )}
                          {line.monthsOld >= 6 && (
                            <span className="flex items-center text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Madurez completa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Radio button visual */}
                    <div className="ml-2 sm:ml-4">
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedLineId === line.id
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedLineId === line.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </Modal.Content>
    </Modal>
  )
}

export default LotSelectionModal