import React, { useState, useEffect } from 'react'

const SystemSelector = ({ line, selectedSystems, onSystemsChange }) => {
  const [selectionMode, setSelectionMode] = useState('range')
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(10)
  const [individualSystems, setIndividualSystems] = useState([])
  
  // Automáticamente usar todos los pisos disponibles
  const allFloors = Array.from({ length: line?.floorsPerSystem || 10 }, (_, i) => i + 1)
  
  useEffect(() => {
    if (selectionMode === 'range') {
      const systems = []
      for (let i = rangeStart; i <= rangeEnd; i++) {
        systems.push({
          systemNumber: i,
          floors: allFloors // Todos los pisos automáticamente
        })
      }
      onSystemsChange(systems)
    } else {
      const systems = individualSystems.map(num => ({
        systemNumber: num,
        floors: allFloors // Todos los pisos automáticamente
      }))
      onSystemsChange(systems)
    }
  }, [selectionMode, rangeStart, rangeEnd, individualSystems, line?.floorsPerSystem])
  
  const toggleSystem = (num) => {
    if (individualSystems.includes(num)) {
      setIndividualSystems(individualSystems.filter(s => s !== num))
    } else {
      setIndividualSystems([...individualSystems, num].sort((a, b) => a - b))
    }
  }
  
  const isSystemOccupied = (systemNumber) => {
    return line?.occupiedSystems?.some(s => s.systemNumber === systemNumber)
  }
  
  const getAvailableSystemsCount = () => {
    const occupied = line?.occupiedSystems?.length || 0
    const total = line?.totalSystems || 100
    return total - occupied
  }
  
  return (
    <div className="space-y-4">
      {/* Modo de selección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modo de selección de sistemas
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="range"
              checked={selectionMode === 'range'}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">Rango continuo</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="individual"
              checked={selectionMode === 'individual'}
              onChange={(e) => setSelectionMode(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">Sistemas individuales</span>
          </label>
        </div>
      </div>
      
      {/* Selección por rango */}
      {selectionMode === 'range' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sistema inicial
            </label>
            <input
              type="number"
              min="1"
              max={line?.totalSystems || 100}
              value={rangeStart}
              onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
              onWheel={(e) => e.target.blur()}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sistema final
            </label>
            <input
              type="number"
              min={rangeStart}
              max={line?.totalSystems || 100}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(parseInt(e.target.value) || rangeStart)}
              onWheel={(e) => e.target.blur()}
              className="input-field"
            />
          </div>
        </div>
      )}
      
      {/* Selección individual */}
      {selectionMode === 'individual' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Selecciona los sistemas ({getAvailableSystemsCount()} disponibles de {line?.totalSystems || 100})
          </label>
          <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {Array.from({ length: line?.totalSystems || 100 }, (_, i) => i + 1).map(num => {
              const isOccupied = isSystemOccupied(num)
              const isSelected = individualSystems.includes(num)
              
              return (
                <button
                  key={num}
                  type="button"
                  disabled={isOccupied}
                  onClick={() => toggleSystem(num)}
                  title={isOccupied ? 'Sistema ocupado' : `Sistema ${num}`}
                  className={`
                    p-2 text-xs font-medium rounded transition-all
                    ${isOccupied 
                      ? 'bg-red-100 text-red-400 cursor-not-allowed opacity-50' 
                      : isSelected 
                        ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }
                  `}
                >
                  {num}
                </button>
              )
            })}
          </div>
          {individualSystems.length > 0 && (
            <p className="text-xs text-blue-600 mt-2 font-medium">
              {individualSystems.length} sistema(s) seleccionado(s): {individualSystems.join(', ')}
            </p>
          )}
        </div>
      )}
      
      {/* Información de pisos automáticos */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-green-900 mb-1 flex items-center">
          <span className="mr-2">✅</span>
          Pisos seleccionados automáticamente
        </h4>
        <p className="text-xs text-green-700">
          Se utilizarán todos los {line?.floorsPerSystem || 10} pisos disponibles en cada sistema seleccionado.
        </p>
      </div>
      
      {/* Resumen de selección */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-blue-900 mb-1">
          📊 Resumen de selección
        </h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>
            • Modo: {selectionMode === 'range' ? 'Rango continuo' : 'Sistemas individuales'}
          </p>
          <p>
            • Sistemas: {
              selectionMode === 'range' 
                ? `Del ${rangeStart} al ${rangeEnd} (${rangeEnd - rangeStart + 1} sistemas)`
                : `${individualSystems.length} sistema(s) seleccionado(s)`
            }
          </p>
          <p>
            • Pisos por sistema: {line?.floorsPerSystem || 10} (todos)
          </p>
          <p className="font-semibold text-blue-800">
            • Total de posiciones: {
              selectionMode === 'range'
                ? (rangeEnd - rangeStart + 1) * (line?.floorsPerSystem || 10)
                : individualSystems.length * (line?.floorsPerSystem || 10)
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default SystemSelector