import React, { useState, useEffect } from 'react'
import { useHarvestStore } from '../../stores/harvestStoreNew'
import { useInventoryStore } from '../../stores'
import LoadingSpinner from '../common/LoadingSpinner'
import {
  getAllConversionsFromManojos,
  getAllConversionsFromConchitas,
  getAllConversionsFromMallas,
  manojosToConchitas
} from '../../constants/conversions'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const HarvestPlanningModal = ({ isOpen, onClose, selectedLot, user }) => {
  const { costCategories: harvestCostCategories, loadConfigurations, createHarvestPlan, loading } = useHarvestStore()
  const { inventory, fetchInventory } = useInventoryStore()
  
  const [planForm, setPlanForm] = useState({
    sectorId: selectedLot?.sectorId || '',
    lotId: selectedLot?.lotId || '', // Use lotId instead of id (which is the compound line ID)
    plannedDate: '',
    estimatedQuantity: selectedLot?.currentQuantity?.toString() || '',
    estimatedMortality: '15',
    notes: '',
    plannedCosts: {},
    inventoryToUse: []
  })
  
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState('')
  const [configMode, setConfigMode] = useState(false)
  const [customCostCategories, setCustomCostCategories] = useState([])
  const [quantityUnit, setQuantityUnit] = useState('manojos') // 'manojos', 'conchas', 'mallas'
  const [displayConversions, setDisplayConversions] = useState({
    manojos: 0,
    conchas: 0,
    mallas: 0,
    kg: 0
  })

  useEffect(() => {
    if (isOpen && user?.id) {
      console.log('📝 [HarvestPlanningModal] Modal opened, loading data for user:', user.id)
      loadConfigurations()
      fetchInventory(user.id)
    } else {
      console.log('📝 [HarvestPlanningModal] Modal closed or no user ID')
    }
  }, [isOpen, user?.id, loadConfigurations, fetchInventory])

  useEffect(() => {
    // Inicializar con las categorías del store
    if (harvestCostCategories && harvestCostCategories.length > 0 && customCostCategories.length === 0) {
      setCustomCostCategories(harvestCostCategories)
    }
  }, [harvestCostCategories, customCostCategories.length])

  useEffect(() => {
    if (selectedLot) {
      console.log('📦 [HarvestPlanningModal] Selected lot changed:', selectedLot)
      const currentQuantity = selectedLot.currentQuantity || 0

      setPlanForm(prev => ({
        ...prev,
        sectorId: selectedLot.sectorId || '',
        lotId: selectedLot.lotId || '', // Use lotId instead of id
        estimatedQuantity: currentQuantity.toString()
      }))

      // Inicializar conversiones basadas en las conchas actuales
      if (currentQuantity > 0) {
        try {
          const conversions = getAllConversionsFromConchitas(currentQuantity)
          // Validar conversiones antes de establecerlas
          const safeConversions = {
            manojos: conversions.manojos || 0,
            conchas: conversions.conchas || 0,
            mallas: conversions.mallas || 0,
            kg: conversions.kg || 0
          }
          setDisplayConversions(safeConversions)
          console.log('📦 [HarvestPlanningModal] Initialized with quantity:', {
            currentQuantity,
            conversions: safeConversions,
            estimatedQuantity: currentQuantity.toString()
          })
        } catch (error) {
          console.error('Error al inicializar conversiones:', error)
          setDisplayConversions({ manojos: 0, conchas: 0, mallas: 0, kg: 0 })
        }
      } else {
        setDisplayConversions({ manojos: 0, conchas: 0, mallas: 0, kg: 0 })
        console.log('⚠️ [HarvestPlanningModal] No current quantity available for lot')
      }
    }
  }, [selectedLot])

  const handleCostChange = (categoryId, field, value) => {
    console.log('💰 [HarvestPlanningModal] Cost changed:', { categoryId, field, value })
    setPlanForm(prev => ({
      ...prev,
      plannedCosts: {
        ...prev.plannedCosts,
        [categoryId]: {
          ...prev.plannedCosts[categoryId],
          [field]: value
        }
      }
    }))
  }

  const handleAddInventoryItem = () => {
    if (!selectedInventoryItem || !inventoryQuantity || inventoryQuantity <= 0) return
    
    const item = inventory.find(i => i.id === selectedInventoryItem)
    if (!item) return
    
    const existingIndex = planForm.inventoryToUse.findIndex(i => i.id === selectedInventoryItem)
    
    if (existingIndex >= 0) {
      const updatedItems = [...planForm.inventoryToUse]
      updatedItems[existingIndex].quantity = parseFloat(inventoryQuantity)
      setPlanForm(prev => ({
        ...prev,
        inventoryToUse: updatedItems
      }))
    } else {
      setPlanForm(prev => ({
        ...prev,
        inventoryToUse: [
          ...prev.inventoryToUse,
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
    setPlanForm(prev => ({
      ...prev,
      inventoryToUse: prev.inventoryToUse.filter(item => item.id !== itemId)
    }))
  }
  
  const handleUpdateInventoryQuantity = (itemId, newQuantity) => {
    const updatedItems = planForm.inventoryToUse.map(item =>
      item.id === itemId ? { ...item, quantity: parseFloat(newQuantity) || 0 } : item
    )
    setPlanForm(prev => ({
      ...prev,
      inventoryToUse: updatedItems
    }))
  }

  const handleCostCategoriesUpdate = (updatedCategories) => {
    setCustomCostCategories(updatedCategories)
    console.log('🔄 [HarvestPlanningModal] Cost categories updated:', updatedCategories.length, 'categories')
  }

  // Funciones para edición inline de categorías de costos
  const handleUpdateCategoryName = (categoryId, newName) => {
    const updatedCategories = customCostCategories.map(cat =>
      cat.id === categoryId ? { ...cat, name: newName } : cat
    )
    setCustomCostCategories(updatedCategories)
  }

  const handleUpdateCategoryDescription = (categoryId, newDescription) => {
    const updatedCategories = customCostCategories.map(cat =>
      cat.id === categoryId ? { ...cat, description: newDescription } : cat
    )
    setCustomCostCategories(updatedCategories)
  }

  const handleRemoveCategory = (categoryId) => {
    const updatedCategories = customCostCategories.map(cat =>
      cat.id === categoryId ? { ...cat, isActive: false } : cat
    )
    setCustomCostCategories(updatedCategories)
  }

  const handleAddNewCategory = () => {
    const newCategory = {
      id: Date.now().toString(),
      name: 'Nueva categoría',
      description: 'Descripción de la categoría',
      estimatedCost: 0,
      isActive: true
    }
    setCustomCostCategories([...customCostCategories, newCategory])
  }

  const handleQuantityChange = (value, unit) => {
    console.log('🔄 [HarvestPlanningModal] handleQuantityChange called:', { value, unit })
    const quantity = parseFloat(value) || 0
    let conversions = { manojos: 0, conchas: 0, mallas: 0, kg: 0 }
    let estimatedQuantityInConchas = 0

    if (quantity > 0) {
      try {
        switch (unit) {
          case 'manojos':
            conversions = getAllConversionsFromManojos(quantity)
            // Convertir a conchas para el almacenamiento interno (compatibilidad)
            estimatedQuantityInConchas = conversions.conchitas || 0
            console.log('🔄 [HarvestPlanningModal] Converting from manojos:', {
              quantity,
              conversions,
              estimatedQuantityInConchas,
              conchas: conversions.conchas,
              conchitas: conversions.conchitas
            })
            break
          case 'conchas':
            conversions = getAllConversionsFromConchitas(quantity)
            estimatedQuantityInConchas = quantity
            console.log('🔄 [HarvestPlanningModal] Setting conchas directly:', { quantity })
            break
          case 'mallas':
            conversions = getAllConversionsFromMallas(quantity)
            estimatedQuantityInConchas = conversions.conchitas || 0
            console.log('🔄 [HarvestPlanningModal] Converting from mallas:', {
              quantity,
              conversions,
              estimatedQuantityInConchas,
              conchas: conversions.conchas,
              conchitas: conversions.conchitas
            })
            break
          default:
            break
        }

        // Validar que las conversiones tengan valores válidos
        conversions = {
          manojos: conversions.manojos || 0,
          conchas: conversions.conchas || 0,
          mallas: conversions.mallas || 0,
          kg: conversions.kg || 0
        }
      } catch (error) {
        console.error('Error en conversiones:', error)
        conversions = { manojos: 0, conchas: 0, mallas: 0, kg: 0 }
        estimatedQuantityInConchas = 0
      }
    }

    // Asegurar que estimatedQuantity siempre sea un número válido
    setPlanForm(prev => ({
      ...prev,
      estimatedQuantity: estimatedQuantityInConchas.toString()
    }))

    setDisplayConversions(conversions)
    console.log('📊 [HarvestPlanningModal] Final values:', {
      estimatedQuantityInConchas,
      conversions,
      formValue: estimatedQuantityInConchas.toString()
    })
  }

  const calculateTotalCost = () => {
    return Object.entries(planForm.plannedCosts).reduce((total, [categoryId, costData]) => {
      const category = customCostCategories.find(c => c.id === categoryId)
      const quantity = parseFloat(costData.quantity || 0)
      const unitCost = parseFloat(costData.unitCost || category?.estimatedCost || 0)
      return total + (quantity * unitCost)
    }, 0)
  }

  const calculateSurvivalQuantity = () => {
    const mortality = parseFloat(planForm.estimatedMortality || 0)
    const estimated = parseFloat(planForm.estimatedQuantity || 0)

    // Validar que los valores sean números válidos
    if (isNaN(mortality) || isNaN(estimated) || estimated <= 0) {
      console.log('⚠️ [HarvestPlanningModal] Invalid values for survival calculation:', { mortality, estimated })
      return 0
    }

    const result = Math.floor(estimated * (1 - mortality / 100))
    console.log('📊 [HarvestPlanningModal] Survival calculation:', { estimated, mortality, result })
    return result
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('💾 [HarvestPlanningModal] Submitting harvest plan')
    console.log('📊 [HarvestPlanningModal] Form data:', {
      estimatedQuantity: planForm.estimatedQuantity,
      estimatedMortality: planForm.estimatedMortality,
      quantityUnit
    })

    // Validación adicional
    const estimatedQty = parseFloat(planForm.estimatedQuantity) || 0
    if (estimatedQty <= 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'Cantidad requerida',
        text: 'Debe especificar una cantidad estimada válida para la cosecha'
      })
      console.log('⚠️ [HarvestPlanningModal] Validation failed - no valid estimated quantity')
      return
    }

    const survivalQuantity = calculateSurvivalQuantity()
    const totalCost = calculateTotalCost()

    console.log('🧮 [HarvestPlanningModal] Calculated values:', {
      survivalQuantity,
      totalCost,
      originalEstimated: planForm.estimatedQuantity
    })

    // Asegurar que tenemos una cantidad estimada válida
    const finalEstimatedQuantity = parseFloat(planForm.estimatedQuantity) || selectedLot?.currentQuantity || 0

    const planData = {
      ...planForm,
      status: 'planned', // Changed from 'planning' to 'planned' to match filter
      estimatedQuantity: finalEstimatedQuantity, // Ensure valid number
      survivalQuantity: survivalQuantity, // Quantity after mortality
      estimatedMortality: parseFloat(planForm.estimatedMortality) || 0,
      plannedCosts: planForm.plannedCosts,
      totalPlannedCost: totalCost,
      inventoryToUse: planForm.inventoryToUse
    }

    console.log('💾 [HarvestPlanningModal] DETAILED PLAN DATA BEFORE SUBMIT:')
    console.log('💾 Raw planForm.estimatedQuantity:', planForm.estimatedQuantity, 'type:', typeof planForm.estimatedQuantity)
    console.log('💾 selectedLot.currentQuantity:', selectedLot?.currentQuantity)
    console.log('💾 finalEstimatedQuantity:', finalEstimatedQuantity)
    console.log('💾 Parsed estimatedQuantity:', parseFloat(planForm.estimatedQuantity), 'isNaN:', isNaN(parseFloat(planForm.estimatedQuantity)))
    console.log('💾 Final planData.estimatedQuantity:', planData.estimatedQuantity)
    console.log('💾 Complete planData:', planData)

    console.log('💾 [HarvestPlanningModal] Plan data to submit:', planData)

    try {
      const result = await createHarvestPlan(planData)

      console.log('💾 [HarvestPlanningModal] Create harvest plan result:', result)

      if (result.success) {
        console.log('✅ [HarvestPlanningModal] SUCCESS - Plan created successfully!')
        console.log('✅ [HarvestPlanningModal] Created plan result:', result)
        console.log('✅ [HarvestPlanningModal] Saved plan data:', result.data)

        MySwal.fire({
          icon: 'success',
          title: 'Planificación creada',
          text: 'La planificación de cosecha se guardó exitosamente',
          timer: 2000,
          showConfirmButton: false
        })
        console.log('❌ [HarvestPlanningModal] Closing modal after successful creation')
        onClose()
      } else {
        throw new Error(result.error || 'Error al crear planificación')
      }
    } catch (error) {
      console.error('❌ [HarvestPlanningModal] Error creating harvest plan:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al crear la planificación de cosecha'
      })
    }
  }

  if (!isOpen) return null

  const harvestInventory = inventory.filter(item => 
    item.category === 'harvest' && item.status === 'available'
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-0">
      <div className="bg-white rounded-lg w-full max-w-sm sm:max-w-md lg:max-w-4xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                📋 Planificación de Cosecha
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                {selectedLot ? 
                  `${selectedLot.sectorName} - ${selectedLot.lineName || selectedLot.origin}` : 
                  'Selecciona los detalles de tu planificación de cosecha'
                }
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
          {/* Información del cultivo seleccionado */}
          {selectedLot && (
            <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-l-4 border-primary-500">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                🌱 Cultivo Seleccionado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Línea</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {selectedLot.lineName ? `Línea ${selectedLot.lineName}` : `Lote ${selectedLot.origin}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Sector</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{selectedLot.sectorName}</p>
                  </div>
                  {selectedLot.selectedSystems && selectedLot.selectedSystems.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Sistemas a cosechar</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        {selectedLot.selectedSystems.length} sistema(s)
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedLot.selectedSystems.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Origen/Especie</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{selectedLot.origin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha de Siembra</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">
                      {new Date(selectedLot.entryDate).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Edad del Cultivo</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{selectedLot.monthsOld} meses</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Tallas (mm)</p>
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        Prom: {selectedLot.averageSize || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Mín: {selectedLot.minSize || 'N/A'} - Máx: {selectedLot.maxSize || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm text-gray-600">Cantidad actual:</span>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-base sm:text-lg text-primary-600">
                        {Math.floor((selectedLot.currentQuantity || 0) / 96).toLocaleString()} manojos
                      </span>
                      <span className="text-xs text-gray-500">
                        ({selectedLot.currentQuantity?.toLocaleString() || 'N/A'} conchas)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {selectedLot.averageSize >= 75 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      ✓ Talla óptima
                    </span>
                  )}
                  {selectedLot.monthsOld >= 6 && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      ✓ Madurez completa
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información básica */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              📅 Información Básica
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Fecha planificada *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field text-sm"
                    value={planForm.plannedDate}
                    onChange={(e) => setPlanForm({...planForm, plannedDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Mortalidad estimada (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field text-sm"
                    value={planForm.estimatedMortality}
                    onChange={(e) => setPlanForm({...planForm, estimatedMortality: e.target.value})}
                    placeholder="15"
                  />
                </div>
              </div>

              {/* Cantidad inicial con conversiones */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📦 Cantidad inicial a cosechar
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      className="input-field text-sm"
                      value={displayConversions[quantityUnit] || ''}
                      onChange={(e) => handleQuantityChange(e.target.value, quantityUnit)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Unidad
                    </label>
                    <select
                      className="input-field text-sm"
                      value={quantityUnit}
                      onChange={(e) => {
                        setQuantityUnit(e.target.value)
                        // Mantener la cantidad en conchas y convertir a la nueva unidad
                        if (planForm.estimatedQuantity) {
                          const conchas = parseFloat(planForm.estimatedQuantity) || 0
                          console.log('🔄 [HarvestPlanningModal] Unit change:', {
                            oldUnit: quantityUnit,
                            newUnit: e.target.value,
                            conchas,
                            estimatedQuantity: planForm.estimatedQuantity
                          })
                          if (conchas > 0) {
                            try {
                              const conversions = getAllConversionsFromConchitas(conchas)
                              const safeConversions = {
                                manojos: conversions.manojos || 0,
                                conchas: conversions.conchas || 0,
                                mallas: conversions.mallas || 0,
                                kg: conversions.kg || 0
                              }
                              setDisplayConversions(safeConversions)
                            } catch (error) {
                              console.error('Error al cambiar unidad:', error)
                              setDisplayConversions({ manojos: 0, conchas: 0, mallas: 0, kg: 0 })
                            }
                          }
                        }
                      }}
                    >
                      <option value="manojos">Manojos</option>
                      <option value="conchas">Conchas</option>
                      <option value="mallas">Mallas</option>
                    </select>
                  </div>
                </div>

                {/* Conversiones automáticas */}
                {(displayConversions.conchas > 0) && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-semibold text-blue-600">{(displayConversions.manojos || 0).toLocaleString()}</div>
                      <div className="text-gray-600">Manojos</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-semibold text-green-600">{(displayConversions.conchas || 0).toLocaleString()}</div>
                      <div className="text-gray-600">Conchas</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-semibold text-purple-600">{parseFloat(displayConversions.mallas || 0).toFixed(1)}</div>
                      <div className="text-gray-600">Mallas</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="font-semibold text-orange-600">{parseFloat(displayConversions.kg || 0).toFixed(1)}</div>
                      <div className="text-gray-600">Kg</div>
                    </div>
                  </div>
                )}

                {/* Información de conversión */}
                <div className="mt-3 text-xs text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>📝 1 manojo = 96 conchas</span>
                    <span>📦 1 malla = 3 manojos = 288 conchas</span>
                  </div>
                </div>
              </div>
            </div>
            
            {planForm.estimatedQuantity && planForm.estimatedMortality && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">
                    📈 Cantidad superviviente estimada:
                  </span>
                  <span className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-700">
                    {((1 - parseFloat(planForm.estimatedMortality)/100) * 100).toFixed(1)}% supervivencia
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {(() => {
                    const survivalQuantity = calculateSurvivalQuantity()
                    if (survivalQuantity <= 0) return null

                    const survivalConversions = getAllConversionsFromConchitas(survivalQuantity)
                    return (
                      <>
                        <div className="text-center p-2 bg-white rounded border border-green-200">
                          <div className="font-semibold text-blue-600">{(survivalConversions.manojos || 0).toLocaleString()}</div>
                          <div className="text-gray-600">Manojos</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border border-green-200">
                          <div className="font-semibold text-green-600">{(survivalConversions.conchas || 0).toLocaleString()}</div>
                          <div className="text-gray-600">Conchas</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border border-green-200">
                          <div className="font-semibold text-purple-600">{parseFloat(survivalConversions.mallas || 0).toFixed(1)}</div>
                          <div className="text-gray-600">Mallas</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border border-green-200">
                          <div className="font-semibold text-orange-600">{parseFloat(survivalConversions.kg || 0).toFixed(1)}</div>
                          <div className="text-gray-600">Kg</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Estimación de costos */}
          <div className="card">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                💰 Estimación de Costos
              </h3>
              <button
                type="button"
                onClick={() => setConfigMode(!configMode)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                title="Configurar campos de costos"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">{configMode ? 'Finalizar' : 'Configurar'}</span>
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {customCostCategories.filter(c => c.isActive).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">💰</div>
                  <p className="text-lg font-medium">No hay campos de costos configurados</p>
                  <p className="text-sm mt-2">Haz clic en "Configurar" para agregar campos personalizados</p>
                </div>
              ) : (
                customCostCategories.filter(c => c.isActive).map((category) => (
                <div key={category.id} className={`border rounded-lg p-3 sm:p-4 ${configMode ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                  <div className={`grid gap-3 sm:gap-4 items-end ${configMode ? 'grid-cols-1 sm:grid-cols-5' : 'grid-cols-1 sm:grid-cols-4'}`}>
                    <div className="sm:col-span-2">
                      {configMode ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Nombre del campo
                            </label>
                            <input
                              type="text"
                              className="input-field text-sm"
                              value={category.name}
                              onChange={(e) => handleUpdateCategoryName(category.id, e.target.value)}
                              placeholder="Nombre del campo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <input
                              type="text"
                              className="input-field text-sm"
                              value={category.description}
                              onChange={(e) => handleUpdateCategoryDescription(category.id, e.target.value)}
                              placeholder="Descripción del campo"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            {category.name}
                          </label>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Cantidad ({category.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="input-field text-sm"
                        value={planForm.plannedCosts[category.id]?.quantity || ''}
                        onChange={(e) => handleCostChange(category.id, 'quantity', e.target.value)}
                        placeholder="0"
                        disabled={configMode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Costo unitario (S/)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field text-sm"
                        value={planForm.plannedCosts[category.id]?.unitCost || category.estimatedCost}
                        onChange={(e) => handleCostChange(category.id, 'unitCost', e.target.value)}
                        placeholder={category.estimatedCost}
                        disabled={configMode}
                      />
                    </div>
                    {configMode && (
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                          title="Eliminar campo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  {!configMode && planForm.plannedCosts[category.id]?.quantity && (
                    <div className="mt-2 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        Subtotal: S/ {(
                          parseFloat(planForm.plannedCosts[category.id]?.quantity || 0) *
                          parseFloat(planForm.plannedCosts[category.id]?.unitCost || category.estimatedCost)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))
              )}

              {configMode && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Agregar nuevo campo</span>
                  </button>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Estimado:</span>
                  <span className="text-xl font-bold text-green-600">
                    S/ {calculateTotalCost().toFixed(2)}
                  </span>
                </div>
                {calculateSurvivalQuantity() > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Costo por concha: S/ {(calculateTotalCost() / calculateSurvivalQuantity()).toFixed(4)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inventario a utilizar */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              📦 Inventario a Utilizar
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
                    {harvestInventory.map((item) => (
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
                    const item = harvestInventory.find(i => i.id === selectedInventoryItem)
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
            {planForm.inventoryToUse.length === 0 ? (
              <p className="text-gray-500 text-center py-4 border-t">
                No se ha agregado inventario aún
              </p>
            ) : (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ítems seleccionados:</h4>
                <div className="space-y-2">
                  {planForm.inventoryToUse.map((item) => (
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
                
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Notas y observaciones
            </label>
            <textarea
              rows="3"
              className="input-field text-sm"
              value={planForm.notes}
              onChange={(e) => setPlanForm({...planForm, notes: e.target.value})}
              placeholder="Detalles adicionales sobre la planificación..."
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
                {loading ? <LoadingSpinner size="sm" message="" /> : 'Guardar Planificación'}
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}

export default HarvestPlanningModal