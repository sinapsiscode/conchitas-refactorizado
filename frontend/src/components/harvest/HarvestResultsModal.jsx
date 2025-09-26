import React, { useState, useEffect } from 'react'
import { useExpenseStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { useIncomeStore } from '../../stores'
import { useIncomeStatementClosureStore } from '../../stores'
import { useAuthStore } from '../../stores'
import { useHarvestStore } from '../../stores'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { CONVERSIONS, DEFAULT_PRESENTATIONS, DEFAULT_MEASURES, getAllConversions } from '../../constants/conversions'

const MySwal = withReactContent(Swal)

const HarvestResultsModal = ({ isOpen, onClose, harvestPlan, sector, pricing }) => {
  const { expenses, fetchExpenses } = useExpenseStore()
  const { sectors } = useSectorStore()
  const { incomeRecords, createIncomeRecord, updateIncomeRecord } = useIncomeStore()
  const { createClosure, loading: closureLoading } = useIncomeStatementClosureStore()
  const { updateHarvestPlan } = useHarvestStore()
  const { user } = useAuthStore()
  const [incomeRecord, setIncomeRecord] = useState(null)
  const [presentations, setPresentations] = useState(() => {
    // Recuperar presentaciones guardadas del localStorage si existen
    const savedPresentations = localStorage.getItem('conchas-abanico:presentations')
    if (savedPresentations) {
      try {
        return JSON.parse(savedPresentations)
      } catch (e) {
        console.error('Error parsing saved presentations:', e)
      }
    }
    // Si no hay presentaciones guardadas, usar las por defecto
    return DEFAULT_PRESENTATIONS.map(pres => ({
      ...pres,
      measures: DEFAULT_MEASURES[pres.id] || []
    }))
  })
  const [weights, setWeights] = useState({})
  const [isEditingDistribution, setIsEditingDistribution] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState(null)
  const [tempPresentationName, setTempPresentationName] = useState('')
  const [expandedPresentations, setExpandedPresentations] = useState(new Set())
  const [selectedPresentation, setSelectedPresentation] = useState(null)

  useEffect(() => {
    if (isOpen && harvestPlan) {
      fetchExpenses({ lotId: harvestPlan.lotId })
      
      // Buscar registro de ingreso existente
      const existingRecord = incomeRecords.find(record => record.harvestPlanId === harvestPlan.id)
      setIncomeRecord(existingRecord)
      
      // Cargar distribución existente si la hay
      if (existingRecord?.presentationDistribution) {
        setPresentations(existingRecord.presentationDistribution.presentations || presentations)
        setWeights(existingRecord.presentationDistribution.weights || {})
      } else {
        // Cargar presentaciones guardadas del localStorage
        const savedPresentations = localStorage.getItem('conchas-abanico:presentations')
        if (savedPresentations) {
          try {
            const parsed = JSON.parse(savedPresentations)
            setPresentations(parsed)
          } catch (e) {
            console.error('Error loading saved presentations:', e)
          }
        }
      }
    }
  }, [isOpen, harvestPlan, fetchExpenses])

  if (!isOpen || !harvestPlan) return null

  const lot = sector?.lots?.find(l => l.id === harvestPlan.lotId)
  const lotExpenses = expenses.filter(expense => expense.lotId === harvestPlan.lotId)
  
  const totalExpenses = lotExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
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

  const calculateRevenue = () => {
    let totalRevenue = 0
    presentations.forEach(pres => {
      pres.measures.forEach(measure => {
        const key = `${pres.id}_${measure.id}`
        const weight = weights[key] || 0
        totalRevenue += weight * measure.pricePerKg
      })
    })
    return totalRevenue
  }

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

    return {
      totalKg,
      totalRevenue,
      totalConchitas,
      totalManojos: Math.round(totalConchitas / CONVERSIONS.CONCHITAS_POR_MANOJO),
      totalMallas: Math.round(totalConchitas / 288)
    }
  }

  const calculateProfitMargin = () => {
    const revenue = calculateRevenue()
    if (revenue === 0) return 0
    return ((revenue - totalExpenses) / revenue * 100)
  }

  const calculateMortalityRate = () => {
    // Usar la cantidad inicial de la siembra (initialQuantity), no la cantidad actual (quantity)
    const initialQuantity = Math.round(lot?.initialQuantity || lot?.quantity || 0)
    // Usar la cantidad real cosechada registrada en el plan de cosecha
    const harvestedQuantity = harvestPlan.actualQuantity || 0
    if (initialQuantity === 0) return 0
    return ((initialQuantity - harvestedQuantity) / initialQuantity * 100)
  }

  const calculateProjectedComparison = () => {
    const totals = calculateTotals()
    const actualQuantity = harvestPlan.actualQuantity || 0  // Usar cantidad real registrada en cosecha
    const projectedQuantity = Math.round(harvestPlan.estimatedQuantity || lot?.quantity || 0)
    const actualRevenue = totals.totalRevenue
    
    // Usar precio promedio para proyección
    const avgPricePerKg = presentations.reduce((sum, pres) => {
      const presAvg = pres.measures.reduce((mSum, m) => mSum + m.pricePerKg, 0) / (pres.measures.length || 1)
      return sum + presAvg
    }, 0) / (presentations.length || 1)
    
    const projectedRevenue = (projectedQuantity / CONVERSIONS.CONCHITAS_POR_KG) * avgPricePerKg
    
    return {
      quantityDiff: actualQuantity - projectedQuantity,
      quantityPercent: projectedQuantity ? ((actualQuantity - projectedQuantity) / projectedQuantity * 100) : 0,
      revenueDiff: actualRevenue - projectedRevenue,
      revenuePercent: projectedRevenue ? ((actualRevenue - projectedRevenue) / projectedRevenue * 100) : 0
    }
  }

  const comparison = calculateProjectedComparison()

  // Funciones para manejo de presentaciones
  const handleWeightChange = (presentationId, measureId, value) => {
    const numValue = parseFloat(value) || 0
    setWeights(prev => ({
      ...prev,
      [`${presentationId}_${measureId}`]: numValue
    }))
  }

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

  const handleRemoveMeasure = (presentationId, measureId) => {
    setPresentations(prev => prev.map(pres => 
      pres.id === presentationId 
        ? { ...pres, measures: pres.measures.filter(m => m.id !== measureId) }
        : pres
    ))
    
    const key = `${presentationId}_${measureId}`
    setWeights(prev => {
      const newWeights = { ...prev }
      delete newWeights[key]
      return newWeights
    })
  }

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

  const startEditingPresentation = (presentationId, currentName) => {
    setEditingPresentation(presentationId)
    setTempPresentationName(currentName)
  }

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

  const savePresentationsToLocalStorage = () => {
    localStorage.setItem('conchas-abanico:presentations', JSON.stringify(presentations))
    MySwal.fire({
      icon: 'success',
      title: 'Configuración guardada',
      text: 'Las presentaciones se han guardado exitosamente',
      timer: 2000
    })
  }

  const handleSaveIncomeStatement = async () => {
    try {
      const revenue = calculateRevenue()
      const netProfit = revenue - totalExpenses
      const profitMargin = calculateProfitMargin()
      
      const result = await MySwal.fire({
        title: '💾 Guardar Estado de Resultados',
        html: `
          <div class="text-left">
            <p class="mb-4">Esta acción guardará el estado de resultados de esta cosecha específica.</p>
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 class="font-medium text-green-900 mb-2">📊 Resumen de la Cosecha:</h4>
              <div class="text-sm text-green-800 space-y-1">
                <div><strong>Sector:</strong> ${sector?.name || 'N/A'} - ${lot?.origin || 'N/A'}</div>
                <div><strong>Fecha:</strong> ${new Date(harvestPlan.actualDate || harvestPlan.plannedDate).toLocaleDateString('es-PE')}</div>
                <div><strong>Cantidad cosechada:</strong> ${Math.round(harvestPlan.actualQuantity / 96) || 0} manojos (${((Math.round(harvestPlan.actualQuantity / 96) || 0) / 3).toFixed(1)} mallas)</div>
                <div><strong>Ingresos:</strong> ${formatCurrency(revenue)}</div>
                <div><strong>Gastos:</strong> ${formatCurrency(totalExpenses)}</div>
                <div><strong>Utilidad neta:</strong> <span class="${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}">${formatCurrency(netProfit)}</span></div>
                <div><strong>Margen de utilidad:</strong> ${profitMargin.toFixed(1)}%</div>
                <div><strong>Tasa de mortalidad:</strong> ${calculateMortalityRate().toFixed(1)}%</div>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input 
                type="text" 
                id="description" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Cosecha exitosa del lote A-1"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea 
                id="notes" 
                rows="3" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Observaciones sobre esta cosecha..."
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '💾 Guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10b981',
        preConfirm: () => {
          const description = document.getElementById('description').value
          const notes = document.getElementById('notes').value
          return { description, notes }
        }
      })

      if (result.isConfirmed) {
        MySwal.fire({
          title: 'Guardando...',
          html: 'Por favor espera mientras se guarda el estado de resultados',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading()
          }
        })

        // Crear los datos del cierre para esta cosecha específica
        // Usar la fecha real de la cosecha, o la planificada si no hay fecha real
        const harvestDate = harvestPlan.actualDate || harvestPlan.plannedDate

        // Para un estado de resultados de una sola cosecha, usar la misma fecha como inicio y fin
        // Esto representa el estado de resultados del día de la cosecha
        const startDate = new Date(harvestDate).toISOString().split('T')[0]
        const endDate = new Date(harvestDate).toISOString().split('T')[0]

        console.log('🔍 Date debugging:', {
          plannedDate: harvestPlan.plannedDate,
          actualDate: harvestPlan.actualDate,
          harvestDate,
          startDate,
          endDate,
          startDateObj: new Date(startDate),
          endDateObj: new Date(endDate),
          isStartBeforeEnd: new Date(startDate) <= new Date(endDate),
          areEqual: startDate === endDate
        })
        
        const closureData = {
          userId: user.id,
          closureType: 'custom',
          periodStartDate: startDate,
          periodEndDate: endDate,
          totalRevenues: revenue,
          totalExpenses: totalExpenses,
          grossProfit: revenue - totalExpenses,
          netProfit: netProfit,
          profitMargin: profitMargin,
          revenueBreakdown: {
            harvestSales: revenue,
            otherIncome: 0
          },
          expenseBreakdown: {
            operational: lotExpenses.filter(e => e.category === 'operational').reduce((sum, e) => sum + e.amount, 0),
            harvesting: harvestPlan.totalActualCost || 0,
            equipment: 0,
            materials: lotExpenses.filter(e => e.category === 'material').reduce((sum, e) => sum + e.amount, 0),
            labor: 0,
            other: lotExpenses.filter(e => !['operational', 'material', 'harvest'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0)
          },
          totalQuantityHarvested: harvestPlan.actualQuantity || 0,  // Usar cantidad real registrada
          numberOfHarvests: 1,
          averageRevenuePerHarvest: revenue,
          status: 'draft',
          notes: result.value.notes,
          description: result.value.description || `Estado de Resultados - ${sector?.name || 'N/A'}`,
          includedHarvestIds: [harvestPlan.id],
          includedExpenseIds: lotExpenses.map(e => e.id),
          includedIncomeIds: incomeRecord ? [incomeRecord.id] : [],
          // Información adicional de la cosecha
          harvestInfo: {
            harvestId: harvestPlan.id,
            sectorName: sector?.name,
            lotId: harvestPlan.lotId,
            lotOrigin: lot?.origin,
            presentationDistribution: {
              presentations,
              weights,
              totals: calculateTotals()
            },
            mortalityRate: calculateMortalityRate(),
            comparison: calculateProjectedComparison()
          }
        }

        const saveResult = await createClosure(closureData)

        if (saveResult.success) {
          // Actualizar el plan de cosecha con la distribución por presentaciones
          await updateHarvestPlan({
            id: harvestPlan.id,
            presentationDistribution: {
              presentations,
              weights,
              totals: calculateTotals()
            },
            actualQuantity: harvestPlan.actualQuantity || 0  // Mantener cantidad real registrada
          })
          
          MySwal.fire({
            icon: 'success',
            title: '✅ Estado de Resultados Guardado',
            html: `
              <div class="text-left">
                <p class="mb-3">El estado de resultados de esta cosecha ha sido guardado exitosamente.</p>
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p class="text-sm text-green-800">
                    Los datos se han consolidado y están disponibles en la sección de Estado de Resultados Consolidado.
                  </p>
                </div>
              </div>
            `,
            timer: 4000,
            showConfirmButton: true,
            confirmButtonText: 'Entendido'
          })
        } else {
          throw new Error(saveResult.error || 'Error al guardar el estado de resultados')
        }
      }
    } catch (error) {
      console.error('Error saving harvest income statement:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'Ha ocurrido un error al guardar el estado de resultados'
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-md lg:max-w-6xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:px-6 sm:py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">📏 Estado de Resultados - Cosecha</h2>
              {incomeRecord ? (
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                  incomeRecord.status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : incomeRecord.status === 'confirmed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {incomeRecord.status === 'paid' ? '✓ Pagado' : 
                   incomeRecord.status === 'confirmed' ? '💵 Confirmado' : 
                   '⏳ Pendiente'}
                </span>
              ) : (
                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                  ⚠ Sin registro de ingreso
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              {sector?.name} - {lot?.origin} | Fecha: {new Date(harvestPlan.actualDate || harvestPlan.plannedDate).toLocaleDateString('es-PE')}
              {incomeRecord && (
                <span className="ml-2 text-green-600">
                  | Ingreso: {formatCurrency(incomeRecord.totalAmount)}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Resumen Financiero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-green-800">Ingresos Totales</p>
                  <p className="text-lg sm:text-xl font-bold text-green-900">{formatCurrency(calculateRevenue())}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">💸</span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-red-800">Gastos Totales</p>
                  <p className="text-lg sm:text-xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </div>

            <div className={`${calculateRevenue() - totalExpenses >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 sm:p-4`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 ${calculateRevenue() - totalExpenses >= 0 ? 'bg-blue-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
                    <span className="text-white font-bold text-xs sm:text-sm">📊</span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className={`text-xs sm:text-sm font-medium ${calculateRevenue() - totalExpenses >= 0 ? 'text-blue-800' : 'text-red-800'}`}>Beneficio Neto</p>
                  <p className={`text-lg sm:text-xl font-bold ${calculateRevenue() - totalExpenses >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                    {formatCurrency(calculateRevenue() - totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs sm:text-sm">%</span>
                  </div>
                </div>
                <div className="ml-2 sm:ml-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">Margen de Beneficio</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{calculateProfitMargin().toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas de Mortalidad */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">⚰️ Análisis de Mortalidad</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Cantidad Inicial</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(lot?.initialQuantity || lot?.quantity || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Cantidad Cosechada</p>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {Math.round(harvestPlan.actualQuantity / 96) || 0} manojos
                </div>
                <div className="text-xs text-green-500">
                  ({((Math.round(harvestPlan.actualQuantity / 96) || 0) / 3).toFixed(1)} mallas)
                </div>
                <div className="text-xs text-gray-500">
                  Registrados en cosecha: {(harvestPlan.actualQuantity || 0).toLocaleString()} unidades
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">% de Mortalidad Real</p>
                <p className={`text-xl sm:text-2xl font-bold ${calculateMortalityRate() > 20 ? 'text-red-600' : calculateMortalityRate() > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {calculateMortalityRate().toFixed(1)}%
                </p>
                {harvestPlan.estimatedMortality && (
                  <p className="text-xs text-gray-500">
                    Proyectado: {harvestPlan.estimatedMortality}%
                    {Math.abs(calculateMortalityRate() - harvestPlan.estimatedMortality) > 5 && (
                      <span className={`ml-1 ${calculateMortalityRate() > harvestPlan.estimatedMortality ? 'text-red-500' : 'text-green-500'}`}>
                        ({calculateMortalityRate() > harvestPlan.estimatedMortality ? '+' : ''}{(calculateMortalityRate() - harvestPlan.estimatedMortality).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comparativo con Proyección */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📈 Comparativo: Real vs Proyectado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Cantidad</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Proyectado:</span>
                  <div className="text-right">
                    <span className="font-medium">{Math.round((harvestPlan.estimatedQuantity || 0) / 96).toLocaleString()} manojos</span>
                    <div className="text-xs text-gray-500">({((harvestPlan.estimatedQuantity || 0) / 288).toFixed(1)} mallas)</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Real:</span>
                  <div className="text-right">
                    <span className="font-medium">{Math.round(harvestPlan.actualQuantity / 96) || 0} manojos</span>
                    <div className="text-xs text-gray-500">({((Math.round(harvestPlan.actualQuantity / 96) || 0) / 3).toFixed(1)} mallas)</div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600">Diferencia:</span>
                  <div className="text-right">
                    <span className={`font-medium ${comparison.quantityDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.quantityDiff >= 0 ? '+' : ''}{Math.round(comparison.quantityDiff / 96).toLocaleString()} manojos ({comparison.quantityPercent.toFixed(1)}%)
                    </span>
                    <div className="text-xs text-gray-500">
                      ({(comparison.quantityDiff / 288).toFixed(1)} mallas)
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Ingresos</h4>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Proyectado:</span>
                  <span className="font-medium">{formatCurrency((harvestPlan.estimatedQuantity || 0) * (pricing.find(p => p.sizeCategory === 'M' && p.isActive)?.pricePerUnit || 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Real:</span>
                  <span className="font-medium">{formatCurrency(calculateRevenue())}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600">Diferencia:</span>
                  <span className={`font-medium ${comparison.revenueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {comparison.revenueDiff >= 0 ? '+' : ''}{formatCurrency(comparison.revenueDiff)} ({comparison.revenuePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Distribución por Presentaciones */}
          <div className="card">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">📊 Distribución por Presentaciones</h3>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <button
                  onClick={async () => {
                    if (isEditingDistribution) {
                      // Guardar distribución en incomeStore
                      const totals = calculateTotals()
                      const presentationData = {
                        presentations,
                        weights,
                        totals
                      }
                      
                      if (incomeRecord) {
                        // Actualizar registro existente
                        await updateIncomeRecord({
                          id: incomeRecord.id,
                          presentationDistribution: presentationData,
                          quantity: totals.totalConchitas,
                          totalAmount: totals.totalRevenue,
                          updatedAt: new Date().toISOString()
                        })
                      } else {
                        // Crear nuevo registro
                        await createIncomeRecord({
                          userId: user.id,
                          harvestPlanId: harvestPlan.id,
                          sectorId: harvestPlan.sectorId,
                          lotId: harvestPlan.lotId,
                          date: harvestPlan.actualDate || harvestPlan.plannedDate,
                          type: 'harvest_sale',
                          description: `Venta de cosecha - ${sector?.name || 'Sector'}`,
                          quantity: totals.totalConchitas,
                          presentationDistribution: presentationData,
                          totalAmount: totals.totalRevenue,
                          currency: 'PEN',
                          status: 'confirmed',
                          notes: 'Registro creado desde modal de resultados'
                        })
                        // Actualizar el registro local
                        const newRecord = incomeRecords.find(r => r.harvestPlanId === harvestPlan.id)
                        setIncomeRecord(newRecord)
                      }
                      
                      MySwal.fire({
                        icon: 'success',
                        title: 'Distribución guardada',
                        text: `Se ha ${incomeRecord ? 'actualizado' : 'creado'} el registro de ingreso`,
                        timer: 2000
                      })
                    }
                    setIsEditingDistribution(!isEditingDistribution)
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors ${
                    isEditingDistribution 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditingDistribution ? '💾 Guardar Distribución' : '✏️ Editar Distribución'}
                </button>
                <button
                  onClick={savePresentationsToLocalStorage}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
                >
                  ⚙️ Guardar Configuración
                </button>
              </div>
            </div>
            
            {/* Selector de presentación rápida */}
            <div className="mb-4">
              <select
                value={selectedPresentation || ''}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedPresentation(value)
                  if (value) {
                    setExpandedPresentations(new Set([value]))
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Seleccionar presentación...</option>
                {presentations.map(pres => {
                  const subtotal = calculatePresentationSubtotal(pres.id)
                  return (
                    <option key={pres.id} value={pres.id}>
                      {pres.name} {subtotal.weight > 0 ? `(${subtotal.weight.toFixed(2)} Kg - ${formatCurrency(subtotal.revenue)})` : ''}
                    </option>
                  )
                })}
              </select>
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
                    className={`bg-gray-50 rounded-lg ${!isExpanded ? 'p-3' : 'p-4'} border-l-4 ${hasData ? 'border-green-500' : 'border-blue-500'}`}
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
                              className="px-3 py-1 border border-gray-300 rounded text-sm font-semibold"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => togglePresentation(presentation.id)}
                          >
                            <h4 className="text-base font-semibold text-gray-900">
                              {presentation.name}
                            </h4>
                            {!isExpanded && (
                              <span className="text-sm text-gray-500">
                                ({presentation.measures.length} medidas)
                              </span>
                            )}
                            {isExpanded && isEditingDistribution && (
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
                              {formatCurrency(subtotal.revenue)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {isExpanded && isEditingDistribution && (
                        <button
                          onClick={() => handleAddMeasure(presentation.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          + Agregar medida
                        </button>
                      )}
                    </div>

                    {/* Medidas - Solo visible cuando está expandido */}
                    {isExpanded && (
                      <div className="space-y-2 mt-4">
                        {presentation.measures.length === 0 ? (
                          <p className="text-gray-400 text-center py-4">
                            No hay medidas configuradas. {isEditingDistribution && "Haz clic en 'Agregar medida' para comenzar."}
                          </p>
                        ) : (
                          presentation.measures.map((measure) => {
                            const key = `${presentation.id}_${measure.id}`
                            const weight = weights[key] || 0
                            const conversions = weight > 0 ? getAllConversions(weight) : null
                            const revenue = weight * measure.pricePerKg

                            return (
                              <div key={measure.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-white rounded-lg">
                                {/* Nombre de medida */}
                                <div className="md:col-span-3">
                                  <label className="text-xs text-gray-600">Medida</label>
                                  {isEditingDistribution ? (
                                    <input
                                      type="text"
                                      value={measure.name}
                                      onChange={(e) => handleMeasureNameChange(presentation.id, measure.id, e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="Nombre de medida"
                                    />
                                  ) : (
                                    <p className="text-sm font-medium">{measure.name}</p>
                                  )}
                                </div>

                                {/* Peso en Kg */}
                                <div className="md:col-span-2">
                                  <label className="text-xs text-gray-600">Peso (Kg)</label>
                                  {isEditingDistribution ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={weight || ''}
                                      onChange={(e) => handleWeightChange(presentation.id, measure.id, e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="0.0"
                                    />
                                  ) : (
                                    <p className="text-sm font-medium">{weight.toFixed(2)}</p>
                                  )}
                                </div>

                                {/* Precio por Kg */}
                                <div className="md:col-span-2">
                                  <label className="text-xs text-gray-600">Precio/Kg (S/)</label>
                                  {isEditingDistribution ? (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={measure.pricePerKg || ''}
                                      onChange={(e) => handleMeasurePriceChange(presentation.id, measure.id, e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      placeholder="0.00"
                                    />
                                  ) : (
                                    <p className="text-sm font-medium">{formatCurrency(measure.pricePerKg)}</p>
                                  )}
                                </div>

                                {/* Ingreso */}
                                <div className="md:col-span-2">
                                  <label className="text-xs text-gray-600">Ingreso (S/)</label>
                                  <p className="text-sm font-semibold text-green-600">
                                    {formatCurrency(revenue)}
                                  </p>
                                </div>

                                {/* Conversiones */}
                                <div className="md:col-span-2">
                                  <label className="text-xs text-gray-600">Equivalencias</label>
                                  {conversions ? (
                                    <div className="text-xs text-gray-700 space-y-0.5">
                                      <div>📦 {conversions.manojos} manojos</div>
                                      <div>🎯 {(conversions.conchitas / 288).toFixed(2)} mallas</div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">-</div>
                                  )}
                                </div>

                                {/* Acciones */}
                                {isEditingDistribution && (
                                  <div className="md:col-span-1 flex items-end">
                                    <button
                                      onClick={() => handleRemoveMeasure(presentation.id, measure.id)}
                                      className="text-red-500 hover:text-red-700 p-2"
                                      title="Eliminar medida"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
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
                              = {formatCurrency(subtotal.revenue)}
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
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3">📈 Resumen Total</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Peso Total</p>
                  <p className="text-lg font-bold text-gray-900">{calculateTotals().totalKg.toFixed(2)} Kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ingreso Total</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(calculateTotals().totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Manojos</p>
                  <p className="text-lg font-bold text-gray-900">{calculateTotals().totalManojos.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Mallas</p>
                  <p className="text-lg font-bold text-gray-900">{calculateTotals().totalMallas}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Rendimiento</p>
                  <p className="text-lg font-bold text-blue-600">
                    {(() => {
                      // Usar manojos reales registrados en cosecha, no conversiones automáticas
                      const manojosReales = Math.round(harvestPlan.actualQuantity / 96) || 0
                      const mallasReales = manojosReales / 3
                      const kgTotales = calculateTotals().totalKg

                      return mallasReales > 0
                        ? (kgTotales / mallasReales).toFixed(2)
                        : '0.00'
                    })()} Kg/malla
                  </p>
                  <p className="text-xs text-gray-500">
                    Basado en {Math.round(harvestPlan.actualQuantity / 96) || 0} manojos reales cosechados
                  </p>
                </div>
              </div>
              
              {/* Información de conversiones */}
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-gray-600">
                  📐 Conversiones: 1 Kg = {CONVERSIONS.CONCHITAS_POR_KG} unidades |
                  1 manojo = {CONVERSIONS.CONCHITAS_POR_MANOJO} unidades |
                  1 malla = {CONVERSIONS.KG_POR_MALLA} Kg
                </p>
              </div>
            </div>
          </div>

          {/* Gastos Registrados */}
          <div className="card">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">💸 Gastos de la Siembra</h3>
            {lotExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay gastos registrados para este lote</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lotExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                          {new Date(expense.date).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            expense.category === 'operational' ? 'bg-blue-100 text-blue-800' :
                            expense.category === 'harvest' ? 'bg-green-100 text-green-800' :
                            expense.category === 'material' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {expense.category === 'operational' ? 'Operacional' :
                             expense.category === 'harvest' ? 'Cosecha' :
                             expense.category === 'material' ? 'Material' :
                             expense.category === 'maintenance' ? 'Mantenimiento' : 
                             'Otro'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{expense.description}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">Total de Gastos:</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-900 text-right">{formatCurrency(totalExpenses)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cerrar
          </button>
          <button
            onClick={handleSaveIncomeStatement}
            disabled={closureLoading}
            className="btn-success"
          >
            {closureLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar Estado de Resultados
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default HarvestResultsModal