import { MockDB } from './db.js'
import { UserSchema } from './schemas/user.js'
import { SectorSchema, LotSchema } from './schemas/sector.js'
import { BatterySchema } from './schemas/battery.js'
import { CultivationLineSchema } from './schemas/cultivationLine.js'
import { MonitoringSchema } from './schemas/monitoring.js'
import { ExpenseSchema, ExpenseTypeSchema } from './schemas/expense.js'
import { HarvestPlanSchema, PricingSchema, HarvestCostCategorySchema } from './schemas/harvest.js'
import { InventorySchema } from './schemas/inventory.js'
import { IncomeRecordSchema } from './schemas/income.js'
import { createNotificationFromTemplate } from './schemas/notification.js'
import { generateUUID } from '../../utils/uuid.js'

const SEED_VERSION = '2.12.0' // Added systems data at lot level and multipleLines level

const generateUser = (overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    email: '',
    password: 'password123',
    firstName: '',
    lastName: '',
    role: 'maricultor',
    status: 'approved',
    phone: '+51 999 999 999',
    location: 'Piura-Sechura',
    totalHectares: Math.round((Math.random() * 15 + 5) * 10) / 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateSector = (userId, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    name: `Sector ${Math.floor(Math.random() * 100) + 1}`,
    userId,
    location: 'Bahía de Sechura',
    hectares: Math.round((Math.random() * 4 + 0.5) * 10) / 10,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { ...defaults, ...overrides }
}

const generateBattery = (sectorId, letter, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    sectorId,
    letter: letter.toUpperCase(),
    name: `Batería ${letter.toUpperCase()}`,
    description: `Batería ${letter.toUpperCase()} del sector`,
    status: 'active',
    totalLines: 0, // Se actualizará cuando se agreguen líneas
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { ...defaults, ...overrides }
}

const generateCultivationLine = (sectorId, batteryId, batteryLetter, lineNumber, overrides = {}) => {
  const lineName = `${batteryLetter.toUpperCase()}-${lineNumber}`

  const defaults = {
    id: generateUUID(),
    sectorId,
    batteryId,
    name: lineName,
    batteryLetter: batteryLetter.toUpperCase(),
    lineNumber,
    totalSystems: 100,
    floorsPerSystem: 10,
    occupiedSystems: [],
    status: Math.random() > 0.7 ? 'partial' : 'available', // 30% tienen ocupación parcial
    description: `Línea ${lineName} de cultivo suspendido`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return { ...defaults, ...overrides }
}

const generateLot = (sectorId, availableBatteries = [], availableLines = [], overrides = {}) => {
  const entryDate = new Date()
  const monthsOld = Math.floor(Math.random() * 8) + 1 // 1-8 meses
  entryDate.setMonth(entryDate.getMonth() - monthsOld)
  
  const initialQuantity = Math.floor(Math.random() * 50000) + 10000
  const mortalityRate = Math.random() * 0.15
  const currentQuantity = Math.floor(initialQuantity * (1 - mortalityRate))
  
  // Determinar status basado en la edad del lote y talla promedio
  // Hacer que la talla esté correlacionada con la edad del lote
  const minSizeForAge = monthsOld * 8 + 10  // Aproximadamente 10mm + 8mm por mes
  const maxSizeForAge = monthsOld * 12 + 20  // Aproximadamente 20mm + 12mm por mes
  let averageSize = Math.floor(Math.random() * (maxSizeForAge - minSizeForAge)) + minSizeForAge
  
  // Asegurar que algunos lotes tengan talla suficiente para cosecha (>=75mm)
  // Esto garantiza que siempre haya lotes disponibles para planificar cosecha
  if (Math.random() < 0.4 && monthsOld >= 4) { // 40% de lotes maduros tendrán talla suficiente
    averageSize = Math.max(averageSize, 75 + Math.floor(Math.random() * 20)) // 75-95mm
  }
  
  let status = 'seeded'
  
  if (monthsOld >= 1) status = 'growing'
  if (monthsOld >= 4 && averageSize >= 45) status = 'ready' // Lotes maduros listos para cosecha
  if (monthsOld >= 8) status = Math.random() > 0.7 ? 'ready' : 'growing' // 30% chance ready for older lots
  
  // Calcular fecha proyectada de cosecha basada en el ciclo de crecimiento típico (6-10 meses)
  const projectedHarvestDate = new Date(entryDate)
  const cycleDuration = Math.floor(Math.random() * 5) + 6 // 6-10 meses
  projectedHarvestDate.setMonth(projectedHarvestDate.getMonth() + cycleDuration)
  
  // Asegurar que algunos lotes tengan fechas futuras para mostrar en proyecciones
  const today = new Date()
  if (Math.random() > 0.6) { // 40% de los lotes tendrán fechas futuras garantizadas
    const futureMonths = Math.floor(Math.random() * 6) + 1 // 1-6 meses en el futuro
    projectedHarvestDate.setTime(today.getTime())
    projectedHarvestDate.setMonth(today.getMonth() + futureMonths)
  }
  
  // Generate lines and systems for harvest planning
  const generateLinesAndSystems = () => {
    const numberOfLines = Math.floor(Math.random() * 3) + 1 // 1-3 lines
    const lines = []
    
    for (let i = 0; i < numberOfLines; i++) {
      const lineId = generateUUID()
      const lineName = `L${String.fromCharCode(65 + i)}` // LA, LB, LC, etc.
      const numberOfSystems = Math.floor(Math.random() * 5) + 3 // 3-7 systems per line
      const systems = []
      
      for (let j = 0; j < numberOfSystems; j++) {
        const systemNumber = j + 1
        const floors = []
        const floorsPerSystem = Math.floor(Math.random() * 3) + 6 // 6-8 floors per system
        
        for (let f = 0; f < floorsPerSystem; f++) {
          floors.push({
            floorNumber: f + 1,
            depth: (f + 1) * 3, // 3m, 6m, 9m, etc.
            capacity: 200 + Math.floor(Math.random() * 100) // 200-300 specimens per floor
          })
        }
        
        systems.push({
          systemNumber,
          floors,
          totalCapacity: floors.reduce((sum, floor) => sum + floor.capacity, 0)
        })
      }
      
      lines.push({
        lineId,
        lineName,
        systems,
        totalSystems: numberOfSystems
      })
    }
    
    return lines
  }

  // Seleccionar batería y línea aleatoria para este lote
  let batteryId = null
  let batteryLetter = null
  let lineId = null
  let lineName = null

  if (availableBatteries.length > 0) {
    const randomBattery = availableBatteries[Math.floor(Math.random() * availableBatteries.length)]
    batteryId = randomBattery.id
    batteryLetter = randomBattery.letter

    // Filtrar líneas que pertenecen a esta batería
    const batteryLines = availableLines.filter(line => line.batteryId === batteryId)
    if (batteryLines.length > 0) {
      const randomLine = batteryLines[Math.floor(Math.random() * batteryLines.length)]
      lineId = randomLine.id
      lineName = randomLine.name
    }
  }

  const defaults = {
    id: generateUUID(),
    sectorId,
    batteryId,
    batteryLetter,
    lineId,
    lineName,
    entryDate: entryDate.toISOString().split('T')[0],
    projectedHarvestDate: projectedHarvestDate.toISOString().split('T')[0],
    origin: Math.random() > 0.5 ? 'Semillero Local' : 'Laboratorio Acuícola',
    initialQuantity,
    currentQuantity,
    expectedMonthlyMortality: Math.floor(Math.random() * 8) + 2,
    cost: Math.floor(Math.random() * 10000) + 5000,
    averageSize,
    maxSize: averageSize + Math.floor(Math.random() * 15) + 5,
    minSize: Math.max(10, averageSize - Math.floor(Math.random() * 15) - 5),
    status,
    cultivationSystem: 'Cultivo suspendido', // Agregado para compatibilidad con HarvestPage
    systems: (() => {
      // Generar sistemas a nivel de lote también
      const numSystems = Math.floor(Math.random() * 5) + 1
      const systems = []
      const usedNumbers = new Set()

      for (let i = 0; i < numSystems; i++) {
        let systemNumber
        do {
          systemNumber = Math.floor(Math.random() * 20) + 1
        } while (usedNumbers.has(systemNumber))
        usedNumbers.add(systemNumber)

        systems.push({
          systemNumber,
          floors: Array.from({length: Math.floor(Math.random() * 5) + 3}, (_, i) => i + 1)
        })
      }

      return systems.sort((a, b) => a.systemNumber - b.systemNumber)
    })(),
    multipleLines: lineId ? [{
      id: generateUUID(),
      lineId: lineId,
      lineName: lineName,
      systems: (() => {
        // Generar 1-5 sistemas aleatorios para esta línea
        const numSystems = Math.floor(Math.random() * 5) + 1
        const systems = []
        const usedNumbers = new Set()

        for (let i = 0; i < numSystems; i++) {
          let systemNumber
          do {
            systemNumber = Math.floor(Math.random() * 20) + 1 // Sistemas 1-20
          } while (usedNumbers.has(systemNumber))
          usedNumbers.add(systemNumber)

          systems.push({
            systemNumber,
            floors: Array.from({length: Math.floor(Math.random() * 5) + 3}, (_, i) => i + 1) // 3-7 pisos
          })
        }

        return systems.sort((a, b) => a.systemNumber - b.systemNumber)
      })()
    }] : [],
    lines: generateLinesAndSystems(), // Lines and systems for harvest planning
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateMonitoring = (lotId, recordedBy, date, previousQuantity = 25000, overrides = {}) => {
  // Generate realistic number of measurement points (most common: 3, 5, 7)
  const pointCounts = [3, 5, 7, 9, 11]
  const totalPoints = pointCounts[Math.floor(Math.random() * pointCounts.length)]
  
  // Calculate realistic size progression based on time
  const seedingDate = new Date(date)
  seedingDate.setMonth(seedingDate.getMonth() - Math.floor(Math.random() * 8 + 1)) // 1-8 months ago
  const daysSinceSeeding = Math.max(0, (date - seedingDate) / (1000 * 60 * 60 * 24))
  const monthsSinceSeeding = daysSinceSeeding / 30.44
  
  // Realistic size progression (starts at ~12mm, grows ~3.5mm per month)
  const baseSize = 12 + (monthsSinceSeeding * 3.5)
  const sizeVariation = baseSize * 0.25 // ±25% variation between points
  
  // Generate measurement points with exact same structure as form
  const measurementPoints = []
  const pointMortalityRates = []
  
  for (let i = 0; i < totalPoints; i++) {
    // Size measurements with realistic progression
    const avgSize = Math.max(8, baseSize + (Math.random() - 0.5) * sizeVariation)
    const maxSize = avgSize + Math.random() * 12 + 8  // Max is typically larger than avg
    const minSize = Math.max(3, avgSize - Math.random() * 8 - 5) // Min is typically smaller than avg
    
    // Environmental parameters with realistic ranges
    const waterTemp = 15 + Math.random() * 8 + Math.sin(date.getMonth() * Math.PI / 6) * 3 // 15-26°C with seasonal variation
    const salinity = 30 + Math.random() * 10 // 30-40 ppm typical for marine environments
    const pH = 7.5 + Math.random() * 1.2 // 7.5-8.7 typical for seawater
    const oxygen = 5.5 + Math.random() * 4 // 5.5-9.5 mg/L
    
    // Mortality sampling data - exact same structure as form
    const totalSpecimens = Math.floor(Math.random() * 100) + 40 // 40-140 specimens per point
    const mortalityRate = Math.random() * 0.12 + 0.01 // 1-13% mortality per point
    const aliveSpecimens = Math.floor(totalSpecimens * (1 - mortalityRate))
    const actualMortalityRate = ((totalSpecimens - aliveSpecimens) / totalSpecimens) * 100
    pointMortalityRates.push(actualMortalityRate)
    
    // Store values as strings initially (like form does), then convert
    measurementPoints.push({
      pointNumber: i + 1,
      averageSize: avgSize.toFixed(1),
      maxSize: maxSize.toFixed(1), 
      minSize: minSize.toFixed(1),
      waterTemperature: waterTemp.toFixed(1),
      salinity: salinity.toFixed(1),
      pH: pH.toFixed(2),
      oxygenLevel: oxygen.toFixed(1),
      totalSpecimens: totalSpecimens.toString(),
      aliveSpecimens: aliveSpecimens.toString()
    })
  }
  
  // Calculate averages exactly like the form's calculateAverages function
  const validPoints = measurementPoints.filter(point => 
    point.averageSize || point.maxSize || point.minSize || 
    point.waterTemperature || point.salinity || point.pH || point.oxygenLevel
  )
  
  const calculateAvg = (field) => {
    const values = validPoints
      .map(point => parseFloat(point[field]))
      .filter(val => !isNaN(val) && val > 0)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
  }
  
  const averages = {
    averageSize: calculateAvg('averageSize'),
    maxSize: Math.max(...validPoints.map(p => parseFloat(p.maxSize)).filter(v => !isNaN(v))),
    minSize: Math.min(...validPoints.map(p => parseFloat(p.minSize)).filter(v => !isNaN(v))),
    waterTemperature: calculateAvg('waterTemperature'),
    salinity: calculateAvg('salinity'),
    pH: calculateAvg('pH'),
    oxygenLevel: calculateAvg('oxygenLevel')
  }
  
  // Calculate mortality data exactly like form's calculateMortalityData function
  const pointMortalities = measurementPoints.map(point => {
    const total = parseFloat(point.totalSpecimens) || 0
    const alive = parseFloat(point.aliveSpecimens) || 0
    const mortalityRate = total > 0 ? ((total - alive) / total) * 100 : 0
    return { 
      pointNumber: point.pointNumber, 
      mortalityRate: parseFloat(mortalityRate.toFixed(1)), 
      total, 
      alive 
    }
  })

  const validMortalityPoints = pointMortalities.filter(p => p.total > 0)
  const averageMortalityRate = validMortalityPoints.length > 0 
    ? validMortalityPoints.reduce((sum, p) => sum + p.mortalityRate, 0) / validMortalityPoints.length 
    : 0

  // Calculate current quantity exactly like the form does
  const currentQuantity = Math.round(previousQuantity * (1 - averageMortalityRate / 100))
  
  // Generate realistic observations (exactly like form allows)
  const observations = [
    'Condiciones normales del cultivo, ejemplares con buen desarrollo',
    'Se observa crecimiento uniforme en todos los puntos de medición',
    'Ligero incremento en la mortalidad, posiblemente por cambios de temperatura',
    'Excelente desarrollo de tallas, condiciones ambientales favorables',
    'Presencia de organismos incrustantes, se requiere limpieza de sistemas',
    'Agua cristalina, buena oxigenación en todos los puntos',
    'Ejemplares activos, buena respuesta alimentaria observada',
    'Temperatura del agua dentro de rangos óptimos para la especie',
    'pH y salinidad estables, condiciones ideales para el cultivo',
    null, null // Some records without observations (form allows this)
  ]
  
  // Convert measurementPoints to samplingPoints structure for InvestorSeedings component
  const samplingPoints = measurementPoints.map((point, index) => {
    const pointDate = new Date(date)
    // Add some time variation to each point (measured at different times during the day)
    pointDate.setHours(8 + index, Math.random() * 60, 0, 0)
    
    return {
      id: generateUUID(),
      pointNumber: point.pointNumber,
      location: `Punto ${point.pointNumber}`, // Could be enhanced with specific coordinates
      recordTime: pointDate.toISOString(),
      quantity: parseInt(point.aliveSpecimens) || null,
      averageSize: parseFloat(point.averageSize),
      temperature: parseFloat(point.waterTemperature),
      salinity: parseFloat(point.salinity),
      ph: parseFloat(point.pH),
      dissolvedOxygen: parseFloat(point.oxygenLevel),
      observations: Math.random() > 0.7 ? [
        'Ejemplares activos y saludables',
        'Desarrollo uniforme observado',
        'Condiciones ambientales estables',
        'Ligera presencia de organismos incrustantes',
        'Buena respuesta alimentaria',
        'Agua cristalina en este punto',
        null
      ][Math.floor(Math.random() * 7)] : null
    }
  })

  // Create exact same structure as handleSubmitMeasurement creates
  const measurementData = {
    id: generateUUID(),
    lotId,
    date: date.toISOString().split('T')[0],
    recordDate: date.toISOString(), // Full datetime for investor interface
    previousQuantity: parseInt(previousQuantity) || 0,
    currentQuantity: parseInt(currentQuantity),
    averageSize: averages.averageSize,
    maxSize: isFinite(averages.maxSize) ? averages.maxSize : null,
    minSize: isFinite(averages.minSize) ? averages.minSize : null,
    waterTemperature: averages.waterTemperature,
    salinity: averages.salinity,
    pH: averages.pH,
    oxygenLevel: averages.oxygenLevel,
    dissolvedOxygen: averages.oxygenLevel, // Alias for investor interface
    observations: observations[Math.floor(Math.random() * observations.length)],
    notes: observations[Math.floor(Math.random() * observations.length)], // Alias for investor interface
    recordedBy,
    measurementPoints,
    samplingPoints, // Add sampling points for investor interface
    totalPoints,
    mortalityData: {
      pointMortalities,
      averageMortalityRate: parseFloat(averageMortalityRate.toFixed(2))
    },
    createdAt: new Date().toISOString()
  }
  
  return { ...measurementData, ...overrides }
}

const generateExpense = (lotId, sectorId, category, type, amount, date, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    lotId,
    sectorId,
    category,
    type,
    description: type,
    amount,
    date: date.toISOString().split('T')[0],
    isRecurring: category === 'operational',
    frequency: category === 'operational' ? 'monthly' : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateHarvestPlan = (sectorId, lotId, plannedDate, quantity, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    sectorId,
    lotId,
    plannedDate: plannedDate.toISOString().split('T')[0],
    status: 'planned',
    estimatedQuantity: quantity,
    notes: 'Cosecha programada',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generatePricing = (sizeCategory, minSize, maxSize, pricePerUnit, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    sizeCategory,
    minSize,
    maxSize,
    pricePerUnit,
    pricePerManojo: pricePerUnit * 100,
    isActive: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateInventoryItem = (category, name, quantity, unitCost, unit = 'units', origin = 'national', overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    category,
    name,
    description: `${name} - Stock inicial`,
    origin,
    quantity,
    unit,
    unitCost,
    totalValue: quantity * unitCost,
    minStock: Math.floor(quantity * 0.2),
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateCategory = (id, name, icon, color, overrides = {}) => {
  const defaults = {
    id,
    name,
    icon,
    color,
    description: `Categoría para ${name.toLowerCase()}`,
    isActive: true,
    createdAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

const generateHarvestCostCategory = (name, description, unit, estimatedCost, overrides = {}) => {
  const defaults = {
    id: generateUUID(),
    name,
    description,
    unit,
    estimatedCost,
    isActive: true
  }
  
  return { ...defaults, ...overrides }
}

const generateSeedOrigin = (name, monthlyGrowthRate, monthlyMortalityRate, pricePerBundle, description, overrides = {}) => {
  const bundleSize = 96
  const defaults = {
    id: generateUUID(),
    name,
    monthlyGrowthRate,
    monthlyMortalityRate,
    pricePerBundle,
    bundleSize,
    pricePerUnit: pricePerBundle / bundleSize,
    description,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return { ...defaults, ...overrides }
}

export const seedData = () => {
  try {
    const currentVersion = MockDB.getSeedVersion()
    
    if (currentVersion === SEED_VERSION) {
      console.log('Database already seeded with version', SEED_VERSION)
      return
    }
    
    console.log('Seeding database...')
    
    MockDB.clearAll()
    
    const maricultor1 = generateUser({
      email: 'maricultor1@conchas.com',
      firstName: 'Juan',
      lastName: 'Pescador',
      role: 'maricultor',
      status: 'approved',
      totalHectares: 12.5
    })
    
    
    // Add investor user for testing
    const investor1 = generateUser({
      id: 'investor-001',
      email: 'inversor@example.com',
      firstName: 'María',
      lastName: 'Investidora',
      role: 'investor',
      status: 'approved',
      phone: '999555666',
      location: 'Lima, Perú'
    })
    
    console.log('👤 [Seeder] Creating investor user:', { 
      email: investor1.email, 
      password: investor1.password,
      role: investor1.role,
      status: investor1.status 
    })
    
    const users = [maricultor1, investor1]
    MockDB.set('users', users)
    
    const sectors = []
    const batteries = []
    const cultivationLines = []
    const lots = []
    const monitoringRecords = []
    
    const maricultores = [maricultor1]
    
    maricultores.forEach(user => {
      for (let i = 0; i < 3; i++) {
        const sector = generateSector(user.id)

        // Generar 2-4 baterías por sector (A, B, C, D)
        const batteriesPerSector = Math.floor(Math.random() * 3) + 2 // 2-4 baterías
        const batteryLetters = ['A', 'B', 'C', 'D', 'E', 'F']

        for (let b = 0; b < batteriesPerSector; b++) {
          const battery = generateBattery(sector.id, batteryLetters[b])
          batteries.push(battery)

          // Generar 3-8 líneas por batería
          const linesPerBattery = Math.floor(Math.random() * 6) + 3 // 3-8 líneas
          let totalLinesInBattery = 0

          for (let l = 1; l <= linesPerBattery; l++) {
            const line = generateCultivationLine(sector.id, battery.id, battery.letter, l)
            cultivationLines.push(line)
            totalLinesInBattery++
          }

          // Actualizar contador de líneas en la batería
          battery.totalLines = totalLinesInBattery
        }

        // Generate 1-2 lots per sector for better organization
        const lotsPerSector = Math.floor(Math.random() * 2) + 1
        sector.lots = []
        
        for (let k = 0; k < lotsPerSector; k++) {
          // Filtrar baterías y líneas de este sector
          const sectorBatteries = batteries.filter(b => b.sectorId === sector.id)
          const sectorLines = cultivationLines.filter(l => l.sectorId === sector.id)

          const lot = generateLot(sector.id, sectorBatteries, sectorLines)
          sector.lots.push(lot)
          lots.push(lot) // Keep for monitoring generation
          
          // Create more realistic monitoring progression - fewer records but more realistic timeline
          const numberOfRecords = Math.floor(Math.random() * 12) + 8 // 8-20 records per lot
          let previousQuantity = lot.initialQuantity
          
          for (let j = 0; j < numberOfRecords; j++) {
            const monitoringDate = new Date()
            // Space out measurements more realistically (every 3-7 days instead of daily)  
            const daysBetween = Math.floor(Math.random() * 5) + 3
            monitoringDate.setDate(monitoringDate.getDate() - (j * daysBetween))
            
            const monitoring = generateMonitoring(lot.id, user.id, monitoringDate, previousQuantity)
            monitoringRecords.push(monitoring)
            
            // Update previous quantity for next iteration to create realistic progression
            previousQuantity = monitoring.currentQuantity
          }
        }
        
        sectors.push(sector)
      }
    })
    
    MockDB.set('sectors', sectors)
    MockDB.set('batteries', batteries)
    MockDB.set('cultivationLines', cultivationLines)
    MockDB.set('lots', lots) // Keep for backward compatibility
    MockDB.set('monitoring', monitoringRecords)
    
    // Generar gastos
    const expenses = []
    
    // Gastos operativos mensuales (vigilante)
    lots.forEach(lot => {
      for (let i = 0; i < 3; i++) {
        const expenseDate = new Date()
        expenseDate.setMonth(expenseDate.getMonth() - i)
        
        expenses.push(generateExpense(
          lot.id,
          lot.sectorId,
          'operational',
          'Sueldo de vigilante',
          300,
          expenseDate
        ))
        
        expenses.push(generateExpense(
          lot.id,
          lot.sectorId,
          'operational',
          'Mantenimiento del vigilante',
          300,
          expenseDate
        ))
      }
      
      // Gastos de cosecha
      expenses.push(generateExpense(
        lot.id,
        lot.sectorId,
        'harvest',
        'Mallas',
        Math.floor(Math.random() * 500) + 200,
        new Date()
      ))
      
      expenses.push(generateExpense(
        lot.id,
        lot.sectorId,
        'harvest',
        'Buzos',
        Math.floor(Math.random() * 800) + 400,
        new Date()
      ))
    })
    
    MockDB.set('expenses', expenses)
    
    // Generar planes de cosecha con algunos completados
    const harvestPlans = []
    const incomeRecords = []
    
    lots.forEach((lot, index) => {
      const plannedDate = new Date()
      
      // 40% de los planes estarán completados (para mostrar ingresos)
      const isCompleted = index % 5 < 2
      
      if (isCompleted) {
        // Cosechas completadas en el pasado
        plannedDate.setMonth(plannedDate.getMonth() - (index % 3) - 1)
      } else {
        // Cosechas futuras
        plannedDate.setMonth(plannedDate.getMonth() + (index % 3) + 1)
      }
      
      const harvestPlan = generateHarvestPlan(
        lot.sectorId,
        lot.id,
        plannedDate,
        Math.round(lot.currentQuantity * 0.9)
      )
      
      // Si está completada, actualizar sus propiedades y crear registro de ingreso
      if (isCompleted) {
        harvestPlan.status = 'completed'
        harvestPlan.actualDate = plannedDate.toISOString().split('T')[0]
        harvestPlan.actualQuantity = Math.round(harvestPlan.estimatedQuantity * (0.85 + Math.random() * 0.15))
        
        // Distribución realista por tallas (asegurando números enteros)
        const totalQuantity = Math.round(harvestPlan.actualQuantity)
        const xs = Math.floor(totalQuantity * 0.05)
        const s = Math.floor(totalQuantity * 0.15)
        const m = Math.floor(totalQuantity * 0.40)
        const l = Math.floor(totalQuantity * 0.30)
        const xl = Math.floor(totalQuantity * 0.10)
        // Ajustar para que la suma sea exacta
        const distributed = xs + s + m + l + xl
        const difference = totalQuantity - distributed
        
        harvestPlan.sizeDistribution = {
          XS: xs,
          S: s,
          M: m + difference, // Agregar la diferencia a la categoría M (la más común)
          L: l,
          XL: xl
        }
        
        // Calcular ingreso total basado en precios
        const calculateTotalAmount = () => {
          let total = 0
          const priceMap = { XS: 0.5, S: 0.8, M: 1.2, L: 1.8, XL: 2.5 }
          Object.entries(harvestPlan.sizeDistribution).forEach(([size, quantity]) => {
            total += quantity * priceMap[size]
          })
          return total
        }
        
        // Crear registro de ingreso para cosecha completada
        const incomeRecord = {
          id: generateUUID(),
          userId: sectors.find(s => s.id === lot.sectorId)?.userId || maricultor1.id,
          harvestPlanId: harvestPlan.id,
          sectorId: lot.sectorId,
          lotId: lot.id,
          date: harvestPlan.actualDate,
          type: 'harvest_sale',
          description: `Venta de cosecha - ${lot.origin || 'Lote'} - ${Math.round(harvestPlan.actualQuantity)} ejemplares`,
          quantity: harvestPlan.actualQuantity,
          sizeDistribution: harvestPlan.sizeDistribution,
          totalAmount: calculateTotalAmount(),
          currency: 'PEN',
          status: Math.random() > 0.3 ? 'paid' : 'confirmed', // 70% pagados, 30% confirmados
          notes: `Cosecha del sector ${sectors.find(s => s.id === lot.sectorId)?.name || 'N/A'}`,
          metadata: {
            harvestDate: harvestPlan.actualDate,
            averageSize: lot.averageSize,
            cultivationSystem: lot.cultivationSystem || 'suspended'
          },
          createdAt: new Date(plannedDate).toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        incomeRecords.push(incomeRecord)
      }
      
      harvestPlans.push(harvestPlan)
    })
    
    MockDB.set('harvestPlans', harvestPlans)
    MockDB.set('incomeRecords', incomeRecords)
    
    // Generar precios por talla
    const pricing = [
      generatePricing('XS', 0, 30, 0.5),
      generatePricing('S', 30, 40, 0.8),
      generatePricing('M', 40, 50, 1.2),
      generatePricing('L', 50, 60, 1.8),
      generatePricing('XL', 60, 100, 2.5)
    ]
    
    MockDB.set('pricing', pricing)
    
    // Generar categorías de inventario
    const categories = [
      generateCategory('cultivation', 'Sistemas de Cultivo', '🌊', '#0EA5E9'),
      generateCategory('flotation', 'Flotación', '🔵', '#3B82F6'),
      generateCategory('anchoring', 'Anclaje', '⚓', '#6B7280'),
      generateCategory('harvest', 'Cosecha', '🎣', '#10B981'),
      generateCategory('maintenance', 'Mantenimiento', '🔧', '#F59E0B'),
      generateCategory('safety', 'Seguridad', '🦺', '#EF4444'),
      generateCategory('laboratory', 'Laboratorio', '🔬', '#8B5CF6'),
      generateCategory('packaging', 'Empaque', '📦', '#EC4899')
    ]
    
    MockDB.set('inventoryCategories', categories)
    
    // Generar inventario con las categorías correctas
    const inventory = [
      generateInventoryItem('flotation', 'Boyas nacionales', 100, 120, 'units', 'national'),
      generateInventoryItem('flotation', 'Boyas importadas', 50, 45, 'units', 'imported'),
      generateInventoryItem('cultivation', 'Líneas de cultivo', 500, 15, 'meters', 'national'),
      generateInventoryItem('harvest', 'Mallas de cosecha', 200, 25, 'units', 'national'),
      generateInventoryItem('cultivation', 'Sistema de fondo', 10, 500, 'sets', 'national'),
      generateInventoryItem('cultivation', 'Sistema suspendido', 8, 800, 'sets', 'imported'),
      generateInventoryItem('packaging', 'Etiquetas para malla', 1000, 0.5, 'pieces', 'national'),
      generateInventoryItem('anchoring', 'Muertos de concreto', 50, 200, 'units', 'national'),
      generateInventoryItem('safety', 'Chalecos salvavidas', 20, 75, 'units', 'national'),
      generateInventoryItem('laboratory', 'Kit de análisis de agua', 5, 450, 'sets', 'imported'),
      generateInventoryItem('maintenance', 'Herramientas de limpieza', 15, 85, 'sets', 'national'),
      generateInventoryItem('harvest', 'Cajas de transporte', 100, 35, 'units', 'national')
    ]
    
    MockDB.set('inventory', inventory)
    MockDB.set('inventoryMovements', [])
    
    // Generar categorías de costos de cosecha
    const harvestCostCategories = [
      generateHarvestCostCategory(
        'Buzos',
        'Personal especializado para extracción submarina',
        'day',
        800
      ),
      generateHarvestCostCategory(
        'Cámaras de buceo',
        'Equipamiento de buceo profesional',
        'trip',
        300
      ),
      generateHarvestCostCategory(
        'Redes y mallas',
        'Material para contención durante la extracción',
        'unit',
        150
      ),
      generateHarvestCostCategory(
        'Derechos de embarque',
        'Permisos y tasas portuarias',
        'kg',
        2.5
      ),
      generateHarvestCostCategory(
        'Combustible',
        'Combustible para embarcaciones',
        'trip',
        200
      ),
      generateHarvestCostCategory(
        'Transporte terrestre',
        'Traslado desde puerto a planta',
        'kg',
        0.8
      ),
      generateHarvestCostCategory(
        'Hielo y conservación',
        'Material para mantener cadena de frío',
        'kg',
        1.2
      )
    ]
    
    MockDB.set('harvestCostCategories', harvestCostCategories)
    
    // Generar orígenes de semillas por defecto
    const seedOrigins = [
      generateSeedOrigin(
        'Semillero Local',
        3.2,
        4.5,
        11.52,
        'Semillas producidas en criaderos locales de la región de Sechura'
      ),
      generateSeedOrigin(
        'Laboratorio Acuícola del Norte',
        4.1,
        3.2,
        17.28,
        'Semillas de laboratorio especializado con mejores condiciones controladas'
      ),
      generateSeedOrigin(
        'Isla de los Lobos',
        2.8,
        6.1,
        7.68,
        'Semillas silvestres recolectadas de banco natural en Isla de los Lobos'
      ),
      generateSeedOrigin(
        'Criadero Paracas',
        3.7,
        3.8,
        14.40,
        'Semillas de criadero comercial en la región de Ica'
      ),
      generateSeedOrigin(
        'Banco Natural Bahía Independencia',
        2.5,
        7.2,
        5.76,
        'Semillas de extracción directa de bancos naturales'
      ),
      generateSeedOrigin(
        'Laboratorio IMARPE',
        4.5,
        2.8,
        24.00,
        'Semillas de investigación con genética mejorada'
      )
    ]
    
    MockDB.set('seedOrigins', seedOrigins)
    
    // Create sample investments for testing
    const investments = []
    
    // Select some lots to create investments for
    const lotsForInvestment = lots.slice(0, 3) // Take first 3 lots
    
    lotsForInvestment.forEach((lot, index) => {
      const investment = {
        id: `investment-${index + 1}`,
        investorId: investor1.id,
        lotId: lot.id,
        maricultorId: lot.userId || maricultor1.id,
        amount: 5000 + (index * 2000), // 5000, 7000, 9000
        percentage: 20 + (index * 5), // 20%, 25%, 30%
        investmentDate: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString(),
        expectedReturn: (5000 + (index * 2000)) * 1.5,
        status: 'active',
        notes: `Inversión en siembra de ${lot.origin || 'origen desconocido'}`,
        totalDistributed: index === 0 ? 2000 : 0, // First investment has some returns
        distributedReturns: index === 0 ? [{
          date: new Date().toISOString(),
          amount: 2000,
          type: 'harvest',
          notes: 'Primera distribución parcial'
        }] : [],
        createdAt: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      investments.push(investment)
      
      // Update lot with investment info
      const lotIndex = lots.findIndex(l => l.id === lot.id)
      if (lotIndex !== -1) {
        lots[lotIndex].hasInvestors = true
        lots[lotIndex].investmentIds = [investment.id]
        lots[lotIndex].totalInvestment = investment.amount
        lots[lotIndex].ownershipDistribution = {
          [investor1.id]: {
            percentage: investment.percentage,
            amount: investment.amount
          }
        }
      }
    })
    
    MockDB.set('lots', lots) // Update lots with investment info
    MockDB.set('investments', investments)
    
    // GENERATE MOCK DISTRIBUTIONS BASED ON COMPLETED HARVESTS
    console.log('💰 [Seeder] Creating distribution records...')
    
    const distributions = []
    const completedHarvests = harvestPlans.filter(h => h.status === 'completed')
    const allExpenses = MockDB.get('expenses')
    
    completedHarvests.forEach(harvest => {
      // Find investments for this lot
      const lotInvestments = investments.filter(inv => inv.lotId === harvest.lotId)
      
      if (lotInvestments.length > 0) {
        // Calculate harvest financials
        let harvestRevenue = 0
        if (harvest.sizeDistribution) {
          const priceMap = { XS: 0.5, S: 0.8, M: 1.2, L: 1.8, XL: 2.5 }
          Object.entries(harvest.sizeDistribution).forEach(([size, quantity]) => {
            harvestRevenue += quantity * priceMap[size]
          })
        }
        
        // Calculate expenses for this lot
        const lotExpenses = allExpenses.filter(e => e.lotId === harvest.lotId)
        const totalExpenses = lotExpenses.reduce((sum, e) => sum + e.amount, 0)
        const netProfit = harvestRevenue - totalExpenses
        
        console.log(`💰 [Seeder] Creating distributions for harvest ${harvest.id}: Revenue=${harvestRevenue}, Expenses=${totalExpenses}, NetProfit=${netProfit}`)
        
        // Create distribution for each investor
        lotInvestments.forEach(investment => {
          const distributedAmount = Math.max(0, (netProfit * investment.percentage) / 100)
          const roi = investment.amount > 0 ? ((distributedAmount - investment.amount) / investment.amount) * 100 : 0
          
          const distribution = {
            id: generateUUID(),
            harvestPlanId: harvest.id,
            lotId: harvest.lotId,
            maricultorId: investment.maricultorId,
            investmentId: investment.id,
            investorId: investment.investorId,
            distributionDate: new Date(harvest.actualDate).toISOString(),
            harvestRevenue: harvestRevenue,
            harvestExpenses: totalExpenses,
            netProfit: netProfit,
            investmentPercentage: investment.percentage,
            distributedAmount: distributedAmount,
            originalInvestment: investment.amount,
            roi: roi,
            status: Math.random() > 0.2 ? 'paid' : 'pending', // 80% paid, 20% pending
            paymentMethod: Math.random() > 0.5 ? 'bank_transfer' : 'cash',
            paymentDate: Math.random() > 0.2 ? new Date(harvest.actualDate).toISOString() : null,
            paymentReference: Math.random() > 0.2 ? `TXN-${generateUUID().slice(-8).toUpperCase()}` : null,
            notes: `Distribución de retornos - Cosecha ${harvest.actualDate} - ${investment.percentage}% del lote`,
            metadata: {
              autoGenerated: false, // These are seeded data, not auto-generated
              harvestData: {
                actualQuantity: harvest.actualQuantity,
                sizeDistribution: harvest.sizeDistribution
              },
              lotData: {
                origin: lots.find(l => l.id === harvest.lotId)?.origin,
                entryDate: lots.find(l => l.id === harvest.lotId)?.entryDate
              }
            },
            createdAt: new Date(harvest.actualDate).toISOString(),
            updatedAt: new Date(harvest.actualDate).toISOString(),
            createdBy: investment.maricultorId
          }
          
          distributions.push(distribution)
          
          // Update investment with distribution info
          const investmentIndex = investments.findIndex(inv => inv.id === investment.id)
          if (investmentIndex !== -1) {
            investments[investmentIndex].actualReturn = distributedAmount
            investments[investmentIndex].totalDistributed = (investments[investmentIndex].totalDistributed || 0) + distributedAmount
            investments[investmentIndex].lastDistributionDate = distribution.distributionDate
            investments[investmentIndex].distributedReturns = [
              ...(investments[investmentIndex].distributedReturns || []),
              {
                distributionId: distribution.id,
                amount: distributedAmount,
                date: distribution.distributionDate,
                type: 'harvest'
              }
            ]
            // Update investment status based on distribution
            if (distributedAmount > 0 && distribution.status === 'paid') {
              investments[investmentIndex].status = 'completed'
            }
          }
          
          console.log(`✅ [Seeder] Distribution created: ${distributedAmount.toFixed(2)} PEN to investor ${investment.investorId} (${investment.percentage}% - ROI: ${roi.toFixed(2)}%)`)
        })
      }
    })
    
    // ADD HISTORICAL DISTRIBUTIONS FOR MORE DATA RICHNESS
    console.log('💰 [Seeder] Creating additional historical distributions...')
    
    // Create some historical distributions for investments to show progression
    investments.forEach(investment => {
      const numHistoricalDistributions = Math.floor(Math.random() * 3) + 1 // 1-3 historical distributions
      
      for (let i = 0; i < numHistoricalDistributions; i++) {
        // Create dates going back in time
        const distributionDate = new Date()
        distributionDate.setMonth(distributionDate.getMonth() - (i + 1) * 2) // Every 2 months back
        
        // Generate realistic amounts (smaller partial distributions)
        const partialAmount = (investment.amount * 0.15) + (Math.random() * investment.amount * 0.25) // 15-40% of original investment
        const roi = ((partialAmount - investment.amount * 0.8) / (investment.amount * 0.8)) * 100 // ROI based on partial
        
        // Simulate some harvest data
        const simulatedRevenue = investment.amount * (2 + Math.random() * 2) // 200-400% of investment
        const simulatedExpenses = simulatedRevenue * (0.3 + Math.random() * 0.3) // 30-60% of revenue
        const simulatedNetProfit = simulatedRevenue - simulatedExpenses
        
        const historicalDistribution = {
          id: generateUUID(),
          harvestPlanId: null, // Historical, no specific harvest
          lotId: investment.lotId,
          maricultorId: investment.maricultorId,
          investmentId: investment.id,
          investorId: investment.investorId,
          distributionDate: distributionDate.toISOString(),
          harvestRevenue: simulatedRevenue,
          harvestExpenses: simulatedExpenses,
          netProfit: simulatedNetProfit,
          investmentPercentage: investment.percentage,
          distributedAmount: partialAmount,
          originalInvestment: investment.amount,
          roi: roi,
          status: Math.random() > 0.1 ? 'paid' : 'pending', // 90% paid for historical
          paymentMethod: Math.random() > 0.3 ? 'bank_transfer' : 'cash',
          paymentDate: Math.random() > 0.1 ? distributionDate.toISOString() : null,
          paymentReference: Math.random() > 0.1 ? `HST-${generateUUID().slice(-8).toUpperCase()}` : null,
          notes: `Distribución histórica #${i + 1} - ${distributionDate.toLocaleDateString('es-PE')}`,
          metadata: {
            autoGenerated: false,
            historical: true,
            sequence: i + 1
          },
          createdAt: distributionDate.toISOString(),
          updatedAt: distributionDate.toISOString(),
          createdBy: investment.maricultorId
        }
        
        distributions.push(historicalDistribution)
        
        // Update investment totals
        const investmentIndex = investments.findIndex(inv => inv.id === investment.id)
        if (investmentIndex !== -1) {
          investments[investmentIndex].totalDistributed = (investments[investmentIndex].totalDistributed || 0) + partialAmount
          investments[investmentIndex].distributedReturns = [
            ...(investments[investmentIndex].distributedReturns || []),
            {
              distributionId: historicalDistribution.id,
              amount: partialAmount,
              date: distributionDate.toISOString(),
              type: 'partial'
            }
          ]
        }
      }
    })
    
    console.log(`✅ [Seeder] Created ${distributions.length} total distribution records (including historical)`)
    MockDB.set('distributions', distributions)
    MockDB.set('investments', investments) // Update with all distribution info
    
    // Generate sample notifications INCLUDING DISTRIBUTION NOTIFICATIONS
    const notifications = []
    
    // Add notifications for recent distributions
    const recentDistributions = distributions
      .filter(d => d.status === 'paid')
      .sort((a, b) => new Date(b.distributionDate) - new Date(a.distributionDate))
      .slice(0, 5) // Last 5 paid distributions
    
    recentDistributions.forEach((distribution, index) => {
      const lot = lots.find(l => l.id === distribution.lotId)
      const sector = sectors.find(s => s.lots?.some(l => l.id === distribution.lotId))
      
      const distributionNotification = createNotificationFromTemplate('distribution_received', distribution.investorId, {
        amount: distribution.distributedAmount,
        harvestId: distribution.harvestPlanId || generateUUID(),
        distributionId: distribution.id,
        lotName: lot?.lineName || lot?.origin || `Lote ${distribution.lotId.slice(-8)}`,
        percentage: distribution.investmentPercentage,
        roi: distribution.roi.toFixed(2)
      })
      
      notifications.push({
        ...distributionNotification,
        id: generateUUID(),
        createdAt: distribution.distributionDate,
        status: index < 2 ? 'unread' : 'read' // Mark first 2 as unread
      })
    })
    
    // Add notifications for pending distributions
    const pendingDistributions = distributions
      .filter(d => d.status === 'pending')
      .slice(0, 2) // A few pending notifications
    
    pendingDistributions.forEach(distribution => {
      const lot = lots.find(l => l.id === distribution.lotId)
      
      notifications.push({
        id: generateUUID(),
        userId: distribution.investorId,
        type: 'distribution_pending',
        title: 'Distribución Pendiente de Pago',
        message: `Tu distribución de ${distribution.distributedAmount.toFixed(2)} PEN del lote ${lot?.origin || 'N/A'} está pendiente de pago.`,
        data: {
          distributionId: distribution.id,
          amount: distribution.distributedAmount,
          lotName: lot?.origin || 'N/A',
          expectedDate: distribution.distributionDate
        },
        status: 'unread',
        createdAt: distribution.distributionDate,
        updatedAt: distribution.distributionDate
      })
    })
    
    // Add original sample notifications
    
    // Notifications for investor
    const investorNotifications = [
      {
        ...createNotificationFromTemplate('investment_accepted', investor1.id, {
          amount: 15000,
          lotName: 'Lote Primavera 2024',
          investmentId: investments[0]?.id
        }),
        id: generateUUID(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        ...createNotificationFromTemplate('harvest_upcoming', investor1.id, {
          lotName: 'Lote Verano 2024',
          date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-PE'),
          harvestId: generateUUID()
        }),
        id: generateUUID(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        ...createNotificationFromTemplate('distribution_received', investor1.id, {
          amount: 5250.50,
          harvestId: generateUUID(),
          distributionId: generateUUID(),
          lotName: 'Lote Invierno 2023',
          percentage: 35,
          roi: '15.25'
        }),
        id: generateUUID(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        status: 'unread'
      }
    ]
    
    // Notifications for maricultors
    maricultores.forEach(maricultor => {
      const maricultorNotifications = [
        {
          ...createNotificationFromTemplate('harvest_completed', maricultor.id, {
            lotName: lots.find(l => sectors.find(s => s.userId === maricultor.id && s.id === l.sectorId))?.lineName || 'Lote Test',
            harvestId: generateUUID()
          }),
          id: generateUUID(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        {
          ...createNotificationFromTemplate('new_monitoring', maricultor.id, {
            lotName: 'Lote ' + Math.floor(Math.random() * 100),
            monitoringId: generateUUID()
          }),
          id: generateUUID(),
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
          status: 'unread'
        }
      ]
      
      notifications.push(...maricultorNotifications)
    })
    
    // Add high priority notification for maricultor1
    if (maricultor1) {
      notifications.push({
        ...createNotificationFromTemplate('mortality_alert', maricultor1.id, {
          percentage: 15.5,
          lotName: 'Lote Crítico 2024',
          lotId: lots[0]?.id
        }),
        id: generateUUID(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: 'unread'
      })
    }
    
    notifications.push(...investorNotifications)
    
    console.log('🔔 [Seeder] Creating', notifications.length, 'sample notifications')
    MockDB.set('notifications', notifications)
    
    MockDB.setSeedVersion(SEED_VERSION)
    
    console.log(`✅ Database seeded successfully with version ${SEED_VERSION}`)
    console.log(`👥 Users: ${users.length} (including user ${maricultor1.id} and investor ${investor1.id})`)
    console.log(`💰 Income Records: ${incomeRecords.length} records created for completed harvests`)
    console.log(`🏭 Sectors: ${sectors.length}`)
    console.log(`🔋 Batteries: ${batteries.length}`)
    console.log(`📏 Cultivation Lines: ${cultivationLines.length}`)
    console.log(`🎯 Lots: ${lots.length}`)
    console.log(`📊 Monitoring records: ${monitoringRecords.length}`)
    console.log(`💰 Expenses: ${expenses.length}`)
    console.log(`🎣 Harvest plans: ${harvestPlans.length}`)
    console.log(`💵 Pricing categories: ${pricing.length}`)
    console.log(`📦 Inventory items: ${inventory.length}`)
    console.log(`🏷️ Harvest cost categories: ${harvestCostCategories.length}`)
    console.log(`🌱 Seed origins: ${seedOrigins.length}`)
    console.log(`🤝 Investments: ${investments.length}`)
  } catch (error) {
    console.error('Error seeding database:', error)
    console.error('Stack trace:', error.stack)
  }
}