export const calculateCostPerManojo = (lot, expenses = [], inventoryUsed = []) => {
  if (!lot) {
    return {
      status: 'error',
      message: 'No se proporcionó información del lote',
      data: null
    }
  }
  
  // Costo inicial del lote
  const initialCost = lot.cost || 0
  
  // Gastos operativos del lote
  const operationalExpenses = expenses
    .filter(e => e.lotId === lot.id && e.category === 'operational')
    .reduce((sum, e) => sum + e.amount, 0)
  
  // Gastos de cosecha
  const harvestExpenses = expenses
    .filter(e => e.lotId === lot.id && e.category === 'harvest')
    .reduce((sum, e) => sum + e.amount, 0)
  
  // Costo de materiales utilizados
  const materialsCost = inventoryUsed
    .filter(item => item.relatedId === lot.id)
    .reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  
  // Costo total
  const totalCost = initialCost + operationalExpenses + harvestExpenses + materialsCost
  
  // Estimar número de manojos (3 manojos por malla aproximadamente)
  const estimatedManojos = Math.ceil(lot.currentQuantity / 1000) * 3
  
  // Costo por manojo
  const costPerManojo = estimatedManojos > 0 ? totalCost / estimatedManojos : 0
  
  return {
    status: 'success',
    data: {
      totalCost,
      initialCost,
      operationalExpenses,
      harvestExpenses,
      materialsCost,
      estimatedManojos,
      costPerManojo: Math.round(costPerManojo * 100) / 100,
      breakdown: {
        initial: ((initialCost / totalCost) * 100).toFixed(1),
        operational: ((operationalExpenses / totalCost) * 100).toFixed(1),
        harvest: ((harvestExpenses / totalCost) * 100).toFixed(1),
        materials: ((materialsCost / totalCost) * 100).toFixed(1)
      }
    }
  }
}

export const calculateProfitability = (lot, harvestData, pricing, expenses = []) => {
  if (!lot || !harvestData || !pricing) {
    return {
      status: 'error',
      message: 'Datos insuficientes para calcular rentabilidad',
      data: null
    }
  }
  
  // Calcular ingresos por talla
  let totalRevenue = 0
  const revenueBySize = {}
  
  if (harvestData.sizeDistribution) {
    Object.entries(harvestData.sizeDistribution).forEach(([size, quantity]) => {
      const priceInfo = pricing.find(p => p.sizeCategory === size && p.isActive)
      if (priceInfo) {
        const revenue = quantity * priceInfo.pricePerUnit
        revenueBySize[size] = revenue
        totalRevenue += revenue
      }
    })
  }
  
  // Calcular costos
  const costAnalysis = calculateCostPerManojo(lot, expenses)
  const totalCost = costAnalysis.data?.totalCost || 0
  
  // Calcular rentabilidad
  const profit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0
  
  return {
    status: 'success',
    data: {
      totalRevenue,
      totalCost,
      profit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      revenueBySize,
      costBreakdown: costAnalysis.data
    }
  }
}

export const calculateSectorOccupancy = (sectors = [], lots = []) => {
  const sectorOccupancy = sectors.map(sector => {
    const activeLots = lots.filter(lot => 
      lot.sectorId === sector.id && 
      ['seeded', 'growing'].includes(lot.status)
    )
    
    const maxCapacity = sector.maxCapacity || 1
    const occupancyRate = (activeLots.length / maxCapacity) * 100
    
    return {
      sectorId: sector.id,
      sectorName: sector.name,
      activeLots: activeLots.length,
      maxCapacity,
      occupancyRate: Math.round(occupancyRate),
      available: maxCapacity - activeLots.length > 0
    }
  })
  
  const totalSectors = sectors.length
  const occupiedSectors = sectorOccupancy.filter(s => s.activeLots > 0).length
  const averageOccupancy = sectorOccupancy.reduce((sum, s) => sum + s.occupancyRate, 0) / totalSectors
  
  return {
    status: 'success',
    data: {
      sectorOccupancy,
      summary: {
        totalSectors,
        occupiedSectors,
        availableSectors: totalSectors - occupiedSectors,
        averageOccupancy: Math.round(averageOccupancy)
      }
    }
  }
}

export const projectGrowth = (lot, growthRate = 0.8) => {
  if (!lot || !lot.entryDate) {
    return {
      status: 'error',
      message: 'Información del lote insuficiente',
      data: null
    }
  }
  
  const entryDate = new Date(lot.entryDate)
  const currentDate = new Date()
  const monthsElapsed = (currentDate - entryDate) / (1000 * 60 * 60 * 24 * 30)
  
  const initialSize = lot.initialSize || 20
  const projectedSize = initialSize + (monthsElapsed * growthRate)
  const actualSize = lot.averageSize || initialSize
  
  const sizeVariance = actualSize - projectedSize
  const variancePercentage = projectedSize > 0 ? (sizeVariance / projectedSize) * 100 : 0
  
  // Proyección a futuro (próximos 6 meses)
  const projections = []
  for (let i = 1; i <= 6; i++) {
    const futureMonths = monthsElapsed + i
    const futureSize = initialSize + (futureMonths * growthRate)
    const futureDate = new Date(entryDate)
    futureDate.setMonth(futureDate.getMonth() + Math.floor(futureMonths))
    
    projections.push({
      month: i,
      date: futureDate.toISOString().split('T')[0],
      projectedSize: Math.round(futureSize * 10) / 10,
      sizeCategory: getSizeCategory(futureSize)
    })
  }
  
  return {
    status: 'success',
    data: {
      monthsElapsed: Math.round(monthsElapsed * 10) / 10,
      initialSize,
      projectedSize: Math.round(projectedSize * 10) / 10,
      actualSize,
      sizeVariance: Math.round(sizeVariance * 10) / 10,
      variancePercentage: Math.round(variancePercentage * 10) / 10,
      performance: variancePercentage > 0 ? 'above' : variancePercentage < -5 ? 'below' : 'on-track',
      projections
    }
  }
}

const getSizeCategory = (size) => {
  if (size < 30) return 'XS'
  if (size < 40) return 'S'
  if (size < 50) return 'M'
  if (size < 60) return 'L'
  return 'XL'
}