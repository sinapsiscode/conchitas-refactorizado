import React, { useState, useEffect } from 'react'
import { useHarvestStore } from '../../stores'
import { useInventoryStore } from '../../stores'
import LoadingSpinner from '../common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const HarvestExecutionModal = ({ isOpen, onClose, selectedPlan, user }) => {
  const { updateHarvestPlan, loading, harvestCostCategories, fetchHarvestCostCategories } = useHarvestStore()
  const { inventory, fetchInventory } = useInventoryStore()
  
  const [executeForm, setExecuteForm] = useState({
    actualDate: new Date().toISOString().split('T')[0],
    actualQuantity: '',
    actualMallas: '',
    actualCosts: {},
    notes: '',
    inventoryUsed: []
  })
  
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState('')

  // Funciones de conversión
  const calculateFromMallas = (mallas) => {
    const numMallas = parseFloat(mallas) || 0
    const totalUnidades = Math.round(numMallas * 288) // 1 malla = 288 unidades
    const totalManojos = Math.round(numMallas * 3) // 1 malla = 3 manojos
    return { totalUnidades, totalManojos }
  }

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchHarvestCostCategories()
      fetchInventory(user.id)
    }
  }, [isOpen, user?.id, fetchHarvestCostCategories, fetchInventory])

  useEffect(() => {
    if (selectedPlan) {
      // NO pre-llenar los campos para que el usuario vea claramente la diferencia
      // Solo pre-llenar la cantidad estimada como referencia
      setExecuteForm(prev => ({
        ...prev,
        actualQuantity: '', // Dejar vacío para que el usuario ingrese el valor real
        actualMallas: '', // Dejar vacío para que el usuario ingrese las mallas
        actualCosts: {} // No pre-llenar costos
      }))
    }
  }, [selectedPlan])


  const handleCostChange = (categoryId, field, value) => {
    setExecuteForm(prev => ({
      ...prev,
      actualCosts: {
        ...prev.actualCosts,
        [categoryId]: {
          ...prev.actualCosts[categoryId],
          [field]: value
        }
      }
    }))
  }

  const handleAddInventoryItem = () => {
    if (!selectedInventoryItem || !inventoryQuantity || inventoryQuantity <= 0) return
    
    const item = inventory.find(i => i.id === selectedInventoryItem)
    if (!item) return
    
    const existingIndex = executeForm.inventoryUsed.findIndex(i => i.id === selectedInventoryItem)
    
    if (existingIndex >= 0) {
      const updatedItems = [...executeForm.inventoryUsed]
      updatedItems[existingIndex].quantity = parseFloat(inventoryQuantity)
      setExecuteForm(prev => ({
        ...prev,
        inventoryUsed: updatedItems
      }))
    } else {
      setExecuteForm(prev => ({
        ...prev,
        inventoryUsed: [
          ...prev.inventoryUsed,
          {
            id: item.id,
            name: item.name,
            quantity: parseFloat(inventoryQuantity),
            unit: item.unit,
            unitCost: item.unitCost,
            maxQuantity: item.quantity
          }
        ]
      }))
    }
    
    setSelectedInventoryItem('')
    setInventoryQuantity('')
  }
  
  const handleRemoveInventoryItem = (itemId) => {
    setExecuteForm(prev => ({
      ...prev,
      inventoryUsed: prev.inventoryUsed.filter(item => item.id !== itemId)
    }))
  }
  
  const handleUpdateInventoryQuantity = (itemId, newQuantity) => {
    const updatedItems = executeForm.inventoryUsed.map(item => 
      item.id === itemId ? { ...item, quantity: parseFloat(newQuantity) || 0 } : item
    )
    setExecuteForm(prev => ({
      ...prev,
      inventoryUsed: updatedItems
    }))
  }


  const calculateTotalActualCost = () => {
    return Object.entries(executeForm.actualCosts).reduce((total, [categoryId, costData]) => {
      const category = harvestCostCategories.find(c => c.id === categoryId)
      const quantity = parseFloat(costData.quantity || 0)
      const unitCost = parseFloat(costData.unitCost || category?.estimatedCost || 0)
      return total + (quantity * unitCost)
    }, 0)
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    // Calcular la cantidad total basándose en las mallas ingresadas
    const { totalUnidades } = calculateFromMallas(executeForm.actualMallas)
    const actualQuantity = totalUnidades

    const executeData = {
      id: selectedPlan.id,
      actualDate: executeForm.actualDate,
      actualQuantity,
      actualCosts: executeForm.actualCosts,
      totalActualCost: calculateTotalActualCost(),
      inventoryUsed: executeForm.inventoryUsed,
      notes: executeForm.notes,
      status: 'completed'
    }

    try {
      const result = await updateHarvestPlan(executeData)

      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Cosecha registrada',
          text: 'Los datos de la cosecha se guardaron exitosamente',
          timer: 2000,
          showConfirmButton: false
        })
        onClose()
      } else {
        throw new Error(result.error || 'Error al registrar cosecha')
      }
    } catch (error) {
      console.error('Error updating harvest plan:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al registrar la cosecha'
      })
    }
  }

  if (!isOpen || !selectedPlan) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-0">
      <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md lg:max-w-5xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                🎣 Ejecutar Cosecha
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Plan del {new Date(selectedPlan.plannedDate).toLocaleDateString('es-PE')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Resumen de la planificación original */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              📋 Planificación Original
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Planificada</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {new Date(selectedPlan.plannedDate).toLocaleDateString('es-PE')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cantidad Estimada</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  {selectedPlan.estimatedQuantity ? Math.round(selectedPlan.estimatedQuantity / 288).toLocaleString() : 'N/A'} mallas
                </p>
                {selectedPlan.estimatedQuantity && (
                  <p className="text-xs text-gray-500">
                    ({Math.round(selectedPlan.estimatedQuantity / 96).toLocaleString()} manojos | {selectedPlan.estimatedQuantity.toLocaleString()} unidades)
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Costo Total Planificado</p>
                <p className="text-sm sm:text-base font-semibold text-gray-900">
                  S/ {selectedPlan.totalPlannedCost?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            
            {selectedPlan.inventoryToUse && selectedPlan.inventoryToUse.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 font-medium mb-2">Inventario planificado:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.inventoryToUse.map((item, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-white border border-blue-300 rounded-full">
                      {item.name}: {item.quantity} {item.unit}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedPlan.notes && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 font-medium mb-1">Notas de planificación:</p>
                <p className="text-xs text-gray-700 italic">{selectedPlan.notes}</p>
              </div>
            )}
          </div>

          {/* Datos reales de cosecha */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              ✅ Datos Reales de Cosecha
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha real de cosecha *
                </label>
                <input
                  type="date"
                  required
                  className="input-field text-sm"
                  value={executeForm.actualDate}
                  onChange={(e) => setExecuteForm({...executeForm, actualDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cantidad de mallas entregadas *
                  {selectedPlan.estimatedQuantity && (
                    <span className="text-xs text-blue-600 font-normal ml-1">
                      (Planificado: {Math.round(selectedPlan.estimatedQuantity / 288).toLocaleString()} mallas)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.1"
                  className="input-field text-sm"
                  value={executeForm.actualMallas}
                  onChange={(e) => {
                    const value = e.target.value
                    setExecuteForm({...executeForm, actualMallas: value})
                  }}
                  placeholder="Número de mallas entregadas"
                />
                {/* Mostrar cálculos automáticos */}
                {executeForm.actualMallas && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-800 space-y-1">
                      <div><strong>📦 Manojos calculados:</strong> {calculateFromMallas(executeForm.actualMallas).totalManojos.toLocaleString()} manojos</div>
                      <div><strong>🔢 Unidades calculadas:</strong> {calculateFromMallas(executeForm.actualMallas).totalUnidades.toLocaleString()} unidades</div>
                    </div>
                  </div>
                )}
                {executeForm.actualMallas && selectedPlan.estimatedQuantity && (
                  <div className="mt-2">
                    <span className={`text-xs font-medium ${
                      calculateFromMallas(executeForm.actualMallas).totalUnidades >= selectedPlan.estimatedQuantity
                        ? 'text-green-600'
                        : 'text-amber-600'
                    }`}>
                      {calculateFromMallas(executeForm.actualMallas).totalUnidades >= selectedPlan.estimatedQuantity ? '✓' : '⚠'}
                      {' Diferencia: '}
                      {(calculateFromMallas(executeForm.actualMallas).totalUnidades - selectedPlan.estimatedQuantity).toLocaleString()} unidades
                      {' ('}
                      {((calculateFromMallas(executeForm.actualMallas).totalUnidades / selectedPlan.estimatedQuantity - 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gastos adicionales de cosecha */}
          <div className="card">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                ⚓ Gastos de Cosecha
              </h3>
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                <strong>💡 Información:</strong> Los campos marcados como "📋 Planificado" son los mismos que se configuraron durante la planificación y aparecen automáticamente para comparación. No se pueden eliminar, pero puedes agregar campos adicionales si es necesario.
              </p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {(() => {
                // Combinar categorías planificadas con las activas del store
                const plannedCostIds = Object.keys(selectedPlan?.plannedCosts || {})
                const activeCategoryIds = harvestCostCategories.filter(c => c.isActive).map(c => c.id)

                // Crear lista unificada sin duplicados
                const allCategoryIds = [...new Set([...plannedCostIds, ...activeCategoryIds])]

                return allCategoryIds.map(categoryId => {
                  const category = harvestCostCategories.find(c => c.id === categoryId)
                  const costData = executeForm.actualCosts[categoryId] || {}
                  const plannedData = selectedPlan?.plannedCosts?.[categoryId] || {}
                  const isPlannedCategory = plannedCostIds.includes(categoryId)

                  // Si la categoría no existe en el store pero está en planificados, crear una representación básica
                  const categoryInfo = category || {
                    id: categoryId,
                    name: `Categoría (${categoryId})`,
                    description: 'Categoría planificada',
                    unit: 'unidad',
                    estimatedCost: 0,
                    isActive: false
                  }
                
                return (
                  <div key={categoryInfo.id} className={`border rounded-lg p-3 sm:p-4 ${isPlannedCategory ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                    {/* Encabezado con nombre y descripción */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{categoryInfo.name}</h4>
                        {isPlannedCategory && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            📋 Planificado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{categoryInfo.description}</p>
                    </div>
                    
                    {/* Comparativo Planificado vs Real */}
                    {plannedData.quantity && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                            📋 Valores Planificados
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-white rounded p-2 border border-blue-100">
                            <p className="text-gray-600 font-medium">Cantidad</p>
                            <p className="text-blue-700 font-bold text-sm">
                              {plannedData.quantity} {category.unit}
                            </p>
                          </div>
                          <div className="bg-white rounded p-2 border border-blue-100">
                            <p className="text-gray-600 font-medium">Costo Unit.</p>
                            <p className="text-blue-700 font-bold text-sm">
                              S/ {plannedData.unitCost || categoryInfo.estimatedCost}
                            </p>
                          </div>
                          <div className="bg-white rounded p-2 border border-blue-100">
                            <p className="text-gray-600 font-medium">Total</p>
                            <p className="text-blue-700 font-bold text-sm">
                              S/ {(parseFloat(plannedData.quantity) * parseFloat(plannedData.unitCost || categoryInfo.estimatedCost)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Campos de entrada para valores reales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad Real ({categoryInfo.unit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          className="input-field text-sm"
                          value={costData.quantity || ''}
                          onChange={(e) => handleCostChange(categoryInfo.id, 'quantity', e.target.value)}
                          placeholder={plannedData.quantity || '0'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Costo Unitario Real (S/)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input-field text-sm"
                          value={costData.unitCost || ''}
                          onChange={(e) => handleCostChange(categoryInfo.id, 'unitCost', e.target.value)}
                          placeholder={plannedData.unitCost || categoryInfo.estimatedCost}
                        />
                      </div>
                    </div>
                    
                    {/* Subtotal y comparación en tiempo real */}
                    {(costData.quantity || plannedData.quantity) && (
                      <div className="mt-3 border-t pt-3">
                        <div className="grid grid-cols-2 gap-3">
                          {/* Columna Real */}
                          <div className={`p-2 rounded-lg ${costData.quantity ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className="text-xs font-medium text-gray-600 mb-1">💰 Total Real</p>
                            <p className="text-lg font-bold text-gray-900">
                              S/ {costData.quantity ? (
                                parseFloat(costData.quantity || 0) *
                                parseFloat(costData.unitCost || categoryInfo.estimatedCost)
                              ).toFixed(2) : '0.00'}
                            </p>
                            {costData.quantity && (
                              <p className="text-xs text-gray-600 mt-1">
                                {costData.quantity} × S/{costData.unitCost || categoryInfo.estimatedCost}
                              </p>
                            )}
                          </div>

                          {/* Columna Planificado */}
                          {plannedData.quantity && (
                            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                              <p className="text-xs font-medium text-gray-600 mb-1">📋 Total Planificado</p>
                              <p className="text-lg font-bold text-blue-700">
                                S/ {(
                                  parseFloat(plannedData.quantity || 0) *
                                  parseFloat(plannedData.unitCost || categoryInfo.estimatedCost)
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {plannedData.quantity} × S/{plannedData.unitCost || categoryInfo.estimatedCost}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Indicador de diferencia */}
                        {costData.quantity && plannedData.quantity && (
                          <div className="mt-2 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              (parseFloat(costData.quantity || 0) * parseFloat(costData.unitCost || categoryInfo.estimatedCost)) <=
                              (parseFloat(plannedData.quantity || 0) * parseFloat(plannedData.unitCost || categoryInfo.estimatedCost))
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {((parseFloat(costData.quantity || 0) * parseFloat(costData.unitCost || categoryInfo.estimatedCost)) <=
                               (parseFloat(plannedData.quantity || 0) * parseFloat(plannedData.unitCost || categoryInfo.estimatedCost)))
                                ? '✓ Dentro del presupuesto'
                                : '⚠ Excede lo planificado'}
                              {' • Diferencia: S/ '}
                              {((parseFloat(costData.quantity || 0) * parseFloat(costData.unitCost || categoryInfo.estimatedCost)) -
                                (parseFloat(plannedData.quantity || 0) * parseFloat(plannedData.unitCost || categoryInfo.estimatedCost))).toFixed(2)}
                              {' ('}
                              {(((parseFloat(costData.quantity || 0) * parseFloat(costData.unitCost || categoryInfo.estimatedCost)) /
                                (parseFloat(plannedData.quantity || 0) * parseFloat(plannedData.unitCost || categoryInfo.estimatedCost)) - 1) * 100).toFixed(1)}
                              {'%)'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
                })
              })()}

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Costo Real</p>
                    <p className="text-xl font-bold text-orange-600">
                      S/ {calculateTotalActualCost().toFixed(2)}
                    </p>
                  </div>
                  {selectedPlan?.totalPlannedCost > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Costo Planificado</p>
                      <p className="text-xl font-bold text-blue-600">
                        S/ {selectedPlan.totalPlannedCost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                {selectedPlan?.totalPlannedCost > 0 && (
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <span className={`text-sm font-medium ${
                      calculateTotalActualCost() <= selectedPlan.totalPlannedCost
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {calculateTotalActualCost() <= selectedPlan.totalPlannedCost ? '✓ Dentro del presupuesto' : '⚠ Excede el presupuesto'}
                      {' (Diferencia: S/ '}
                      {Math.abs(calculateTotalActualCost() - selectedPlan.totalPlannedCost).toFixed(2)}
                      {', '}
                      {((calculateTotalActualCost() / selectedPlan.totalPlannedCost - 1) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventario utilizado */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              📦 Inventario Utilizado
            </h3>
            
            {/* Selector de inventario */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Seleccionar ítem del inventario
                  </label>
                  <select
                    className="input-field text-sm"
                    value={selectedInventoryItem}
                    onChange={(e) => setSelectedInventoryItem(e.target.value)}
                  >
                    <option value="">Seleccione un ítem...</option>
                    {inventory.filter(item => item.category === 'harvest' && item.status === 'available').map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - Stock: {item.quantity} {item.unit} - S/{item.unitCost.toFixed(2)}/{item.unit}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sm:w-32">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className="input-field text-sm"
                    value={inventoryQuantity}
                    onChange={(e) => setInventoryQuantity(e.target.value)}
                    placeholder="0"
                    disabled={!selectedInventoryItem}
                  />
                </div>
                
                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={handleAddInventoryItem}
                    className="btn-primary w-full sm:w-auto text-sm"
                    disabled={!selectedInventoryItem || !inventoryQuantity || inventoryQuantity <= 0}
                  >
                    Agregar
                  </button>
                </div>
              </div>
              
              {selectedInventoryItem && (
                <div className="mt-2">
                  {(() => {
                    const item = inventory.find(i => i.id === selectedInventoryItem)
                    return item && inventoryQuantity > item.quantity ? (
                      <p className="text-xs text-red-600">
                        ⚠️ La cantidad solicitada ({inventoryQuantity}) excede el stock disponible ({item.quantity} {item.unit})
                      </p>
                    ) : null
                  })()}
                </div>
              )}
            </div>
            
            {/* Lista de ítems agregados */}
            {executeForm.inventoryUsed.length === 0 ? (
              <p className="text-gray-500 text-center py-4 border-t">
                No se ha agregado inventario aún
              </p>
            ) : (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ítems utilizados:</h4>
                <div className="space-y-2">
                  {executeForm.inventoryUsed.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          Costo unitario: S/{item.unitCost.toFixed(2)}/{item.unit} | Stock máx: {item.maxQuantity} {item.unit}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={item.maxQuantity}
                          step="0.1"
                          className="w-20 input-field text-sm"
                          value={item.quantity}
                          onChange={(e) => handleUpdateInventoryQuantity(item.id, e.target.value)}
                        />
                        <span className="text-sm text-gray-600">{item.unit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInventoryItem(item.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar ítem"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total del inventario */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Costo total de inventario:</span>
                    <span className="text-sm font-bold text-blue-700">
                      S/ {executeForm.inventoryUsed.reduce((total, item) => 
                        total + (item.quantity * item.unitCost), 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Observaciones de la cosecha
            </label>
            <textarea
              rows="3"
              className="input-field text-sm"
              value={executeForm.notes}
              onChange={(e) => setExecuteForm({...executeForm, notes: e.target.value})}
              placeholder="Detalles sobre la cosecha realizada, condiciones, incidencias..."
            />
          </div>

          {/* Botones */}
          <div className="sticky bottom-0 bg-white border-t border-slate-100 -mx-4 sm:-mx-6 px-8 py-8 mt-6">
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary text-sm"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" message="" /> : 'Registrar Cosecha'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HarvestExecutionModal