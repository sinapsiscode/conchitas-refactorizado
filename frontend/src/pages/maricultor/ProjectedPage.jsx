import React, { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../stores'
import { useSectorStore } from '../../stores'
import { useHarvestStore } from '../../stores'
import { useExpenseStore } from '../../stores'
import StatCard from '../../components/common/StatCard'
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { CONVERSIONS, DEFAULT_PRESENTATIONS, DEFAULT_MEASURES, getAllConversions } from '../../constants/conversions'

const ProjectedPage = () => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors } = useSectorStore()
  const { harvestPlans, pricing, fetchHarvestPlans, fetchPricing, loading } = useHarvestStore()
  const { expenses, fetchExpenses } = useExpenseStore()
  const [selectedLot, setSelectedLot] = useState(null)
  const [presentations, setPresentations] = useState(() => {
    const savedPresentations = localStorage.getItem('conchas-abanico:presentations')
    if (savedPresentations) {
      try {
        return JSON.parse(savedPresentations)
      } catch (e) {
        console.error('Error loading saved presentations:', e)
      }
    }
    return [
      { id: 1, name: 'Malla 15 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 0 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 0 },
        { id: 3, name: '30-40', editable: true, pricePerKg: 0 },
        { id: 4, name: '40-50', editable: true, pricePerKg: 0 },
        { id: 5, name: '50-60', editable: true, pricePerKg: 0 },
        { id: 6, name: '60-70', editable: true, pricePerKg: 0 },
        { id: 7, name: '70-80', editable: true, pricePerKg: 0 },
        { id: 8, name: '80-90', editable: true, pricePerKg: 0 },
        { id: 9, name: '90-100', editable: true, pricePerKg: 0 },
        { id: 10, name: '100-110', editable: true, pricePerKg: 0 },
        { id: 11, name: '110-120', editable: true, pricePerKg: 0 },
        { id: 12, name: '120+', editable: true, pricePerKg: 0 }
      ]},
      { id: 2, name: 'Balde 10 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 0 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 0 },
        { id: 3, name: '30-40', editable: true, pricePerKg: 0 }
      ]},
      { id: 3, name: 'Saco 50 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 0 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 0 }
      ]},
      { id: 4, name: 'Tina 200 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 0 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 0 }
      ]}
    ]
  })
  const [weights, setWeights] = useState({})
  const [selectedPresentation, setSelectedPresentation] = useState(null)
  const [estimationForm, setEstimationForm] = useState({
    sizeDistribution: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    },
    customPrices: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0
    },
    estimatedSurvivalRate: 85,
    estimatedExpenses: [
      { id: '1', name: 'Mano de Obra', amount: 0 },
      { id: '2', name: 'Materiales', amount: 0 },
      { id: '3', name: 'Transporte', amount: 0 },
      { id: '4', name: 'Mantenimiento', amount: 0 }
    ],
    notes: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
      fetchPricing()
      fetchHarvestPlans(user.id)
      fetchExpenses({ userId: user.id })
    }
  }, [user?.id, fetchSectors, fetchPricing, fetchHarvestPlans, fetchExpenses])

  // Get lots that haven't reached their projected harvest date
  const projectedLots = useMemo(() => {
    const today = new Date()
    return sectors.flatMap(sector => {
      return (sector.lots || [])
        .filter(lot => {
          // Include lots that:
          // 1. Have a projected harvest date in the future
          // 2. Are in 'seeded' or 'growing' status
          // 3. Haven't been harvested yet
          if (!lot.projectedHarvestDate) return false
          
          const projectedDate = new Date(lot.projectedHarvestDate)
          const isInFuture = projectedDate > today
          const isNotHarvested = lot.status !== 'harvested'
          
          return isInFuture && isNotHarvested
        })
        .map(lot => ({
          ...lot,
          sectorName: sector.name,
          sectorId: sector.id,
          monthsUntilHarvest: Math.ceil((new Date(lot.projectedHarvestDate) - today) / (1000 * 60 * 60 * 24 * 30)),
          daysUntilHarvest: Math.ceil((new Date(lot.projectedHarvestDate) - today) / (1000 * 60 * 60 * 24))
        }))
    }).sort((a, b) => new Date(a.projectedHarvestDate) - new Date(b.projectedHarvestDate))
  }, [sectors])

  // Comprehensive Projected Analysis - Synchronized with other sections
  const projectedAnalysis = useMemo(() => {
    // 1. Historical performance data from completed harvests
    const completedHarvests = harvestPlans.filter(plan => plan.status === 'completed')
    
    // 2. Calculate historical averages for better projections
    const historicalData = {
      averageSurvivalRate: completedHarvests.length > 0 
        ? completedHarvests.reduce((sum, plan) => {
            const sector = sectors.find(s => s.id === plan.sectorId)
            const lot = sector?.lots?.find(l => l.id === plan.lotId)
            const initialQty = lot?.quantity || plan.estimatedQuantity || 0
            const actualQty = plan.actualQuantity || 0
            const survivalRate = initialQty > 0 ? (actualQty / initialQty * 100) : 0
            return sum + survivalRate
          }, 0) / completedHarvests.length
        : 85, // Default 85%
      
      averagePricePerUnit: pricing.length > 0 
        ? pricing.reduce((sum, p) => sum + p.pricePerUnit, 0) / pricing.length 
        : 0,
        
      historicalCostPatterns: completedHarvests.reduce((acc, plan) => {
        const lotExpenses = expenses.filter(expense => expense.lotId === plan.lotId)
        const totalCosts = lotExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        const harvestedQuantity = plan.actualQuantity || 0
        
        if (harvestedQuantity > 0) {
          acc.costPerUnit.push(totalCosts / harvestedQuantity)
          acc.totalCostPerHarvest.push(totalCosts)
        }
        
        return acc
      }, { costPerUnit: [], totalCostPerHarvest: [] })
    }

    // 3. Project future revenues using enhanced calculations
    const projectedFinancials = projectedLots.map(lot => {
      // Use historical survival rate or estimated rate
      const survivalRate = historicalData.averageSurvivalRate / 100
      const currentQuantity = lot.currentQuantity || lot.initialQuantity || 0
      const projectedQuantity = Math.floor(currentQuantity * survivalRate)
      
      // Estimate size distribution based on current size or historical patterns
      const sizeDistribution = {
        XS: Math.floor(projectedQuantity * 0.10),
        S: Math.floor(projectedQuantity * 0.20), 
        M: Math.floor(projectedQuantity * 0.40),
        L: Math.floor(projectedQuantity * 0.25),
        XL: Math.floor(projectedQuantity * 0.05)
      }
      
      // Calculate projected revenue
      let projectedRevenue = 0
      Object.entries(sizeDistribution).forEach(([size, quantity]) => {
        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
        if (price && quantity) {
          projectedRevenue += quantity * price.pricePerUnit
        }
      })
      
      // Estimate costs based on historical patterns
      const avgCostPerUnit = historicalData.historicalCostPatterns.costPerUnit.length > 0
        ? historicalData.historicalCostPatterns.costPerUnit.reduce((a, b) => a + b, 0) / historicalData.historicalCostPatterns.costPerUnit.length
        : 0.5 // Fallback cost estimation
        
      const projectedCosts = projectedQuantity * avgCostPerUnit + (lot.cost || 0) // Include initial investment
      
      return {
        ...lot,
        projectedQuantity,
        sizeDistribution,
        projectedRevenue,
        projectedCosts,
        projectedProfit: projectedRevenue - projectedCosts,
        projectedMargin: projectedRevenue > 0 ? ((projectedRevenue - projectedCosts) / projectedRevenue * 100) : 0
      }
    })

    // 4. Aggregate projections
    const totalProjectedRevenue = projectedFinancials.reduce((sum, lot) => sum + lot.projectedRevenue, 0)
    const totalProjectedCosts = projectedFinancials.reduce((sum, lot) => sum + lot.projectedCosts, 0)
    const totalProjectedProfit = totalProjectedRevenue - totalProjectedCosts
    const totalProjectedQuantity = projectedFinancials.reduce((sum, lot) => sum + lot.projectedQuantity, 0)
    
    // 5. Performance comparisons with historical data
    const historicalTotalRevenue = completedHarvests.reduce((sum, plan) => {
      if (!plan.sizeDistribution || !pricing.length) return sum
      let revenue = 0
      Object.entries(plan.sizeDistribution).forEach(([size, quantity]) => {
        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
        if (price && quantity) {
          revenue += quantity * price.pricePerUnit
        }
      })
      return sum + revenue
    }, 0)
    
    const historicalQuantity = completedHarvests.reduce((sum, plan) => sum + (plan.actualQuantity || 0), 0)
    
    return {
      projectedFinancials,
      totals: {
        revenue: totalProjectedRevenue,
        costs: totalProjectedCosts,
        profit: totalProjectedProfit,
        quantity: totalProjectedQuantity,
        margin: totalProjectedRevenue > 0 ? (totalProjectedProfit / totalProjectedRevenue * 100) : 0,
        avgRevenuePerUnit: totalProjectedQuantity > 0 ? totalProjectedRevenue / totalProjectedQuantity : 0,
        avgCostPerUnit: totalProjectedQuantity > 0 ? totalProjectedCosts / totalProjectedQuantity : 0
      },
      historical: {
        totalRevenue: historicalTotalRevenue,
        totalQuantity: historicalQuantity,
        avgRevenuePerUnit: historicalQuantity > 0 ? historicalTotalRevenue / historicalQuantity : 0,
        survivalRate: historicalData.averageSurvivalRate,
        avgCostPerUnit: historicalData.historicalCostPatterns.costPerUnit.length > 0
          ? historicalData.historicalCostPatterns.costPerUnit.reduce((a, b) => a + b, 0) / historicalData.historicalCostPatterns.costPerUnit.length
          : 0
      },
      performance: {
        projectedVsHistoricalRevenue: historicalTotalRevenue > 0 
          ? ((totalProjectedRevenue - historicalTotalRevenue) / historicalTotalRevenue * 100)
          : 0,
        projectedVsHistoricalQuantity: historicalQuantity > 0 
          ? ((totalProjectedQuantity - historicalQuantity) / historicalQuantity * 100)
          : 0
      }
    }
  }, [projectedLots, sectors, harvestPlans, expenses, pricing])

  const handleLotSelection = (lot) => {
    setSelectedLot(lot)
    // Initialize custom prices with current pricing data
    const initialPrices = {}
    const sizes = ['XS', 'S', 'M', 'L', 'XL']
    sizes.forEach(size => {
      const price = pricing.find(p => p.sizeCategory === size && p.isActive)
      initialPrices[size] = price ? price.pricePerUnit : 0
    })
    
    // Reset estimation form when selecting a new lot
    setEstimationForm({
      sizeDistribution: {
        XS: Math.floor(lot.currentQuantity * 0.1) || 0,
        S: Math.floor(lot.currentQuantity * 0.2) || 0,
        M: Math.floor(lot.currentQuantity * 0.4) || 0,
        L: Math.floor(lot.currentQuantity * 0.25) || 0,
        XL: Math.floor(lot.currentQuantity * 0.05) || 0
      },
      customPrices: initialPrices,
      estimatedSurvivalRate: 85,
      estimatedExpenses: [
        { id: '1', name: 'Mano de Obra', amount: 0 },
        { id: '2', name: 'Materiales', amount: 0 },
        { id: '3', name: 'Transporte', amount: 0 },
        { id: '4', name: 'Mantenimiento', amount: 0 }
      ],
      notes: ''
    })
  }

  const handleSizeDistributionChange = (size, value) => {
    setEstimationForm(prev => ({
      ...prev,
      sizeDistribution: {
        ...prev.sizeDistribution,
        [size]: parseInt(value) || 0
      }
    }))
  }

  const handleExpenseChange = (id, value) => {
    setEstimationForm(prev => ({
      ...prev,
      estimatedExpenses: prev.estimatedExpenses.map(expense =>
        expense.id === id ? { ...expense, amount: parseFloat(value) || 0 } : expense
      )
    }))
  }

  const handleExpenseNameChange = (id, name) => {
    setEstimationForm(prev => ({
      ...prev,
      estimatedExpenses: prev.estimatedExpenses.map(expense =>
        expense.id === id ? { ...expense, name } : expense
      )
    }))
  }

  const addNewExpense = () => {
    const newExpense = {
      id: Date.now().toString(),
      name: '',
      amount: 0
    }
    setEstimationForm(prev => ({
      ...prev,
      estimatedExpenses: [...prev.estimatedExpenses, newExpense]
    }))
  }

  const removeExpense = (id) => {
    setEstimationForm(prev => ({
      ...prev,
      estimatedExpenses: prev.estimatedExpenses.filter(expense => expense.id !== id)
    }))
  }

  const handlePriceChange = (size, value) => {
    setEstimationForm(prev => ({
      ...prev,
      customPrices: {
        ...prev.customPrices,
        [size]: parseFloat(value) || 0
      }
    }))
  }

  const calculateTotalDistribution = () => {
    return Object.values(estimationForm.sizeDistribution)
      .reduce((sum, count) => sum + (parseInt(count) || 0), 0)
  }

  const calculateEstimatedRevenue = () => {
    let total = 0
    Object.entries(estimationForm.sizeDistribution).forEach(([size, quantity]) => {
      const customPrice = estimationForm.customPrices[size]
      if (customPrice && quantity) {
        total += quantity * customPrice
      }
    })
    
    return total
  }

  const calculateTotalExpenses = () => {
    return estimationForm.estimatedExpenses
      .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
  }

  const calculateEstimatedProfit = () => {
    return calculateTotals().totalRevenue - calculateTotalExpenses()
  }

  // Helper functions for presentation distribution
  const calculateTotals = () => {
    let totalKg = 0
    let totalConchitas = 0
    let totalRevenue = 0

    if (selectedPresentation !== null) {
      const pres = presentations[selectedPresentation]
      pres.measures.forEach(measure => {
        const key = `${pres.id}_${measure.id}`
        const weight = weights[key] || 0
        totalKg += weight
        
        // Calculate units based on conversion (111 conchitas per kg)
        const units = Math.round(weight * CONVERSIONS.CONCHITAS_POR_KG)
        totalConchitas += units
        
        // Calculate revenue based on measure's price per kg
        if (weight > 0 && measure.pricePerKg) {
          totalRevenue += weight * measure.pricePerKg
        }
      })
    }

    return {
      totalKg,
      totalConchitas,
      totalRevenue
    }
  }

  const handleWeightChange = (presentationId, measureId, value) => {
    const key = `${presentationId}_${measureId}`
    setWeights(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }))
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
      ready: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || colors.seeded
  }

  const getStatusText = (status) => {
    const texts = {
      seeded: 'Sembrado',
      growing: 'Creciendo',
      ready: 'Listo'
    }
    return texts[status] || status
  }

  // Enhanced statistics using synchronized calculations
  const totalCurrentQuantity = projectedLots.reduce((sum, lot) => sum + (lot.currentQuantity || lot.initialQuantity || 0), 0)

  if (loading && projectedLots.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando datos proyectados..." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cosechas Proyectadas</h1>
          <p className="text-gray-600 mt-1">
            Visualiza y estima las siembras que aún no han llegado a su fecha proyectada de cosecha
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Siembras Proyectadas"
          value={projectedLots.length}
          subtitle="Por cosechar"
          icon="🌱"
          color="blue"
        />
        
        <StatCard
          title="Cantidad Total"
          value={totalCurrentQuantity.toLocaleString()}
          subtitle="Ejemplares actuales"
          icon="🐚"
          color="green"
        />
        
        <StatCard
          title="Ingresos Proyectados"
          value={formatCurrency(projectedAnalysis.totals.revenue)}
          subtitle={`Basado en ${projectedAnalysis.historical.survivalRate.toFixed(1)}% supervivencia`}
          icon="💰"
          color="yellow"
        />

        <StatCard
          title="Beneficio Proyectado"
          value={formatCurrency(projectedAnalysis.totals.profit)}
          subtitle={`Margen: ${projectedAnalysis.totals.margin.toFixed(1)}%`}
          icon="📈"
          color={projectedAnalysis.totals.profit >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projected Lots List */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 Siembras Proyectadas</h2>
            <p className="text-sm text-gray-600">Selecciona una siembra para estimar su distribución por tallas</p>
          </div>
          
          {projectedLots.length === 0 ? (
            <EmptyState
              title="No hay siembras proyectadas"
              message="Todas las siembras han alcanzado su fecha proyectada de cosecha o ya han sido cosechadas."
              icon="📈"
              className="py-8"
            />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projectedLots.map((lot) => (
                <div
                  key={lot.id}
                  onClick={() => handleLotSelection(lot)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedLot?.id === lot.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{lot.sectorName}</h3>
                      <p className="text-sm text-gray-600">Origen: {lot.origin}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lot.status)}`}>
                      {getStatusText(lot.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Fecha proyectada:</span>
                      <p className="font-medium text-gray-900">
                        {new Date(lot.projectedHarvestDate).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Días restantes:</span>
                      <p className="font-medium text-gray-900">{lot.daysUntilHarvest} días</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cantidad actual:</span>
                      <p className="font-medium text-gray-900">
                        {(lot.currentQuantity || lot.initialQuantity || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Talla promedio:</span>
                      <p className="font-medium text-gray-900">{lot.averageSize || 'N/A'} mm</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Size Distribution Estimation */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📏 Estimación Manual</h2>
            <p className="text-sm text-gray-600">
              {selectedLot 
                ? `Estima la distribución por tallas para ${selectedLot.sectorName}`
                : 'Selecciona una siembra para realizar la estimación'
              }
            </p>
          </div>

          {selectedLot ? (
            <div className="space-y-6">
              {/* Survival Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de Supervivencia Estimada (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="input-field"
                  value={estimationForm.estimatedSurvivalRate}
                  onChange={(e) => setEstimationForm(prev => ({
                    ...prev,
                    estimatedSurvivalRate: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>

              {/* Presentation Distribution */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">📊 Distribución por Presentaciones</h3>
                
                {/* Select presentation to use */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Selecciona una presentación:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {presentations.map((pres, index) => (
                      <label key={pres.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="presentation"
                          checked={selectedPresentation === index}
                          onChange={() => {
                            setSelectedPresentation(index)
                            // Clear weights when changing presentation
                            setWeights({})
                          }}
                          className="rounded-full border-gray-300"
                        />
                        {pres.editable ? (
                          <input
                            type="text"
                            value={pres.name}
                            onChange={(e) => {
                              const newPresentations = [...presentations]
                              newPresentations[index] = { ...pres, name: e.target.value }
                              setPresentations(newPresentations)
                              localStorage.setItem('conchas-abanico:presentations', JSON.stringify(newPresentations))
                            }}
                            className="text-sm font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                            placeholder="Nombre de presentación"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">{pres.name}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Weight distribution by presentation and measure */}
                {selectedPresentation !== null && (
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        {presentations[selectedPresentation].name}
                      </h4>
                      <button
                        onClick={() => {
                          const newPresentations = [...presentations]
                          newPresentations[selectedPresentation].measures.push({
                            id: Date.now(),
                            name: 'Nueva medida',
                            editable: true,
                            pricePerKg: 0
                          })
                          setPresentations(newPresentations)
                          localStorage.setItem('conchas-abanico:presentations', JSON.stringify(newPresentations))
                        }}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        + Agregar medida
                      </button>
                    </div>
                    <div className="space-y-3">
                      {presentations[selectedPresentation].measures.map((measure, measureIndex) => {
                        const key = `${presentations[selectedPresentation].id}_${measure.id}`
                        const weight = weights[key] || 0
                        const units = Math.round(weight * CONVERSIONS.CONCHITAS_POR_KG)
                        const subtotal = weight * (measure.pricePerKg || 0)
                        
                        return (
                          <div key={measure.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center space-x-2 mb-2">
                              {/* Measure name */}
                              <input
                                type="text"
                                value={measure.name}
                                onChange={(e) => {
                                  const newPresentations = [...presentations]
                                  newPresentations[selectedPresentation].measures[measureIndex].name = e.target.value
                                  setPresentations(newPresentations)
                                  localStorage.setItem('conchas-abanico:presentations', JSON.stringify(newPresentations))
                                }}
                                className="text-sm font-medium text-gray-700 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
                                placeholder="Nombre de medida"
                              />
                              {measure.editable && (
                                <button
                                  onClick={() => {
                                    const newPresentations = [...presentations]
                                    newPresentations[selectedPresentation].measures = 
                                      newPresentations[selectedPresentation].measures.filter((_, i) => i !== measureIndex)
                                    setPresentations(newPresentations)
                                    localStorage.setItem('conchas-abanico:presentations', JSON.stringify(newPresentations))
                                    // Clear weight for this measure
                                    setWeights(prev => {
                                      const newWeights = { ...prev }
                                      delete newWeights[key]
                                      return newWeights
                                    })
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm px-2"
                                >
                                  Eliminar ×
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {/* Weight input */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Peso (Kg)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input-field w-full"
                                  value={weight || ''}
                                  onChange={(e) => handleWeightChange(presentations[selectedPresentation].id, measure.id, e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                              
                              {/* Price per kg input */}
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Precio por Kg (S/)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input-field w-full"
                                  value={measure.pricePerKg || ''}
                                  onChange={(e) => {
                                    const newPresentations = [...presentations]
                                    newPresentations[selectedPresentation].measures[measureIndex].pricePerKg = parseFloat(e.target.value) || 0
                                    setPresentations(newPresentations)
                                    localStorage.setItem('conchas-abanico:presentations', JSON.stringify(newPresentations))
                                  }}
                                  placeholder="0.00"
                                />
                              </div>
                              
                              {/* Units and subtotal */}
                              <div className="text-sm text-gray-600">
                                <div>≈ {units.toLocaleString()} unidades</div>
                                {subtotal > 0 && (
                                  <div className="font-medium text-gray-900">
                                    Subtotal: {formatCurrency(subtotal)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Presentation subtotal */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal {presentations[selectedPresentation].name}:</span>
                        <span className="font-medium text-gray-900">
                          {presentations[selectedPresentation].measures.reduce((sum, m) => {
                            const weight = weights[`${presentations[selectedPresentation].id}_${m.id}`] || 0
                            return sum + weight
                          }, 0).toFixed(2)} Kg
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Totals summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total peso:</span>
                      <span className="font-medium">{calculateTotals().totalKg.toFixed(2)} Kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total unidades:</span>
                      <span className="font-medium">{calculateTotals().totalConchitas.toLocaleString()} und</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cantidad actual del lote:</span>
                      <span className="font-medium">
                        {(selectedLot.currentQuantity || selectedLot.initialQuantity || 0).toLocaleString()} und
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Estimation */}
              {selectedPresentation !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-green-900 mb-2">Resumen de Ingresos Proyectados</h3>
                  <div className="space-y-2">
                    {(() => {
                      const pres = presentations[selectedPresentation]
                      const presTotal = pres.measures.reduce((sum, m) => {
                        const weight = weights[`${pres.id}_${m.id}`] || 0
                        return sum + weight
                      }, 0)
                      
                      if (presTotal === 0) return <p className="text-sm text-gray-600">Ingresa pesos para calcular ingresos</p>
                      
                      return (
                        <div className="text-sm">
                          <div className="font-medium text-gray-700">{pres.name}:</div>
                          <div className="pl-4 space-y-1">
                            {pres.measures.map((measure) => {
                              const key = `${pres.id}_${measure.id}`
                              const weight = weights[key] || 0
                              if (weight === 0) return null
                              
                              const units = Math.round(weight * CONVERSIONS.CONCHITAS_POR_KG)
                              const subtotal = weight * (measure.pricePerKg || 0)
                              
                              return (
                                <div key={measure.id} className="space-y-1">
                                  <div className="flex justify-between text-xs text-gray-600">
                                    <span>{measure.name}: {weight.toFixed(2)} Kg ({units.toLocaleString()} und)</span>
                                  </div>
                                  {measure.pricePerKg > 0 && (
                                    <div className="flex justify-between text-xs text-gray-500 pl-4">
                                      <span>{weight.toFixed(2)} Kg × S/ {measure.pricePerKg.toFixed(2)}</span>
                                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                    <div className="border-t border-green-300 pt-2 flex justify-between font-bold text-green-800">
                      <span>Total Ingresos Estimados:</span>
                      <span>{formatCurrency(calculateTotals().totalRevenue)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses Estimation */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-red-900">Gastos Estimados</h3>
                  <button
                    type="button"
                    onClick={addNewExpense}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    + Agregar Gasto
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {estimationForm.estimatedExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-3">
                      <input
                        type="text"
                        className="flex-1 input-field text-sm"
                        placeholder="Nombre del gasto"
                        value={expense.name}
                        onChange={(e) => handleExpenseNameChange(expense.id, e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-32 input-field text-center"
                        value={expense.amount}
                        onChange={(e) => handleExpenseChange(expense.id, e.target.value)}
                        placeholder="0.00"
                      />
                      <span className="text-sm text-gray-600">S/</span>
                      {estimationForm.estimatedExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExpense(expense.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Eliminar gasto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}

                  {estimationForm.estimatedExpenses.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      No hay gastos agregados. Haz clic en "Agregar Gasto" para comenzar.
                    </p>
                  )}
                </div>

                <div className="border-t border-red-300 pt-2 flex justify-between font-bold text-red-800">
                  <span>Total Gastos:</span>
                  <span>{formatCurrency(calculateTotalExpenses())}</span>
                </div>
              </div>

              {/* Profit Estimation */}
              {(calculateTotals().totalRevenue > 0 || calculateTotalExpenses() > 0) && (
                <div className={`border rounded-lg p-4 ${
                  calculateEstimatedProfit() >= 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <h3 className={`text-md font-semibold mb-3 ${
                    calculateEstimatedProfit() >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    Resultado Estimado
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Ingresos:</span>
                      <span className="font-medium text-green-700">
                        {formatCurrency(calculateTotals().totalRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Gastos:</span>
                      <span className="font-medium text-red-700">
                        {formatCurrency(calculateTotalExpenses())}
                      </span>
                    </div>
                    <div className={`border-t pt-2 flex justify-between font-bold text-lg ${
                      calculateEstimatedProfit() >= 0 
                        ? 'border-blue-300 text-blue-800' 
                        : 'border-orange-300 text-orange-800'
                    }`}>
                      <span>Beneficio Neto:</span>
                      <span>{formatCurrency(calculateEstimatedProfit())}</span>
                    </div>
                    {calculateTotals().totalRevenue > 0 && (
                      <div className="text-center text-sm mt-2">
                        <span className={`font-medium ${
                          calculateEstimatedProfit() >= 0 ? 'text-blue-700' : 'text-orange-700'
                        }`}>
                          Margen: {(calculateTotals().totalRevenue > 0 ? ((calculateEstimatedProfit() / calculateTotals().totalRevenue) * 100).toFixed(1) : '0')}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows="3"
                  className="input-field"
                  value={estimationForm.notes}
                  onChange={(e) => setEstimationForm(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Notas sobre la estimación, condiciones del lote, etc."
                />
              </div>
            </div>
          ) : (
            <EmptyState
              title="Selecciona una siembra"
              message="Elige una siembra de la lista para comenzar a estimar su distribución por tallas y ingresos proyectados."
              icon="👈"
              className="py-8"
            />
          )}
        </div>
      </div>

      {/* Comprehensive Projected Financial Analysis - Based on Selected Siembra */}
      {selectedLot && (
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">📊 Estado de Resultados Proyectado</h2>
            <p className="text-sm text-gray-600 mt-1">
              Análisis financiero basado en la siembra seleccionada: {selectedLot.sectorName} - {selectedLot.origin}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Projected Revenue Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2">
                💰 Ingresos Proyectados
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">Total Proyectado</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatCurrency(calculateTotals().totalRevenue)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600">Cantidad Proyectada</div>
                    <div className="font-semibold text-gray-900">
                      {calculateTotals().totalConchitas.toLocaleString()} und
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-gray-600">Precio Prom/Unidad</div>
                    <div className="font-semibold text-gray-900">
                      {calculateTotals().totalConchitas > 0 
                        ? formatCurrency(calculateTotals().totalRevenue / calculateTotals().totalConchitas)
                        : formatCurrency(0)}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Projected Costs Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-700 border-b border-red-200 pb-2">
                💸 Costos Proyectados
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="font-medium">Total Proyectado</span>
                  <span className="text-lg font-bold text-red-700">
                    {formatCurrency(calculateTotalExpenses())}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-600">Desglose de Gastos</div>
                    <div className="space-y-1 mt-1">
                      {estimationForm.estimatedExpenses.filter(expense => expense.amount > 0 && expense.name).map((expense) => (
                        <div key={expense.id} className="flex justify-between text-xs">
                          <span>{expense.name}:</span>
                          <span className="font-medium">{formatCurrency(expense.amount)}</span>
                        </div>
                      ))}
                      {estimationForm.estimatedExpenses.filter(expense => expense.amount > 0 && expense.name).length === 0 && (
                        <div className="text-xs text-gray-500 text-center">Sin gastos registrados</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Profitability Projections */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-purple-700 mb-4">
              📈 Rentabilidad Proyectada
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`rounded-lg p-4 border ${
                calculateEstimatedProfit() >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
                  : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              }`}>
                <div className={`text-sm font-medium mb-1 ${
                  calculateEstimatedProfit() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Beneficio Neto Proyectado
                </div>
                <div className={`text-2xl font-bold ${
                  calculateEstimatedProfit() >= 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  {formatCurrency(calculateEstimatedProfit())}
                </div>
                <div className={`text-xs mt-1 ${
                  calculateEstimatedProfit() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Por unidad: {calculateTotals().totalConchitas > 0 
                    ? formatCurrency(calculateEstimatedProfit() / calculateTotals().totalConchitas)
                    : formatCurrency(0)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-1">Margen Proyectado</div>
                <div className="text-2xl font-bold text-purple-800">
                  {calculateTotals().totalRevenue > 0 
                    ? ((calculateEstimatedProfit() / calculateTotals().totalRevenue) * 100).toFixed(1)
                    : '0.0'}%
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  Beneficio / Ingresos
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-1">Tasa de Supervivencia</div>
                <div className="text-2xl font-bold text-blue-800">
                  {estimationForm.estimatedSurvivalRate.toFixed(1)}%
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Estimación manual
                </div>
              </div>
            </div>
          </div>


          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{selectedLot.sectorName}</div>
                <div className="text-gray-600">Sector</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {selectedLot.daysUntilHarvest}
                </div>
                <div className="text-gray-600">Días hasta cosecha</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {new Date(selectedLot.projectedHarvestDate).toLocaleDateString('es-PE')}
                </div>
                <div className="text-gray-600">Fecha proyectada</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">
                  {selectedLot.origin}
                </div>
                <div className="text-gray-600">Origen</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectedPage