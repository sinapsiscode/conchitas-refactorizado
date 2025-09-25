import React, { useState, useEffect } from 'react'
import { CONVERSIONS, DEFAULT_PRESENTATIONS, DEFAULT_MEASURES, getAllConversions } from '../../constants/conversions'

const PresentationDistribution = ({
  planId,
  initialData = {},
  harvestData = {},
  onSave,
  onCancel,
  isEditing = false
}) => {
  // Estado para las presentaciones
  const [presentations, setPresentations] = useState(() => {
    if (initialData?.presentations) {
      return initialData.presentations
    }
    // Inicializar con las presentaciones por defecto
    return DEFAULT_PRESENTATIONS.map(pres => ({
      ...pres,
      measures: DEFAULT_MEASURES[pres.id] || []
    }))
  })

  // Estado para controlar qué presentaciones están expandidas
  const [expandedPresentations, setExpandedPresentations] = useState(() => {
    // Expandir todas las presentaciones por defecto para mejor UX
    if (initialData?.presentations) {
      return new Set(initialData.presentations.map(p => p.id))
    }
    return new Set(DEFAULT_PRESENTATIONS.map(p => p.id))
  })
  const [selectedPresentation, setSelectedPresentation] = useState(null)

  // Estado para los valores de peso por presentación-medida
  const [weights, setWeights] = useState(() => {
    return initialData?.weights || {}
  })

  // Estado para edición de nombres de presentaciones
  const [editingPresentation, setEditingPresentation] = useState(null)
  const [tempPresentationName, setTempPresentationName] = useState('')

  // Agregar nueva presentación
  const handleAddPresentation = () => {
    const newPresentation = {
      id: `custom_pres_${Date.now()}`,
      name: 'Nueva Presentación',
      measures: [],
      isNew: true
    }
    
    setPresentations(prev => [...prev, newPresentation])
    setExpandedPresentations(prev => new Set([...prev, newPresentation.id]))
    setEditingPresentation(newPresentation.id)
    setTempPresentationName(newPresentation.name)
  }

  // Eliminar presentación
  const handleRemovePresentation = (presentationId) => {
    if (presentations.length <= 1) {
      alert('Debe mantener al menos una presentación')
      return
    }
    
    setPresentations(prev => prev.filter(p => p.id !== presentationId))
    setExpandedPresentations(prev => {
      const newSet = new Set(prev)
      newSet.delete(presentationId)
      return newSet
    })
    
    // Limpiar pesos asociados
    setWeights(prev => {
      const newWeights = { ...prev }
      Object.keys(newWeights).forEach(key => {
        if (key.startsWith(`${presentationId}_`)) {
          delete newWeights[key]
        }
      })
      return newWeights
    })
  }

  // Manejar cambio de peso
  const handleWeightChange = (presentationId, measureId, value) => {
    const numValue = parseFloat(value) || 0
    setWeights(prev => ({
      ...prev,
      [`${presentationId}_${measureId}`]: numValue
    }))
  }

  // Agregar nueva medida a una presentación
  const handleAddMeasure = (presentationId) => {
    const newMeasure = {
      id: `custom_${Date.now()}`,
      name: 'Nueva medida',
      pricePerKg: 0,
      isNew: true
    }
    
    setPresentations(prev => prev.map(pres => 
      pres.id === presentationId 
        ? { ...pres, measures: [...pres.measures, newMeasure] }
        : pres
    ))
  }

  // Eliminar medida
  const handleRemoveMeasure = (presentationId, measureId) => {
    setPresentations(prev => prev.map(pres => 
      pres.id === presentationId 
        ? { ...pres, measures: pres.measures.filter(m => m.id !== measureId) }
        : pres
    ))
    
    // Limpiar el peso asociado
    const key = `${presentationId}_${measureId}`
    setWeights(prev => {
      const newWeights = { ...prev }
      delete newWeights[key]
      return newWeights
    })
  }

  // Editar nombre de medida
  const handleMeasureNameChange = (presentationId, measureId, newName) => {
    setPresentations(prev => prev.map(pres => 
      pres.id === presentationId 
        ? {
            ...pres,
            measures: pres.measures.map(m => 
              m.id === measureId ? { ...m, name: newName } : m
            )
          }
        : pres
    ))
  }

  // Editar precio de medida
  const handleMeasurePriceChange = (presentationId, measureId, newPrice) => {
    setPresentations(prev => prev.map(pres => 
      pres.id === presentationId 
        ? {
            ...pres,
            measures: pres.measures.map(m => 
              m.id === measureId ? { ...m, pricePerKg: parseFloat(newPrice) || 0 } : m
            )
          }
        : pres
    ))
  }

  // Iniciar edición de nombre de presentación
  const startEditingPresentation = (presentationId, currentName) => {
    setEditingPresentation(presentationId)
    setTempPresentationName(currentName)
  }

  // Guardar nombre de presentación
  const savePresentationName = (presentationId) => {
    if (tempPresentationName.trim()) {
      setPresentations(prev => prev.map(pres => 
        pres.id === presentationId 
          ? { ...pres, name: tempPresentationName.trim() }
          : pres
      ))
    }
    setEditingPresentation(null)
    setTempPresentationName('')
  }

  // Toggle de presentación expandida
  const togglePresentation = (presentationId) => {
    setExpandedPresentations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(presentationId)) {
        newSet.delete(presentationId)
      } else {
        newSet.add(presentationId)
      }
      return newSet
    })
  }

  // Expandir/Colapsar todas las presentaciones
  const toggleAllPresentations = () => {
    if (expandedPresentations.size === presentations.length) {
      setExpandedPresentations(new Set())
    } else {
      setExpandedPresentations(new Set(presentations.map(p => p.id)))
    }
  }

  // Calcular subtotal por presentación
  const calculatePresentationSubtotal = (presentationId) => {
    const presentation = presentations.find(p => p.id === presentationId)
    if (!presentation) return { weight: 0, revenue: 0 }

    let weight = 0
    let revenue = 0

    presentation.measures.forEach(measure => {
      const key = `${presentationId}_${measure.id}`
      const measureWeight = weights[key] || 0
      weight += measureWeight
      revenue += measureWeight * measure.pricePerKg
    })

    return { weight, revenue }
  }

  // Calcular totales
  const calculateTotals = () => {
    let totalKg = 0
    let totalRevenue = 0
    let totalConchitas = 0

    presentations.forEach(pres => {
      pres.measures.forEach(measure => {
        const key = `${pres.id}_${measure.id}`
        const weight = weights[key] || 0
        const revenue = weight * measure.pricePerKg
        
        totalKg += weight
        totalRevenue += revenue
      })
    })

    totalConchitas = Math.round(totalKg * CONVERSIONS.CONCHITAS_POR_KG)

    // Usar EXCLUSIVAMENTE los datos reales registrados en la ejecución de cosecha
    // Si están disponibles, no calcular nada - usar los valores directos
    let actualManojos, actualMallas

    if (harvestData.manojos !== undefined && harvestData.manojos !== null) {
      // Usar los manojos registrados directamente en la ejecución de cosecha
      actualManojos = harvestData.manojos
      actualMallas = (harvestData.manojos / 3).toFixed(2)
    } else if (harvestData.actualQuantity) {
      // Fallback: calcular desde actualQuantity si no hay manojos directos
      actualManojos = Math.round(harvestData.actualQuantity / 96)
      actualMallas = (actualManojos / 3).toFixed(2)
    } else {
      // Último fallback: calcular desde distribución (solo si no hay datos de cosecha)
      actualManojos = Math.round(totalConchitas / CONVERSIONS.CONCHITAS_POR_MANOJO)
      actualMallas = (totalKg / CONVERSIONS.KG_POR_MALLA).toFixed(2)
    }

    return {
      totalKg,
      totalRevenue,
      totalConchitas,
      totalManojos: actualManojos,
      totalMallas: actualMallas
    }
  }

  // Guardar cambios
  const handleSave = () => {
    const totals = calculateTotals()
    const data = {
      presentations,
      weights,
      totals,
      timestamp: new Date().toISOString()
    }
    onSave(planId, data)
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            📊 Distribución por Presentaciones
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPresentation}
              className="text-sm px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded hover:bg-blue-700 transition-colors"
              title="Agregar nueva presentación"
            >
              ➕ Presentación
            </button>
            <button
              onClick={toggleAllPresentations}
              className="text-sm px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              title={expandedPresentations.size === presentations.length ? "Colapsar todas" : "Expandir todas"}
            >
              {expandedPresentations.size === presentations.length ? "➖ Colapsar" : "➕ Expandir"} todas
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Registra el peso vendido en kilogramos para cada presentación y medida
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Doble clic en nombres de presentaciones para editarlos. 
            Los nombres de medidas y precios se pueden editar directamente haciendo clic en los campos.
          </p>
        </div>
        
        {/* Selector de presentación rápida */}
        <div className="mt-3">
          <select
            value={selectedPresentation || ''}
            onChange={(e) => {
              const value = e.target.value
              setSelectedPresentation(value)
              if (value) {
                setExpandedPresentations(new Set([value]))
              }
            }}
            className="input-field text-sm"
          >
            <option value="">Seleccionar presentación...</option>
            {presentations.map(pres => {
              const subtotal = calculatePresentationSubtotal(pres.id)
              return (
                <option key={pres.id} value={pres.id}>
                  {pres.name} {subtotal.weight > 0 ? `(${subtotal.weight.toFixed(2)} Kg - S/ ${subtotal.revenue.toFixed(2)})` : ''}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Presentaciones */}
      <div className="space-y-3">
        {presentations.map((presentation) => {
          const isExpanded = expandedPresentations.has(presentation.id)
          const subtotal = calculatePresentationSubtotal(presentation.id)
          const hasData = subtotal.weight > 0

          return (
            <div 
              key={presentation.id} 
              className={`card border-l-4 ${hasData ? 'border-green-500' : 'border-blue-500'} ${!isExpanded ? 'py-3' : ''}`}
            >
              {/* Encabezado de presentación */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Botón de expandir/colapsar */}
                  <button
                    onClick={() => togglePresentation(presentation.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title={isExpanded ? "Colapsar" : "Expandir"}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>

                  {editingPresentation === presentation.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempPresentationName}
                        onChange={(e) => setTempPresentationName(e.target.value)}
                        onBlur={() => savePresentationName(presentation.id)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') savePresentationName(presentation.id)
                        }}
                        className="input-field text-sm font-semibold"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => togglePresentation(presentation.id)}
                    >
                      <h4 
                        className="text-base font-semibold text-gray-900 hover:text-blue-600 hover:cursor-text transition-colors duration-200 px-1 py-1 rounded hover:bg-blue-50"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          startEditingPresentation(presentation.id, presentation.name)
                        }}
                        title="✏️ Doble clic para editar nombre de presentación"
                      >
                        {presentation.name}
                      </h4>
                      {!isExpanded && (
                        <span className="text-sm text-gray-500">
                          ({presentation.measures.length} medidas)
                        </span>
                      )}
                      {isExpanded && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingPresentation(presentation.id, presentation.name)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title="Editar nombre"
                        >
                          ✏️
                        </button>
                      )}
                    </div>
                  )}

                  {/* Resumen compacto cuando está colapsado */}
                  {!isExpanded && hasData && (
                    <div className="flex items-center gap-4 ml-auto text-sm">
                      <span className="text-gray-600">
                        <strong>{subtotal.weight.toFixed(2)}</strong> Kg
                      </span>
                      <span className="text-green-600 font-semibold">
                        S/ {subtotal.revenue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="flex items-center gap-2">
                    {presentations.length > 1 && (
                      <button
                        onClick={() => handleRemovePresentation(presentation.id)}
                        className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 transition-colors"
                        title="Eliminar presentación"
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      onClick={() => handleAddMeasure(presentation.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      + Agregar medida
                    </button>
                  </div>
                )}
              </div>

              {/* Medidas - Solo visible cuando está expandido */}
              {isExpanded && (
                <div className="space-y-2 mt-4">
              {presentation.measures.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No hay medidas configuradas. Haz clic en "Agregar medida" para comenzar.
                </p>
              ) : (
                presentation.measures.map((measure) => {
                  const key = `${presentation.id}_${measure.id}`
                  const weight = weights[key] || 0
                  const conversions = weight > 0 ? getAllConversions(weight) : null
                  const revenue = weight * measure.pricePerKg

                  return (
                    <div key={measure.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Nombre de medida */}
                      <div className="md:col-span-3">
                        <label className="text-xs text-gray-600">Medida</label>
                        <input
                          type="text"
                          value={measure.name}
                          onChange={(e) => handleMeasureNameChange(presentation.id, measure.id, e.target.value)}
                          className="input-field text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="Nombre de medida"
                          title="✏️ Haz clic para editar el nombre de medida"
                        />
                      </div>

                      {/* Peso en Kg */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Peso (Kg)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={weight || ''}
                          onChange={(e) => handleWeightChange(presentation.id, measure.id, e.target.value)}
                          className="input-field text-sm"
                          placeholder="0.0"
                        />
                      </div>

                      {/* Precio por Kg */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Precio/Kg (S/)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={measure.pricePerKg || ''}
                          onChange={(e) => handleMeasurePriceChange(presentation.id, measure.id, e.target.value)}
                          className="input-field text-sm hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                          placeholder="0.00"
                          title="💰 Haz clic para editar el precio por kilogramo"
                        />
                      </div>

                      {/* Ingreso */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Ingreso (S/)</label>
                        <div className="input-field text-sm bg-white font-semibold text-green-600">
                          {revenue.toFixed(2)}
                        </div>
                      </div>

                      {/* Conversiones */}
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600">Equivalencias</label>
                        {conversions ? (
                          <div className="text-xs text-gray-700 space-y-0.5">
                            <div>🐚 {conversions.conchitas.toLocaleString()} unid</div>
                            <div>📦 {conversions.manojos} manojos</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">-</div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="md:col-span-1 flex items-end">
                        <button
                          onClick={() => handleRemoveMeasure(presentation.id, measure.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="Eliminar medida"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>
            )}

              {/* Subtotal por presentación - Solo visible cuando está expandido y tiene medidas */}
              {isExpanded && presentation.measures.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal {presentation.name}:</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {subtotal.weight.toFixed(2)} Kg
                      </span>
                      <span className="text-gray-600 ml-2">
                        = S/ {subtotal.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumen de totales */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">📈 Resumen Total</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-gray-600">Peso Total</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalKg.toFixed(2)} Kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Ingreso Total</p>
            <p className="text-lg font-bold text-green-600">S/ {totals.totalRevenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Conchitas</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalConchitas.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Manojos</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalManojos.toLocaleString()}</p>
            <p className="text-xs text-blue-600">📋 De cosecha ejecutada</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Mallas</p>
            <p className="text-lg font-bold text-gray-900">{totals.totalMallas}</p>
            <p className="text-xs text-blue-600">📋 De cosecha ejecutada</p>
          </div>
        </div>
        
        {/* Análisis por Unidad - Precios */}
        <div className="mt-4 pt-3 border-t border-green-200">
          <h5 className="text-sm font-semibold text-green-800 mb-2">🔍 Análisis de Precios por Unidad</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded p-3 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Precio por Manojo</div>
              <div className="text-lg font-bold text-green-700">
                S/ {totals.totalManojos > 0 ? (totals.totalRevenue / totals.totalManojos).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-gray-500">({CONVERSIONS.CONCHITAS_POR_MANOJO} unidades)</div>
            </div>
            <div className="bg-white rounded p-3 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Precio por Malla</div>
              <div className="text-lg font-bold text-green-700">
                S/ {parseFloat(totals.totalMallas) > 0 ? (totals.totalRevenue / parseFloat(totals.totalMallas)).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-gray-500">({CONVERSIONS.KG_POR_MALLA} kg)</div>
            </div>
            <div className="bg-white rounded p-3 border border-green-100">
              <div className="text-xs text-gray-600 mb-1">Precio por Conchita</div>
              <div className="text-lg font-bold text-green-700">
                S/ {totals.totalConchitas > 0 ? (totals.totalRevenue / totals.totalConchitas).toFixed(4) : '0.0000'}
              </div>
              <div className="text-xs text-gray-500">(unidad)</div>
            </div>
          </div>
        </div>
        
        {/* Información de conversiones */}
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs text-gray-600">
            📐 Conversiones: 1 Kg = {CONVERSIONS.CONCHITAS_POR_KG} conchitas | 
            1 manojo = {CONVERSIONS.CONCHITAS_POR_MANOJO} conchitas | 
            1 malla = {CONVERSIONS.KG_POR_MALLA} Kg
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={totals.totalKg === 0}
        >
          💾 Guardar Distribución
        </button>
      </div>
    </div>
  )
}

export default PresentationDistribution