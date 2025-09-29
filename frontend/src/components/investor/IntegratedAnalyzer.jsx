import React, { useState, useEffect } from 'react'
import { useSeedOriginStore } from '../../stores/seedOriginStoreNew.js'
import { useSectorStore } from '../../stores/sectorStoreNew.js'
import { useHarvestStore } from '../../stores/harvestStoreNew.js'

const IntegratedAnalyzer = () => {
  const { seedOrigins, fetchSeedOrigins, loading: seedOriginsLoading } = useSeedOriginStore()
  const { sectors, fetchAllSectors, cultivationLines, fetchCultivationLines } = useSectorStore()  
  const { pricing, fetchPricing } = useHarvestStore()
  
  const [projectData, setProjectData] = useState({
    // Configuración de Siembra - Sincronizado con SeedingPage
    origin: '',
    initialQuantity: 4800, // 50 manojos * 96 conchas
    numberOfBundles: 50,
    cost: 0,
    customPricePerUnit: '',
    priceType: 'bundle', // 'unit' o 'bundle'
    entryDate: new Date().toISOString().split('T')[0],
    projectedHarvestDate: '',
    
    // Sistema de Cultivo - Sincronizado con SeedingPage
    cultivationSystem: 'Cultivo suspendido',
    sectorId: '',
    lineName: '',
    selectedLines: [],
    numberOfLines: 20,
    systemsPerLine: 10,
    averageSize: 15,
    minSize: 12,
    maxSize: 18,
    theoreticalDensity: '',
    actualDensity: '',
    
    // Parámetros de Crecimiento - Usando datos reales de origen
    harvestTime: 6,
    expectedMonthlyMortality: 0, // Se obtiene del origen seleccionado
    monthlyGrowthRate: 0, // Se obtiene del origen seleccionado
    
    // Condiciones de Mercado - Costos operativos reales
    operatingCosts: {
      buzos: 800,
      embarcaciones: 600,
      mallas: 300,
      mantenimiento: 400,
      combustible: 500,
      otros: 400
    },
    customCosts: [],
    additionalCosts: 500,
    
    // Configuración de Presentaciones - Sincronizado con HarvestResultsModal
    selectedPresentation: null
  })

  const [analysis, setAnalysis] = useState(null)
  
  // Estados de presentaciones - Sincronizado con HarvestResultsModal  
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
        { id: 1, name: '10-20', editable: true, pricePerKg: 25 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 30 },
        { id: 3, name: '30-40', editable: true, pricePerKg: 35 },
        { id: 4, name: '40-50', editable: true, pricePerKg: 45 }
      ]},
      { id: 2, name: 'Balde 10 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 25 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 30 },
        { id: 3, name: '30-40', editable: true, pricePerKg: 35 }
      ]},
      { id: 3, name: 'Saco 50 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 20 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 25 }
      ]},
      { id: 4, name: 'Tina 200 Kg', editable: true, measures: [
        { id: 1, name: '10-20', editable: true, pricePerKg: 18 },
        { id: 2, name: '20-30', editable: true, pricePerKg: 22 }
      ]}
    ]
  })
  
  const [weights, setWeights] = useState({})
  const [selectedPresentation, setSelectedPresentation] = useState(null)
  const [expandedPresentations, setExpandedPresentations] = useState(() => {
    // Expandir todas las presentaciones por defecto para mejor UX
    return new Set([1, 2, 3, 4]) // IDs por defecto de las presentaciones iniciales
  })
  const [isEditingDistribution, setIsEditingDistribution] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState(null)
  const [tempPresentationName, setTempPresentationName] = useState('')
  
  
  useEffect(() => {
    fetchSeedOrigins()
    fetchAllSectors()
    fetchPricing()
  }, [fetchSeedOrigins, fetchAllSectors, fetchPricing])
  
  // Auto-calculate analysis whenever project data or presentations change
  useEffect(() => {
    if (projectData.origin && projectData.numberOfBundles > 0) {
      calculateIntegratedAnalysis()
    }
  }, [projectData, weights, presentations])
  
  // Auto-completar datos cuando se selecciona origen - Sincronizado con SeedingPage
  useEffect(() => {
    if (projectData.origin && seedOrigins.length > 0) {
      const selectedOrigin = seedOrigins.find(origin => origin.name === projectData.origin)
      if (selectedOrigin) {
        const pricePerBundle = selectedOrigin.pricePerUnit * 96 // 96 conchas por manojo
        setProjectData(prev => ({
          ...prev,
          expectedMonthlyMortality: selectedOrigin.monthlyMortalityRate || 5,
          monthlyGrowthRate: selectedOrigin.monthlyGrowthRate || 3,
          cost: pricePerBundle * projectData.numberOfBundles
        }))
      }
    }
  }, [projectData.origin, projectData.numberOfBundles, seedOrigins])
  
  // Cargar líneas cuando se selecciona sector
  useEffect(() => {
    if (projectData.sectorId) {
      fetchCultivationLines(projectData.sectorId)
    }
  }, [projectData.sectorId, fetchCultivationLines])
  
  // Inicializar con primer origen disponible
  useEffect(() => {
    if (seedOrigins.length > 0 && !projectData.origin) {
      const firstOrigin = seedOrigins[0]
      setProjectData(prev => ({
        ...prev,
        origin: firstOrigin.name
      }))
    }
  }, [seedOrigins, projectData.origin])

  // Obtener datos del origen seleccionado
  const getOriginData = (originName) => {
    const origin = seedOrigins.find(o => o.name === originName)
    return origin ? {
      price: origin.pricePerUnit * 96, // 96 conchas por manojo
      quality: origin.monthlyMortalityRate < 4 ? 'premium' : origin.monthlyMortalityRate < 6 ? 'alta' : 'media',
      mortality: origin.monthlyMortalityRate
    } : { price: 15, quality: 'media', mortality: 15 }
  }

  // Funciones para manejo de presentaciones - Sincronizado con HarvestResultsModal
  const toggleAllPresentations = () => {
    if (expandedPresentations.size === presentations.length) {
      setExpandedPresentations(new Set())
    } else {
      setExpandedPresentations(new Set(presentations.map(p => p.id)))
    }
  }

  const togglePresentation = (presentationId) => {
    const presentation = presentations.find(p => p.id === presentationId)
    if (!presentation) return
    
    const newExpanded = new Set(expandedPresentations)
    if (newExpanded.has(presentationId)) {
      newExpanded.delete(presentationId)
    } else {
      newExpanded.add(presentationId)
    }
    setExpandedPresentations(newExpanded)
  }

  const calculatePresentationSubtotal = (presentationId) => {
    const presentation = presentations.find(p => p.id === presentationId)
    if (!presentation) return { weight: 0, revenue: 0, units: 0 }
    
    let totalWeight = 0
    let totalRevenue = 0
    let totalUnits = 0
    
    presentation.measures.forEach(measure => {
      const key = `${presentationId}-${measure.id}`
      const measureWeight = weights[key] || 0
      totalWeight += measureWeight
      totalRevenue += measureWeight * (measure.pricePerKg || 0)
      
      // Calcular unidades usando conversiones
      // 1 malla = 2.6 kg = 288 conchitas
      // 1 manojo = 96 conchitas
      const conchitasFromKg = (measureWeight / 2.6) * 288
      totalUnits += conchitasFromKg
    })
    
    return { weight: totalWeight, revenue: totalRevenue, units: totalUnits }
  }

  const calculateTotals = () => {
    let totalWeight = 0
    let totalRevenue = 0
    let totalConchitas = 0
    let totalMallas = 0
    let totalManojos = 0
    
    presentations.forEach(pres => {
      const subtotal = calculatePresentationSubtotal(pres.id)
      totalWeight += subtotal.weight
      totalRevenue += subtotal.revenue
      totalConchitas += subtotal.units
    })
    
    // Conversiones: 1 malla = 2.6 kg = 288 conchitas / 1 manojo = 96 conchitas / 1 malla = 3 manojos
    totalMallas = totalWeight / 2.6
    totalManojos = totalConchitas / 96
    
    return {
      totalWeight,
      totalRevenue,
      totalConchitas,
      totalMallas,
      totalManojos
    }
  }

  const savePresentationsToLocalStorage = () => {
    localStorage.setItem('conchas-abanico:presentations', JSON.stringify(presentations))
    // Mostrar mensaje de confirmación aquí si es necesario
  }

  // Funciones para editar presentaciones y medidas
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

  const handleAddMeasure = (presentationId) => {
    const newMeasure = {
      id: Date.now(),
      name: 'Nueva medida',
      pricePerKg: 0,
      editable: true
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
    
    // Limpiar el peso asociado
    const key = `${presentationId}-${measureId}`
    setWeights(prev => {
      const newWeights = { ...prev }
      delete newWeights[key]
      return newWeights
    })
  }

  const handleAddPresentation = () => {
    const newPresentation = {
      id: Date.now(),
      name: 'Nueva Presentación',
      measures: [],
      editable: true
    }
    
    setPresentations(prev => [...prev, newPresentation])
    setExpandedPresentations(prev => new Set([...prev, newPresentation.id]))
    setEditingPresentation(newPresentation.id)
    setTempPresentationName(newPresentation.name)
  }

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
        if (key.startsWith(`${presentationId}-`)) {
          delete newWeights[key]
        }
      })
      return newWeights
    })
  }

  const marketPrices = {
    local: {
      'small': { low: 20, high: 28, peak: 32 },
      'standard': { low: 28, high: 38, peak: 45 },
      'large': { low: 35, high: 48, peak: 55 },
      'jumbo': { low: 45, high: 60, peak: 70 }
    },
    export: {
      'small': { low: 35, high: 45, peak: 50 },
      'standard': { low: 45, high: 60, peak: 70 },
      'large': { low: 55, high: 75, peak: 85 },
      'jumbo': { low: 70, high: 90, peak: 110 }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }

  const getSizeCategory = (size) => {
    if (size < 40) return 'small'
    if (size < 55) return 'standard'
    if (size < 70) return 'large'
    return 'jumbo'
  }

  const calculateIntegratedAnalysis = () => {
    // Step 1: Seeding Analysis - Sincronizado con lógica del maricultor
    const shellsPerBundle = 96
    const totalShells = projectData.initialQuantity || (projectData.numberOfBundles * shellsPerBundle)
    
    // Calcular área del sector basado en líneas y sistemas (como en maricultor)
    const lineLength = 100 // metros por línea típica
    const lineSpacing = 2.5 // metros entre líneas
    const sectorArea = projectData.numberOfLines * lineLength * lineSpacing
    const initialDensity = totalShells / sectorArea
    
    // Costo inicial usando datos reales del origen
    const selectedOrigin = seedOrigins.find(o => o.name === projectData.origin)
    const bundleCost = selectedOrigin 
      ? projectData.numberOfBundles * (selectedOrigin.pricePerUnit * 96)
      : projectData.cost
    const totalInitialCost = bundleCost + projectData.additionalCosts
    
    // Usar tasas reales del origen seleccionado
    const mortalityRate = selectedOrigin 
      ? selectedOrigin.monthlyMortalityRate * projectData.harvestTime
      : projectData.expectedMonthlyMortality * projectData.harvestTime
    
    // Step 2: Growth Projection - Usando tasas reales del origen
    let currentSize = projectData.averageSize
    const realGrowthRate = selectedOrigin?.monthlyGrowthRate || 3 // mm/mes del origen
    const monthlyGrowthRates = []
    
    for (let month = 1; month <= projectData.harvestTime; month++) {
      // Aplicar tasa de crecimiento real del origen seleccionado
      currentSize += realGrowthRate
      
      monthlyGrowthRates.push({
        month,
        size: Math.round(currentSize * 10) / 10,
        growth: realGrowthRate
      })
    }
    
    const finalSize = currentSize
    const finalWeight = calculateWeightFromSize(finalSize)
    const survivingShells = Math.round(totalShells * (1 - mortalityRate / 100))
    const finalDensity = survivingShells / sectorArea
    
    // Step 3: Return Calculation - Usando lógica de presentaciones como en HarvestResultsModal
    const totals = calculateTotals()
    const grossRevenue = totals.totalRevenue
    const totalWeight = totals.totalWeight
    const baseOperatingCosts = Object.values(projectData.operatingCosts).reduce((sum, cost) => sum + cost, 0)
    const customOperatingCosts = projectData.customCosts.reduce((sum, cost) => sum + cost.amount, 0)
    const totalOperatingCosts = baseOperatingCosts + customOperatingCosts + projectData.additionalCosts
    const netRevenue = grossRevenue - totalOperatingCosts
    const totalInvestment = totalInitialCost
    const netProfit = netRevenue - totalInvestment
    const roi = ((netProfit / totalInvestment) * 100)
    
    // Step 4: Investment Scenarios - usando lógica de presentaciones
    const calculateScenarioRevenue = (priceMultiplier) => {
      let scenarioRevenue = 0
      presentations.forEach(pres => {
        pres.measures.forEach(measure => {
          const key = `${pres.id}-${measure.id}`
          const measureWeight = weights[key] || 0
          const adjustedPrice = (measure.pricePerKg || 0) * priceMultiplier
          scenarioRevenue += measureWeight * adjustedPrice
        })
      })
      return scenarioRevenue
    }

    const scenarios = [
      {
        season: 'conservative',
        priceMultiplier: 0.9, // -10%
        revenue: calculateScenarioRevenue(0.9) - totalOperatingCosts,
        profit: calculateScenarioRevenue(0.9) - totalOperatingCosts - totalInvestment,
        roi: ((calculateScenarioRevenue(0.9) - totalOperatingCosts - totalInvestment) / totalInvestment) * 100
      },
      {
        season: 'expected',
        priceMultiplier: 1.0,
        revenue: netRevenue,
        profit: netProfit,
        roi: roi
      },
      {
        season: 'optimistic',
        priceMultiplier: 1.15, // +15%
        revenue: calculateScenarioRevenue(1.15) - totalOperatingCosts,
        profit: calculateScenarioRevenue(1.15) - totalOperatingCosts - totalInvestment,
        roi: ((calculateScenarioRevenue(1.15) - totalOperatingCosts - totalInvestment) / totalInvestment) * 100
      }
    ]
    
    // Step 5: Density Analysis
    const densityAnalysis = analyzeDensity(initialDensity, finalDensity)
    
    setAnalysis({
      // Seeding results
      totalShells,
      survivingShells,
      sectorArea,
      initialDensity,
      finalDensity,
      totalInitialCost,
      mortalityRate,
      
      // Growth results
      finalSize,
      finalWeight,
      monthlyGrowthRates,
      
      // Return results
      totalWeight,
      grossRevenue,
      netRevenue,
      netProfit,
      roi,
      presentationTotals: totals,
      averagePricePerKg: totalWeight > 0 ? (grossRevenue / totalWeight) : 0,
      totalOperatingCosts,
      baseOperatingCosts,
      customOperatingCosts,
      
      // Investment scenarios
      scenarios,
      
      // Density analysis
      densityAnalysis,
      
      // Summary metrics
      costPerKg: totalInvestment / totalWeight,
      revenuePerShell: grossRevenue / survivingShells,
      profitPerM2: netProfit / sectorArea
    })
  }


  const calculateWeightFromSize = (size) => {
    return Math.pow(size / 10, 2.3) * 2.5
  }



  const analyzeDensity = (initial, final) => {
    const optimal = 10 // optimal density
    return {
      initialStatus: initial > 15 ? 'high' : initial < 8 ? 'low' : 'optimal',
      finalStatus: final > 12 ? 'high' : final < 6 ? 'low' : 'optimal',
      recommendation: initial > 15 ? 'Reducir densidad' : initial < 8 ? 'Aumentar densidad' : 'Mantener densidad'
    }
  }

  const handleOriginChange = (origin) => {
    const originData = getOriginData(origin)
    setProjectData({
      ...projectData,
      origin,
      pricePerBundle: originData.price
    })
  }

  const addCustomCost = () => {
    const newCost = {
      id: Date.now(),
      name: '',
      amount: 0
    }
    setProjectData({
      ...projectData,
      customCosts: [...projectData.customCosts, newCost]
    })
  }

  const updateCustomCost = (id, field, value) => {
    const updatedCosts = projectData.customCosts.map(cost =>
      cost.id === id ? { ...cost, [field]: value } : cost
    )
    setProjectData({
      ...projectData,
      customCosts: updatedCosts
    })
  }

  const removeCustomCost = (id) => {
    const updatedCosts = projectData.customCosts.filter(cost => cost.id !== id)
    setProjectData({
      ...projectData,
      customCosts: updatedCosts
    })
  }
  


  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Step Content */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <div className="space-y-3 sm:space-y-4">
          {/* Step 1: Seeding Configuration */}
          <div className="card p-3 sm:p-4 lg:p-6 border-blue-200 bg-blue-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">🌱</span>
              <h3 className="font-semibold text-gray-900">Configuración de Siembra</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Número de Manojos</label>
                <input
                  type="number"
                  value={projectData.numberOfBundles}
                  onChange={(e) => setProjectData({ 
                    ...projectData, 
                    numberOfBundles: Number(e.target.value),
                    initialQuantity: Number(e.target.value) * 96
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="500"
                />
                <span className="text-xs text-gray-500">
                  {(projectData.numberOfBundles * 96).toLocaleString()} conchas total
                </span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Origen de Semilla</label>
                <select
                  value={projectData.origin}
                  onChange={(e) => setProjectData({ ...projectData, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  disabled={seedOriginsLoading}
                >
                  <option value="">Seleccionar origen...</option>
                  {seedOriginsLoading ? (
                    <option value="">Cargando orígenes...</option>
                  ) : (
                    seedOrigins.filter(origin => origin.isActive).map((origin) => (
                      <option key={origin.id} value={origin.name}>
                        {origin.name} - S/{(origin.pricePerUnit * 96).toFixed(2)}/manojo
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tamaño Promedio Inicial (mm)</label>
                <input
                  type="number"
                  value={projectData.averageSize}
                  onChange={(e) => setProjectData({ ...projectData, averageSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="25"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Costo Total de Siembra (S/)</label>
                <input
                  type="number"
                  value={projectData.cost}
                  onChange={(e) => setProjectData({ ...projectData, cost: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
                <span className="text-xs text-gray-500">
                  Calculado automáticamente según origen
                </span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Número de Líneas</label>
                <input
                  type="number"
                  value={projectData.numberOfLines}
                  onChange={(e) => setProjectData({ ...projectData, numberOfLines: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Sistemas por Línea</label>
                <input
                  type="number"
                  value={projectData.systemsPerLine}
                  onChange={(e) => setProjectData({ ...projectData, systemsPerLine: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  min="5"
                  max="20"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Growth Parameters */}
          <div className="card p-3 sm:p-4 lg:p-6 border-green-200 bg-green-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">📈</span>
              <h3 className="font-semibold text-gray-900">Parámetros de Crecimiento</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tiempo de Cosecha (meses)</label>
                <input
                  type="number"
                  value={projectData.harvestTime}
                  onChange={(e) => setProjectData({ ...projectData, harvestTime: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  min="3"
                  max="12"
                  step="1"
                />
                <span className="text-xs text-gray-500">Número de meses hasta la cosecha</span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Mortalidad Mensual (%)</label>
                <input
                  type="number"
                  value={projectData.expectedMonthlyMortality}
                  onChange={(e) => setProjectData({ ...projectData, expectedMonthlyMortality: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  min="1"
                  max="20"
                  step="0.1"
                  readOnly
                />
                <span className="text-xs text-gray-500">
                  Del origen seleccionado: {seedOrigins.find(o => o.name === projectData.origin)?.name || 'N/A'}
                </span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Crecimiento Mensual (mm/mes)</label>
                <input
                  type="number"
                  value={projectData.monthlyGrowthRate}
                  onChange={(e) => setProjectData({ ...projectData, monthlyGrowthRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  min="1"
                  max="10"
                  step="0.1"
                  readOnly
                />
                <span className="text-xs text-gray-500">Tasa del origen seleccionado</span>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tamaño Final Estimado (mm)</label>
                <input
                  type="number"
                  value={projectData.averageSize + (projectData.monthlyGrowthRate * projectData.harvestTime)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-blue-50"
                  readOnly
                />
                <span className="text-xs text-gray-500">
                  Calculado: {projectData.averageSize}mm + ({projectData.monthlyGrowthRate} × {projectData.harvestTime})
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Market Conditions */}
          <div className="card p-3 sm:p-4 lg:p-6 border-purple-200 bg-purple-50">
            <div className="flex items-center mb-3">
              <span className="text-lg mr-2">💰</span>
              <h3 className="font-semibold text-gray-900">Condiciones de Mercado</h3>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Buzos (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.buzos}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, buzos: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Embarcaciones (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.embarcaciones}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, embarcaciones: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mallas (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.mallas}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, mallas: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mantenimiento (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.mantenimiento}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, mantenimiento: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Combustible (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.combustible}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, combustible: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Otros Costos (S/)</label>
                  <input
                    type="number"
                    value={projectData.operatingCosts.otros}
                    onChange={(e) => setProjectData({ 
                      ...projectData, 
                      operatingCosts: { ...projectData.operatingCosts, otros: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Custom Cost Fields */}
              {projectData.customCosts.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {projectData.customCosts.map((cost, index) => (
                    <React.Fragment key={cost.id}>
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <input
                            type="text"
                            placeholder="Ej: Seguro, Permisos"
                            value={cost.name}
                            onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                            className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 placeholder-gray-400"
                            style={{ fontSize: 'inherit' }}
                          />
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                            min="0"
                          />
                          <button
                            onClick={() => removeCustomCost(cost.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                            title="Eliminar campo"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      
                      {/* Fill empty spaces in the grid */}
                      {index === projectData.customCosts.length - 1 && (projectData.customCosts.length % 3 !== 0) && (
                        <>
                          {Array.from({ length: 3 - (projectData.customCosts.length % 3) }).map((_, emptyIndex) => (
                            <div key={`empty-${emptyIndex}`} />
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              <div className="flex items-center">
                <button
                  onClick={addCustomCost}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                >
                  <span className="mr-1 text-lg leading-none">+</span>
                  Agregar otro costo
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costos Adicionales (S/)</label>
                  <input
                    type="number"
                    value={projectData.additionalCosts}
                    onChange={(e) => setProjectData({ ...projectData, additionalCosts: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">Transporte, linternas, cuerdas</span>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 mb-1">Total Costos Operativos</div>
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(
                      Object.values(projectData.operatingCosts).reduce((sum, cost) => sum + cost, 0) +
                      projectData.customCosts.reduce((sum, cost) => sum + cost.amount, 0) +
                      projectData.additionalCosts
                    )}
                  </div>
                  <div className="text-xs text-blue-600">Suma de todos los costos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Distribución por Presentaciones */}
          <div className="card p-3 sm:p-4 lg:p-6 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-lg mr-2">📊</span>
                <h3 className="font-semibold text-gray-900">Distribución por Presentaciones</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddPresentation}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  ➕ Presentación
                </button>
                <button
                  onClick={toggleAllPresentations}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
                >
                  {expandedPresentations.size === presentations.length ? "➖ Colapsar" : "➕ Expandir"} todas
                </button>
                <button
                  onClick={() => setIsEditingDistribution(!isEditingDistribution)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isEditingDistribution 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isEditingDistribution ? '💾 Guardar Distribución' : '✏️ Editar Distribución'}
                </button>
                <button
                  onClick={savePresentationsToLocalStorage}
                  className="px-3 py-1.5 rounded text-xs font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
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
            
            {/* Instrucciones de uso */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Tip:</strong> Doble clic en nombres de presentaciones para editarlos. 
                Los nombres de medidas y precios se pueden editar directamente haciendo clic en los campos.
                Usa "✏️ Editar Distribución" para cambiar los pesos en kg.
              </p>
            </div>
            
            {/* Presentaciones */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {presentations.map((presentation) => {
                const isExpanded = expandedPresentations.has(presentation.id)
                const subtotal = calculatePresentationSubtotal(presentation.id)
                const hasData = subtotal.weight > 0
                
                return (
                  <div 
                    key={presentation.id} 
                    className={`bg-gray-50 rounded-lg p-3 border-l-4 ${hasData ? 'border-green-500' : 'border-blue-500'}`}
                  >
                    {/* Encabezado de presentación */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => togglePresentation(presentation.id)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                        
                        {editingPresentation === presentation.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={tempPresentationName}
                              onChange={(e) => setTempPresentationName(e.target.value)}
                              onBlur={() => savePresentationName(presentation.id)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') savePresentationName(presentation.id)
                              }}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="cursor-pointer flex-1" onClick={() => togglePresentation(presentation.id)}>
                            <h4 
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:cursor-text transition-colors duration-200 px-1 py-1 rounded hover:bg-blue-50"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                startEditingPresentation(presentation.id, presentation.name)
                              }}
                              title="✏️ Doble clic para editar nombre de presentación"
                            >
                              {presentation.name}
                            </h4>
                            {!isExpanded && (
                              <span className="text-xs text-gray-500">
                                ({presentation.measures.length} medidas)
                              </span>
                            )}
                          </div>
                        )}
                        
                        {isExpanded && (
                          <div className="flex items-center gap-1">
                            {presentations.length > 1 && (
                              <button
                                onClick={() => handleRemovePresentation(presentation.id)}
                                className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition-colors"
                                title="Eliminar presentación"
                              >
                                🗑️
                              </button>
                            )}
                            <button
                              onClick={() => handleAddMeasure(presentation.id)}
                              className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded hover:bg-green-200 transition-colors"
                              title="Agregar nueva medida"
                            >
                              + Medida
                            </button>
                            {!editingPresentation && (
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
                      </div>
                      {hasData && (
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            {formatCurrency(subtotal.revenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {subtotal.weight.toFixed(2)} Kg
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Medidas expandidas */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                        {presentation.measures.map((measure) => {
                          const key = `${presentation.id}-${measure.id}`
                          const measureWeight = weights[key] || 0
                          const measureRevenue = measureWeight * (measure.pricePerKg || 0)
                          
                          return (
                            <div key={measure.id} className="bg-white p-2 rounded border">
                              <div className="flex items-center justify-between mb-1">
                                <input
                                  type="text"
                                  value={measure.name}
                                  onChange={(e) => handleMeasureNameChange(presentation.id, measure.id, e.target.value)}
                                  className="text-xs font-medium text-gray-700 bg-transparent border-none p-0 focus:ring-1 focus:ring-blue-400 focus:bg-blue-50 rounded px-1 hover:bg-blue-50 transition-colors flex-1"
                                  title="✏️ Haz clic para editar el nombre de medida"
                                />
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">S/</span>
                                  <input
                                    type="number"
                                    value={measure.pricePerKg || 0}
                                    onChange={(e) => handleMeasurePriceChange(presentation.id, measure.id, e.target.value)}
                                    className="w-12 text-xs text-gray-500 bg-transparent border-none p-0 focus:ring-1 focus:ring-green-400 focus:bg-green-50 rounded px-1 hover:bg-green-50 transition-colors text-right"
                                    step="0.01"
                                    min="0"
                                    title="💰 Haz clic para editar el precio por kg"
                                  />
                                  <span className="text-xs text-gray-500">/Kg</span>
                                  {presentation.measures.length > 1 && (
                                    <button
                                      onClick={() => handleRemoveMeasure(presentation.id, measure.id)}
                                      className="text-red-500 hover:text-red-700 text-xs ml-1"
                                      title="Eliminar medida"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </div>
                              {isEditingDistribution ? (
                                <input
                                  type="number"
                                  value={measureWeight}
                                  onChange={(e) => setWeights({
                                    ...weights,
                                    [key]: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                <div className="text-center py-1">
                                  <span className="text-sm font-medium">{measureWeight.toFixed(2)} Kg</span>
                                  {measureRevenue > 0 && (
                                    <div className="text-xs text-green-600">{formatCurrency(measureRevenue)}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Totales */}
            {(() => {
              const totals = calculateTotals()
              if (totals.totalWeight > 0) {
                return (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-2">Totales de Distribución</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Peso Total:</span>
                        <div className="font-bold text-blue-800">{totals.totalWeight.toFixed(2)} Kg</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Ingresos:</span>
                        <div className="font-bold text-green-600">{formatCurrency(totals.totalRevenue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Conchitas:</span>
                        <div className="font-bold text-blue-800">{Math.round(totals.totalConchitas).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mallas:</span>
                        <div className="font-bold text-blue-800">{totals.totalMallas.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      Conversiones: 1 malla = 3 manojos = 2.6 Kg = 288 conchitas
                    </div>
                  </div>
                )
              }
              return null
            })()}

            {/* Comparación Real vs Teórico */}
            {analysis && (() => {
              const totals = calculateTotals()

              if (totals.totalWeight > 0 && projectData.numberOfBundles > 0) {
                // Cálculos teóricos
                const theoreticalShells = analysis.survivingShells || 0
                const theoreticalWeight = theoreticalShells * (analysis.finalWeight || 0)
                const theoreticalBundles = theoreticalShells / 96 // 96 conchas por manojo
                const theoreticalMallas = theoreticalBundles / 3 // 3 manojos por malla

                // Valores reales (de la distribución llenada)
                const realShells = totals.totalConchitas
                const realWeight = totals.totalWeight
                const realBundles = realShells / 96
                const realMallas = totals.totalMallas

                // Diferencias
                const shellsDiff = realShells - theoreticalShells
                const weightDiff = realWeight - theoreticalWeight
                const bundlesDiff = realBundles - theoreticalBundles
                const mallasDiff = realMallas - theoreticalMallas

                // Porcentajes de diferencia
                const shellsPercent = theoreticalShells > 0 ? (shellsDiff / theoreticalShells) * 100 : 0
                const weightPercent = theoreticalWeight > 0 ? (weightDiff / theoreticalWeight) * 100 : 0
                const bundlesPercent = theoreticalBundles > 0 ? (bundlesDiff / theoreticalBundles) * 100 : 0
                const mallasPercent = theoreticalMallas > 0 ? (mallasDiff / theoreticalMallas) * 100 : 0

                const formatDifference = (diff, percent) => {
                  const color = diff >= 0 ? 'text-green-600' : 'text-red-600'
                  const sign = diff >= 0 ? '+' : ''
                  return (
                    <span className={`font-bold ${color}`}>
                      {sign}{diff.toFixed(2)} ({sign}{percent.toFixed(1)}%)
                    </span>
                  )
                }

                return (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-700 mb-2">📊 Comparación: Real vs Teórico</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">Conchas:</span>
                        <div className="font-bold text-gray-800">
                          {Math.round(realShells).toLocaleString()} / {Math.round(theoreticalShells).toLocaleString()}
                        </div>
                        <div>{formatDifference(shellsDiff, shellsPercent)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Peso (Kg):</span>
                        <div className="font-bold text-gray-800">
                          {realWeight.toFixed(2)} / {theoreticalWeight.toFixed(2)}
                        </div>
                        <div>{formatDifference(weightDiff, weightPercent)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Manojos:</span>
                        <div className="font-bold text-gray-800">
                          {realBundles.toFixed(1)} / {theoreticalBundles.toFixed(1)}
                        </div>
                        <div>{formatDifference(bundlesDiff, bundlesPercent)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Mallas:</span>
                        <div className="font-bold text-gray-800">
                          {realMallas.toFixed(2)} / {theoreticalMallas.toFixed(2)}
                        </div>
                        <div>{formatDifference(mallasDiff, mallasPercent)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600 mt-2">
                      📈 Verde = Mejor que lo esperado | 📉 Rojo = Menor que lo esperado
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>

        </div>

        {/* Results Panel */}
        <div className="card p-3 sm:p-4 lg:p-6">
          {analysis ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Análisis Completo del Proyecto</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Ganancia Neta</div>
                  <div className={`text-xl font-bold ${analysis.netProfit >= 0 ? 'text-green-900' : 'text-red-600'}`}>
                    {formatCurrency(analysis.netProfit)}
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">ROI</div>
                  <div className={`text-xl font-bold ${analysis.roi >= 0 ? 'text-blue-900' : 'text-red-600'}`}>
                    {analysis.roi.toFixed(1)}%
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600">Producción</div>
                  <div className="text-xl font-bold text-purple-900">
                    {analysis.totalWeight.toFixed(0)} kg
                  </div>
                </div>
                
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600">Tamaño Final</div>
                  <div className="text-xl font-bold text-orange-900">
                    {analysis.finalSize.toFixed(1)} mm
                  </div>
                </div>
              </div>

              {/* Investment Breakdown */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Desglose Financiero</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Inversión Total:</span>
                    <span className="font-medium">{formatCurrency(analysis.totalInitialCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ingresos Brutos:</span>
                    <span className="font-medium text-green-600">{formatCurrency(analysis.grossRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costos Operativos:</span>
                    <span className="font-medium text-red-600">{formatCurrency(analysis.totalOperatingCosts)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Ganancia Neta:</span>
                    <span className={`font-bold ${analysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(analysis.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operating Costs Breakdown */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Desglose de Costos Operativos</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Buzos:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.buzos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Embarcaciones:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.embarcaciones)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mallas:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.mallas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mantenimiento:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.mantenimiento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Combustible:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.combustible)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Otros:</span>
                    <span className="font-medium">{formatCurrency(projectData.operatingCosts.otros)}</span>
                  </div>
                  
                  {/* Custom Costs */}
                  {projectData.customCosts.map((cost) => (
                    <div key={cost.id} className="flex justify-between">
                      <span>{cost.name || 'Costo personalizado'}:</span>
                      <span className="font-medium">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                  
                  {/* Additional Costs */}
                  {projectData.additionalCosts > 0 && (
                    <div className="flex justify-between">
                      <span>Costos Adicionales:</span>
                      <span className="font-medium">{formatCurrency(projectData.additionalCosts)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-2 border-t col-span-2">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-red-600">{formatCurrency(analysis.totalOperatingCosts)}</span>
                  </div>
                </div>
              </div>

              {/* Production Details */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Detalles de Producción</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Conchas Sembradas:</span>
                    <span>{analysis.totalShells.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supervivientes ({100 - analysis.mortalityRate}%):</span>
                    <span className="text-green-600">{analysis.survivingShells.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Densidad Final:</span>
                    <span>{analysis.finalDensity.toFixed(1)} conchas/m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distribución de Peso:</span>
                    <span>{analysis.presentationTotals?.totalWeight?.toFixed(2) || '0.00'} Kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio Promedio por Kg:</span>
                    <span>S/{analysis.averagePricePerKg?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Conchitas:</span>
                    <span>{Math.round(analysis.presentationTotals?.totalConchitas || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Mallas:</span>
                    <span>{analysis.presentationTotals?.totalMallas?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Scenario Analysis */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Escenarios de Rentabilidad</h4>
                <div className="space-y-2">
                  {analysis.scenarios.map((scenario) => {
                    const getScenarioLabel = (season) => {
                      const labels = {
                        conservative: 'Conservador (-10%)',
                        expected: 'Esperado',
                        optimistic: 'Optimista (+15%)'
                      }
                      return labels[season] || season
                    }
                    
                    return (
                      <div 
                        key={scenario.season}
                        className={`flex justify-between items-center p-2 rounded text-sm ${
                          scenario.season === 'expected' ? 'bg-blue-100' : 'bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">{getScenarioLabel(scenario.season)}</span>
                        <div className="text-right">
                          <div className={scenario.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(scenario.profit)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ROI: {scenario.roi.toFixed(1)}% - {(scenario.priceMultiplier * 100).toFixed(0)}% del precio base
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-2">Recomendaciones</h4>
                <div className="text-sm text-amber-800 space-y-1">
                  {analysis.roi < 15 && (
                    <p>• ROI bajo - considere optimizar costos o extender período</p>
                  )}
                  {analysis.densityAnalysis.initialStatus === 'high' && (
                    <p>• Densidad alta - riesgo de competencia entre conchas</p>
                  )}
                  {analysis.finalSize < 45 && (
                    <p>• Tamaño final pequeño - considere extender cultivo</p>
                  )}
                  <p>• Monitoree condiciones ambientales regularmente</p>
                  <p>• Mantenga registros de crecimiento y mortalidad</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>Complete los parámetros para ver el análisis en tiempo real</p>
              <p className="text-sm mt-2">Los resultados se actualizan automáticamente conforme ingresa los datos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IntegratedAnalyzer