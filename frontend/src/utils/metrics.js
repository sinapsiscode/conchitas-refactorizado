export const calculateMetrics = (data, type) => {
  if (!data || data.length === 0) {
    return {
      status: 'insufficient-data',
      missing: ['No hay datos disponibles para el cálculo'],
      data: null
    }
  }
  
  switch (type) {
    case 'mortality-rate':
      return calculateMortalityRate(data)
    case 'growth-rate':
      return calculateGrowthRate(data)
    case 'sector-summary':
      return calculateSectorSummary(data)
    case 'water-quality':
      return calculateWaterQuality(data)
    default:
      return {
        status: 'insufficient-data',
        missing: [`Tipo de métrica '${type}' no reconocido`],
        data: null
      }
  }
}

const calculateMortalityRate = (lots) => {
  const requiredFields = ['initialQuantity', 'currentQuantity', 'entryDate']
  const missing = []
  
  const validLots = lots.filter(lot => {
    const lotMissing = requiredFields.filter(field => !lot[field] && lot[field] !== 0)
    if (lotMissing.length > 0) {
      missing.push(...lotMissing.map(field => `${field} en lote ${lot.id || 'desconocido'}`))
      return false
    }
    return true
  })
  
  if (validLots.length === 0) {
    return {
      status: 'insufficient-data',
      missing: ['No hay lotes con datos suficientes para calcular mortalidad', ...missing],
      data: null
    }
  }
  
  const totalInitial = validLots.reduce((sum, lot) => sum + lot.initialQuantity, 0)
  const totalCurrent = validLots.reduce((sum, lot) => sum + lot.currentQuantity, 0)
  const mortalityRate = ((totalInitial - totalCurrent) / totalInitial) * 100
  
  return {
    status: 'success',
    missing: [],
    data: {
      mortalityRate: Math.round(mortalityRate * 100) / 100,
      totalInitial,
      totalCurrent,
      totalMortality: totalInitial - totalCurrent,
      lotsAnalyzed: validLots.length
    }
  }
}

const calculateGrowthRate = (monitoringRecords) => {
  if (!monitoringRecords || monitoringRecords.length < 2) {
    return {
      status: 'insufficient-data',
      missing: ['Se necesitan al menos 2 registros de monitoreo para calcular crecimiento'],
      data: null
    }
  }
  
  const requiredFields = ['averageSize', 'date']
  const validRecords = monitoringRecords.filter(record => 
    requiredFields.every(field => record[field])
  ).sort((a, b) => new Date(a.date) - new Date(b.date))
  
  if (validRecords.length < 2) {
    return {
      status: 'insufficient-data',
      missing: ['Registros insuficientes con talla promedio y fecha válidas'],
      data: null
    }
  }
  
  const firstRecord = validRecords[0]
  const lastRecord = validRecords[validRecords.length - 1]
  
  const daysDiff = Math.abs(new Date(lastRecord.date) - new Date(firstRecord.date)) / (1000 * 60 * 60 * 24)
  const sizeDiff = lastRecord.averageSize - firstRecord.averageSize
  const dailyGrowthRate = sizeDiff / daysDiff
  
  return {
    status: 'success',
    missing: [],
    data: {
      dailyGrowthRate: Math.round(dailyGrowthRate * 1000) / 1000,
      totalGrowth: sizeDiff,
      daysAnalyzed: Math.round(daysDiff),
      initialSize: firstRecord.averageSize,
      currentSize: lastRecord.averageSize,
      recordsAnalyzed: validRecords.length
    }
  }
}

const calculateSectorSummary = (sectors) => {
  const requiredFields = ['lots']
  const missing = []
  
  const validSectors = sectors.filter(sector => {
    if (!sector.lots || !Array.isArray(sector.lots)) {
      missing.push(`Lotes no definidos en sector ${sector.name || 'desconocido'}`)
      return false
    }
    return true
  })
  
  if (validSectors.length === 0) {
    return {
      status: 'insufficient-data',
      missing: ['No hay sectores con lotes válidos', ...missing],
      data: null
    }
  }
  
  const totalSectors = validSectors.length
  const totalLots = validSectors.reduce((sum, sector) => sum + sector.lots.length, 0)
  const activeLots = validSectors.reduce((sum, sector) => 
    sum + sector.lots.filter(lot => lot.status === 'growing' || lot.status === 'seeded').length, 0)
  
  const allLots = validSectors.flatMap(sector => sector.lots)
  const totalQuantity = allLots.reduce((sum, lot) => sum + (lot.currentQuantity || 0), 0)
  
  return {
    status: 'success',
    missing: [],
    data: {
      totalSectors,
      totalLots,
      activeLots,
      totalQuantity,
      averageLotsPerSector: Math.round((totalLots / totalSectors) * 100) / 100
    }
  }
}

const calculateWaterQuality = (monitoringRecords) => {
  if (!monitoringRecords || monitoringRecords.length === 0) {
    return {
      status: 'insufficient-data',
      missing: ['No hay registros de monitoreo disponibles'],
      data: null
    }
  }
  
  const qualityFields = ['waterTemperature', 'salinity', 'oxygenLevel', 'pH']
  const validRecords = monitoringRecords.filter(record => 
    qualityFields.some(field => record[field] !== undefined && record[field] !== null)
  )
  
  if (validRecords.length === 0) {
    return {
      status: 'insufficient-data',
      missing: ['No hay registros con parámetros de calidad de agua'],
      data: null
    }
  }
  
  const averages = {}
  const ranges = {}
  
  qualityFields.forEach(field => {
    const values = validRecords
      .map(record => record[field])
      .filter(value => value !== undefined && value !== null)
    
    if (values.length > 0) {
      averages[field] = Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100
      ranges[field] = {
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }
  })
  
  return {
    status: 'success',
    missing: [],
    data: {
      averages,
      ranges,
      recordsAnalyzed: validRecords.length,
      parametersAvailable: Object.keys(averages)
    }
  }
}