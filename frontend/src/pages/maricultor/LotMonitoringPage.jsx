import React, { useEffect, useState } from 'react'
import { useAuthStore, useSectorStore, useMonitoringStore, useSeedOriginStore, useSeedingStore } from '../../stores'
// Fixed: Changed fetchMonitoring to fetchMonitoringRecords
import { getAllConversionsFromConchitas } from '../../constants/conversions'
import StatCard from '../../components/common/StatCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const SeedingMonitoringPage = ({ lotId, onBack }) => {
  const { user } = useAuthStore()
  const { sectors } = useSectorStore()
  const { lots, fetchLots } = useSeedingStore()
  const { monitoringRecords, fetchMonitoringRecords, createMonitoring, updateMonitoring, loading } = useMonitoringStore()
  const { seedOrigins, fetchSeedOrigins } = useSeedOriginStore()
  const [defaultParams, setDefaultParams] = useState(null)
  const [showMeasurementForm, setShowMeasurementForm] = useState(false)
  const [measurementForm, setMeasurementForm] = useState({
    date: new Date().toISOString().split('T')[0],
    previousQuantity: '',
    currentQuantity: '',
    observations: '',
    measurementPoints: 5,
    points: []
  })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showAddPointsForm, setShowAddPointsForm] = useState(false)
  const [additionalPointsForm, setAdditionalPointsForm] = useState({
    numberOfPoints: 1,
    points: []
  })
  
  // Encontrar la siembra específica
  const seeding = lots.find(l => l.id === lotId)
  const sector = sectors.find(s => s.id === seeding?.sectorId)
  
  useEffect(() => {
    if (lotId) {
      fetchMonitoringRecords(lotId)
    }
    fetchSeedOrigins()
    fetchLots()
    // Load default parameters from API
    fetch('http://localhost:4077/defaultSeedOriginParameters')
      .then(res => res.json())
      .then(data => {
        if (data && data[0]) {
          setDefaultParams(data[0])
        }
      })
      .catch(err => console.error('Error loading default seed parameters:', err))
  }, [lotId, fetchMonitoringRecords, fetchSeedOrigins, fetchLots])

  // Centralized function to get seed origin parameters with validation
  const getSeedOriginParameters = () => {
    if (!seeding || !seeding.origin) {
      // Only warn if it's a real issue, not during initial load
      if (seeding) {
        console.warn('Seeding or origin not found for parameter calculation')
      }
      return {
        monthlyGrowthRate: defaultParams?.monthlyGrowthRate || 3.5,
        monthlyMortalityRate: defaultParams?.monthlyMortalityRate || 5.0,
        pricePerUnit: defaultParams?.pricePerUnit || 0.12,
        pricePerBundle: defaultParams?.pricePerBundle || 11.52,
        isValidOrigin: false,
        originName: 'No definido'
      }
    }

    const seedOrigin = seedOrigins.find(origin => origin.name === seeding.origin)

    if (!seedOrigin) {
      // Only warn if seedOrigins has been loaded (not empty)
      if (seedOrigins.length > 0) {
        console.warn(`Seed origin "${seeding.origin}" not found in seedOrigins database`)
      }
      return {
        monthlyGrowthRate: defaultParams?.monthlyGrowthRate || 3.5,
        monthlyMortalityRate: parseFloat(seeding.expectedMonthlyMortality) || defaultParams?.monthlyMortalityRate || 5.0,
        pricePerUnit: defaultParams?.pricePerUnit || 0.12,
        pricePerBundle: defaultParams?.pricePerBundle || 11.52,
        isValidOrigin: false,
        originName: seeding.origin
      }
    }

    // Validation: ensure all required parameters exist
    const requiredParams = ['monthlyGrowthRate', 'monthlyMortalityRate', 'pricePerUnit']
    const missingParams = requiredParams.filter(param =>
      seedOrigin[param] === undefined || seedOrigin[param] === null
    )

    if (missingParams.length > 0) {
      console.warn(`Seed origin "${seeding.origin}" missing parameters: ${missingParams.join(', ')}`)
    }

    return {
      monthlyGrowthRate: seedOrigin.monthlyGrowthRate || defaultParams?.monthlyGrowthRate || 3.5,
      monthlyMortalityRate: seedOrigin.monthlyMortalityRate || defaultParams?.monthlyMortalityRate || 5.0,
      pricePerUnit: seedOrigin.pricePerUnit || defaultParams?.pricePerUnit || 0.12,
      pricePerBundle: seedOrigin.pricePerBundle || defaultParams?.pricePerBundle || 11.52,
      isValidOrigin: true,
      originName: seedOrigin.name,
      description: seedOrigin.description || ''
    }
  }

  // Function to get initial size from seeding record (addresses inconsistency #5)
  const getInitialSize = () => {
    // Priority: 1. seeding.averageSize, 2. default from API, 3. fallback value
    const initialSize = parseFloat(seeding?.averageSize) || defaultParams?.initialSize || 12

    if (!seeding?.averageSize) {
      console.warn('Initial size not found in seeding record, using default 12mm')
    }

    return initialSize
  }

  // Function to open measurement form with previous quantity
  const openMeasurementForm = () => {
    // Get the most recent measurement or use initial seeding quantity
    const sortedRecords = [...monitoringRecords].sort((a, b) => new Date(b.date) - new Date(a.date))
    const previousQuantity = sortedRecords.length > 0
      ? sortedRecords[0].currentQuantity
      : seeding?.initialQuantity || 0

    setMeasurementForm(prev => ({
      ...prev,
      previousQuantity: previousQuantity ? previousQuantity.toString() : '0',
      currentQuantity: ''
    }))
    setShowMeasurementForm(true)
  }

  // Calculate mortality rate for each point and overall average
  const calculateMortalityData = () => {
    const pointMortalities = measurementForm.points.map(point => {
      const total = parseFloat(point.totalSpecimens) || 0
      const alive = parseFloat(point.aliveSpecimens) || 0
      const mortalityRate = total > 0 ? ((total - alive) / total) * 100 : 0
      return { pointNumber: point.pointNumber, mortalityRate, total, alive }
    })

    const validPoints = pointMortalities.filter(p => p.total > 0)
    const averageMortalityRate = validPoints.length > 0 
      ? validPoints.reduce((sum, p) => sum + p.mortalityRate, 0) / validPoints.length 
      : 0

    const previousQuantity = parseFloat(measurementForm.previousQuantity) || 0
    const currentQuantity = previousQuantity * (1 - averageMortalityRate / 100)

    return {
      pointMortalities,
      averageMortalityRate: parseFloat(averageMortalityRate.toFixed(2)),
      calculatedCurrentQuantity: Math.round(currentQuantity)
    }
  }

  // Initialize measurement points when form loads or points count changes
  useEffect(() => {
    const initializePoints = () => {
      // Get previous density from last monitoring record or initial seeding
      const sortedRecords = [...monitoringRecords].sort((a, b) => new Date(b.date) - new Date(a.date))
      let previousDensity = 0
      
      if (sortedRecords.length > 0 && sortedRecords[0].measurementPoints) {
        // Calculate average density from last monitoring
        const lastPoints = sortedRecords[0].measurementPoints
        const densities = lastPoints.filter(p => p.averageDensity).map(p => parseFloat(p.averageDensity))
        if (densities.length > 0) {
          previousDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length
        }
      } else if (seeding?.actualDensity) {
        // Use density from initial seeding ("Densidad según muestreo")
        previousDensity = parseFloat(seeding.actualDensity)
      }
      
      const newPoints = []
      // Determinar la línea a autocompletar desde la siembra
      let defaultLineName = ''
      if (seeding?.multipleLines && seeding.multipleLines.length > 0) {
        // Si tiene múltiples líneas, usar la primera como default
        defaultLineName = seeding.multipleLines[0].lineName || ''
      } else if (seeding?.lineName) {
        // Si tiene una sola línea
        defaultLineName = seeding.lineName
      }

      for (let i = 0; i < measurementForm.measurementPoints; i++) {
        newPoints.push({
          pointNumber: i + 1,
          lineName: defaultLineName,
          ropeNumber: '',
          floorNumber: '',
          averageSize: '',
          maxSize: '',
          minSize: '',
          totalSpecimens: previousDensity > 0 ? previousDensity.toString() : '',
          aliveSpecimens: '',
          averageDensity: ''
        })
      }
      setMeasurementForm(prev => ({ ...prev, points: newPoints }))
    }
    
    if (measurementForm.measurementPoints > 0) {
      initializePoints()
    }
  }, [measurementForm.measurementPoints, monitoringRecords, seeding])

  // Initialize additional measurement points
  useEffect(() => {
    const initializeAdditionalPoints = () => {
      const newPoints = []
      const existingPointsCount = selectedRecord?.measurementPoints?.length || 0

      // Determinar la línea a autocompletar desde la siembra
      let defaultLineName = ''
      if (seeding?.multipleLines && seeding.multipleLines.length > 0) {
        // Si tiene múltiples líneas, usar la primera como default
        defaultLineName = seeding.multipleLines[0].lineName || ''
      } else if (seeding?.lineName) {
        // Si tiene una sola línea
        defaultLineName = seeding.lineName
      }

      for (let i = 0; i < additionalPointsForm.numberOfPoints; i++) {
        newPoints.push({
          pointNumber: existingPointsCount + i + 1,
          lineName: defaultLineName,
          ropeNumber: '',
          floorNumber: '',
          averageSize: '',
          maxSize: '',
          minSize: '',
          totalSpecimens: '',
          aliveSpecimens: '',
          averageDensity: ''
        })
      }
      setAdditionalPointsForm(prev => ({ ...prev, points: newPoints }))
    }
    
    if (additionalPointsForm.numberOfPoints > 0 && selectedRecord) {
      initializeAdditionalPoints()
    }
  }, [additionalPointsForm.numberOfPoints, selectedRecord])

  const updateMeasurementPoint = (pointIndex, field, value) => {
    // Validar rango del número de piso
    if (field === 'floorNumber') {
      const numValue = parseInt(value)
      if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 10)) {
        return // No actualizar si está fuera del rango 1-10
      }
    }

    setMeasurementForm(prev => {
      const updatedPoints = prev.points.map((point, index) =>
        index === pointIndex ? { ...point, [field]: value } : point
      )
      
      // Auto-calcular cantidad actual cuando se modifiquen los campos de mortalidad
      if (field === 'aliveSpecimens' || field === 'totalSpecimens') {
        const validPoints = updatedPoints.filter(p => 
          p.totalSpecimens && p.aliveSpecimens && 
          parseFloat(p.totalSpecimens) > 0 && parseFloat(p.aliveSpecimens) >= 0
        )
        
        if (validPoints.length > 0) {
          // Calcular mortalidad promedio
          let totalMortalityRate = 0
          validPoints.forEach(point => {
            const total = parseFloat(point.totalSpecimens)
            const alive = parseFloat(point.aliveSpecimens)
            const mortalityRate = ((total - alive) / total) * 100
            totalMortalityRate += mortalityRate
          })
          const averageMortalityRate = totalMortalityRate / validPoints.length
          
          // Calcular cantidad actual basada en la mortalidad
          const previousQuantity = parseFloat(prev.previousQuantity) || 0
          const currentQuantity = Math.round(previousQuantity * (1 - averageMortalityRate / 100))
          
          return {
            ...prev,
            points: updatedPoints,
            currentQuantity: currentQuantity.toString() // Auto-completar el campo
          }
        }
      }
      
      return {
        ...prev,
        points: updatedPoints
      }
    })
  }

  const updateAdditionalMeasurementPoint = (pointIndex, field, value) => {
    // Validar rango del número de piso
    if (field === 'floorNumber') {
      const numValue = parseInt(value)
      if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 10)) {
        return // No actualizar si está fuera del rango 1-10
      }
    }

    setAdditionalPointsForm(prev => ({
      ...prev,
      points: prev.points.map((point, index) =>
        index === pointIndex ? { ...point, [field]: value } : point
      )
    }))
  }

  const calculateAverages = (points) => {
    const validPoints = points.filter(point => 
      point.averageSize || point.maxSize || point.minSize
    )
    
    if (validPoints.length === 0) return {}

    const calculateAvg = (field) => {
      const values = validPoints
        .map(point => parseFloat(point[field]))
        .filter(val => !isNaN(val) && val > 0)
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
    }

    return {
      averageSize: calculateAvg('averageSize'),
      maxSize: Math.max(...validPoints.map(p => parseFloat(p.maxSize)).filter(v => !isNaN(v))),
      minSize: Math.min(...validPoints.map(p => parseFloat(p.minSize)).filter(v => !isNaN(v)))
    }
  }
  
  const handleSubmitMeasurement = async (e) => {
    e.preventDefault()
    
    const averages = calculateAverages(measurementForm.points)
    const mortalityData = calculateMortalityData()
    
    // Use calculated current quantity if not manually entered
    const currentQuantity = measurementForm.currentQuantity 
      ? parseInt(measurementForm.currentQuantity)
      : mortalityData.calculatedCurrentQuantity
    
    const measurementData = {
      lotId,
      date: measurementForm.date,  // Campo requerido por el esquema
      recordDate: measurementForm.date,  // También requerido por el esquema
      previousQuantity: parseInt(measurementForm.previousQuantity) || 0,
      currentQuantity: currentQuantity,
      averageSize: averages.averageSize,
      maxSize: isFinite(averages.maxSize) ? averages.maxSize : null,
      minSize: isFinite(averages.minSize) ? averages.minSize : null,
      observations: measurementForm.observations || null,
      recordedBy: user.id,
      measurementPoints: measurementForm.points,
      totalPoints: measurementForm.measurementPoints,
      mortalityData: {
        pointMortalities: mortalityData.pointMortalities,
        averageMortalityRate: mortalityData.averageMortalityRate
      }
    }
    
    console.log('🚀 Enviando datos de medición:', measurementData)
    const result = await createMonitoring(measurementData)
    console.log('📊 Resultado de createMonitoring:', result)

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Medición registrada',
        text: 'La medición se registró exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      
      setShowMeasurementForm(false)
      setMeasurementForm({
        date: new Date().toISOString().split('T')[0],
        previousQuantity: '',
        currentQuantity: '',
        observations: '',
        measurementPoints: 5,
        points: []
      })
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }

  const handleAddAdditionalPoints = async (e) => {
    e.preventDefault()
    
    const additionalData = {
      measurementPoints: additionalPointsForm.points
    }
    
    const result = await updateMonitoring(selectedRecord.id, additionalData)
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Puntos agregados',
        text: 'Los pisos muestreados se agregaron exitosamente',
        timer: 2000,
        showConfirmButton: false
      })
      
      // Actualizar el registro seleccionado con los datos actualizados
      setSelectedRecord(result.data)
      setShowAddPointsForm(false)
      setAdditionalPointsForm({
        numberOfPoints: 1,
        points: []
      })
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }
  
  // Calculate monthly projections for a seeding (using centralized parameters)
  const calculateMonthlyProjections = (seeding) => {
    const projections = []
    const startDate = new Date(seeding.entryDate)
    const today = new Date()

    // Use centralized seed origin parameters for consistency
    const originParams = getSeedOriginParameters()
    const initialSize = getInitialSize()
    
    // Determinar fecha límite basada en fecha proyectada de cosecha o 24 meses por defecto
    let endDate = new Date(startDate)
    if (seeding.projectedHarvestDate) {
      endDate = new Date(seeding.projectedHarvestDate)
    } else {
      // Si no hay fecha proyectada, usar 24 meses como límite
      endDate.setMonth(startDate.getMonth() + 24)
    }
    
    // Calcular número total de meses hasta la fecha límite
    const totalMonths = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44))
    const maxMonths = Math.max(1, totalMonths) // Al menos 1 mes
    
    // Calcular proyecciones hasta la fecha límite
    for (let month = 0; month <= maxMonths; month++) {
      const projectionDate = new Date(startDate)
      projectionDate.setMonth(startDate.getMonth() + month)
      
      // Si la fecha de proyección supera la fecha límite, parar
      if (projectionDate > endDate) {
        break
      }
      
      // Calcular talla esperada
      const expectedSize = initialSize + (month * originParams.monthlyGrowthRate)

      // Calcular mortalidad acumulada usando interés compuesto
      // Fórmula: Población final = Población inicial × (1 - tasa_mortalidad)^meses
      const mortalityRate = originParams.monthlyMortalityRate / 100 // Convertir porcentaje a decimal
      const survivalRate = Math.pow(1 - mortalityRate, month)
      const survivingQuantity = Math.floor(seeding.initialQuantity * survivalRate)
      
      // Mortalidad acumulada = ejemplares perdidos / ejemplares iniciales * 100
      const lostQuantity = seeding.initialQuantity - survivingQuantity
      const cumulativeMortality = parseFloat((lostQuantity / seeding.initialQuantity * 100).toFixed(2))
      
      // Estado basado en tiempo transcurrido y talla
      let status = 'seeded'
      if (month >= 1) status = 'growing'
      if (month >= 4 && expectedSize >= 45) status = 'ready'
      if (month >= 12 && expectedSize >= 60) status = 'mature'
      
      projections.push({
        month,
        date: projectionDate,
        expectedSize: parseFloat(expectedSize.toFixed(2)),
        survivingQuantity,
        cumulativeMortality: cumulativeMortality,
        monthlyMortality: month === 0 ? 0 : originParams.monthlyMortalityRate,
        status,
        isPast: projectionDate <= today,
        isCurrentMonth: projectionDate.getMonth() === today.getMonth() && 
                       projectionDate.getFullYear() === today.getFullYear(),
        isHarvestMonth: seeding.projectedHarvestDate && 
                       projectionDate.getMonth() === new Date(seeding.projectedHarvestDate).getMonth() && 
                       projectionDate.getFullYear() === new Date(seeding.projectedHarvestDate).getFullYear()
      })
    }
    
    return projections
  }

  const calculateTheoreticalData = (date) => {
    const entryDate = new Date(seeding.entryDate)
    const measurementDate = new Date(date)
    const monthsActive = Math.max(0, (measurementDate - entryDate) / (1000 * 60 * 60 * 24 * 30.44))

    // Use centralized seed origin parameters (addresses inconsistencies #4, #6, #8, #9)
    const originParams = getSeedOriginParameters()
    const initialSize = getInitialSize()

    // Calcular talla esperada
    const expectedSize = initialSize + (monthsActive * originParams.monthlyGrowthRate)

    // Calcular mortalidad usando interés compuesto (consistent with cards)
    const mortalityRate = originParams.monthlyMortalityRate / 100
    const survivalRate = Math.pow(1 - mortalityRate, monthsActive)
    const theoreticalMortality = Math.min((1 - survivalRate) * 100, 100)
    const theoreticalQuantity = Math.floor(seeding.initialQuantity * survivalRate)

    return {
      monthsActive: monthsActive.toFixed(2),
      theoreticalMortality: theoreticalMortality.toFixed(2),
      theoreticalQuantity: theoreticalQuantity,
      expectedSize: expectedSize.toFixed(2),
      // Return parameters used for transparency and debugging
      parametersUsed: {
        monthlyGrowthRate: originParams.monthlyGrowthRate,
        monthlyMortalityRate: originParams.monthlyMortalityRate,
        initialSize: initialSize,
        isValidOrigin: originParams.isValidOrigin,
        originName: originParams.originName
      }
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }
  
  if (!seeding) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-xl text-gray-600">Siembra no encontrada</h1>
          <button onClick={onBack} className="btn-primary mt-4">
            Volver al Monitoreo
          </button>
        </div>
      </div>
    )
  }
  
  if (loading && monitoringRecords.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando historial de monitoreo..." />
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitoreo de Siembra - {sector?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              📍 {sector?.location} • Origen: {seeding.origin} • Siembra: {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
            </p>
            {/* Mostrar líneas y sistemas si es cultivo suspendido */}
            {seeding.cultivationSystem === 'Cultivo suspendido' && (seeding.multipleLines || seeding.lines) && (seeding.multipleLines || seeding.lines).length > 0 && (
              <div className="mt-2 space-y-1">
                {(seeding.multipleLines || seeding.lines).map((line, index) => (
                  <div key={index} className="text-sm text-blue-600">
                    <span className="font-medium">Línea {line.lineName}:</span>
                    {line.systems && line.systems.length > 0 && (
                      <span className="ml-2 text-gray-600">
                        Sistemas {
                          line.systems.length === 1 
                            ? line.systems[0].systemNumber
                            : line.systems.length <= 5
                              ? line.systems.map(s => s.systemNumber).join(', ')
                              : `${line.systems[0].systemNumber}-${line.systems[line.systems.length - 1].systemNumber} (${line.systems.length} total)`
                        }
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Mostrar línea individual si no hay array de líneas */}
            {seeding.cultivationSystem === 'Cultivo suspendido' && !(seeding.multipleLines || seeding.lines) && seeding.lineName && (
              <div className="mt-2 text-sm text-blue-600">
                <span className="font-medium">Línea {seeding.lineName}:</span>
                {seeding.systems && seeding.systems.length > 0 && (
                  <span className="ml-2 text-gray-600">
                    Sistemas {
                      seeding.systems.length === 1 
                        ? seeding.systems[0].systemNumber
                        : seeding.systems.length <= 5
                          ? seeding.systems.map(s => s.systemNumber).join(', ')
                          : `${seeding.systems[0].systemNumber}-${seeding.systems[seeding.systems.length - 1].systemNumber} (${seeding.systems.length} total)`
                    }
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={openMeasurementForm}
          className="btn-primary"
        >
          📊 Nueva Medición
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          title="Cantidad Inicial"
          value={
            <div>
              <div>{seeding.initialQuantity?.toLocaleString()}</div>
              <div className="text-xs font-normal text-gray-500 mt-1">
                ({Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos)
              </div>
            </div>
          }
          subtitle="Ejemplares sembrados"
          icon="🌱"
          color="blue"
        />
        
        <StatCard
          title="Cantidad Actual"
          value={
            <div>
              {(() => {
                // Obtener la cantidad de la medición más reciente
                const sortedRecords = [...monitoringRecords].sort((a, b) => new Date(b.date) - new Date(a.date))
                const latestMeasurement = sortedRecords.length > 0 ? sortedRecords[0] : null
                const currentQuantity = latestMeasurement?.currentQuantity || seeding.initialQuantity || 0

                return (
                  <div>
                    <div>{currentQuantity.toLocaleString()}</div>
                    <div className="text-xs font-normal text-gray-500 mt-1">
                      ({Math.round(currentQuantity / 96).toLocaleString()} manojos)
                    </div>
                    {latestMeasurement && (
                      <div className="text-xs font-normal text-blue-600 mt-1">
                        {new Date(latestMeasurement.date).toLocaleDateString('es-PE')}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          }
          subtitle={monitoringRecords.length > 0 ? "Última medición" : "Cantidad inicial"}
          icon="🐚"
          color="green"
        />
        
        <StatCard
          title="Mortalidad Esperada"
          value={
            <div>
              {(() => {
                // Use centralized seed origin parameters (fixes inconsistency #4)
                const originParams = getSeedOriginParameters()

                // Calcular mortalidad acumulada esperada basada en tiempo transcurrido
                const entryDate = new Date(seeding.entryDate)
                const today = new Date()
                const monthsElapsed = Math.max(0, (today - entryDate) / (1000 * 60 * 60 * 24 * 30.44))
                const monthlyMortalityRate = originParams.monthlyMortalityRate / 100
                const cumulativeExpectedMortality = (1 - Math.pow(1 - monthlyMortalityRate, monthsElapsed)) * 100

                return (
                  <div>
                    <div>{originParams.monthlyMortalityRate}%</div>
                    <div className="text-xs font-normal text-blue-600 mt-1">
                      Acum: {cumulativeExpectedMortality.toFixed(1)}%
                    </div>
                    {!originParams.isValidOrigin && (
                      <div className="text-xs font-normal text-orange-600 mt-1">
                        ⚠️ Origen no encontrado
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          }
          subtitle="Mensual"
          icon="📊"
          color="yellow"
        />

        <StatCard
          title="Mortalidad Real"
          value={
            <div>
              {(() => {
                // Calculate real mortality using same methodology as expected mortality (fixes inconsistency #10)
                const initialQuantity = seeding.initialQuantity || 0
                const sortedRecords = [...monitoringRecords].sort((a, b) => new Date(b.date) - new Date(a.date))
                const latestMeasurement = sortedRecords.length > 0 ? sortedRecords[0] : null
                const currentQuantity = latestMeasurement?.currentQuantity || seeding.initialQuantity || 0

                if (initialQuantity > 0 && currentQuantity < initialQuantity) {
                  const realCumulativeMortality = ((initialQuantity - currentQuantity) / initialQuantity * 100)

                  // Calculate equivalent monthly mortality using compound interest formula
                  const entryDate = new Date(seeding.entryDate)
                  const measurementDate = latestMeasurement ? new Date(latestMeasurement.date) : new Date()
                  const monthsElapsed = Math.max(0.1, (measurementDate - entryDate) / (1000 * 60 * 60 * 24 * 30.44))

                  // Reverse compound interest: mensual = 1 - (survival_rate)^(1/meses)
                  const survivalRate = currentQuantity / initialQuantity
                  const monthlyMortalityEquivalent = survivalRate > 0 && monthsElapsed > 0
                    ? (1 - Math.pow(survivalRate, 1 / monthsElapsed)) * 100
                    : 0

                  return (
                    <div>
                      <div>{monthlyMortalityEquivalent.toFixed(1)}%</div>
                      <div className="text-xs font-normal text-red-600 mt-1">
                        Acum: {realCumulativeMortality.toFixed(1)}%
                      </div>
                      {latestMeasurement && (
                        <div className="text-xs font-normal text-gray-500 mt-1">
                          {new Date(latestMeasurement.date).toLocaleDateString('es-PE')}
                        </div>
                      )}
                    </div>
                  )
                } else if (initialQuantity > 0 && currentQuantity >= initialQuantity) {
                  return (
                    <div>
                      <div>0.0%</div>
                      <div className="text-xs font-normal text-green-600 mt-1">
                        Sin mortalidad
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div>
                      <div>No hay datos</div>
                      <div className="text-xs font-normal text-gray-400 mt-1">
                        Sin mediciones
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          }
          subtitle="Mensual"
          icon="🔬"
          color="red"
        />

        <StatCard
          title="Costo Total"
          value={formatCurrency(seeding.cost)}
          subtitle="Inversión inicial"
          icon="💰"
          color="purple"
        />
      </div>
      
      
      {/* Historial de Mediciones y Comparación */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tabla de Historial Real */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📈 Historial de Mediciones Reales (Promedios)</h2>
            <p className="text-sm text-gray-600">Promedios calculados a partir de múltiples pisos muestreados</p>
          </div>

          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Talla Prom.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Talla Máx.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Talla Mín.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Densidad Teórica</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Densidad Muestreo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Puntos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-green-800 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monitoringRecords.map((record, index) => (
                    <React.Fragment key={record.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{record.currentQuantity?.toLocaleString() || '-'}</div>
                            {record.currentQuantity && (
                              <div className="text-xs text-gray-500">
                                {Math.round(record.currentQuantity / 96).toLocaleString()} manojos
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.averageSize ? `${parseFloat(record.averageSize).toFixed(2)}mm` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.maxSize ? `${parseFloat(record.maxSize).toFixed(2)}mm` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {record.minSize ? `${parseFloat(record.minSize).toFixed(2)}mm` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="text-center">
                            <span className="font-medium text-blue-600">1,500</span>
                            <div className="text-xs text-gray-500">conchas/piso</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="text-center">
                            {(() => {
                              // Calcular densidad según muestreo basada en la cantidad actual y puntos de muestreo
                              const currentQuantity = record.currentQuantity || 0;
                              const totalPoints = record.totalPoints || 1;

                              if (currentQuantity > 0 && totalPoints > 0) {
                                const samplingDensity = Math.round(currentQuantity / totalPoints);
                                return (
                                  <div>
                                    <span className="font-medium text-green-600">{samplingDensity.toLocaleString()}</span>
                                    <div className="text-xs text-gray-500">conchas/piso</div>
                                  </div>
                                );
                              }

                              return <span className="text-gray-400">-</span>;
                            })()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {record.totalPoints || 1} punto{(record.totalPoints || 1) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            onClick={() => {
                              setSelectedRecord(record)
                              setShowDetailModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            disabled={!record.measurementPoints || record.measurementPoints.length === 0}
                          >
                            {record.measurementPoints && record.measurementPoints.length > 0 ? 'Ver Detalles' : 'Sin detalles'}
                          </button>
                        </td>
                      </tr>

                      {/* Mostrar fila inicial después de la medición más antigua */}
                      {index === monitoringRecords.length - 1 && (
                        <tr className="bg-blue-50 hover:bg-blue-100">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">
                                Inicio
                              </span>
                              {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{seeding.initialQuantity?.toLocaleString() || '-'}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {seeding.averageSize ? `${parseFloat(seeding.averageSize).toFixed(2)}mm` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {seeding.maxSize ? `${parseFloat(seeding.maxSize).toFixed(2)}mm` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {seeding.minSize ? `${parseFloat(seeding.minSize).toFixed(2)}mm` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="text-center">
                              <span className="font-medium text-blue-600">1,500</span>
                              <div className="text-xs text-gray-500">conchas/piso</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="text-center">
                              <span className="text-gray-400">-</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              Inicial
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="text-gray-400 text-sm italic">Datos iniciales</span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Mostrar fila inicial cuando no hay mediciones */}
                  {monitoringRecords.length === 0 && (
                    <tr className="bg-blue-50 hover:bg-blue-100">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">
                            Inicio
                          </span>
                          {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{seeding.initialQuantity?.toLocaleString() || '-'}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {seeding.averageSize ? `${parseFloat(seeding.averageSize).toFixed(2)}mm` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {seeding.maxSize ? `${parseFloat(seeding.maxSize).toFixed(2)}mm` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {seeding.minSize ? `${parseFloat(seeding.minSize).toFixed(2)}mm` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="text-center">
                          <span className="font-medium text-blue-600">1,500</span>
                          <div className="text-xs text-gray-500">conchas/piso</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="text-center">
                          <span className="text-gray-400">-</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          Inicial
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="text-gray-400 text-sm italic">Datos iniciales</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Tabla de Comparación Teórica */}
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">📊 Comparación Real vs Teórico</h2>
            <p className="text-sm text-gray-600">Análisis de proyecciones vs mediciones reales</p>
          </div>
          
          <div>
            {monitoringRecords.length === 0 && (
              <div className="text-center py-4 mb-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-gray-600 text-sm">Se generará automáticamente con las mediciones</p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Cantidad Real</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Cantidad Teórica</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Dif. Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Talla Real</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Talla Teórica</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Dif. Talla</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monitoringRecords.map((record, index) => {
                    const theoretical = calculateTheoreticalData(record.date)
                    const realQuantity = record.currentQuantity
                    const theoreticalQuantity = theoretical.theoreticalQuantity
                    const quantityDifference = realQuantity - theoreticalQuantity
                    const quantityDifferencePercent = ((quantityDifference / theoreticalQuantity) * 100).toFixed(2)
                    
                    // Use the same average size as shown in the measurements history table
                    const realAverageSize = record.averageSize || null
                    
                    const theoreticalSize = parseFloat(theoretical.expectedSize)
                    const sizeDifference = realAverageSize ? (realAverageSize - theoreticalSize).toFixed(2) : null
                    const sizeDifferencePercent = realAverageSize && theoreticalSize > 0 
                      ? (((realAverageSize - theoreticalSize) / theoreticalSize) * 100).toFixed(2) 
                      : null
                    
                    return (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString('es-PE')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{realQuantity?.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">
                              {Math.round(realQuantity / 96).toLocaleString()} manojos
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="font-medium">{theoreticalQuantity.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">
                              {Math.round(theoreticalQuantity / 96).toLocaleString()} manojos
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={quantityDifference >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {quantityDifference >= 0 ? '+' : ''}{quantityDifference.toLocaleString()}
                            </span>
                            <div className="text-xs text-gray-500">({quantityDifferencePercent}%)</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {realAverageSize ? (
                              <div>
                                <div className="font-medium">{realAverageSize.toFixed(2)}mm</div>
                                <div className="text-xs text-gray-500">promedio</div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">No medido</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="font-medium">{theoreticalSize}mm</div>
                            <div className="text-xs text-gray-500">proyectado</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sizeDifference !== null ? (
                              <div>
                                <span className={parseFloat(sizeDifference) >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                  {parseFloat(sizeDifference) >= 0 ? '+' : ''}{sizeDifference}mm
                                </span>
                                <div className="text-xs text-gray-500">({sizeDifferencePercent}%)</div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">-</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {quantityDifference >= 0 ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                ✅ Superior
                              </span>
                            ) : Math.abs(quantityDifference) / theoreticalQuantity > 0.2 ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                ⚠️ Crítico
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                📊 Normal
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Mostrar fila inicial después de la medición más antigua */}
                        {index === monitoringRecords.length - 1 && (
                          <tr className="bg-blue-50 hover:bg-blue-100">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">
                                  Inicio
                                </span>
                                {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{seeding.initialQuantity?.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="font-medium">{seeding.initialQuantity?.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="text-gray-600 font-medium">0</span>
                              <div className="text-xs text-gray-500">(0%)</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {seeding.averageSize ? (
                                <div>
                                  <div className="font-medium">{parseFloat(seeding.averageSize).toFixed(2)}mm</div>
                                  <div className="text-xs text-gray-500">inicial</div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No definida</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="font-medium">{seeding.averageSize ? parseFloat(seeding.averageSize).toFixed(2) : '0.0'}mm</div>
                              <div className="text-xs text-gray-500">inicial</div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="text-gray-600 font-medium">0.00mm</span>
                              <div className="text-xs text-gray-500">(0%)</div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                🌱 Inicial
                              </span>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}

                  {/* Mostrar fila inicial cuando no hay mediciones */}
                  {monitoringRecords.length === 0 && (
                    <tr className="bg-blue-50 hover:bg-blue-100">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-bold mr-2">
                            Inicio
                          </span>
                          {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{seeding.initialQuantity?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="font-medium">{seeding.initialQuantity?.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round(seeding.initialQuantity / 96).toLocaleString()} manojos
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-600 font-medium">0</span>
                        <div className="text-xs text-gray-500">(0%)</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {seeding.averageSize ? (
                          <div>
                            <div className="font-medium">{parseFloat(seeding.averageSize).toFixed(2)}mm</div>
                            <div className="text-xs text-gray-500">inicial</div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No definida</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="font-medium">{seeding.averageSize ? parseFloat(seeding.averageSize).toFixed(2) : '0.0'}mm</div>
                        <div className="text-xs text-gray-500">inicial</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-600 font-medium">0.00mm</span>
                        <div className="text-xs text-gray-500">(0%)</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          🌱 Inicial
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulario de Nueva Medición */}
      {showMeasurementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              📊 Nueva Medición - {sector?.name}
            </h2>
            <form onSubmit={handleSubmitMeasurement} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Medición *
                  </label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={measurementForm.date}
                    onChange={(e) => setMeasurementForm({...measurementForm, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Anterior
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field bg-gray-100"
                    value={measurementForm.previousQuantity}
                    readOnly
                    placeholder="Auto calculado"
                  />
                  {measurementForm.previousQuantity && (
                    <div className="text-xs text-gray-600 mt-1">
                      <div className="font-medium">
                        {(() => {
                          const conversions = getAllConversionsFromConchitas(parseInt(measurementForm.previousQuantity) || 0)
                          return `${conversions.manojos.toLocaleString()} manojos • ${conversions.mallas} mallas`
                        })()}
                      </div>
                      <div className="text-gray-500">De la medición anterior</div>
                    </div>
                  )}
                  {!measurementForm.previousQuantity && (
                    <p className="text-xs text-gray-500 mt-1">De la medición anterior</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de pisos muestreados *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    className="input-field"
                    value={measurementForm.measurementPoints}
                    onChange={(e) => setMeasurementForm({...measurementForm, measurementPoints: parseInt(e.target.value) || 1})}
                    placeholder="Ej: 5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ingrese entre 1 y 20 pisos para muestrear</p>
                </div>
              </div>
              
              {/* Puntos de Medición */}
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Pisos Muestreados ({measurementForm.measurementPoints} pisos)
                </h3>
                <div className="space-y-6">
                  {measurementForm.points.map((point, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        📍 Piso {point.pointNumber}
                      </h4>
                      
                      {/* Campos de ubicación */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Línea *
                          </label>
                          <select
                            className="input-field text-sm"
                            value={point.lineName}
                            onChange={(e) => updateMeasurementPoint(index, 'lineName', e.target.value)}
                            required
                          >
                            <option value="">Seleccionar línea</option>
                            {/* Check for multipleLines first, then lines, then individual lineName */}
                            {(seeding?.multipleLines || seeding?.lines)?.map((line, lineIdx) => (
                              <option key={lineIdx} value={line.lineName}>
                                Línea {line.lineName}
                              </option>
                            ))}
                            {/* Fallback to individual lineName if no multiple lines */}
                            {!(seeding?.multipleLines || seeding?.lines) && seeding?.lineName && (
                              <option value={seeding.lineName}>
                                Línea {seeding.lineName}
                              </option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            N° de Cuelga (Sistema) *
                          </label>
                          <select
                            className="input-field text-sm"
                            value={point.ropeNumber}
                            onChange={(e) => updateMeasurementPoint(index, 'ropeNumber', e.target.value)}
                            required
                          >
                            <option value="">Seleccionar sistema</option>
                            {(() => {
                              // Debug: mostrar información disponible
                              const availableLines = seeding?.multipleLines || seeding?.lines || []
                              const selectedLineName = point.lineName
                              
                              // Buscar la línea seleccionada (más flexible)
                              const selectedLine = availableLines.find(l => 
                                l.lineName === selectedLineName || 
                                l.lineName === `Línea ${selectedLineName}` ||
                                l.name === selectedLineName
                              )
                              
                              // Obtener sistemas de la línea encontrada, o usar sistemas globales como fallback
                              let systems = []
                              
                              if (selectedLine && selectedLine.systems) {
                                systems = selectedLine.systems
                              } else if (seeding?.systems) {
                                systems = seeding.systems
                              }
                              
                              // Verificar que los sistemas tengan la estructura correcta
                              return systems.map((system, sysIdx) => {
                                const systemNumber = system.systemNumber || system.number || system.id || (sysIdx + 1)
                                return (
                                  <option key={sysIdx} value={systemNumber}>
                                    Sistema {systemNumber}
                                  </option>
                                )
                              })
                            })()}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            N° de Piso *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="input-field text-sm"
                            value={point.floorNumber}
                            onChange={(e) => updateMeasurementPoint(index, 'floorNumber', e.target.value)}
                            placeholder="1-10"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Tallas */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Promedio (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.averageSize}
                            onChange={(e) => updateMeasurementPoint(index, 'averageSize', e.target.value)}
                            placeholder="45.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Máxima (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.maxSize}
                            onChange={(e) => updateMeasurementPoint(index, 'maxSize', e.target.value)}
                            placeholder="68.2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Mínima (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.minSize}
                            onChange={(e) => updateMeasurementPoint(index, 'minSize', e.target.value)}
                            placeholder="22.1"
                          />
                        </div>
                      </div>
                      
                      {/* Campos de Mortalidad y Densidad */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ejemplares Totales
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input-field text-sm bg-gray-100"
                            value={point.totalSpecimens}
                            readOnly
                            placeholder="Auto-calculado"
                            title="Este valor se toma de la densidad del monitoreo anterior o de la siembra inicial"
                          />
                          <p className="text-xs text-gray-500 mt-1">Densidad anterior</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Densidad promedio (ind/piso)
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input-field text-sm"
                            value={point.aliveSpecimens}
                            onChange={(e) => updateMeasurementPoint(index, 'aliveSpecimens', e.target.value)}
                            placeholder="95"
                          />
                        </div>
                      </div>
                      
                      {/* Mostrar tasa de mortalidad calculada */}
                      {point.totalSpecimens && point.aliveSpecimens && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-center">
                          <span className="text-xs text-gray-600">
                            Mortalidad del punto: {' '}
                            <span className="font-medium text-blue-800">
                              {(((parseFloat(point.totalSpecimens) - parseFloat(point.aliveSpecimens)) / parseFloat(point.totalSpecimens)) * 100).toFixed(2)}%
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resumen de Mortalidad y Cantidad Actual */}
                {(() => {
                  const mortalityData = calculateMortalityData()
                  const avgDensity = measurementForm.points
                    .filter(p => p.aliveSpecimens && parseFloat(p.aliveSpecimens) > 0)
                    .reduce((sum, p) => sum + parseFloat(p.aliveSpecimens), 0) / 
                    (measurementForm.points.filter(p => p.aliveSpecimens && parseFloat(p.aliveSpecimens) > 0).length || 1)
                  
                  return (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">📊 Resumen de Mortalidad</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Mortalidad Promedio</div>
                          <div className="font-semibold text-yellow-800">{mortalityData.averageMortalityRate}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Cantidad Anterior</div>
                          <div className="font-semibold text-yellow-800">
                            {parseInt(measurementForm.previousQuantity || 0).toLocaleString()}
                            {measurementForm.previousQuantity && (
                              <div className="text-xs font-normal text-gray-600 mt-1">
                                {(() => {
                                  const conversions = getAllConversionsFromConchitas(parseInt(measurementForm.previousQuantity) || 0)
                                  return `${conversions.manojos.toLocaleString()} manojos`
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Cantidad Actual (Calculada)</div>
                          <div className="font-semibold text-yellow-800">{mortalityData.calculatedCurrentQuantity.toLocaleString()}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Densidad Promedio/Piso</div>
                          <div className="font-semibold text-green-800">{isNaN(avgDensity) ? '0' : avgDensity.toFixed(0)} ind/piso</div>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-600 text-center italic">
                        La cantidad actual se calcula automáticamente al llenar los datos de mortalidad
                      </div>
                    </div>
                  )
                })()}
              </div>
              
              {/* Campo Cantidad Actual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Actual (Auto-calculada) ✨
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field bg-blue-50 font-semibold"
                  value={measurementForm.currentQuantity}
                  onChange={(e) => setMeasurementForm({...measurementForm, currentQuantity: e.target.value})}
                  placeholder="Se calcula automáticamente con los datos de mortalidad"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este valor se actualiza automáticamente al ingresar los datos de mortalidad en los pisos. Puede editarlo manualmente si lo desea.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows="3"
                  className="input-field"
                  value={measurementForm.observations}
                  onChange={(e) => setMeasurementForm({...measurementForm, observations: e.target.value})}
                  placeholder="Notas adicionales sobre la medición..."
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMeasurementForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : 'Registrar Medición'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal de Detalles de Puntos */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📊 Detalles de Medición - {new Date(selectedRecord.date).toLocaleDateString('es-PE')}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Resumen (Promedios Calculados)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Talla Promedio</div>
                  <div className="font-semibold text-green-800">{selectedRecord.averageSize ? `${selectedRecord.averageSize.toFixed(2)}mm` : 'N/A'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Talla Máxima</div>
                  <div className="font-semibold text-green-800">{selectedRecord.maxSize ? `${selectedRecord.maxSize.toFixed(2)}mm` : 'N/A'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Talla Mínima</div>
                  <div className="font-semibold text-green-800">{selectedRecord.minSize ? `${selectedRecord.minSize.toFixed(2)}mm` : 'N/A'}</div>
                </div>
              </div>
            </div>
            
            {selectedRecord.measurementPoints && selectedRecord.measurementPoints.length > 0 ? (
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">
                  Pisos Muestreados Individuales ({selectedRecord.measurementPoints.length} pisos)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Punto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla Prom. (mm)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla Max. (mm)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla Min. (mm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedRecord.measurementPoints.map((point, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            📍 Punto {point.pointNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {point.averageSize || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {point.maxSize || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {point.minSize || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500">No hay detalles de pisos muestreados disponibles para este registro.</p>
                <p className="text-gray-400 text-sm mt-1">Este registro fue creado antes de implementar el sistema de múltiples puntos.</p>
              </div>
            )}
            
            {selectedRecord.observations && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Observaciones:</h4>
                <p className="text-sm text-gray-700">{selectedRecord.observations}</p>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowAddPointsForm(true)}
                className="btn-primary"
              >
                📊 Agregar Puntos
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para Agregar Puntos Adicionales */}
      {showAddPointsForm && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                📊 Agregar Pisos Muestreados - {new Date(selectedRecord.date).toLocaleDateString('es-PE')}
              </h2>
              <button
                onClick={() => setShowAddPointsForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Puntos existentes:</strong> {selectedRecord.measurementPoints?.length || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los nuevos puntos se numerarán a partir del {(selectedRecord.measurementPoints?.length || 0) + 1}
              </p>
            </div>
            
            <form onSubmit={handleAddAdditionalPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Puntos Adicionales *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  className="input-field"
                  value={additionalPointsForm.numberOfPoints}
                  onChange={(e) => setAdditionalPointsForm({...additionalPointsForm, numberOfPoints: parseInt(e.target.value) || 1})}
                  placeholder="Ej: 3"
                />
                <p className="text-xs text-gray-500 mt-1">Ingrese entre 1 y 10 puntos adicionales</p>
              </div>
              
              {/* Pisos Muestreados Adicionales */}
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  Nuevos Pisos Muestreados ({additionalPointsForm.numberOfPoints} pisos)
                </h3>
                <div className="space-y-6">
                  {additionalPointsForm.points.map((point, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        📍 Piso {point.pointNumber}
                      </h4>
                      
                      {/* Campos de ubicación */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Línea *
                          </label>
                          <select
                            className="input-field text-sm"
                            value={point.lineName}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'lineName', e.target.value)}
                            required
                          >
                            <option value="">Seleccionar línea</option>
                            {/* Check for multipleLines first, then lines, then individual lineName */}
                            {(seeding?.multipleLines || seeding?.lines)?.map((line, lineIdx) => (
                              <option key={lineIdx} value={line.lineName}>
                                Línea {line.lineName}
                              </option>
                            ))}
                            {/* Fallback to individual lineName if no multiple lines */}
                            {!(seeding?.multipleLines || seeding?.lines) && seeding?.lineName && (
                              <option value={seeding.lineName}>
                                Línea {seeding.lineName}
                              </option>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            N° de Cuelga (Sistema) *
                          </label>
                          <select
                            className="input-field text-sm"
                            value={point.ropeNumber}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'ropeNumber', e.target.value)}
                            required
                          >
                            <option value="">Seleccionar sistema</option>
                            {(() => {
                              // Debug: mostrar información disponible
                              const availableLines = seeding?.multipleLines || seeding?.lines || []
                              const selectedLineName = point.lineName
                              
                              // Buscar la línea seleccionada (más flexible)
                              const selectedLine = availableLines.find(l => 
                                l.lineName === selectedLineName || 
                                l.lineName === `Línea ${selectedLineName}` ||
                                l.name === selectedLineName
                              )
                              
                              // Obtener sistemas de la línea encontrada, o usar sistemas globales como fallback
                              let systems = []
                              
                              if (selectedLine && selectedLine.systems) {
                                systems = selectedLine.systems
                              } else if (seeding?.systems) {
                                systems = seeding.systems
                              }
                              
                              // Verificar que los sistemas tengan la estructura correcta
                              return systems.map((system, sysIdx) => {
                                const systemNumber = system.systemNumber || system.number || system.id || (sysIdx + 1)
                                return (
                                  <option key={sysIdx} value={systemNumber}>
                                    Sistema {systemNumber}
                                  </option>
                                )
                              })
                            })()}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            N° de Piso *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            className="input-field text-sm"
                            value={point.floorNumber}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'floorNumber', e.target.value)}
                            placeholder="1-10"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Tallas */}
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Promedio (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.averageSize}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'averageSize', e.target.value)}
                            placeholder="45.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Máxima (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.maxSize}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'maxSize', e.target.value)}
                            placeholder="68.2"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Talla Mínima (mm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="input-field text-sm"
                            value={point.minSize}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'minSize', e.target.value)}
                            placeholder="22.1"
                          />
                        </div>
                      </div>
                      
                      {/* Campos de Mortalidad y Densidad para puntos adicionales */}
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Ejemplares Totales
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input-field text-sm"
                            value={point.totalSpecimens}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'totalSpecimens', e.target.value)}
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Densidad promedio (ind/piso)
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="input-field text-sm"
                            value={point.aliveSpecimens}
                            onChange={(e) => updateAdditionalMeasurementPoint(index, 'aliveSpecimens', e.target.value)}
                            placeholder="95"
                          />
                        </div>
                      </div>
                      
                      {/* Mostrar tasa de mortalidad calculada para puntos adicionales */}
                      {point.totalSpecimens && point.aliveSpecimens && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-center">
                          <span className="text-xs text-gray-600">
                            Mortalidad del punto: {' '}
                            <span className="font-medium text-blue-800">
                              {(((parseFloat(point.totalSpecimens) - parseFloat(point.aliveSpecimens)) / parseFloat(point.totalSpecimens)) * 100).toFixed(2)}%
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPointsForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : 'Agregar Puntos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeedingMonitoringPage