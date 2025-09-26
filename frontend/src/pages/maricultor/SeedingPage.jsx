import React, { useEffect, useState } from 'react'
import { useAuthStore, useSectorStore, useSeedOriginStore, useInventoryStore, useSeedingStore } from '../../stores'
// import { mockAPI } from '../../services/mock/server' // DESACTIVADO - Migrado a JSON Server
import EmptyState from '../../components/common/EmptyState'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SystemSelector from '../../components/seeding/SystemSelector'
import { getAllConversionsFromConchitas } from '../../constants/conversions'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const SeedingPage = () => {
  const { user } = useAuthStore()
  const {
    sectors,
    batteries,
    cultivationLines,
    fetchSectors,
    fetchBatteries,
    fetchCultivationLines,
    loading
  } = useSectorStore()
  const { seedOrigins, fetchSeedOrigins } = useSeedOriginStore()
  const { inventory, fetchInventory } = useInventoryStore()
  const {
    lots,
    fetchLots,
    createLot,
    updateLot,
    loading: lotsLoading
  } = useSeedingStore()
  const [showSeedingForm, setShowSeedingForm] = useState(false)
  const [showBatterySelector, setShowBatterySelector] = useState(false)
  const [selectedSector, setSelectedSector] = useState(null)
  const [selectedBattery, setSelectedBattery] = useState(null)
  const [editingSeeding, setEditingSeeding] = useState(null)
  const [selectedLines, setSelectedLines] = useState([])
  const [seedingForm, setSeedingForm] = useState({
    origin: '',
    initialQuantity: '',
    initialBundles: '',
    expectedMonthlyMortality: '',
    cost: '',
    customPricePerUnit: '',
    priceType: 'unit', // 'unit' o 'bundle'
    entryDate: new Date().toISOString().split('T')[0],
    projectedHarvestDate: '',
    cultivationSystem: 'Cultivo suspendido',
    lineName: '',
    multipleLines: [],
    averageSize: '',
    minSize: '',
    maxSize: '',
    theoreticalDensity: '',
    actualDensity: '',
    nextThiningDate: '',
    inventoryItems: [] // Nuevo campo para los ítems del inventario
  })
  const [filters, setFilters] = useState({
    sector: '',
    startDate: '',
    endDate: '',
    projectedHarvestStartDate: '',
    projectedHarvestEndDate: ''
  })
  const [sorting, setSorting] = useState({
    field: 'entryDate',
    direction: 'desc'
  })
  const [showProjectionModal, setShowProjectionModal] = useState(false)
  const [selectedSeeding, setSelectedSeeding] = useState(null)
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false)
  const [selectedSeedingForInvestor, setSelectedSeedingForInvestor] = useState(null)
  const [createdSeeding, setCreatedSeeding] = useState(null)
  const [availableInvestors, setAvailableInvestors] = useState([])
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  const [selectedLine, setSelectedLine] = useState(null)
  const [selectedSystems, setSelectedSystems] = useState([])
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState('')
  
  useEffect(() => {
    if (user?.id) {
      fetchSectors(user.id)
      fetchInventory(user.id)
    }
    fetchSeedOrigins()
  }, [user?.id, fetchSectors, fetchSeedOrigins, fetchInventory])

  // Cargar todas las baterías y líneas cuando se cargan los sectores
  useEffect(() => {
    const loadAllBatteriesAndLines = async () => {
      if (sectors && sectors.length > 0) {
        // Cargar baterías de todos los sectores
        for (const sector of sectors) {
          await fetchBatteries(sector.id)
        }

        // Cargar líneas de todos los sectores (esto cargará las líneas de todas las baterías)
        for (const sector of sectors) {
          await fetchCultivationLines(sector.id)
        }
      }
    }

    loadAllBatteriesAndLines()
  }, [sectors, fetchBatteries, fetchCultivationLines])
  
  // Cargar baterías cuando se selecciona un sector
  useEffect(() => {
    if (selectedSector?.id) {
      fetchBatteries(selectedSector.id)
      // Limpiar batería seleccionada al cambiar sector
      setSelectedBattery(null)
    }
  }, [selectedSector?.id, fetchBatteries])

  // Cargar líneas cuando se selecciona una batería
  useEffect(() => {
    if (selectedBattery?.id && selectedSector?.id) {
      fetchCultivationLines(selectedSector.id, selectedBattery.id)
    }
  }, [selectedBattery?.id, selectedSector?.id, fetchCultivationLines])

  // Seleccionar batería automáticamente durante edición
  useEffect(() => {
    if (editingSeeding && editingSeeding.batteryId && batteries.length > 0 && !selectedBattery) {
      const battery = batteries.find(b => b.id === editingSeeding.batteryId)
      if (battery) {
        setSelectedBattery(battery)
      }
    }
  }, [editingSeeding, batteries, selectedBattery])

  // Cargar inversores cuando se abre el modal
  useEffect(() => {
    if (showAddInvestorModal && user?.id) {
      // Obtener inversores del localStorage
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]')
      const investors = users.filter(u => 
        u.role === 'investor' && u.maricultorId === user.id
      )
      setAvailableInvestors(investors)
    }
  }, [showAddInvestorModal, user?.id])

  // Autocompletar mortalidad cuando se selecciona origen
  useEffect(() => {
    if (seedingForm.origin) {
      const selectedOrigin = seedOrigins.find(origin => origin.name === seedingForm.origin)
      if (selectedOrigin && selectedOrigin.monthlyMortalityRate && typeof selectedOrigin.monthlyMortalityRate === 'number') {
        setSeedingForm(prev => ({
          ...prev,
          expectedMonthlyMortality: selectedOrigin.monthlyMortalityRate.toString()
        }))
      }
    }
  }, [seedingForm.origin, seedOrigins])

  // Calcular costo automáticamente basado en origen y cantidad
  useEffect(() => {
    if (seedingForm.origin) {
      const selectedOrigin = seedOrigins.find(origin => origin.name === seedingForm.origin)
      if (selectedOrigin) {
        // Usar precio personalizado si existe, sino usar el precio del origen
        let basePrice = seedingForm.customPricePerUnit 
          ? parseFloat(seedingForm.customPricePerUnit)
          : (selectedOrigin.pricePerUnit || 0)
        
        // Si el precio es por manojo, convertir a precio por unidad
        const pricePerUnit = seedingForm.priceType === 'bundle' 
          ? basePrice / 96  // 1 manojo = 96 conchas
          : basePrice
        
        if (seedingForm.initialQuantity) {
          const quantity = parseFloat(seedingForm.initialQuantity)
          if (!isNaN(quantity) && quantity > 0 && !isNaN(pricePerUnit)) {
            const calculatedCost = quantity * pricePerUnit
            setSeedingForm(prev => ({
              ...prev,
              cost: calculatedCost.toFixed(2)
            }))
          }
        } else {
          // Si no hay cantidad, mostrar el precio como referencia
          setSeedingForm(prev => ({
            ...prev,
            cost: basePrice.toFixed(2)
          }))
        }
      }
    } else {
      // Si no hay origen seleccionado, limpiar el costo
      setSeedingForm(prev => ({
        ...prev,
        cost: '',
        customPricePerUnit: ''
      }))
    }
  }, [seedingForm.origin, seedingForm.initialQuantity, seedingForm.customPricePerUnit, seedingForm.priceType, seedOrigins])

  
  const handleCreateSeeding = async (e) => {
    e.preventDefault()

    // Validar que la densidad según muestreo sea obligatoria
    if (!seedingForm.actualDensity || seedingForm.actualDensity === '') {
      MySwal.fire({
        icon: 'error',
        title: 'Campo obligatorio',
        text: 'La densidad según muestreo es obligatoria. Por favor, complete este campo.',
        confirmButtonColor: '#f59e0b'
      })
      return
    }


    // Calcular boyas desde los ítems del inventario
    const buoysFromInventory = seedingForm.inventoryItems
      .filter(item => {
        const inventoryItem = inventory.find(invItem => invItem.id === item.id)
        return inventoryItem && inventoryItem.name && (
          inventoryItem.name.toLowerCase().includes('boya') ||
          inventoryItem.name.toLowerCase().includes('buoy')
        )
      })
      .reduce((total, item) => total + (item.quantity || 0), 0)

    const seedingData = {
      ...seedingForm,
      sectorId: selectedSector.id,
      batteryId: selectedBattery?.id || null,
      initialQuantity: parseInt(seedingForm.initialQuantity),
      expectedMonthlyMortality: parseFloat(seedingForm.expectedMonthlyMortality),
      cost: parseFloat(seedingForm.cost),
      buoysUsed: buoysFromInventory,
      multipleLines: seedingForm.cultivationSystem === 'Cultivo suspendido' ? selectedLines : [],
      inventoryItems: seedingForm.inventoryItems
    }
    
    let result
    if (editingSeeding) {
      result = await updateLot(editingSeeding.id, selectedSector.id, seedingData)
    } else {
      result = await createLot(seedingData)
    }
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: editingSeeding ? 'Siembra actualizada' : 'Siembra creada',
        text: editingSeeding ? 'La siembra se actualizó exitosamente.' : 'La siembra se registró exitosamente.',
        confirmButtonColor: '#3b82f6'
      })
      resetSeedingForm()
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }
  
  // Funciones para manejar ítems del inventario
  const handleAddInventoryItem = () => {
    if (!selectedInventoryItem || !inventoryQuantity || inventoryQuantity <= 0) return

    const item = inventory.find(i => i.id === selectedInventoryItem)
    if (!item) return

    const existingIndex = seedingForm.inventoryItems.findIndex(i => i.id === selectedInventoryItem)

    if (existingIndex >= 0) {
      // Actualizar cantidad si el item ya existe
      const updatedItems = [...seedingForm.inventoryItems]
      updatedItems[existingIndex].quantity = parseFloat(inventoryQuantity)
      setSeedingForm(prev => ({
        ...prev,
        inventoryItems: updatedItems
      }))
    } else {
      // Agregar nuevo item
      setSeedingForm(prev => ({
        ...prev,
        inventoryItems: [
          ...prev.inventoryItems,
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
    setSeedingForm(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.filter(item => item.id !== itemId)
    }))
  }

  const handleUpdateInventoryQuantity = (itemId, newQuantity) => {
    const updatedItems = seedingForm.inventoryItems.map(item =>
      item.id === itemId ? { ...item, quantity: parseFloat(newQuantity) || 0 } : item
    )
    setSeedingForm(prev => ({
      ...prev,
      inventoryItems: updatedItems
    }))
  }

  const resetSeedingForm = () => {
    setSeedingForm({
      origin: '',
      initialQuantity: '',
      initialBundles: '',
      expectedMonthlyMortality: '',
      cost: '',
      customPricePerUnit: '',
      priceType: 'unit',
      entryDate: new Date().toISOString().split('T')[0],
      projectedHarvestDate: '',
      cultivationSystem: 'Cultivo suspendido',
      lineName: '',
      lineId: '',
      systems: [],
      averageSize: '',
      minSize: '',
      maxSize: '',
      theoreticalDensity: '',
      actualDensity: '',
      nextThiningDate: '',
      inventoryItems: []
    })
    setShowSeedingForm(false)
    setSelectedSector(null)
    setSelectedBattery(null)
    setEditingSeeding(null)
    setSelectedLines([])
    setSelectedInventoryItem('')
    setInventoryQuantity('')
  }
  
  
  const handleStartSeeding = (sector) => {
    setSelectedSector(sector)
    setShowBatterySelector(true)
    // Limpiar estados previos
    setSelectedBattery(null)
    setEditingSeeding(null)
    setSelectedLines([])
    setSelectedLine(null)
    setSelectedSystems([])
  }

  const handleBatterySelected = (battery) => {
    setSelectedBattery(battery)
    setShowBatterySelector(false)

    // Limpiar el formulario para nueva siembra
    setSeedingForm({
      origin: '',
      initialQuantity: '',
      initialBundles: '',
      expectedMonthlyMortality: '',
      cost: '',
      customPricePerUnit: '',
      priceType: 'unit',
      entryDate: new Date().toISOString().split('T')[0],
      projectedHarvestDate: '',
      cultivationSystem: 'Cultivo suspendido',
      lineName: '',
      lineId: '',
      systems: [],
      averageSize: '',
      minSize: '',
      maxSize: '',
      theoreticalDensity: '',
      actualDensity: '',
      nextThiningDate: '',
      inventoryItems: []
    })

    setShowSeedingForm(true)
  }
  
  const handleEditSeeding = async (seeding) => {
    const sector = sectors.find(s => s.id === seeding.sectorId ||
      s.lots?.some(l => l.id === seeding.id))

    if (sector) {
      setSelectedSector(sector)

      // Si tiene batteryId, cargar las baterías
      if (seeding.batteryId) {
        await fetchBatteries(sector.id)
      }

      setEditingSeeding(seeding)
      const bundles = seeding.initialQuantity ? Math.floor(seeding.initialQuantity / 96) : ''
      setSeedingForm({
        origin: seeding.origin || '',
        initialQuantity: seeding.initialQuantity?.toString() || '',
        initialBundles: bundles.toString(),
        expectedMonthlyMortality: seeding.expectedMonthlyMortality?.toString() || '',
        cost: seeding.cost?.toString() || '',
        customPricePerUnit: seeding.customPricePerUnit?.toString() || '',
        priceType: seeding.priceType || 'unit',
        entryDate: seeding.entryDate || new Date().toISOString().split('T')[0],
        projectedHarvestDate: seeding.projectedHarvestDate || '',
        cultivationSystem: seeding.cultivationSystem || 'Cultivo suspendido',
        lineName: seeding.lineName || '',
        lineId: seeding.lineId || '',
        systems: seeding.systems || [],
        averageSize: seeding.averageSize?.toString() || '',
        minSize: seeding.minSize?.toString() || '',
        maxSize: seeding.maxSize?.toString() || '',
        theoreticalDensity: seeding.theoreticalDensity?.toString() || '',
        actualDensity: seeding.actualDensity?.toString() || '',
        nextThiningDate: seeding.nextThiningDate || '',
        inventoryItems: seeding.inventoryItems || []
      })

      // Restaurar las líneas seleccionadas si existen
      if (seeding.multipleLines && seeding.multipleLines.length > 0) {
        setSelectedLines(seeding.multipleLines.map(line => ({
          id: line.id || Date.now().toString() + Math.random(),
          lineId: line.lineId || '',
          lineName: line.lineName || '',
          systems: line.systems || []
        })))
      } else {
        // Si no hay múltiples líneas pero hay datos de línea individual
        if (seeding.lineName || seeding.lineId || (seeding.systems && seeding.systems.length > 0)) {
          setSelectedLines([{
            id: Date.now().toString(),
            lineId: seeding.lineId || '',
            lineName: seeding.lineName || '',
            systems: seeding.systems || []
          }])
        } else {
          setSelectedLines([])
        }
      }

      setShowSeedingForm(true)
    }
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
      ready: 'bg-yellow-100 text-yellow-800',
      harvested: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.seeded
  }
  
  const getStatusText = (status) => {
    const texts = {
      seeded: 'Sembrado',
      growing: 'Crecimiento',
      ready: 'Listo',
      harvested: 'Cosechado'
    }
    return texts[status] || status
  }

  // Calculate time elapsed since seeding
  const calculateTimeElapsed = (entryDate) => {
    const seedingDate = new Date(entryDate)
    const today = new Date()
    const diffTime = today - seedingDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30.44) // Average days per month
    
    if (diffDays < 30) {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`
    } else {
      const remainingDays = Math.floor(diffDays % 30.44)
      if (remainingDays === 0) {
        return `${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`
      } else {
        return `${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}, ${remainingDays} día${remainingDays !== 1 ? 's' : ''}`
      }
    }
  }

  // Calculate days remaining until projected harvest
  const calculateDaysToHarvest = (projectedHarvestDate) => {
    if (!projectedHarvestDate) return null
    
    const harvestDate = new Date(projectedHarvestDate)
    const today = new Date()
    const diffTime = harvestDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''} vencida`
    } else if (diffDays === 0) {
      return 'Hoy'
    } else {
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`
    }
  }

  // Calculate monthly projections for a seeding
  const calculateMonthlyProjections = (seeding) => {
    const projections = []
    const startDate = new Date(seeding.entryDate)
    const today = new Date()
    
    // Buscar los parámetros del origen de semilla configurado
    const seedOrigin = seedOrigins.find(origin => origin.name === seeding.origin)
    
    // Usar parámetros del origen configurado o valores por defecto
    const averageMonthlyGrowth = seedOrigin?.monthlyGrowthRate || 3.5
    const monthlyMortality = seedOrigin?.monthlyMortalityRate || parseFloat(seeding.expectedMonthlyMortality) || 5
    const initialSize = parseFloat(seeding.averageSize) || 12 // Talla inicial promedio
    
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
      const expectedSize = initialSize + (month * averageMonthlyGrowth)
      
      // Calcular mortalidad acumulada usando interés compuesto
      // Fórmula: Población final = Población inicial × (1 - tasa_mortalidad)^meses
      const mortalityRate = monthlyMortality / 100 // Convertir porcentaje a decimal
      const survivalRate = Math.pow(1 - mortalityRate, month)
      const survivingQuantity = Math.floor(seeding.initialQuantity * survivalRate)
      
      // Mortalidad acumulada = ejemplares perdidos / ejemplares iniciales * 100
      const lostQuantity = seeding.initialQuantity - survivingQuantity
      const cumulativeMortality = parseFloat((lostQuantity / seeding.initialQuantity * 100).toFixed(1))
      
      // Estado basado en tiempo transcurrido y talla
      let status = 'seeded'
      if (month >= 1) status = 'growing'
      if (month >= 4 && expectedSize >= 45) status = 'ready'
      if (month >= 12 && expectedSize >= 60) status = 'mature'
      
      projections.push({
        month,
        date: projectionDate,
        expectedSize: parseFloat(expectedSize.toFixed(1)),
        survivingQuantity,
        cumulativeMortality: cumulativeMortality,
        monthlyMortality: month === 0 ? 0 : monthlyMortality,
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

  const handleViewProjection = (seeding) => {
    setSelectedSeeding(seeding)
    setShowProjectionModal(true)
  }

  const handleAddInvestor = (seeding) => {
    setSelectedSeedingForInvestor(seeding)
    setSelectedInvestor(null) // Limpiar selección previa
    setShowAddInvestorModal(true)
  }

  const handleSaveInvestor = async (investorData) => {
    try {
      // Guardar la relación siembra-inversor en localStorage
      const seedingInvestors = JSON.parse(localStorage.getItem('seeding_investors') || '[]')
      
      const newRelation = {
        id: Date.now().toString(),
        seedingId: selectedSeedingForInvestor.id,
        sectorName: selectedSeedingForInvestor.sectorName,
        investorEmail: investorData.email,
        investorName: investorData.name,
        investmentAmount: investorData.amount,
        investmentPercentage: investorData.percentage,
        createdAt: new Date().toISOString()
      }
      
      seedingInvestors.push(newRelation)
      localStorage.setItem('seeding_investors', JSON.stringify(seedingInvestors))
      
      MySwal.fire({
        icon: 'success',
        title: 'Inversor agregado',
        text: `${investorData.name} ha sido agregado a la siembra exitosamente.`,
        confirmButtonColor: '#3b82f6'
      })
      
      setShowAddInvestorModal(false)
      setSelectedSeedingForInvestor(null)
      setSelectedInvestor(null)
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el inversor. Intente nuevamente.',
        confirmButtonColor: '#ef4444'
      })
    }
  }
  
  // Get all seedings (lots) from all sectors
  const allSeedings = sectors.flatMap(sector => 
    (sector.lots || []).map(lot => ({
      ...lot,
      sectorName: sector.name,
      sectorLocation: sector.location
    }))
  )

  // Filter seedings based on current filters
  const filteredSeedings = allSeedings.filter(seeding => {
    // Filter by sector
    if (filters.sector && seeding.sectorName !== filters.sector) {
      return false
    }
    
    // Filter by start date range
    if (filters.startDate && seeding.entryDate < filters.startDate) {
      return false
    }
    if (filters.endDate && seeding.entryDate > filters.endDate) {
      return false
    }
    
    // Filter by projected harvest date range
    if (filters.projectedHarvestStartDate && seeding.projectedHarvestDate && 
        seeding.projectedHarvestDate < filters.projectedHarvestStartDate) {
      return false
    }
    if (filters.projectedHarvestEndDate && seeding.projectedHarvestDate && 
        seeding.projectedHarvestDate > filters.projectedHarvestEndDate) {
      return false
    }
    
    return true
  })

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      sector: '',
      startDate: '',
      endDate: '',
      projectedHarvestStartDate: '',
      projectedHarvestEndDate: ''
    })
  }

  // Handle sorting
  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Sort seedings function
  const sortSeedings = (seedings) => {
    return [...seedings].sort((a, b) => {
      const { field, direction } = sorting
      let aValue, bValue

      switch (field) {
        case 'sector':
          aValue = a.sectorName
          bValue = b.sectorName
          break
        case 'entryDate':
          aValue = new Date(a.entryDate)
          bValue = new Date(b.entryDate)
          break
        case 'origin':
          aValue = a.origin
          bValue = b.origin
          break
        case 'cultivationSystem':
          aValue = a.cultivationSystem || 'Cultivo suspendido'
          bValue = b.cultivationSystem || 'Cultivo suspendido'
          break
        case 'currentQuantity':
          aValue = a.currentQuantity || a.initialQuantity
          bValue = b.currentQuantity || b.initialQuantity
          break
        case 'expectedMonthlyMortality':
          aValue = a.expectedMonthlyMortality
          bValue = b.expectedMonthlyMortality
          break
        case 'cost':
          aValue = a.cost
          bValue = b.cost
          break
        case 'timeElapsed':
          aValue = new Date() - new Date(a.entryDate)
          bValue = new Date() - new Date(b.entryDate)
          break
        case 'daysToHarvest':
          if (!a.projectedHarvestDate && !b.projectedHarvestDate) return 0
          if (!a.projectedHarvestDate) return direction === 'asc' ? 1 : -1
          if (!b.projectedHarvestDate) return direction === 'asc' ? -1 : 1
          aValue = new Date(a.projectedHarvestDate)
          bValue = new Date(b.projectedHarvestDate)
          break
        case 'projectedHarvestDate':
          if (!a.projectedHarvestDate && !b.projectedHarvestDate) return 0
          if (!a.projectedHarvestDate) return direction === 'asc' ? 1 : -1
          if (!b.projectedHarvestDate) return direction === 'asc' ? -1 : 1
          aValue = new Date(a.projectedHarvestDate)
          bValue = new Date(b.projectedHarvestDate)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
  }

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sorting.field !== field) {
      return (
        <span className="ml-1 text-gray-400">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </span>
      )
    }
    
    return (
      <span className="ml-1 text-blue-600">
        {sorting.direction === 'asc' ? (
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </span>
    )
  }
  
  if (loading && sectors.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando datos..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Siembras</h1>
          <p className="text-gray-600 mt-1">
            Administra todas tus siembras de conchas de abanico por sector
          </p>
        </div>
        {sectors.length > 0 && (
          <div className="dropdown relative">
            <button 
              className="btn-primary dropdown-toggle"
              onClick={() => document.getElementById('sector-dropdown').classList.toggle('hidden')}
            >
              Nueva Siembra
            </button>
            <div id="sector-dropdown" className="hidden absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border z-10">
              <div className="p-2">
                <div className="text-sm font-medium text-gray-700 px-3 py-2">Seleccionar Sector:</div>
                {sectors.map(sector => (
                  <button
                    key={sector.id}
                    onClick={() => {
                      handleStartSeeding(sector)
                      document.getElementById('sector-dropdown').classList.add('hidden')
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                  >
                    <div className="font-medium">{sector.name}</div>
                    <div className="text-xs text-gray-500">{sector.location || 'Sin ubicación'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {sectors.length === 0 ? (
        <EmptyState
          title="No hay sectores disponibles"
          message="Necesitas crear sectores antes de poder realizar siembras. Ve a la sección de Sectores para crear tu primer sector."
          icon="🏭"
          action={
            <button className="btn-primary" disabled>
              Crear sectores primero
            </button>
          }
        />
      ) : allSeedings.length === 0 ? (
        <EmptyState
          title="No hay siembras registradas"
          message="Comienza registrando tu primera siembra en cualquiera de tus sectores disponibles."
          icon="🌱"
          action={
            <button
              onClick={() => {
                if (sectors.length === 1) {
                  handleStartSeeding(sectors[0])
                } else {
                  document.getElementById('sector-dropdown').classList.toggle('hidden')
                }
              }}
              className="btn-primary"
            >
              Crear Primera Siembra
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Filters Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
              {/* Sector Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector
                </label>
                <select
                  value={filters.sector}
                  onChange={(e) => setFilters({...filters, sector: e.target.value})}
                  className="input-field"
                >
                  <option value="">Todos los sectores</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.name}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Start Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha siembra desde
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha siembra hasta
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                  className="input-field"
                />
              </div>
              
              {/* Projected Harvest Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cosecha proyectada desde
                </label>
                <input
                  type="date"
                  value={filters.projectedHarvestStartDate}
                  onChange={(e) => setFilters({...filters, projectedHarvestStartDate: e.target.value})}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cosecha proyectada hasta
                </label>
                <input
                  type="date"
                  value={filters.projectedHarvestEndDate}
                  onChange={(e) => setFilters({...filters, projectedHarvestEndDate: e.target.value})}
                  className="input-field"
                />
              </div>
            </div>
            
            {/* Results Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {filteredSeedings.length} de {allSeedings.length} siembras
            </div>
          </div>
          
          {filteredSeedings.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No se encontraron siembras"
                message="No hay siembras que coincidan con los filtros seleccionados. Intenta ajustar los filtros o limpiarlos para ver más resultados."
                icon="🔍"
                action={
                  <button onClick={clearFilters} className="btn-secondary">
                    Limpiar filtros
                  </button>
                }
              />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('sector')}
                    >
                      <div className="flex items-center">
                        Sector
                        <SortIcon field="sector" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('entryDate')}
                    >
                      <div className="flex items-center">
                        Fecha Siembra
                        <SortIcon field="entryDate" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('origin')}
                    >
                      <div className="flex items-center">
                        Origen
                        <SortIcon field="origin" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('cultivationSystem')}
                    >
                      <div className="flex items-center">
                        Sistema de Cultivo
                        <SortIcon field="cultivationSystem" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batería-Línea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° de boyas
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('minSize')}
                    >
                      <div className="flex items-center">
                        Talla Mínima
                        <SortIcon field="minSize" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('maxSize')}
                    >
                      <div className="flex items-center">
                        Talla Máxima
                        <SortIcon field="maxSize" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('averageSize')}
                    >
                      <div className="flex items-center">
                        Talla Promedio
                        <SortIcon field="averageSize" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Densidad Teórica
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Densidad Real
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('currentQuantity')}
                    >
                      <div className="flex items-center">
                        Cantidad Actual
                        <SortIcon field="currentQuantity" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('expectedMonthlyMortality')}
                    >
                      <div className="flex items-center">
                        Mortalidad Esperada
                        <SortIcon field="expectedMonthlyMortality" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('cost')}
                    >
                      <div className="flex items-center">
                        Inversión
                        <SortIcon field="cost" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('timeElapsed')}
                    >
                      <div className="flex items-center">
                        Tiempo Transcurrido
                        <SortIcon field="timeElapsed" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('daysToHarvest')}
                    >
                      <div className="flex items-center">
                        Días para Cosecha
                        <SortIcon field="daysToHarvest" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('projectedHarvestDate')}
                    >
                      <div className="flex items-center">
                        Cosecha Proyectada
                        <SortIcon field="projectedHarvestDate" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Estado
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortSeedings(filteredSeedings).map((seeding) => (
                    <tr key={seeding.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{seeding.sectorName}</div>
                          <div className="text-xs text-gray-500">{seeding.sectorLocation || 'Sin ubicación'}</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(seeding.entryDate).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seeding.origin}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          seeding.cultivationSystem === 'Cultivo suspendido' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {seeding.cultivationSystem || 'Cultivo suspendido'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          // Función para obtener la batería por ID
                          const getBatteryLetter = (batteryId) => {
                            const battery = batteries.find(b => b.id === batteryId)
                            return battery?.letter || '?'
                          }

                          // Función para obtener línea por ID
                          const getLineInfo = (lineId) => {
                            const line = cultivationLines.find(l => l.id === lineId)
                            return line || null
                          }

                          // Función para formatear sistemas (devuelve objeto con texto y JSX)
                          const formatSystems = (systems) => {
                            if (!systems || systems.length === 0) return null

                            const systemNumbers = systems.map(s => s.systemNumber).sort((a, b) => a - b)
                            let systemText = ''

                            if (systemNumbers.length === 1) {
                              systemText = `Sistema ${systemNumbers[0]}`
                            } else {
                              // Detectar si es un rango continuo
                              let isRange = true
                              for (let i = 1; i < systemNumbers.length; i++) {
                                if (systemNumbers[i] !== systemNumbers[i-1] + 1) {
                                  isRange = false
                                  break
                                }
                              }

                              if (isRange && systemNumbers.length > 2) {
                                systemText = `Sistemas ${systemNumbers[0]}-${systemNumbers[systemNumbers.length - 1]}`
                              } else {
                                systemText = `Sistemas ${systemNumbers.join(', ')}`
                              }
                            }

                            return systemText
                          }

                          // Mostrar múltiples líneas si existen
                          if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                            const lineElements = seeding.multipleLines.map((l, idx) => {
                              const line = getLineInfo(l.lineId)
                              if (line && seeding.batteryId) {
                                const batteryLetter = getBatteryLetter(seeding.batteryId)
                                const systemsText = formatSystems(l.systems)
                                const batteryLineName = `${batteryLetter}-${line.lineNumber}`

                                return (
                                  <div key={idx} className="mb-1 last:mb-0">
                                    <div className="font-medium">{batteryLineName}</div>
                                    {systemsText && (
                                      <div className="text-xs text-gray-500">{systemsText}</div>
                                    )}
                                  </div>
                                )
                              }
                              return (
                                <div key={idx} className="mb-1 last:mb-0">
                                  <div className="font-medium">{l.lineName || 'Sin especificar'}</div>
                                </div>
                              )
                            })

                            if (seeding.multipleLines.length === 1) {
                              return lineElements[0]
                            } else {
                              return (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    {seeding.multipleLines.length} líneas:
                                  </div>
                                  {lineElements}
                                </div>
                              )
                            }
                          }

                          // Mostrar línea individual si existe batteryId y lineId
                          if (seeding.batteryId && seeding.lineId) {
                            const batteryLetter = getBatteryLetter(seeding.batteryId)
                            const line = getLineInfo(seeding.lineId)
                            if (line) {
                              const systemsText = formatSystems(seeding.systems || [])
                              const batteryLineName = `${batteryLetter}-${line.lineNumber}`

                              return (
                                <div>
                                  <div className="font-medium">{batteryLineName}</div>
                                  {systemsText && (
                                    <div className="text-xs text-gray-500">{systemsText}</div>
                                  )}
                                </div>
                              )
                            }
                          }

                          // Mostrar línea individual si existe solo lineName
                          if (seeding.lineName) {
                            return (
                              <div>
                                <div className="font-medium">{seeding.lineName}</div>
                              </div>
                            )
                          }

                          // Sin líneas especificadas
                          return (
                            <div>
                              <div className="font-medium text-gray-400">Sin especificar</div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(() => {
                          // Mostrar el número real de boyas asignadas del inventario
                          const buoysUsed = seeding.buoysUsed || 0

                          // Si no hay boyas asignadas, mostrar cálculo estimado como referencia
                          if (buoysUsed === 0) {
                            let estimatedBuoys = 0

                            // Si tiene múltiples líneas, sumar sistemas de todas las líneas
                            if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                              seeding.multipleLines.forEach(line => {
                                if (line.systems && line.systems.length > 0) {
                                  estimatedBuoys += line.systems.length * 2 // 2 boyas por sistema
                                }
                              })
                            }

                            // Si tiene sistemas a nivel de lote
                            if (seeding.systems && seeding.systems.length > 0) {
                              estimatedBuoys = Math.max(estimatedBuoys, seeding.systems.length * 2)
                            }

                            // Si no hay datos de sistemas, estimación basada en cantidad
                            if (estimatedBuoys === 0) {
                              const estimatedSystems = Math.ceil((seeding.currentQuantity || 0) / 10000)
                              estimatedBuoys = Math.max(1, estimatedSystems) * 2
                            }

                            return (
                              <div className="text-gray-400 italic">
                                ~{estimatedBuoys.toLocaleString()}
                                <div className="text-xs text-gray-300">
                                  estimado
                                </div>
                              </div>
                            )
                          }

                          // Mostrar boyas reales asignadas del inventario
                          return (
                            <div className="font-medium text-blue-600">
                              {buoysUsed.toLocaleString()}
                              <div className="text-xs text-green-600">
                                del inventario
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          {seeding.minSize ? (
                            <div>
                              <span className="font-medium">{seeding.minSize}</span>
                              <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          {seeding.maxSize ? (
                            <div>
                              <span className="font-medium">{seeding.maxSize}</span>
                              <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          {seeding.averageSize ? (
                            <div>
                              <span className="font-medium">{seeding.averageSize}</span>
                              <span className="text-xs text-gray-500 ml-1">mm</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          {(() => {
                            // Calcular densidad teórica basada en la cantidad inicial y sistemas
                            const initialQuantity = seeding.initialQuantity || 0;
                            let totalFloors = 0;

                            // Contar pisos de múltiples líneas
                            if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                              seeding.multipleLines.forEach(line => {
                                if (line.systems && line.systems.length > 0) {
                                  line.systems.forEach(system => {
                                    totalFloors += (system.floors && system.floors.length) || 0;
                                  });
                                }
                              });
                            }

                            // Contar pisos de sistema individual
                            if (seeding.systems && seeding.systems.length > 0) {
                              seeding.systems.forEach(system => {
                                totalFloors += (system.floors && system.floors.length) || 0;
                              });
                            }

                            if (totalFloors > 0) {
                              const theoricalDensity = Math.round(initialQuantity / totalFloors);
                              return (
                                <div>
                                  <span className="font-medium text-blue-600">{theoricalDensity.toLocaleString()}</span>
                                  <div className="text-xs text-gray-500">conchas/piso</div>
                                </div>
                              );
                            }

                            return <span className="text-gray-400">-</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-center">
                          {(() => {
                            // Calcular densidad real basada en la cantidad actual y sistemas
                            const currentQuantity = seeding.currentQuantity || 0;
                            let totalFloors = 0;

                            // Contar pisos de múltiples líneas
                            if (seeding.multipleLines && seeding.multipleLines.length > 0) {
                              seeding.multipleLines.forEach(line => {
                                if (line.systems && line.systems.length > 0) {
                                  line.systems.forEach(system => {
                                    totalFloors += (system.floors && system.floors.length) || 0;
                                  });
                                }
                              });
                            }

                            // Contar pisos de sistema individual
                            if (seeding.systems && seeding.systems.length > 0) {
                              seeding.systems.forEach(system => {
                                totalFloors += (system.floors && system.floors.length) || 0;
                              });
                            }

                            if (totalFloors > 0) {
                              const realDensity = Math.round(currentQuantity / totalFloors);
                              return (
                                <div>
                                  <span className="font-medium text-green-600">{realDensity.toLocaleString()}</span>
                                  <div className="text-xs text-gray-500">conchas/piso</div>
                                </div>
                              );
                            }

                            return <span className="text-gray-400">-</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const currentQuantity = seeding.currentQuantity || 0
                          const initialQuantity = seeding.initialQuantity || 0
                          const currentConversions = getAllConversionsFromConchitas(currentQuantity)
                          const initialConversions = getAllConversionsFromConchitas(initialQuantity)
                          
                          return (
                            <div>
                              <div className="font-medium">
                                {currentConversions.manojos.toLocaleString()} manojos
                              </div>
                              <div className="text-xs text-gray-500">
                                {currentConversions.mallas} mallas • {currentConversions.conchitas.toLocaleString()} conchas
                              </div>
                              <div className="text-xs text-gray-400">
                                Inicial: {initialConversions.manojos.toLocaleString()} manojos • {initialConversions.mallas} mallas
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seeding.expectedMonthlyMortality}% mensual
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(seeding.cost)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          {calculateTimeElapsed(seeding.entryDate)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className={seeding.projectedHarvestDate ? '' : 'text-gray-400'}>
                          {seeding.projectedHarvestDate 
                            ? calculateDaysToHarvest(seeding.projectedHarvestDate)
                            : 'No especificada'
                          }
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {seeding.projectedHarvestDate 
                          ? new Date(seeding.projectedHarvestDate).toLocaleDateString('es-PE')
                          : 'No especificada'
                        }
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(seeding.status)}`}>
                          {getStatusText(seeding.status)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:gap-2">
                          <button
                            onClick={() => handleViewProjection(seeding)}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-full sm:w-auto justify-center"
                          >
                            📈 Ver Proyección
                          </button>
                          <button
                            onClick={() => handleEditSeeding(seeding)}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 w-full sm:w-auto justify-center"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleAddInvestor(seeding)}
                            className="inline-flex items-center px-2 sm:px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 w-full sm:w-auto justify-center"
                          >
                            👥 Agregar Inversor
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {showSeedingForm && selectedSector && (selectedBattery || editingSeeding) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingSeeding ? 'Editar Siembra' : 'Nueva Siembra'} - {selectedSector.name} {selectedBattery ? `- Batería ${selectedBattery.letter}` : ''}
            </h2>
            <form onSubmit={handleCreateSeeding} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Siembra *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={seedingForm.entryDate}
                  onChange={(e) => setSeedingForm({...seedingForm, entryDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen de la Semilla *
                </label>
                <select
                  required
                  className="input-field"
                  value={seedingForm.origin}
                  onChange={(e) => setSeedingForm({...seedingForm, origin: e.target.value})}
                >
                  <option value="">Seleccionar origen...</option>
                  {seedOrigins
                    .filter(origin => origin.isActive)
                    .map(origin => (
                      <option key={origin.id} value={origin.name}>
                        {origin.name} - {origin.monthlyGrowthRate}mm/mes, {origin.monthlyMortalityRate}% mort., S/ {(origin.pricePerUnit && typeof origin.pricePerUnit === 'number') ? origin.pricePerUnit.toFixed(2) : '0.00'}/und
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los parámetros de crecimiento y mortalidad se tomarán de la configuración del origen seleccionado
                </p>
                {seedingForm.origin && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Parámetros del Origen Seleccionado</h4>
                    {(() => {
                      const selectedOrigin = seedOrigins.find(origin => origin.name === seedingForm.origin)
                      if (!selectedOrigin) return null
                      
                      return (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 text-xs">
                          <div>
                            <span className="text-blue-600 font-medium">Crecimiento:</span>
                            <div className="text-blue-900">{selectedOrigin.monthlyGrowthRate}mm/mes</div>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Mortalidad:</span>
                            <div className="text-blue-900">{selectedOrigin.monthlyMortalityRate}%/mes</div>
                          </div>
                          <div>
                            <span className="text-blue-600 font-medium">Precio:</span>
                            <div className="space-y-2">
                              {/* Selector de tipo de precio */}
                              <div className="flex gap-2">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="unit"
                                    checked={seedingForm.priceType === 'unit'}
                                    onChange={(e) => setSeedingForm({...seedingForm, priceType: e.target.value})}
                                    className="mr-1"
                                  />
                                  <span className="text-xs">Por unidad</span>
                                </label>
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    value="bundle"
                                    checked={seedingForm.priceType === 'bundle'}
                                    onChange={(e) => setSeedingForm({...seedingForm, priceType: e.target.value})}
                                    className="mr-1"
                                  />
                                  <span className="text-xs">Por manojo</span>
                                </label>
                              </div>
                              {/* Input de precio */}
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">S/</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="w-24 px-2 py-1 text-xs border rounded bg-white text-blue-900 font-medium"
                                  value={seedingForm.customPricePerUnit || selectedOrigin.pricePerUnit?.toFixed(2) || '0.00'}
                                  onChange={(e) => setSeedingForm({...seedingForm, customPricePerUnit: e.target.value})}
                                  onWheel={(e) => e.target.blur()}
                                  placeholder={selectedOrigin.pricePerUnit?.toFixed(2) || '0.00'}
                                />
                                <span className="text-gray-500">/{seedingForm.priceType === 'bundle' ? 'manojo' : 'und'}</span>
                              </div>
                              {seedingForm.priceType === 'bundle' && (
                                <div className="text-xs text-gray-600">
                                  = S/ {((seedingForm.customPricePerUnit || selectedOrigin.pricePerUnit || 0) / 96).toFixed(4)}/und
                                </div>
                              )}
                              {seedingForm.customPricePerUnit && seedingForm.customPricePerUnit !== selectedOrigin.pricePerUnit?.toFixed(2) && (
                                <div className="mt-1">
                                  <span className="text-xs text-yellow-600">✏️ Precio modificado</span>
                                  <button
                                    type="button"
                                    onClick={() => setSeedingForm({...seedingForm, customPricePerUnit: ''})}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Restaurar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Inicial (Manojos) *
                  {seedingForm.origin && (
                    <span className="ml-2 text-xs text-blue-600">
                      (1 manojo = 96 conchas)
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={seedingForm.initialBundles}
                    onChange={(e) => {
                      const bundles = e.target.value
                      const quantity = bundles ? parseInt(bundles) * 96 : ''
                      setSeedingForm({
                        ...seedingForm,
                        initialBundles: bundles,
                        initialQuantity: quantity.toString()
                      })
                    }}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 260 manojos"
                  />
                  {seedingForm.initialBundles && (
                    <p className="text-xs text-gray-500">
                      Equivale a {(parseInt(seedingForm.initialBundles) * 96).toLocaleString()} conchas individuales
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mortalidad Esperada Mensual (%) *
                  {seedingForm.origin && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Auto
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="100"
                  className={`input-field ${seedingForm.origin ? 'bg-green-50 border-green-300' : ''}`}
                  value={seedingForm.expectedMonthlyMortality}
                  onChange={(e) => setSeedingForm({...seedingForm, expectedMonthlyMortality: e.target.value})}
                  onWheel={(e) => e.target.blur()}
                  placeholder={seedingForm.origin ? "Se autocompleta desde el origen..." : "Ej: 5.5"}
                  readOnly={!!seedingForm.origin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seedingForm.origin ? 
                    'Valor autocompletado desde la configuración del origen seleccionado' :
                    'Seleccione un origen para autocompletar este valor'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo de Inversión (PEN) *
                  {seedingForm.origin && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Auto
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className={`input-field ${seedingForm.origin ? 'bg-green-50 border-green-300' : ''}`}
                  value={seedingForm.cost}
                  onChange={(e) => setSeedingForm({...seedingForm, cost: e.target.value})}
                  onWheel={(e) => e.target.blur()}
                  placeholder={seedingForm.origin ? "Se autocompleta desde el origen..." : "Ej: 2500.00"}
                  readOnly={!!seedingForm.origin}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {seedingForm.origin ? (
                    seedingForm.initialQuantity ? (
                      seedingForm.priceType === 'bundle' ? 
                        `Costo total: ${Math.floor(seedingForm.initialQuantity / 96).toLocaleString()} manojos × S/ ${(() => {
                          const price = seedingForm.customPricePerUnit || 
                            seedOrigins.find(o => o.name === seedingForm.origin)?.pricePerUnit?.toFixed(2) || '0.00'
                          return price
                        })()} = S/ ${seedingForm.cost}` :
                        `Costo total: ${seedingForm.initialQuantity?.toLocaleString()} conchas × S/ ${(() => {
                          const price = seedingForm.customPricePerUnit || 
                            seedOrigins.find(o => o.name === seedingForm.origin)?.pricePerUnit?.toFixed(2) || '0.00'
                          return price
                        })()} = S/ ${seedingForm.cost}`
                    ) : `Precio base del origen. Ingrese cantidad para calcular costo total.`
                  ) : 'Seleccione un origen para autocompletar el costo'}
                </p>
              </div>

              {/* Sistema de Cultivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sistema de Cultivo *
                </label>
                <select
                  required
                  className="input-field"
                  value={seedingForm.cultivationSystem}
                  onChange={(e) => {
                    setSeedingForm({...seedingForm, cultivationSystem: e.target.value, lineId: '', lineName: ''})
                    setSelectedLine(null)
                    setSelectedSystems([])
                  }}
                >
                  <option value="Cultivo suspendido">Cultivo suspendido</option>
                  <option value="Cultivo de fondo">Cultivo de fondo</option>
                </select>
              </div>
              
              {/* Selección de Múltiples Líneas para Cultivo Suspendido */}
              {seedingForm.cultivationSystem === 'Cultivo suspendido' && selectedSector && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Líneas de Cultivo *
                    </label>
                    {cultivationLines.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLines([...selectedLines, { 
                            id: Date.now().toString(), 
                            lineId: '', 
                            lineName: '', 
                            systems: [] 
                          }])
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Agregar otra línea
                      </button>
                    )}
                  </div>

                  {cultivationLines.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                      ⚠️ No hay líneas configuradas para esta batería.
                      Por favor, configure las líneas en la sección de Sectores.
                    </div>
                  ) : (
                    <>
                      {/* Si no hay líneas seleccionadas, agregar una automáticamente */}
                      {selectedLines.length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLines([{ 
                              id: Date.now().toString(), 
                              lineId: '', 
                              lineName: '', 
                              systems: [] 
                            }])
                          }}
                          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 transition-colors"
                        >
                          <span className="text-gray-600">Haz clic para seleccionar la primera línea</span>
                        </button>
                      )}

                      {/* Lista de líneas seleccionadas */}
                      {selectedLines.map((selectedLine, index) => {
                        const line = cultivationLines.find(l => l.id === selectedLine.lineId)
                        
                        return (
                          <div key={selectedLine.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">
                                Línea {index + 1}
                              </h4>
                              {selectedLines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLines(selectedLines.filter(l => l.id !== selectedLine.id))
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar línea"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Selector de línea */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Seleccionar línea
                              </label>
                              <select
                                required
                                className="input-field"
                                value={selectedLine.lineId}
                                onChange={(e) => {
                                  const lineId = e.target.value
                                  const line = cultivationLines.find(l => l.id === lineId)
                                  const updatedLines = selectedLines.map(l => 
                                    l.id === selectedLine.id 
                                      ? { ...l, lineId, lineName: line?.name || '', systems: [] }
                                      : l
                                  )
                                  setSelectedLines(updatedLines)
                                }}
                              >
                                <option value="">Seleccionar línea</option>
                                {cultivationLines.map(line => {
                                  const occupied = line.occupiedSystems?.length || 0
                                  const total = line.totalSystems || 100
                                  const available = total - occupied
                                  // Verificar si esta línea ya fue seleccionada
                                  const isAlreadySelected = selectedLines.some(l => 
                                    l.lineId === line.id && l.id !== selectedLine.id
                                  )
                                  
                                  return (
                                    <option 
                                      key={line.id} 
                                      value={line.id} 
                                      disabled={available === 0 || isAlreadySelected}
                                    >
                                      {line.name} ({available} de {total} sistemas disponibles)
                                      {isAlreadySelected && ' (✓ Ya seleccionada)'}
                                    </option>
                                  )
                                })}
                              </select>
                            </div>

                            {/* Selector de Sistemas */}
                            {line && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  Sistemas a utilizar
                                </label>
                                <SystemSelector
                                  line={line}
                                  selectedSystems={selectedLine.systems}
                                  onSystemsChange={(systems) => {
                                    const updatedLines = selectedLines.map(l => 
                                      l.id === selectedLine.id 
                                        ? { ...l, systems }
                                        : l
                                    )
                                    setSelectedLines(updatedLines)
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Resumen de selección */}
                      {selectedLines.length > 0 && selectedLines.some(l => l.lineId) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">
                            📋 Resumen de líneas seleccionadas
                          </h4>
                          <div className="text-xs text-blue-700 space-y-1">
                            <p>• {selectedLines.filter(l => l.lineId).length} línea(s) seleccionada(s)</p>
                            <p>• {selectedLines.reduce((acc, l) => acc + l.systems.length, 0)} sistema(s) en total</p>
                            <p>• {selectedLines.reduce((acc, l) => 
                              acc + l.systems.reduce((sysAcc, sys) => 
                                sysAcc + (sys.floors?.length || 0), 0
                              ), 0)} posiciones totales</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {/* Nombre de Línea para Cultivo de Fondo */}
              {seedingForm.cultivationSystem === 'Cultivo de fondo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identificación del Área
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={seedingForm.lineName}
                    onChange={(e) => setSeedingForm({...seedingForm, lineName: e.target.value})}
                    placeholder="Ej: Zona A-1, Sección Norte"
                  />
                </div>
              )}
              
              {/* Tallas */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Talla Promedio (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    value={seedingForm.averageSize}
                    onChange={(e) => setSeedingForm({...seedingForm, averageSize: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 15.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Talla Mínima (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    value={seedingForm.minSize}
                    onChange={(e) => setSeedingForm({...seedingForm, minSize: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 12.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Talla Máxima (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    value={seedingForm.maxSize}
                    onChange={(e) => setSeedingForm({...seedingForm, maxSize: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 18.5"
                  />
                </div>
              </div>
              
              {/* Densidades */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Densidad Teórica (ind/piso)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="input-field"
                    value={seedingForm.theoreticalDensity}
                    onChange={(e) => setSeedingForm({...seedingForm, theoreticalDensity: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 150"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número de individuos por piso
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Densidad según muestreo (ind/piso) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="input-field"
                    value={seedingForm.actualDensity}
                    onChange={(e) => setSeedingForm({...seedingForm, actualDensity: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 142"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Número real de individuos por piso obtenido del muestreo
                  </div>
                </div>
              </div>
              
              {/* Fecha de Próximo Desdoble */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del Próximo Desdoble
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={seedingForm.nextThiningDate}
                  onChange={(e) => setSeedingForm({...seedingForm, nextThiningDate: e.target.value})}
                />
              </div>

              {/* Fecha Proyectada de Cosecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Proyectada de Cosecha
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={seedingForm.projectedHarvestDate}
                  onChange={(e) => setSeedingForm({...seedingForm, projectedHarvestDate: e.target.value})}
                />
              </div>

              {/* Sección de Inventario */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">📦 Ítems del Inventario</h3>

                {/* Selector de inventario */}
                <div className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Seleccionar ítem del inventario
                      </label>
                      <select
                        className="input-field text-sm"
                        value={selectedInventoryItem}
                        onChange={(e) => setSelectedInventoryItem(e.target.value)}
                      >
                        <option value="">Seleccione un ítem...</option>
                        {inventory.filter(item => item.quantity > 0).map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} - Stock: {item.quantity} {item.unit} - S/{item.unitCost.toFixed(2)}/{item.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-32">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
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

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddInventoryItem}
                        className="btn-secondary text-sm px-4 py-2"
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
                {seedingForm.inventoryItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-3 text-sm">
                    No se han agregado ítems del inventario
                  </p>
                ) : (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Ítems utilizados:</h4>
                    {seedingForm.inventoryItems.map((item) => (
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

                    {/* Total del inventario */}
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Costo total de inventario:</span>
                        <span className="text-sm font-bold text-blue-700">
                          S/ {seedingForm.inventoryItems.reduce((total, item) =>
                            total + (item.quantity * item.unitCost), 0
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Limpiar todo al cancelar
                    resetSeedingForm()
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : (editingSeeding ? 'Actualizar Siembra' : 'Crear Siembra')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Proyección de Crecimiento */}
      {showProjectionModal && selectedSeeding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  📈 Proyección de Crecimiento y Mortalidad
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSeeding.sectorName} • {selectedSeeding.origin} • Sembrado: {new Date(selectedSeeding.entryDate).toLocaleDateString('es-PE')}
                </p>
                {selectedSeeding.projectedHarvestDate && (
                  <p className="text-sm text-blue-600 mt-1">
                    🎯 Proyección hasta cosecha: {new Date(selectedSeeding.projectedHarvestDate).toLocaleDateString('es-PE')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowProjectionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Datos Iniciales */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">📊 Datos Registrados Iniciales</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-xs text-blue-600">Cantidad Inicial</div>
                  {(() => {
                    const initialConversions = getAllConversionsFromConchitas(selectedSeeding.initialQuantity || 0)
                    return (
                      <div className="font-semibold text-blue-900">
                        {initialConversions.manojos.toLocaleString()} manojos
                        <span className="text-xs text-gray-600 block">
                          {initialConversions.mallas} mallas • {initialConversions.conchitas.toLocaleString()} conchas
                        </span>
                      </div>
                    )
                  })()}
                </div>
                <div>
                  <div className="text-xs text-blue-600">Talla Inicial</div>
                  <div className="font-semibold text-blue-900">{selectedSeeding.averageSize || '12.0'}mm promedio</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600">Mortalidad Esperada</div>
                  <div className="font-semibold text-blue-900">{selectedSeeding.expectedMonthlyMortality}% mensual</div>
                </div>
                <div>
                  <div className="text-xs text-blue-600">Precio Unitario</div>
                  <div className="font-semibold text-blue-900">
                    {(() => {
                      const origin = seedOrigins.find(o => o.name === selectedSeeding.origin)
                      return origin && origin.pricePerUnit && typeof origin.pricePerUnit === 'number' 
                        ? `S/ ${origin.pricePerUnit.toFixed(2)}/und` 
                        : 'N/A'
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600">Inversión Total</div>
                  <div className="font-semibold text-blue-900">{formatCurrency(selectedSeeding.cost)}</div>
                </div>
              </div>
            </div>

            {/* Tabla de Proyección */}
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla Esperada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad Proyectada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mortalidad Mensual</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mortalidad Acumulada</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado Esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calculateMonthlyProjections(selectedSeeding).map((projection, index) => (
                    <tr 
                      key={index} 
                      className={`${
                        projection.isHarvestMonth 
                          ? 'bg-purple-50 border-purple-200' 
                          : projection.isCurrentMonth 
                            ? 'bg-yellow-50 border-yellow-200' 
                            : projection.isPast 
                              ? 'bg-gray-50' 
                              : 'bg-white'
                      } ${
                        projection.isHarvestMonth 
                          ? 'ring-2 ring-purple-300' 
                          : projection.isCurrentMonth 
                            ? 'ring-2 ring-yellow-300' 
                            : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-medium">Mes {projection.month}</span>
                          {projection.isHarvestMonth && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              🎯 Cosecha
                            </span>
                          )}
                          {projection.isCurrentMonth && !projection.isHarvestMonth && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Actual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {projection.date.toLocaleDateString('es-PE', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{projection.expectedSize}mm</div>
                        <div className="text-xs text-gray-500">
                          +{((projection.expectedSize - (parseFloat(selectedSeeding.averageSize) || 12)) || 0).toFixed(1)}mm crecimiento
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {(() => {
                          const projectedConversions = getAllConversionsFromConchitas(projection.survivingQuantity)
                          const lostQuantity = selectedSeeding.initialQuantity - projection.survivingQuantity
                          return (
                            <div>
                              <div className="font-medium">{projection.survivingQuantity.toLocaleString()} conchas</div>
                              <div className="text-xs text-blue-600">
                                {projectedConversions.manojos.toLocaleString()} manojos • {projectedConversions.mallas} mallas
                              </div>
                              <div className="text-xs text-gray-500">
                                -{lostQuantity.toLocaleString()} perdidas
                              </div>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {projection.monthlyMortality.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className={`font-medium ${
                          projection.cumulativeMortality > 50 
                            ? 'text-red-600' 
                            : projection.cumulativeMortality > 25 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {projection.cumulativeMortality.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          projection.status === 'mature' 
                            ? 'bg-purple-100 text-purple-800' 
                            : getStatusColor(projection.status)
                        }`}>
                          {projection.status === 'mature' ? 'Maduro' : getStatusText(projection.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notas importantes */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Notas Importantes:</h4>
              {(() => {
                const seedOrigin = seedOrigins.find(origin => origin.name === selectedSeeding.origin)
                const growthRate = seedOrigin?.monthlyGrowthRate || 3.5
                const mortalityRate = seedOrigin?.monthlyMortalityRate || selectedSeeding.expectedMonthlyMortality
                
                return (
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• <strong>Origen:</strong> {selectedSeeding.origin}</li>
                    <li>• <strong>Crecimiento:</strong> {growthRate}mm por mes (parámetro del origen configurado)</li>
                    <li>• <strong>Mortalidad:</strong> {mortalityRate}% mensual (parámetro del origen configurado)</li>
                    <li>• <strong>Cálculo de mortalidad:</strong> Se aplica interés compuesto - Población final = Inicial × (1 - tasa)^meses</li>
                    <li className="ml-4 text-blue-600">
                      <strong>Ejemplo:</strong> Con 5% mensual en 12 meses: Compuesto = (1-0.05)^12 = 54% sobrevive vs Lineal = 40% sobrevive
                    </li>
                    <li>• <strong>Período de proyección:</strong> Desde {new Date(selectedSeeding.entryDate).toLocaleDateString('es-PE')} hasta {selectedSeeding.projectedHarvestDate ? new Date(selectedSeeding.projectedHarvestDate).toLocaleDateString('es-PE') : '24 meses después de la siembra'}</li>
                    <li>• <strong>Estado "Listo":</strong> Se alcanza aproximadamente a los 4 meses con talla ≥45mm</li>
                    <li>• <strong>Estado "Maduro":</strong> Se alcanza aproximadamente a los 12 meses con talla ≥60mm</li>
                    <li>• <strong>Mes Actual:</strong> Resaltado en amarillo para referencia temporal</li>
                    {selectedSeeding.projectedHarvestDate && (
                      <li>• <strong>Mes de Cosecha:</strong> Resaltado en morado con etiqueta "🎯 Cosecha"</li>
                    )}
                    {seedOrigin?.description && (
                      <li>• <strong>Descripción:</strong> {seedOrigin.description}</li>
                    )}
                  </ul>
                )
              })()}
            </div>

            <div className="flex justify-center sm:justify-end mt-6">
              <button
                onClick={() => setShowProjectionModal(false)}
                className="btn-secondary w-full sm:w-auto"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Inversor a Siembra */}
      {showAddInvestorModal && selectedSeedingForInvestor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Agregar Inversor a Siembra
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSeedingForInvestor.sectorName} - {selectedSeedingForInvestor.origin}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddInvestorModal(false)
                  setSelectedSeedingForInvestor(null)
                  setSelectedInvestor(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              if (!selectedInvestor) {
                MySwal.fire({
                  icon: 'warning',
                  title: 'Seleccione un inversor',
                  text: 'Debe seleccionar un inversor de la lista',
                  confirmButtonColor: '#f59e0b'
                })
                return
              }
              const formData = new FormData(e.target)
              handleSaveInvestor({
                email: selectedInvestor.email,
                name: `${selectedInvestor.firstName} ${selectedInvestor.lastName}`,
                amount: parseFloat(formData.get('amount') || 0),
                percentage: parseFloat(formData.get('percentage') || 0)
              })
            }} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleccionar Inversor *
                </label>
                <select
                  required
                  className="input-field"
                  value={selectedInvestor?.id || ''}
                  onChange={(e) => {
                    const investor = availableInvestors.find(inv => inv.id === e.target.value)
                    setSelectedInvestor(investor)
                  }}
                >
                  <option value="">-- Seleccione un inversor --</option>
                  {availableInvestors.map(investor => (
                    <option key={investor.id} value={investor.id}>
                      {investor.firstName} {investor.lastName}
                    </option>
                  ))}
                </select>
                {availableInvestors.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No hay inversores registrados. Cree inversores desde la sección "Inversores".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del Inversor
                </label>
                <input
                  type="email"
                  value={selectedInvestor?.email || ''}
                  readOnly
                  className="input-field bg-gray-50"
                  placeholder="Se autocompleta al seleccionar el inversor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto de Inversión (S/)
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  className="input-field"
                  onWheel={(e) => e.target.blur()}
                  placeholder="10000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Participación (%)
                </label>
                <input
                  type="number"
                  name="percentage"
                  onWheel={(e) => e.target.blur()}
                  step="0.01"
                  min="0"
                  max="100"
                  className="input-field"
                  placeholder="25.00"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Información de la Siembra</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>📅 Fecha: {new Date(selectedSeedingForInvestor.entryDate).toLocaleDateString('es-PE')}</div>
                  <div>💰 Inversión Total: {formatCurrency(selectedSeedingForInvestor.cost)}</div>
                  <div>🌱 Cantidad: {selectedSeedingForInvestor.initialQuantity?.toLocaleString()} ejemplares</div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInvestorModal(false)
                    setSelectedSeedingForInvestor(null)
                    setSelectedInvestor(null)
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                >
                  Agregar Inversor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Selector de Baterías */}
      {showBatterySelector && selectedSector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  🔋 Seleccionar Batería
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sector: {selectedSector.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBatterySelector(false)
                  setSelectedSector(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Selecciona la batería donde realizarás la siembra:
              </p>

              {loading ? (
                <div className="text-center py-6">
                  <LoadingSpinner size="sm" message="Cargando baterías..." />
                </div>
              ) : batteries.length > 0 ? (
                <div className="space-y-2">
                  {batteries.map((battery) => (
                    <button
                      key={battery.id}
                      onClick={() => handleBatterySelected(battery)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">🔋</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{battery.name}</h4>
                            <p className="text-sm text-gray-600">
                              Batería {battery.letter} • {battery.totalLines} líneas
                            </p>
                          </div>
                        </div>
                        <div className="text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      {battery.description && (
                        <p className="text-xs text-gray-500 mt-1 ml-10">{battery.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">🔋</div>
                  <p className="text-sm text-gray-600 mb-3">
                    No hay baterías configuradas en este sector
                  </p>
                  <p className="text-xs text-gray-500">
                    Configure baterías en la sección "Sectores" antes de crear siembras
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SeedingPage