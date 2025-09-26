import React, { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { useHarvestStore } from '../../stores'
import { useExpenseStore } from '../../stores'
import { useIncomeStore } from '../../stores'
import { useIncomeStatementClosureStore } from '../../stores'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import HarvestResultsModal from '../../components/harvest/HarvestResultsModal'
import PresentationDistribution from '../../components/income/PresentationDistribution'
import { CONVERSIONS, getAllConversions } from '../../constants/conversions'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const IncomePage = () => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors } = useSectorStore()
  const { harvestPlans, pricing, fetchHarvestPlans, fetchPricing, updateHarvestPlan, loading } = useHarvestStore()
  const { expenses, fetchExpenses } = useExpenseStore()
  const { 
    incomeRecords, 
    fetchIncomeRecords, 
    createIncomeRecord, 
    updateIncomeRecord,
    loading: incomeLoading 
  } = useIncomeStore()
  const { createClosure, finalizeClosure, registerClosureInCashFlow, loading: closureLoading } = useIncomeStatementClosureStore()
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [editingDistribution, setEditingDistribution] = useState({})
  const [tempDistributions, setTempDistributions] = useState({})
  const [showPresentationModal, setShowPresentationModal] = useState(null)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    sectorId: '',
    minIncome: '',
    maxIncome: '',
    searchTerm: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
      fetchHarvestPlans(user.id)
      fetchPricing()
      fetchExpenses({ userId: user.id })
      fetchIncomeRecords(user.id)
    }
  }, [user?.id, fetchSectors, fetchHarvestPlans, fetchPricing, fetchExpenses, fetchIncomeRecords])

  // Obtener el ingreso real de un plan de cosecha
  const getActualRevenue = (plan) => {
    const incomeRecord = incomeRecords.find(record => record.harvestPlanId === plan.id)
    return incomeRecord ? incomeRecord.totalAmount : 0
  }
  
  // Calcular ingreso estimado (usado cuando no hay registro real)
  const calculateEstimatedRevenue = (plan) => {
    // Primero buscar si existe un registro de ingreso real
    const actualRevenue = getActualRevenue(plan)
    if (actualRevenue > 0) return actualRevenue
    
    // Si no hay registro real, calcular estimado
    if (!plan.sizeDistribution || !pricing.length) return 0
    
    let total = 0
    Object.entries(plan.sizeDistribution).forEach(([size, quantity]) => {
      const price = pricing.find(p => p.sizeCategory === size && p.isActive)
      if (price && quantity) {
        total += quantity * price.pricePerUnit
      }
    })
    
    return total
  }

  // Save current income statement without closure
  const handleSaveCurrentIncomeStatement = async () => {
    try {
      const result = await MySwal.fire({
        title: '💾 Guardar Estado de Resultados',
        html: `
          <div class="text-left">
            <p class="mb-4">Esta acción guardará el estado de resultados actual basado en los filtros aplicados.</p>
            <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <h4 class="font-medium text-green-900 mb-2">📊 Resumen del Estado Actual:</h4>
              <div class="text-sm text-green-800 space-y-1">
                <div><strong>Período:</strong> ${filters.dateFrom || 'Inicio'} - ${filters.dateTo || 'Hoy'}</div>
                <div><strong>Cosechas incluidas:</strong> ${filteredStats.completedCount}</div>
                <div><strong>Ingresos totales:</strong> ${formatCurrency(incomeStatementData.totalRevenues)}</div>
                <div><strong>Gastos totales:</strong> ${formatCurrency(incomeStatementData.totalCosts)}</div>
                <div><strong>Utilidad neta:</strong> <span class="${incomeStatementData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}">${formatCurrency(incomeStatementData.netProfit)}</span></div>
                <div><strong>Margen de utilidad:</strong> ${incomeStatementData.profitMargin.toFixed(1)}%</div>
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input 
                type="text" 
                id="description" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Estado de resultados del mes de enero"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea 
                id="notes" 
                rows="3" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Observaciones adicionales..."
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
        // Show loading
        MySwal.fire({
          title: 'Guardando...',
          html: 'Por favor espera mientras se guarda el estado de resultados',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading()
          }
        })

        // Calculate date range properly
        let startDate, endDate

        if (filters.dateFrom && filters.dateTo) {
          // Usar fechas de filtros si están definidas
          startDate = filters.dateFrom
          endDate = filters.dateTo
        } else if (completedHarvests.length > 0) {
          // Si no hay filtros pero hay cosechas, usar el rango de fechas de las cosechas
          const harvestDates = completedHarvests.map(h => {
            const dateStr = h.actualDate || h.plannedDate
            console.log('🔍 DEBUG - Harvest date:', h.id, dateStr)
            return new Date(dateStr)
          })

          // Obtener fechas mínima y máxima
          const minDate = new Date(Math.min(...harvestDates))
          const maxDate = new Date(Math.max(...harvestDates))

          startDate = minDate.toISOString().split('T')[0]
          endDate = maxDate.toISOString().split('T')[0]

          console.log('🔍 DEBUG - Harvest dates range:', {
            harvestDates: harvestDates.map(d => d.toISOString()),
            minDate: minDate.toISOString(),
            maxDate: maxDate.toISOString(),
            startDate,
            endDate
          })
        } else {
          // Si no hay filtros ni cosechas, usar la fecha de hoy
          const today = new Date().toISOString().split('T')[0]
          startDate = today
          endDate = today
        }

        // Ensure end date is after or equal to start date
        // Si las fechas son iguales, está bien (es un solo día)
        // Si endDate es menor que startDate, usar startDate para ambos
        const finalEndDate = new Date(endDate) < new Date(startDate)
          ? startDate
          : endDate

        // Debug: log the dates before sending
        console.log('🔍 DEBUG - Final dates being sent:', {
          startDate,
          endDate,
          finalEndDate,
          startDateObj: new Date(startDate),
          finalEndDateObj: new Date(finalEndDate),
          comparison: new Date(startDate) <= new Date(finalEndDate),
          areEqual: startDate === finalEndDate
        })

        // Create closure data for current state
        const closureData = {
          userId: user.id,
          closureType: 'custom',
          periodStartDate: startDate,
          periodEndDate: finalEndDate,
          totalRevenues: incomeStatementData.totalRevenues,
          totalExpenses: incomeStatementData.totalCosts,
          grossProfit: incomeStatementData.totalRevenues - incomeStatementData.totalCosts, // Must be exactly revenues - expenses for validation
          netProfit: incomeStatementData.netProfit,
          profitMargin: incomeStatementData.profitMargin,
          revenueBreakdown: {
            harvestSales: incomeStatementData.totalRevenues,
            otherIncome: 0
          },
          expenseBreakdown: {
            operational: incomeStatementData.lotExpenses,
            harvesting: incomeStatementData.harvestExpenses,
            equipment: 0,
            materials: incomeStatementData.initialInvestments,
            labor: 0,
            other: 0
          },
          totalQuantityHarvested: incomeStatementData.totalQuantityHarvested,
          numberOfHarvests: filteredStats.completedCount,
          averageRevenuePerHarvest: incomeStatementData.averageRevenuePerHarvest,
          status: 'draft',
          notes: result.value.notes,
          description: result.value.description || 'Estado de Resultados Guardado',
          appliedFilters: { ...filters },
          includedHarvestIds: completedHarvests.map(h => h.id),
          includedExpenseIds: [],
          includedIncomeIds: completedHarvests
            .map(h => incomeRecords.find(r => r.harvestPlanId === h.id)?.id)
            .filter(id => id !== undefined)
        }

        const saveResult = await createClosure(closureData)

        if (saveResult.success) {
          MySwal.fire({
            icon: 'success',
            title: '✅ Estado de Resultados Guardado',
            html: `
              <div class="text-left">
                <p class="mb-3">El estado de resultados ha sido guardado exitosamente.</p>
                <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p class="text-sm text-green-800">
                    Los datos consolidados han sido almacenados y están disponibles para consulta posterior.
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
      console.error('Error saving income statement:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message || 'Ha ocurrido un error al guardar el estado de resultados'
      })
    }
  }

  // Income Statement Closure Functions
  const handleGenerateIncomeStatementClosure = async () => {
    // Get all lots with their sector information for the seeding selector
    const allLots = sectors.flatMap(sector => 
      sector.lots?.map(lot => ({
        ...lot,
        sectorName: sector.name
      })) || []
    )

    // Filter lots that have completed harvests
    const lotsWithHarvests = allLots.filter(lot => 
      completedHarvests.some(harvest => harvest.lotId === lot.id)
    )

    const seedingOptions = lotsWithHarvests.map(lot => {
      const harvests = completedHarvests.filter(h => h.lotId === lot.id)
      return `<option value="${lot.id}" data-entry-date="${lot.entryDate}" data-sector="${lot.sectorName}">
        ${lot.sectorName} - ${lot.origin} (${new Date(lot.entryDate).toLocaleDateString('es-PE')}) - ${harvests.length} cosecha(s)
      </option>`
    }).join('')

    const result = await MySwal.fire({
      title: '📊 Generar Cierre del Estado de Resultados',
      html: `
        <div class="text-left">
          <p class="mb-4">Esta acción generará un cierre del estado de resultados basado en una siembra específica.</p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 class="font-medium text-blue-900 mb-2">📈 Datos que se incluirán:</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Todas las cosechas de la siembra seleccionada</li>
              <li>• Ingresos generados por esas cosechas</li>
              <li>• Gastos operacionales relacionados</li>
              <li>• Análisis de rentabilidad por siembra</li>
            </ul>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Siembra *</label>
            <select 
              id="seedingId" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona una siembra...</option>
              ${seedingOptions}
            </select>
            <p class="text-xs text-gray-500 mt-1">Se muestran solo siembras con cosechas completadas</p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de cierre</label>
            <select 
              id="closureType" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="seeding">Por Siembra</option>
              <option value="custom">Personalizado</option>
              <option value="monthly">Mensual</option>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea 
              id="notes" 
              rows="3" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones sobre este cierre..."
            ></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '📊 Generar Cierre',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      preConfirm: () => {
        const seedingId = document.getElementById('seedingId').value
        const closureType = document.getElementById('closureType').value
        const notes = document.getElementById('notes').value

        if (!seedingId) {
          Swal.showValidationMessage('Por favor, selecciona una siembra')
          return false
        }

        return { seedingId, closureType, notes }
      }
    })

    if (result.isConfirmed) {
      await createIncomeStatementClosureFromSeeding(result.value)
    }
  }

  const createIncomeStatementClosureFromSeeding = async ({ seedingId, closureType, notes }) => {
    try {
      // Show loading
      MySwal.fire({
        title: 'Generando cierre...',
        html: 'Por favor espera mientras generamos el cierre del estado de resultados',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        }
      })

      // Find the selected seeding (lot) and its sector
      const allLots = sectors.flatMap(sector => 
        sector.lots?.map(lot => ({
          ...lot,
          sectorName: sector.name
        })) || []
      )
      
      const selectedSeeding = allLots.find(lot => lot.id === seedingId)
      if (!selectedSeeding) {
        throw new Error('Siembra no encontrada')
      }

      // Get all harvests for this seeding
      const seedingHarvests = completedHarvests.filter(harvest => harvest.lotId === seedingId)
      
      // Calculate revenues for this seeding
      const seedingRevenues = seedingHarvests.reduce((total, harvest) => 
        total + calculateEstimatedRevenue(harvest), 0
      )
      
      // Calculate harvest expenses for this seeding
      const harvestExpenses = seedingHarvests.reduce((total, harvest) => 
        total + (harvest.totalActualCost || harvest.totalHarvestExpenses || 0), 0
      )
      
      // Get related operational expenses (filtered by seeding period)
      const seedingStartDate = new Date(selectedSeeding.entryDate)
      const lastHarvestDate = seedingHarvests.length > 0 
        ? new Date(Math.max(...seedingHarvests.map(h => new Date(h.actualDate || h.plannedDate))))
        : new Date()
      
      // Ensure end date is after start date
      const periodEndDate = lastHarvestDate < seedingStartDate 
        ? new Date(seedingStartDate.getTime() + 24 * 60 * 60 * 1000) // Add one day to start date
        : lastHarvestDate
      
      const relatedExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= seedingStartDate && 
               expenseDate <= periodEndDate &&
               (expense.lotId === seedingId || expense.sectorId === selectedSeeding.sectorId)
      })
      
      const operationalExpenses = relatedExpenses.reduce((total, expense) => total + expense.amount, 0)
      
      // Calculate seeding investment cost
      const seedingCost = selectedSeeding.cost || 0
      
      // Calculate totals
      const totalRevenues = seedingRevenues
      const totalExpenses = harvestExpenses + operationalExpenses + seedingCost
      const grossProfit = totalRevenues - totalExpenses
      const netProfit = grossProfit
      const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0
      
      // Calculate volume metrics
      const totalQuantityHarvested = seedingHarvests.reduce((sum, harvest) => sum + (harvest.actualQuantity || 0), 0)
      const numberOfHarvests = seedingHarvests.length
      const averageRevenuePerHarvest = numberOfHarvests > 0 ? totalRevenues / numberOfHarvests : 0

      // Generate closure data based on selected seeding
      const closureData = {
        userId: user.id,
        closureType: closureType,
        periodStartDate: selectedSeeding.entryDate,
        periodEndDate: periodEndDate.toISOString().split('T')[0],
        totalRevenues,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMargin,
        revenueBreakdown: {
          harvestSales: seedingRevenues,
          otherIncome: 0
        },
        expenseBreakdown: {
          operational: operationalExpenses,
          harvesting: harvestExpenses,
          equipment: 0,
          materials: seedingCost,
          labor: 0,
          other: 0
        },
        totalQuantityHarvested,
        numberOfHarvests,
        averageRevenuePerHarvest,
        status: 'draft',
        notes: notes,
        appliedFilters: {
          seedingId: seedingId,
          includeOnlyCompleted: true
        },
        includedHarvestIds: seedingHarvests.map(h => h.id),
        includedExpenseIds: relatedExpenses.map(e => e.id),
        includedIncomeIds: [],
        // Add seeding-specific metadata
        seedingInfo: {
          seedingId: selectedSeeding.id,
          sectorName: selectedSeeding.sectorName,
          origin: selectedSeeding.origin,
          initialQuantity: selectedSeeding.initialQuantity,
          currentQuantity: selectedSeeding.currentQuantity,
          entryDate: selectedSeeding.entryDate,
          cultivationSystem: selectedSeeding.cultivationSystem
        }
      }

      const result = await createClosure(closureData)

      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: '🎉 Cierre generado exitosamente',
          html: `
            <div class="text-left">
              <p class="mb-3">El cierre del estado de resultados ha sido creado en estado <strong>borrador</strong>.</p>
              <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <h4 class="font-medium text-green-900 mb-2">📊 Resumen del cierre:</h4>
                <div class="text-sm text-green-800 space-y-1">
                  <div><strong>Siembra:</strong> ${selectedSeeding.sectorName} - ${selectedSeeding.origin}</div>
                  <div><strong>Período:</strong> ${new Date(selectedSeeding.entryDate).toLocaleDateString('es-PE')} - ${lastHarvestDate.toLocaleDateString('es-PE')}</div>
                  <div><strong>Cosechas incluidas:</strong> ${numberOfHarvests}</div>
                  <div><strong>Ingresos totales:</strong> ${formatCurrency(totalRevenues)}</div>
                  <div><strong>Gastos totales:</strong> ${formatCurrency(totalExpenses)}</div>
                  <div><strong>Utilidad neta:</strong> <span class="${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}">${formatCurrency(netProfit)}</span></div>
                  <div><strong>Margen de utilidad:</strong> ${profitMargin.toFixed(1)}%</div>
                  <div><strong>ROI:</strong> ${seedingCost > 0 ? ((netProfit / seedingCost) * 100).toFixed(1) + '%' : 'N/A'}</div>
                </div>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '💰 Finalizar y Registrar en Flujo de Caja',
          cancelButtonText: 'Mantener como Borrador',
          confirmButtonColor: '#10b981'
        }).then(async (finalizeResult) => {
          if (finalizeResult.isConfirmed) {
            await finalizeAndRegisterClosure(result.data.id)
          }
        })
      } else {
        throw new Error(result.error || 'Error al crear el cierre')
      }
    } catch (error) {
      console.error('Error creating closure:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error al generar cierre',
        text: error.message || 'Ha ocurrido un error al generar el cierre del estado de resultados'
      })
    }
  }

  const finalizeAndRegisterClosure = async (closureId) => {
    try {
      MySwal.fire({
        title: 'Finalizando y registrando...',
        html: 'Procesando el cierre y registrándolo en el flujo de caja...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading()
        }
      })

      // First finalize the closure
      const finalizeResult = await finalizeClosure(closureId, user.id)
      
      if (!finalizeResult.success) {
        throw new Error(finalizeResult.error || 'Error al finalizar el cierre')
      }

      // Then register it in cash flow
      const registerResult = await registerClosureInCashFlow(closureId)

      if (registerResult.success) {
        MySwal.fire({
          icon: 'success',
          title: '✅ Cierre registrado en flujo de caja',
          html: `
            <div class="text-left">
              <p class="mb-3">El cierre ha sido finalizado y registrado exitosamente en el flujo de caja.</p>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p class="text-sm text-blue-800">
                  <strong>💡 Consejo:</strong> Puedes ver este registro en la sección de "Flujo de caja" junto con tus otros movimientos financieros.
                </p>
              </div>
            </div>
          `,
          timer: 5000,
          showConfirmButton: true,
          confirmButtonText: 'Entendido'
        })
      } else {
        throw new Error(registerResult.error || 'Error al registrar en flujo de caja')
      }
    } catch (error) {
      console.error('Error finalizing closure:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error al finalizar cierre',
        text: error.message || 'Ha ocurrido un error al finalizar y registrar el cierre'
      })
    }
  }

  // Filter functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      sectorId: '',
      minIncome: '',
      maxIncome: '',
      searchTerm: ''
    })
  }

  const applyPresetFilter = (preset) => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    switch (preset) {
      case 'thisMonth':
        setFilters({
          ...filters,
          dateFrom: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        })
        break
      case 'lastMonth':
        const lastMonth = new Date(currentYear, currentMonth - 1, 1)
        const lastMonthEnd = new Date(currentYear, currentMonth, 0)
        setFilters({
          ...filters,
          dateFrom: lastMonth.toISOString().split('T')[0],
          dateTo: lastMonthEnd.toISOString().split('T')[0]
        })
        break
      case 'thisYear':
        setFilters({
          ...filters,
          dateFrom: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        })
        break
      case 'highIncome':
        setFilters({
          ...filters,
          minIncome: '10000'
        })
        break
      default:
        break
    }
  }

  const completedHarvests = useMemo(() => {
    let filtered = harvestPlans.filter(plan => plan.status === 'completed')
    
    // Apply filters
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(plan => {
        const planDate = new Date(plan.actualDate || plan.plannedDate)
        return planDate >= fromDate
      })
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(plan => {
        const planDate = new Date(plan.actualDate || plan.plannedDate)
        return planDate <= toDate
      })
    }
    
    if (filters.sectorId) {
      filtered = filtered.filter(plan => plan.sectorId === filters.sectorId)
    }
    
    if (filters.minIncome || filters.maxIncome) {
      filtered = filtered.filter(plan => {
        const revenue = calculateEstimatedRevenue(plan)
        const minIncome = parseFloat(filters.minIncome) || 0
        const maxIncome = parseFloat(filters.maxIncome) || Infinity
        return revenue >= minIncome && revenue <= maxIncome
      })
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(plan => {
        const sector = sectors.find(s => s.id === plan.sectorId)
        const sectorName = sector?.name?.toLowerCase() || ''
        const lotId = plan.lotId?.toLowerCase() || ''
        const notes = plan.notes?.toLowerCase() || ''
        
        return sectorName.includes(searchLower) || 
               lotId.includes(searchLower) || 
               notes.includes(searchLower)
      })
    }
    
    return filtered
  }, [harvestPlans, filters, sectors, calculateEstimatedRevenue])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const handleShowHarvestResults = (plan) => {
    setSelectedPlan(plan)
    setShowResultsModal(true)
  }

  const handleCloseResultsModal = () => {
    setSelectedPlan(null)
    setShowResultsModal(false)
  }

  // Size distribution editing functions
  const handleEditDistribution = (planId) => {
    const plan = completedHarvests.find(p => p.id === planId)
    if (plan && plan.sizeDistribution) {
      setTempDistributions(prev => ({
        ...prev,
        [planId]: { ...plan.sizeDistribution }
      }))
      setEditingDistribution(prev => ({ ...prev, [planId]: true }))
    }
  }

  const handleCancelEdit = (planId) => {
    setEditingDistribution(prev => {
      const newState = { ...prev }
      delete newState[planId]
      return newState
    })
    setTempDistributions(prev => {
      const newState = { ...prev }
      delete newState[planId]
      return newState
    })
  }

  const handleSizeChange = (planId, size, value) => {
    setTempDistributions(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [size]: parseInt(value) || 0
      }
    }))
  }

  const handleSaveDistribution = async (planId) => {
    try {
      const newDistribution = tempDistributions[planId]
      const plan = completedHarvests.find(p => p.id === planId)
      
      // Calcular el nuevo total basado en la distribución
      const newTotalQuantity = Object.values(newDistribution).reduce((sum, val) => sum + parseInt(val || 0), 0)
      
      // Actualizar el plan de cosecha con la nueva distribución y cantidad total
      await updateHarvestPlan({ 
        id: planId, 
        sizeDistribution: newDistribution,
        actualQuantity: newTotalQuantity 
      })
      
      // Calcular el nuevo total de ingresos
      let newTotalAmount = 0
      Object.entries(newDistribution).forEach(([size, quantity]) => {
        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
        if (price && quantity) {
          newTotalAmount += quantity * price.pricePerUnit
        }
      })
      
      // Buscar si existe un registro de ingreso para este plan
      const existingIncomeRecord = incomeRecords.find(record => record.harvestPlanId === planId)
      
      if (existingIncomeRecord) {
        // Actualizar el registro existente
        await updateIncomeRecord({
          id: existingIncomeRecord.id,
          sizeDistribution: newDistribution,
          totalAmount: newTotalAmount,
          quantity: Object.values(newDistribution).reduce((sum, q) => sum + q, 0),
          updatedAt: new Date().toISOString()
        })
      } else {
        // Crear un nuevo registro de ingreso
        await createIncomeRecord({
          userId: user.id,
          harvestPlanId: planId,
          sectorId: plan.sectorId,
          lotId: plan.lotId,
          date: plan.actualDate || plan.plannedDate,
          type: 'harvest_sale',
          description: `Venta de cosecha - Lote ${plan.lotId}`,
          quantity: Object.values(newDistribution).reduce((sum, q) => sum + q, 0),
          sizeDistribution: newDistribution,
          totalAmount: newTotalAmount,
          currency: 'PEN',
          status: 'confirmed',
          notes: `Distribución actualizada desde la página de ingresos`
        })
      }
      
      // Limpiar estado de edición
      setEditingDistribution(prev => {
        const newState = { ...prev }
        delete newState[planId]
        return newState
      })
      setTempDistributions(prev => {
        const newState = { ...prev }
        delete newState[planId]
        return newState
      })
      
      // Refrescar datos
      if (user?.id) {
        await Promise.all([
          fetchHarvestPlans(user.id),
          fetchIncomeRecords(user.id)
        ])
      }
      
      MySwal.fire({
        icon: 'success',
        title: 'Distribución guardada',
        text: 'La distribución por tallas y los ingresos han sido actualizados exitosamente',
        timer: 2000
      })
      
    } catch (error) {
      console.error('❌ Error saving distribution:', error)
      MySwal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: 'Ha ocurrido un error al guardar la distribución'
      })
    }
  }

  const calculateTempRevenue = (planId) => {
    const distribution = tempDistributions[planId]
    if (!distribution || !pricing.length) return 0
    
    let total = 0
    Object.entries(distribution).forEach(([size, quantity]) => {
      const price = pricing.find(p => p.sizeCategory === size && p.isActive)
      if (price && quantity) {
        total += quantity * price.pricePerUnit
      }
    })
    return total
  }

  // Recalculate totals based on filtered data (usando ingresos reales cuando existen)
  const filteredStats = useMemo(() => {
    const totalRevenue = completedHarvests.reduce((sum, plan) => {
      const incomeRecord = incomeRecords.find(record => record.harvestPlanId === plan.id)
      return sum + (incomeRecord ? incomeRecord.totalAmount : calculateEstimatedRevenue(plan))
    }, 0)

    // Calcular el total basado en la distribución por tallas si existe, o en actualQuantity si no
    const totalHarvested = completedHarvests.reduce((sum, plan) => {
      if (plan.sizeDistribution && Object.keys(plan.sizeDistribution).length > 0) {
        // Sumar la distribución por tallas (redondeado hacia arriba)
        const tallySum = Object.values(plan.sizeDistribution).reduce((tallyTotal, count) =>
          tallyTotal + Math.ceil(count || 0), 0
        )
        return sum + tallySum
      } else {
        // Si no hay distribución, usar actualQuantity (redondeado hacia arriba)
        return sum + Math.ceil(plan.actualQuantity || 0)
      }
    }, 0)

    const averageRevenue = completedHarvests.length > 0 
      ? totalRevenue / completedHarvests.length 
      : 0

    return {
      totalRevenue,
      totalHarvested,
      averageRevenue,
      completedCount: completedHarvests.length
    }
  }, [completedHarvests, calculateEstimatedRevenue])

  // Synchronized Income Statement Calculations (using filtered data)
  const incomeStatementData = useMemo(() => {
    // 1. Calculate total revenues from filtered completed harvests (usando datos reales del incomeStore)
    const totalRevenues = completedHarvests.reduce((sum, plan) => {
      const incomeRecord = incomeRecords.find(record => record.harvestPlanId === plan.id)
      return sum + (incomeRecord ? incomeRecord.totalAmount : calculateEstimatedRevenue(plan))
    }, 0)

    // 2. Calculate total expenses (operational + harvest specific)
    const harvestExpenses = completedHarvests.reduce((sum, plan) => {
      return sum + (plan.totalActualCost || plan.totalHarvestExpenses || 0)
    }, 0)

    // 3. Get lot-related expenses from expense store
    const lotExpenses = expenses.reduce((sum, expense) => {
      // Only include expenses related to completed harvests
      const isHarvestRelated = completedHarvests.some(plan => 
        expense.lotId === plan.lotId || expense.sectorId === plan.sectorId
      )
      return isHarvestRelated ? sum + (expense.amount || 0) : sum
    }, 0)

    // 4. Calculate initial investment costs from lots
    const initialInvestments = completedHarvests.reduce((sum, plan) => {
      const sector = sectors.find(s => s.id === plan.sectorId)
      const lot = sector?.lots?.find(l => l.id === plan.lotId)
      return sum + (lot?.cost || 0)
    }, 0)

    const totalCosts = harvestExpenses + lotExpenses + initialInvestments
    const grossProfit = totalRevenues - harvestExpenses
    const netProfit = totalRevenues - totalCosts
    const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues * 100) : 0
    const roi = initialInvestments > 0 ? (netProfit / initialInvestments * 100) : 0

    return {
      // Revenue breakdown
      totalRevenues,
      averageRevenuePerHarvest: completedHarvests.length > 0 ? totalRevenues / completedHarvests.length : 0,
      
      // Cost breakdown
      harvestExpenses,
      lotExpenses,
      initialInvestments,
      totalCosts,
      averageCostPerHarvest: completedHarvests.length > 0 ? totalCosts / completedHarvests.length : 0,
      
      // Profitability metrics
      grossProfit,
      netProfit,
      profitMargin,
      roi,
      
      // Volume metrics
      totalQuantityHarvested: filteredStats.totalHarvested,

      // Métricas por concha individual (unidad base)
      revenuePerUnit: filteredStats.totalHarvested > 0 ? totalRevenues / filteredStats.totalHarvested : 0,
      costPerUnit: filteredStats.totalHarvested > 0 ? totalCosts / filteredStats.totalHarvested : 0,
      profitPerUnit: filteredStats.totalHarvested > 0 ? netProfit / filteredStats.totalHarvested : 0,

      // Métricas por manojo
      revenuePerManojo: filteredStats.totalHarvested > 0 ? (totalRevenues / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MANOJO : 0,
      costPerManojo: filteredStats.totalHarvested > 0 ? (totalCosts / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MANOJO : 0,
      profitPerManojo: filteredStats.totalHarvested > 0 ? (netProfit / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MANOJO : 0,

      // Métricas por malla
      revenuePerMalla: filteredStats.totalHarvested > 0 ? (totalRevenues / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MALLA : 0,
      costPerMalla: filteredStats.totalHarvested > 0 ? (totalCosts / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MALLA : 0,
      profitPerMalla: filteredStats.totalHarvested > 0 ? (netProfit / filteredStats.totalHarvested) * CONVERSIONS.CONCHITAS_POR_MALLA : 0
    }
  }, [completedHarvests, expenses, sectors, filteredStats.totalHarvested, calculateEstimatedRevenue])

  if (loading && harvestPlans.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando datos de ingresos..." />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ingresos por Cosecha</h1>
          <p className="text-gray-600 mt-1">
            Visualiza todas las cosechas realizadas y sus ingresos generados
          </p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            🔍 Filtros
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({completedHarvests.length} de {harvestPlans.filter(p => p.status === 'completed').length} cosechas)
            </span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6 mb-4">
          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              className="input-field"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          
          {/* Sector Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <select
              className="input-field"
              value={filters.sectorId}
              onChange={(e) => handleFilterChange('sectorId', e.target.value)}
            >
              <option value="">Todos los sectores</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Income Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingreso mínimo (PEN)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="input-field"
              placeholder="0"
              value={filters.minIncome}
              onChange={(e) => handleFilterChange('minIncome', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingreso máximo (PEN)
            </label>
            <input
              type="number"
              min="0"
              step="100"
              className="input-field"
              placeholder="Sin límite"
              value={filters.maxIncome}
              onChange={(e) => handleFilterChange('maxIncome', e.target.value)}
            />
          </div>
          
          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Sector, lote, notas..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
        
        {/* Filter Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            🗑️ Limpiar Filtros
          </button>
          
          {/* Preset Filters */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => applyPresetFilter('thisMonth')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              📅 Este Mes
            </button>
            <button
              onClick={() => applyPresetFilter('lastMonth')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              📅 Mes Anterior
            </button>
            <button
              onClick={() => applyPresetFilter('thisYear')}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              📅 Este Año
            </button>
            <button
              onClick={() => applyPresetFilter('highIncome')}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
            >
              💰 Ingresos Altos
            </button>
          </div>
          
          {/* Active Filters Indicators */}
          {Object.values(filters).some(value => value !== '') && (
            <div className="flex flex-wrap gap-1">
              {filters.dateFrom && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Desde: {new Date(filters.dateFrom).toLocaleDateString('es-PE')}
                </span>
              )}
              {filters.dateTo && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Hasta: {new Date(filters.dateTo).toLocaleDateString('es-PE')}
                </span>
              )}
              {filters.sectorId && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Sector: {sectors.find(s => s.id === filters.sectorId)?.name || 'N/A'}
                </span>
              )}
              {filters.minIncome && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Min: S/ {parseFloat(filters.minIncome).toLocaleString()}
                </span>
              )}
              {filters.maxIncome && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Max: S/ {parseFloat(filters.maxIncome).toLocaleString()}
                </span>
              )}
              {filters.searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Buscar: "{filters.searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6">
        <StatCard
          title="Cosechas Completadas"
          value={filteredStats.completedCount}
          subtitle={`${filteredStats.completedCount === harvestPlans.filter(p => p.status === 'completed').length ? 'Total realizadas' : `de ${harvestPlans.filter(p => p.status === 'completed').length} totales`}`}
          icon="✅"
          color="green"
        />
        
        <StatCard
          title="Total Cosechado"
          value={
            <div>
              <div>{Math.round(filteredStats.totalHarvested / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()}</div>
              <div className="text-xs opacity-75">
                ({Math.round(filteredStats.totalHarvested / CONVERSIONS.CONCHITAS_POR_MALLA)} mallas)
              </div>
            </div>
          }
          subtitle="Manojos (filtrado)"
          icon="📦"
          color="blue"
        />
        
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(filteredStats.totalRevenue)}
          subtitle="Ventas registradas (filtrado)"
          icon="💰"
          color="yellow"
        />

        <StatCard
          title="Ingreso Promedio"
          value={formatCurrency(filteredStats.averageRevenue)}
          subtitle="Por cosecha (filtrado)"
          icon="📊"
          color="secondary"
        />
      </div>

      {/* Completed Harvests Table */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">📊 Cosechas Realizadas</h2>
          <p className="text-sm text-gray-600">Registro detallado de todas las cosechas completadas con sus ingresos</p>
        </div>
        
        {completedHarvests.length === 0 ? (
          <EmptyState
            title="No hay cosechas completadas"
            message="Las cosechas completadas aparecerán aquí con información detallada sobre los ingresos generados."
            icon="💵"
            className="py-8"
          />
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Cosechada
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distribución por Presentaciones
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos
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
                {completedHarvests
                  .sort((a, b) => new Date(b.actualDate || b.plannedDate) - new Date(a.actualDate || a.plannedDate))
                  .map((plan) => {
                    const sector = sectors.find(s => s.id === plan.sectorId)
                    const incomeRecord = incomeRecords.find(record => record.harvestPlanId === plan.id)
                    const actualRevenue = incomeRecord ? incomeRecord.totalAmount : 0
                    const estimatedRevenue = calculateEstimatedRevenue(plan)
                    const hasRealIncome = incomeRecord !== undefined
                    
                    return (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {plan.actualDate 
                            ? new Date(plan.actualDate).toLocaleDateString('es-PE')
                            : new Date(plan.plannedDate).toLocaleDateString('es-PE')
                          }
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{sector?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">
                              ID Lote: {plan.lotId}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="font-medium text-green-700">
                              📦 {Math.round((plan.actualQuantity || plan.estimatedQuantity || 0) / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()} manojos
                              <span className="text-xs text-gray-500 ml-1">({CONVERSIONS.CONCHITAS_POR_MANOJO} conchas c/u)</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              🦪 {Math.round((plan.actualQuantity || plan.estimatedQuantity || 0) / CONVERSIONS.CONCHITAS_POR_KG).toLocaleString()} conchitas
                              <span className="text-xs text-gray-500 ml-1">(1kg = {CONVERSIONS.CONCHITAS_POR_KG} conchas)</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              🎯 {Math.round((plan.actualQuantity || plan.estimatedQuantity || 0) / CONVERSIONS.CONCHITAS_POR_MALLA)} mallas
                              <span className="text-xs text-gray-400 ml-1">({CONVERSIONS.CONCHITAS_POR_MALLA} conchas c/u)</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              Total: {Math.ceil(plan.actualQuantity || plan.estimatedQuantity || 0).toLocaleString()} unidades
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                          {showPresentationModal === plan.id ? (
                            <div className="text-xs text-blue-600">
                              Editando en modal...
                            </div>
                          ) : editingDistribution[plan.id] ? (
                            <div className="space-y-2">
                              {/* Editable Size Distribution */}
                              <div className="grid grid-cols-2 gap-2">
                                {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                  <div key={size} className="flex items-center space-x-1">
                                    <label className="text-xs font-medium w-6">{size}:</label>
                                    <input
                                      type="number"
                                      min="0"
                                      className="w-12 sm:w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                      value={tempDistributions[plan.id]?.[size] || 0}
                                      onChange={(e) => handleSizeChange(plan.id, size, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {/* Action buttons */}
                              <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1">
                                <button
                                  onClick={() => handleSaveDistribution(plan.id)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 w-full sm:w-auto"
                                >
                                  ✓ Guardar
                                </button>
                                <button
                                  onClick={() => handleCancelEdit(plan.id)}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 w-full sm:w-auto"
                                >
                                  ✕ Cancelar
                                </button>
                              </div>
                              
                              {/* Real-time revenue preview */}
                              <div className="text-xs text-blue-600 font-medium">
                                Nuevo ingreso: {formatCurrency(calculateTempRevenue(plan.id))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {plan.presentationDistribution ? (
                                <div className="text-xs space-y-1">
                                  <div className="font-medium text-gray-700 mb-1">📦 Presentaciones:</div>
                                  {plan.presentationDistribution.presentations?.map((pres) => {
                                    const presTotal = pres.measures?.reduce((sum, m) => {
                                      const key = `${pres.id}_${m.id}`
                                      return sum + (plan.presentationDistribution.weights[key] || 0)
                                    }, 0) || 0
                                    
                                    if (presTotal === 0) return null
                                    
                                    return (
                                      <div key={pres.id} className="mb-2">
                                        <div className="font-medium text-gray-800 pl-2">
                                          {pres.name}: {presTotal.toFixed(2)} Kg
                                        </div>
                                        <div className="pl-4 space-y-0.5">
                                          {pres.measures?.map((measure) => {
                                            const key = `${pres.id}_${measure.id}`
                                            const weight = plan.presentationDistribution.weights[key] || 0
                                            if (weight === 0) return null
                                            
                                            return (
                                              <div key={measure.id} className="flex justify-between text-gray-600">
                                                <span>• {measure.name}:</span>
                                                <span>{weight.toFixed(2)} Kg</span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  <div className="flex justify-between border-t pt-1 font-semibold text-gray-700">
                                    <span>Total:</span>
                                    <span>
                                      {plan.presentationDistribution.totals?.totalKg?.toFixed(2) || '0'} Kg
                                      ({plan.presentationDistribution.totals?.totalUnidades?.toLocaleString() || '0'} unid)
                                    </span>
                                  </div>
                                </div>
                              ) : plan.sizeDistribution ? (
                                <div className="text-xs space-y-1">
                                  {Object.entries(plan.sizeDistribution)
                                    .filter(([, count]) => count > 0)
                                    .map(([size, count]) => (
                                      <div key={size} className="flex justify-between">
                                        <span className="font-medium">{size}:</span>
                                        <span>{Math.ceil(count).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  {/* Mostrar total de la distribución */}
                                  <div className="flex justify-between border-t pt-1 font-semibold text-gray-700">
                                    <span>Total:</span>
                                    <span>{Object.values(plan.sizeDistribution).reduce((sum, count) => sum + Math.ceil(count || 0), 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Sin datos</span>
                              )}
                              
                              {/* Edit button */}
                              <button
                                onClick={() => setShowPresentationModal(plan.id)}
                                className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors w-full sm:w-auto"
                              >
                                📏 {plan.presentationDistribution ? 'Editar' : 'Configurar'} Presentaciones
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {editingDistribution[plan.id] ? (
                            <div>
                              <div className="font-bold text-blue-600">
                                {formatCurrency(calculateTempRevenue(plan.id))}
                              </div>
                              <div className="text-xs text-blue-500">
                                (Editando)
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Original: {formatCurrency(actualRevenue || estimatedRevenue)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {hasRealIncome ? (
                                <>
                                  <div className="font-bold text-green-600">
                                    {formatCurrency(actualRevenue)}
                                  </div>
                                  <div className="text-xs text-green-500">
                                    ✓ Registrado
                                  </div>
                                  {incomeRecord.status === 'paid' && (
                                    <span className="text-xs text-green-700 font-medium">✓ Pagado</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="font-bold text-orange-600">
                                    {formatCurrency(estimatedRevenue)}
                                  </div>
                                  <div className="text-xs text-orange-500">
                                    ⚠ Estimado
                                  </div>
                                  <button
                                    onClick={async () => {
                                      // Crear registro de ingreso
                                      await createIncomeRecord({
                                        userId: user.id,
                                        harvestPlanId: plan.id,
                                        sectorId: plan.sectorId,
                                        lotId: plan.lotId,
                                        date: plan.actualDate || plan.plannedDate,
                                        type: 'harvest_sale',
                                        description: `Venta de cosecha - ${sector?.name || 'Sector'}`,
                                        quantity: plan.actualQuantity || plan.estimatedQuantity,
                                        sizeDistribution: plan.sizeDistribution,
                                        totalAmount: estimatedRevenue,
                                        currency: 'PEN',
                                        status: 'confirmed',
                                        notes: `Registro creado desde página de ingresos`
                                      })
                                      // Refrescar datos
                                      await fetchIncomeRecords(user.id)
                                      MySwal.fire({
                                        icon: 'success',
                                        title: 'Ingreso registrado',
                                        text: 'Se ha creado el registro de ingreso exitosamente',
                                        timer: 2000
                                      })
                                    }}
                                    className="mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors"
                                  >
                                    💵 Registrar
                                  </button>
                                </>
                              )}
                              {(actualRevenue || estimatedRevenue) > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatCurrency((actualRevenue || estimatedRevenue) / (plan.actualQuantity || plan.estimatedQuantity || 1))}/unidad
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Completado
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleShowHarvestResults(plan)}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-2 sm:px-3 py-1 rounded text-xs transition-colors w-full sm:w-auto"
                          >
                            📏 Estado de Resultados
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Revenue Summary */}
      {completedHarvests.length > 0 && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📈 Resumen de Ingresos por Mes</h2>
            <p className="text-sm text-gray-600">Distribución de ingresos agrupados por mes</p>
          </div>
          
          <div className="space-y-4">
            {Object.entries(
              completedHarvests.reduce((acc, plan) => {
                const month = new Date(plan.actualDate || plan.plannedDate).toLocaleDateString('es-PE', { 
                  year: 'numeric', 
                  month: 'long' 
                })
                if (!acc[month]) {
                  acc[month] = {
                    plans: [],
                    totalRevenue: 0,
                    totalQuantity: 0
                  }
                }
                acc[month].plans.push(plan)
                acc[month].totalRevenue += calculateEstimatedRevenue(plan)
                acc[month].totalQuantity += Math.ceil(plan.actualQuantity || plan.estimatedQuantity || 0)
                return acc
              }, {})
            )
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([month, data]) => (
                <div key={month} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900 capitalize">{month}</h3>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(data.totalRevenue)}</div>
                      <div className="text-xs text-gray-500">{data.plans.length} cosechas</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 text-sm">
                    <div className="bg-blue-50 rounded p-2">
                      <div className="font-medium text-blue-800">Cantidad Total</div>
                      <div className="text-blue-600">
                        {Math.round(data.totalQuantity / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()} manojos
                      </div>
                      <div className="text-xs text-blue-500">
                        ({Math.round(data.totalQuantity / CONVERSIONS.CONCHITAS_POR_MALLA)} mallas)
                      </div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <div className="font-medium text-green-800">Ingreso Promedio</div>
                      <div className="text-green-600">{formatCurrency(data.totalRevenue / data.plans.length)}</div>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                      <div className="font-medium text-purple-800">Precio por Manojo</div>
                      <div className="text-purple-600">{formatCurrency(data.totalRevenue / Math.round(data.totalQuantity / CONVERSIONS.CONCHITAS_POR_MANOJO))}</div>
                      <div className="text-xs text-purple-500">
                        {formatCurrency(data.totalRevenue / (data.totalQuantity / CONVERSIONS.CONCHITAS_POR_MALLA))}/malla
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Comprehensive Income Statement */}
      {completedHarvests.length > 0 && (
        <div className="card">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">📊 Estado de Resultados Consolidado</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Análisis financiero completo sincronizado con todas las secciones del sistema
                </p>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <button
                  onClick={handleSaveCurrentIncomeStatement}
                  disabled={closureLoading || filteredStats.completedCount === 0}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 w-full sm:w-auto ${
                    closureLoading || filteredStats.completedCount === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                  }`}
                  title={filteredStats.completedCount === 0 ? 'Necesitas al menos una cosecha completada para guardar' : 'Guardar el estado de resultados actual'}
                >
                  {closureLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      💾 Guardar Estado Actual
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerateIncomeStatementClosure}
                  disabled={closureLoading || filteredStats.completedCount === 0}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 w-full sm:w-auto ${
                    closureLoading || filteredStats.completedCount === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                  }`}
                  title={filteredStats.completedCount === 0 ? 'Necesitas al menos una cosecha completada para generar un cierre' : 'Generar cierre del estado de resultados para registro en flujo de caja'}
                >
                  {closureLoading ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      Procesando...
                    </>
                  ) : (
                    <>
                      📊 Generar Cierre Formal
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {/* Revenue Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2">
                💰 Ingresos
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Ingresos Totales por Ventas</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(incomeStatementData.totalRevenues)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600">Ingreso Promedio/Cosecha</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(incomeStatementData.averageRevenuePerHarvest)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600">Precio Promedio/Unidad</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(incomeStatementData.revenuePerUnit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Costs Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2">
                💸 Costos y Gastos
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Gastos de Cosecha</span>
                    <span className="font-medium text-red-700">
                      {formatCurrency(incomeStatementData.harvestExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Gastos Operacionales</span>
                    <span className="font-medium text-red-700">
                      {formatCurrency(incomeStatementData.lotExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-sm">Inversión Inicial (Lotes)</span>
                    <span className="font-medium text-red-700">
                      {formatCurrency(incomeStatementData.initialInvestments)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border-2 border-red-200">
                  <span className="font-semibold">Total Costos</span>
                  <span className="text-lg font-bold text-red-700">
                    {formatCurrency(incomeStatementData.totalCosts)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  Costo promedio por unidad: {formatCurrency(incomeStatementData.costPerUnit)}
                </div>
              </div>
            </div>
          </div>

          {/* Profitability Metrics */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">
              📈 Métricas de Rentabilidad
            </h3>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-1">Utilidad Bruta</div>
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrency(incomeStatementData.grossProfit)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  (Ingresos - Gastos de Cosecha)
                </div>
              </div>
              
              <div className={`rounded-lg p-4 border ${
                incomeStatementData.netProfit >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  incomeStatementData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Utilidad Neta
                </div>
                <div className={`text-2xl font-bold ${
                  incomeStatementData.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatCurrency(incomeStatementData.netProfit)}
                </div>
                <div className={`text-xs mt-1 ${
                  incomeStatementData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  (Ingresos - Todos los Costos)
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-1">Margen de Utilidad</div>
                <div className="text-2xl font-bold text-purple-800">
                  {incomeStatementData.profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  (Utilidad / Ingresos)
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="text-orange-600 text-sm font-medium mb-1">ROI</div>
                <div className="text-2xl font-bold text-orange-800">
                  {incomeStatementData.roi.toFixed(1)}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  (Utilidad / Inversión Inicial)
                </div>
              </div>
            </div>
          </div>

          {/* Per Unit Analysis - Análisis por Manojo y Malla */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              🔍 Análisis por Presentación
            </h3>
            
            {/* Análisis por Malla - PRINCIPAL */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-purple-700 mb-3">🎯 Por Malla ({CONVERSIONS.MANOJOS_POR_MALLA} manojos = {CONVERSIONS.CONCHITAS_POR_MALLA} unidades) - PRINCIPAL</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                  <div className="text-purple-800 text-sm font-semibold mb-2">Total Mallas</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round(incomeStatementData.totalQuantityHarvested / CONVERSIONS.CONCHITAS_POR_MALLA)}
                  </div>
                  <div className="text-xs text-purple-700 font-medium">mallas</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-purple-700 text-sm font-medium mb-2">Ingreso por Malla</div>
                  <div className="text-xl font-bold text-purple-900">
                    {formatCurrency(incomeStatementData.revenuePerMalla)}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-purple-700 text-sm font-medium mb-2">Costo por Malla</div>
                  <div className="text-xl font-bold text-purple-900">
                    {formatCurrency(incomeStatementData.costPerMalla)}
                  </div>
                </div>

                <div className={`rounded-lg p-4 border-2 ${
                  incomeStatementData.profitPerMalla >= 0
                    ? 'bg-green-100 border-green-300'
                    : 'bg-red-100 border-red-300'
                }`}>
                  <div className="text-gray-700 text-sm font-semibold mb-2">Utilidad por Malla</div>
                  <div className={`text-xl font-bold ${
                    incomeStatementData.profitPerMalla >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {formatCurrency(incomeStatementData.profitPerMalla)}
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis por Manojo - SECUNDARIO */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-blue-600 mb-3">📦 Por Manojo ({CONVERSIONS.CONCHITAS_POR_MANOJO} unidades)</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-700 text-sm mb-2">Total Manojos</div>
                  <div className="text-xl font-bold text-blue-900">
                    {Math.round(incomeStatementData.totalQuantityHarvested / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600">manojos</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-2">Ingreso por Manojo</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(incomeStatementData.revenuePerManojo)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-600 text-sm mb-2">Costo por Manojo</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(incomeStatementData.costPerManojo)}
                  </div>
                </div>

                <div className={`rounded-lg p-4 ${
                  incomeStatementData.profitPerManojo >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="text-gray-600 text-sm mb-2">Utilidad por Manojo</div>
                  <div className={`text-xl font-bold ${
                    incomeStatementData.profitPerManojo >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(incomeStatementData.profitPerManojo)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Análisis por Unidad Individual - REFERENCIA */}
            <div className="mt-6 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">🐚 Por Unidad Individual (referencia)</h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="bg-white rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">Ingresos por Unidad</div>
                  <div className="text-sm font-bold text-gray-700">
                    {formatCurrency(incomeStatementData.revenuePerUnit)}
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">Costo por Unidad</div>
                  <div className="text-sm font-bold text-gray-700">
                    {formatCurrency(incomeStatementData.costPerUnit)}
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="text-gray-500 text-xs mb-1">Utilidad por Unidad</div>
                  <div className={`text-sm font-bold ${
                    incomeStatementData.profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(incomeStatementData.profitPerUnit)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{completedHarvests.length}</div>
                <div className="text-gray-600">Cosechas Realizadas</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">{Math.round(incomeStatementData.totalQuantityHarvested / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()}</div>
                <div className="text-gray-600">Manojos ({CONVERSIONS.CONCHITAS_POR_MANOJO} c/u)</div>
                <div className="text-xs text-gray-500">{Math.round(incomeStatementData.totalQuantityHarvested / CONVERSIONS.CONCHITAS_POR_MALLA)} mallas</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-700">{Math.round(incomeStatementData.totalQuantityHarvested / CONVERSIONS.CONCHITAS_POR_KG).toLocaleString()}</div>
                <div className="text-gray-600">Conchitas (1kg={CONVERSIONS.CONCHITAS_POR_KG})</div>
                <div className="text-xs text-gray-500">{Math.ceil(incomeStatementData.totalQuantityHarvested).toLocaleString()} unidades</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {formatCurrency(incomeStatementData.averageCostPerHarvest)}
                </div>
                <div className="text-gray-600">Costo Promedio/Cosecha</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {completedHarvests.length > 0
                    ? Math.round((incomeStatementData.totalQuantityHarvested / completedHarvests.length) / CONVERSIONS.CONCHITAS_POR_MANOJO).toLocaleString()
                    : '0'
                  }
                </div>
                <div className="text-gray-600">Promedio Manojos/Cosecha</div>
                <div className="text-xs text-gray-500">
                  ({completedHarvests.length > 0
                    ? Math.round((incomeStatementData.totalQuantityHarvested / completedHarvests.length) / CONVERSIONS.CONCHITAS_POR_MALLA)
                    : 0
                  } mallas)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      <HarvestResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseResultsModal}
        harvestPlan={selectedPlan}
        sector={selectedPlan ? sectors.find(s => s.id === selectedPlan.sectorId) : null}
        pricing={pricing}
      />
      
      {/* Presentation Distribution Modal */}
      {showPresentationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">
                  📦 Configurar Distribución por Presentaciones
                </h2>
                <button
                  onClick={() => setShowPresentationModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <PresentationDistribution
                planId={showPresentationModal}
                initialData={completedHarvests.find(p => p.id === showPresentationModal)?.presentationDistribution}
                harvestData={completedHarvests.find(p => p.id === showPresentationModal)}
                onSave={async (planId, data) => {
                  try {
                    // Actualizar el plan de cosecha con la nueva distribución
                    await updateHarvestPlan({
                      id: planId,
                      presentationDistribution: data,
                      actualQuantity: data.totals.totalUnidades
                    })
                    
                    // Actualizar o crear registro de ingreso
                    const existingIncomeRecord = incomeRecords.find(r => r.harvestPlanId === planId)
                    
                    if (existingIncomeRecord) {
                      await updateIncomeRecord({
                        id: existingIncomeRecord.id,
                        presentationDistribution: data,
                        totalAmount: data.totals.totalRevenue,
                        quantity: data.totals.totalUnidades,
                        weightKg: data.totals.totalKg,
                        updatedAt: new Date().toISOString()
                      })
                    } else {
                      const plan = completedHarvests.find(p => p.id === planId)
                      const sector = sectors.find(s => s.id === plan.sectorId)
                      
                      await createIncomeRecord({
                        harvestPlanId: planId,
                        userId: user.id,
                        date: plan.actualDate || plan.plannedDate,
                        type: 'harvest_sale',
                        category: 'harvest',
                        description: `Venta de cosecha - ${sector?.name || 'Sector'}`,
                        quantity: data.totals.totalUnidades,
                        weightKg: data.totals.totalKg,
                        presentationDistribution: data,
                        totalAmount: data.totals.totalRevenue,
                        currency: 'PEN',
                        status: 'confirmed',
                        notes: `Registro creado desde página de ingresos`
                      })
                    }
                    
                    MySwal.fire({
                      icon: 'success',
                      title: 'Distribución guardada',
                      text: 'La distribución por presentaciones se guardó exitosamente',
                      timer: 2000,
                      showConfirmButton: false
                    })
                    
                    setShowPresentationModal(null)
                    
                    // Refrescar datos
                    fetchHarvestPlans(user.id)
                    fetchIncomeRecords(user.id)
                  } catch (error) {
                    console.error('Error saving presentation distribution:', error)
                    MySwal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Error al guardar la distribución por presentaciones'
                    })
                  }
                }}
                onCancel={() => setShowPresentationModal(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IncomePage