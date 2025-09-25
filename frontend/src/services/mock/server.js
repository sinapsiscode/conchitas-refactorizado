import { MockDB } from './db.js'
import { validateUser } from './schemas/user.js'
import { validateSector, validateLot } from './schemas/sector.js'
import { validateMonitoring } from './schemas/monitoring.js'
import { validateExpense } from './schemas/expense.js'
import { validateHarvestPlan, validatePricing } from './schemas/harvest.js'
import { validateInventory, validateInventoryMovement } from './schemas/inventory.js'
import { validateSeedOrigin } from './schemas/seedOrigin.js'
import { validateIncomeRecord } from './schemas/income.js'
import { validateIncomeStatementClosure } from './schemas/incomeStatementClosure.js'
import { validateDistribution } from './schemas/distribution.js'
import { validateInvestment } from './schemas/investment.js'
import { validateNotification, createNotificationFromTemplate } from './schemas/notification.js'
import { createInvestorInvitation, INVITATION_STATUSES } from './schemas/investorInvitation.js'
import { validateCultivationLine } from './schemas/cultivationLine.js'
import { validateBattery } from './schemas/battery.js'
import { generateUUID } from '../../utils/uuid.js'

const API_DELAY_MIN = 100
const API_DELAY_MAX = 600
const ERROR_RATE = 0.0

const delay = () => {
  const ms = Math.random() * (API_DELAY_MAX - API_DELAY_MIN) + API_DELAY_MIN
  return new Promise(resolve => setTimeout(resolve, ms))
}

const shouldSimulateError = () => Math.random() < ERROR_RATE

const createResponse = (data = null, success = true, message = '', status = 200) => ({
  success,
  data,
  message,
  status,
  timestamp: new Date().toISOString()
})

const createErrorResponse = (message, status = 500) => 
  createResponse(null, false, message, status)

export const MockAPI = {
  async authenticate(email, password) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const users = MockDB.get('users')
    console.log('🔐 [Auth] Attempting login with email:', email)
    console.log('🔐 [Auth] Available users:', users.map(u => ({ email: u.email, role: u.role, status: u.status })))
    
    const user = users.find(u => u.email === email && u.password === password)
    
    if (!user) {
      console.log('❌ [Auth] Login failed - no matching user for:', email)
      throw createErrorResponse('Credenciales incorrectas', 401)
    }
    
    if (user.status !== 'approved') {
      throw createErrorResponse('Usuario pendiente de aprobación', 403)
    }
    
    const { password: _, ...userWithoutPassword } = user
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }))
    
    return createResponse({ user: userWithoutPassword, token })
  },
  
  async register(userData) {
    console.log('🔍 [MockAPI] register: Starting registration with data:', userData)
    await delay()
    
    if (shouldSimulateError()) {
      console.log('❌ [MockAPI] register: Simulating error')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    console.log('🔍 [MockAPI] register: Validating user data...')
    const errors = validateUser(userData)
    if (errors.length > 0) {
      console.error('❌ [MockAPI] register: Validation errors:', errors)
      throw createErrorResponse(errors.join(', '), 400)
    }
    console.log('✅ [MockAPI] register: Validation passed')
    
    const users = MockDB.get('users')
    console.log('🔍 [MockAPI] register: Current users count:', users.length)
    
    const existingUser = users.find(u => u.email === userData.email)
    
    if (existingUser) {
      console.error('❌ [MockAPI] register: Email already exists:', existingUser.email)
      throw createErrorResponse('El correo ya está registrado', 409)
    }
    
    const newUser = {
      ...userData,
      id: generateUUID(),
      status: userData.status || 'pending',  // Respetar status si viene definido
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    console.log('🔍 [MockAPI] register: Created new user object:', newUser)
    
    MockDB.add('users', newUser)
    console.log('✅ [MockAPI] register: User added to MockDB')
    
    // Verify it was added to localStorage
    const usersAfterAdd = JSON.parse(localStorage.getItem('mock_users') || '[]')
    console.log('🔍 [MockAPI] register: Users in localStorage after add:', usersAfterAdd.length)
    const justAdded = usersAfterAdd.find(u => u.email === userData.email)
    console.log('🔍 [MockAPI] register: Just added user found in localStorage?', !!justAdded)
    if (justAdded) {
      console.log('🔍 [MockAPI] register: Added user details:', { 
        id: justAdded.id, 
        email: justAdded.email, 
        role: justAdded.role, 
        maricultorId: justAdded.maricultorId,
        status: justAdded.status 
      })
    }
    
    const { password: _, ...userWithoutPassword } = newUser
    console.log('✅ [MockAPI] register: Registration completed successfully')
    return createResponse(userWithoutPassword, true, 'Usuario registrado exitosamente')
  },
  
  async getUsers(page = 1, limit = 10, filters = {}) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let users = MockDB.get('users')
    
    if (filters.role) {
      users = users.filter(u => u.role === filters.role)
    }
    
    if (filters.status) {
      users = users.filter(u => u.status === filters.status)
    }
    
    const total = users.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = users.slice(startIndex, endIndex)
    
    const usersWithoutPasswords = paginatedUsers.map(({ password, ...user }) => user)
    
    return createResponse({
      users: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  },
  
  async getSectors(userId, page = 1, limit = 10) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let sectors = MockDB.get('sectors')
    
    if (userId) {
      sectors = sectors.filter(s => s.userId === userId)
    }
    
    const total = sectors.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedSectors = sectors.slice(startIndex, endIndex)
    
    const lots = MockDB.get('lots')
    const sectorsWithLots = paginatedSectors.map(sector => ({
      ...sector,
      lots: lots.filter(l => l.sectorId === sector.id)
    }))
    
    return createResponse({
      sectors: sectorsWithLots,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  },

  async getAllSectors() {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const sectors = MockDB.get('sectors')
    const lots = MockDB.get('lots')
    
    const sectorsWithLots = sectors.map(sector => ({
      ...sector,
      lots: lots.filter(l => l.sectorId === sector.id)
    }))
    
    return createResponse(sectorsWithLots)
  },
  
  async createSector(sectorData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateSector(sectorData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const newSector = {
      ...sectorData,
      id: generateUUID(),
      status: sectorData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('sectors', newSector)
    return createResponse(newSector, true, 'Sector creado exitosamente')
  },

  // Funciones de Baterías
  async getBatteries(sectorId) {
    await delay()

    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }

    const batteries = MockDB.get('batteries').filter(battery => battery.sectorId === sectorId)

    return createResponse(batteries, true, 'Baterías obtenidas exitosamente')
  },

  async createBattery(batteryData) {
    await delay()

    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }

    const errors = validateBattery(batteryData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }

    const newBattery = {
      ...batteryData,
      id: generateUUID(),
      status: batteryData.status || 'active',
      totalLines: batteryData.totalLines || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    MockDB.add('batteries', newBattery)
    return createResponse(newBattery, true, 'Batería creada exitosamente')
  },

  async updateBattery(batteryId, batteryData) {
    await delay()

    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }

    const batteries = MockDB.get('batteries')
    const batteryIndex = batteries.findIndex(battery => battery.id === batteryId)

    if (batteryIndex === -1) {
      throw createErrorResponse('Batería no encontrada', 404)
    }

    const errors = validateBattery({ ...batteries[batteryIndex], ...batteryData })
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }

    const updatedBattery = {
      ...batteries[batteryIndex],
      ...batteryData,
      updatedAt: new Date().toISOString()
    }

    batteries[batteryIndex] = updatedBattery
    MockDB.set('batteries', batteries)

    return createResponse(updatedBattery, true, 'Batería actualizada exitosamente')
  },

  async deleteBattery(batteryId) {
    await delay()

    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }

    const batteries = MockDB.get('batteries')
    const batteryIndex = batteries.findIndex(battery => battery.id === batteryId)

    if (batteryIndex === -1) {
      throw createErrorResponse('Batería no encontrada', 404)
    }

    // Verificar si hay líneas de cultivo asociadas
    const cultivationLines = MockDB.get('cultivationLines')
    const associatedLines = cultivationLines.filter(line => line.batteryId === batteryId)

    if (associatedLines.length > 0) {
      throw createErrorResponse('No se puede eliminar la batería porque tiene líneas de cultivo asociadas', 409)
    }

    batteries.splice(batteryIndex, 1)
    MockDB.set('batteries', batteries)

    return createResponse(null, true, 'Batería eliminada exitosamente')
  },

  async createLot(lotData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateLot(lotData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const sector = MockDB.findById('sectors', lotData.sectorId)
    if (!sector) {
      throw createErrorResponse('Sector no encontrado', 404)
    }

    // Procesar items del inventario (incluye boyas y otros materiales)
    let buoyInventoryIds = []
    let totalBuoyCount = 0
    let processedInventoryItems = []

    // Procesar todos los items del inventario seleccionados
    if (lotData.inventoryItems && lotData.inventoryItems.length > 0) {
      const inventory = MockDB.get('inventory') || []

      for (const requestedItem of lotData.inventoryItems) {
        // Buscar el item en el inventario
        const inventoryItem = inventory.find(item => item.id === requestedItem.id)

        if (!inventoryItem) {
          throw createErrorResponse(`Item de inventario con ID ${requestedItem.id} no encontrado`, 404)
        }

        const quantityNeeded = requestedItem.quantity || 0

        if (quantityNeeded <= 0) {
          continue // Saltar items sin cantidad
        }

        if (inventoryItem.quantity < quantityNeeded) {
          throw createErrorResponse(`No hay suficiente cantidad del item "${inventoryItem.name}". Disponible: ${inventoryItem.quantity}, Necesario: ${quantityNeeded}`, 400)
        }

        // Reducir inventario
        inventoryItem.quantity -= quantityNeeded

        // Si es una boya, contarla para el total de boyas
        if (inventoryItem.name && (
          inventoryItem.name.toLowerCase().includes('boya') ||
          inventoryItem.name.toLowerCase().includes('buoy')
        )) {
          totalBuoyCount += quantityNeeded
          buoyInventoryIds.push({
            inventoryId: inventoryItem.id,
            quantity: quantityNeeded,
            name: inventoryItem.name,
            unitCost: inventoryItem.unitCost || 0
          })
        }

        // Agregar al procesado
        processedInventoryItems.push({
          inventoryId: inventoryItem.id,
          quantity: quantityNeeded,
          name: inventoryItem.name,
          unitCost: inventoryItem.unitCost || 0
        })

        // Crear movimiento de inventario
        const movement = {
          id: generateUUID(),
          inventoryId: inventoryItem.id,
          type: 'outgoing',
          quantity: quantityNeeded,
          previousQuantity: inventoryItem.quantity + quantityNeeded,
          newQuantity: inventoryItem.quantity,
          reason: 'Asignación a siembra',
          description: `${inventoryItem.name} asignado(a) al lote ${lotData.origin || 'N/A'}`,
          relatedLotId: generateUUID(), // Se actualizará después
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const movements = MockDB.get('inventoryMovements') || []
        movements.unshift(movement)
        MockDB.set('inventoryMovements', movements)
      }

      // Actualizar inventario
      MockDB.set('inventory', inventory)
    }

    const newLot = {
      ...lotData,
      id: generateUUID(),
      currentQuantity: lotData.initialQuantity,
      status: lotData.status || 'seeded',
      buoysUsed: totalBuoyCount,
      buoyInventoryIds,
      processedInventoryItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Actualizar movimientos con el ID real del lote
    if (processedInventoryItems.length > 0) {
      const movements = MockDB.get('inventoryMovements') || []
      movements.forEach(movement => {
        if (movement.relatedLotId && !MockDB.findById('lots', movement.relatedLotId)) {
          movement.relatedLotId = newLot.id
        }
      })
      MockDB.set('inventoryMovements', movements)
    }

    MockDB.add('lots', newLot)
    return createResponse(newLot, true, 'Lote creado exitosamente')
  },
  
  async updateLot(lotId, lotData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingLot = MockDB.findById('lots', lotId)
    if (!existingLot) {
      throw createErrorResponse('Lote no encontrado', 404)
    }
    
    const errors = validateLot({ ...existingLot, ...lotData })
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const updatedLot = {
      ...existingLot,
      ...lotData,
      id: lotId,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('lots', lotId, updatedLot)
    return createResponse(updatedLot, true, 'Lote actualizado exitosamente')
  },
  
  async getMonitoring(lotId, startDate, endDate) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let monitoring = MockDB.get('monitoring')
    
    if (lotId) {
      monitoring = monitoring.filter(m => m.lotId === lotId)
    }
    
    if (startDate) {
      monitoring = monitoring.filter(m => m.date >= startDate)
    }
    
    if (endDate) {
      monitoring = monitoring.filter(m => m.date <= endDate)
    }

    // Sort by date descending
    monitoring.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
    
    return createResponse(monitoring)
  },

  async getAllMonitoring() {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const monitoring = MockDB.get('monitoring')
    
    // Sort by date descending
    monitoring.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
    
    monitoring.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return createResponse(monitoring)
  },
  
  async createMonitoring(monitoringData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateMonitoring(monitoringData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const lot = MockDB.findById('lots', monitoringData.lotId)
    if (!lot) {
      throw createErrorResponse('Lote no encontrado', 404)
    }
    
    const newMonitoring = {
      ...monitoringData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    }
    
    MockDB.add('monitoring', newMonitoring)
    
    if (monitoringData.currentQuantity !== lot.currentQuantity) {
      MockDB.update('lots', lot.id, { 
        currentQuantity: monitoringData.currentQuantity 
      })
    }
    
    return createResponse(newMonitoring, true, 'Monitoreo registrado exitosamente')
  },

  async updateMonitoring(recordId, additionalData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingRecord = MockDB.findById('monitoring', recordId)
    if (!existingRecord) {
      throw createErrorResponse('Registro de monitoreo no encontrado', 404)
    }
    
    // Combinar los puntos de medición existentes con los nuevos
    const existingPoints = existingRecord.measurementPoints || []
    const newPoints = additionalData.measurementPoints || []
    const combinedPoints = [...existingPoints, ...newPoints]
    
    // Recalcular los promedios con todos los puntos
    const calculateAverages = (points) => {
      const validPoints = points.filter(point => 
        point.averageSize || point.maxSize || point.minSize || 
        point.waterTemperature || point.salinity || point.pH || point.oxygenLevel
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
        minSize: Math.min(...validPoints.map(p => parseFloat(p.minSize)).filter(v => !isNaN(v))),
        waterTemperature: calculateAvg('waterTemperature'),
        salinity: calculateAvg('salinity'),
        pH: calculateAvg('pH'),
        oxygenLevel: calculateAvg('oxygenLevel')
      }
    }
    
    const averages = calculateAverages(combinedPoints)
    
    const updatedRecord = {
      ...existingRecord,
      measurementPoints: combinedPoints,
      totalPoints: combinedPoints.length,
      averageSize: averages.averageSize,
      maxSize: isFinite(averages.maxSize) ? averages.maxSize : existingRecord.maxSize,
      minSize: isFinite(averages.minSize) ? averages.minSize : existingRecord.minSize,
      waterTemperature: averages.waterTemperature || existingRecord.waterTemperature,
      salinity: averages.salinity || existingRecord.salinity,
      pH: averages.pH || existingRecord.pH,
      oxygenLevel: averages.oxygenLevel || existingRecord.oxygenLevel,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('monitoring', recordId, updatedRecord)
    
    return createResponse(updatedRecord, true, 'Puntos de medición agregados exitosamente')
  },
  
  async getExpenses(filters = {}) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let expenses = MockDB.get('expenses')
    
    if (filters.lotId) {
      expenses = expenses.filter(e => e.lotId === filters.lotId)
    }
    
    if (filters.sectorId) {
      expenses = expenses.filter(e => e.sectorId === filters.sectorId)
    }
    
    if (filters.category) {
      expenses = expenses.filter(e => e.category === filters.category)
    }
    
    if (filters.startDate) {
      expenses = expenses.filter(e => e.date >= filters.startDate)
    }
    
    if (filters.endDate) {
      expenses = expenses.filter(e => e.date <= filters.endDate)
    }
    
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return createResponse(expenses)
  },
  
  async createExpense(expenseData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateExpense(expenseData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const newExpense = {
      ...expenseData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('expenses', newExpense)
    return createResponse(newExpense, true, 'Gasto registrado exitosamente')
  },
  
  async getHarvestPlans(userId = null, sectorId = null) {
    console.log('🔍 [MockAPI] Getting harvest plans for user:', userId, 'sector:', sectorId)
    await delay()
    
    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in getHarvestPlans')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let plans = MockDB.get('harvestPlans')
    console.log('📋 [MockAPI] Found', plans.length, 'total harvest plans in database')
    
    // Filtrar por userId si se proporciona
    if (userId) {
      // Verificar si el usuario es un inversor
      const user = MockDB.findBy('users', { id: userId })[0]
      
      if (user && user.role === 'investor') {
        // Para inversores, filtrar por los lotes en los que han invertido
        const userInvestments = MockDB.findBy('investments', { investorId: userId })
        const investorLotIds = userInvestments.map(inv => inv.lotId).filter(Boolean)
        console.log('💰 [MockAPI] Investor lot IDs:', investorLotIds)
        plans = plans.filter(p => investorLotIds.includes(p.lotId))
        console.log('📋 [MockAPI] Filtered to', plans.length, 'plans for investor', userId)
      } else {
        // Para maricultores, filtrar por sectores que poseen
        const userSectors = MockDB.findBy('sectors', { userId })
        const userSectorIds = userSectors.map(s => s.id)
        console.log('🏭 [MockAPI] User sectors:', userSectorIds)
        plans = plans.filter(p => userSectorIds.includes(p.sectorId))
        console.log('📋 [MockAPI] Filtered to', plans.length, 'plans for user', userId)
      }
    }
    
    // Filtrar por sectorId específico si se proporciona
    if (sectorId) {
      plans = plans.filter(p => p.sectorId === sectorId)
      console.log('📋 [MockAPI] Filtered to', plans.length, 'plans for sector', sectorId)
    }
    
    plans.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate))

    console.log('📋 [MockAPI] FINAL PLANS TO RETURN:')
    plans.forEach((plan, index) => {
      console.log(`📋 [MockAPI] Plan ${index + 1}:`, {
        id: plan.id,
        status: plan.status,
        plannedDate: plan.plannedDate,
        estimatedQuantity: plan.estimatedQuantity,
        estimatedQuantityType: typeof plan.estimatedQuantity,
        isValidNumber: !isNaN(parseFloat(plan.estimatedQuantity))
      })
    })

    return createResponse(plans)
  },
  
  async createHarvestPlan(planData) {
    console.log('💾 [MockAPI] Creating harvest plan - estimatedQuantity:', planData.estimatedQuantity, 'type:', typeof planData.estimatedQuantity)
    console.log('💾 [MockAPI] Full plan data:', planData)
    await delay()
    
    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in createHarvestPlan')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateHarvestPlan(planData)
    if (errors.length > 0) {
      console.error('❌ [MockAPI] Validation errors:', errors)
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const sector = MockDB.findById('sectors', planData.sectorId)
    console.log('🔍 Looking for sector:', planData.sectorId)
    console.log('🔍 Found sector:', sector ? {id: sector.id, name: sector.name, lotsCount: sector.lots?.length || 0} : 'null')
    
    if (!sector) {
      throw createErrorResponse('Sector no encontrado', 404)
    }
    
    console.log('🔍 Looking for lot:', planData.lotId)
    console.log('🔍 Available lots in sector:', sector.lots?.map(l => ({id: l.id, origin: l.origin, status: l.status})) || [])
    
    // Buscar el lote dentro del sector (los lotes están almacenados dentro de los sectores)
    const lot = sector.lots?.find(l => l.id === planData.lotId)
    console.log('🔍 Found lot in sector:', lot ? {id: lot.id, origin: lot.origin, status: lot.status} : 'null')
    
    if (!lot) {
      // Fallback: buscar el lote en todos los sectores si no se encuentra en el sector especificado
      const allSectors = MockDB.get('sectors')
      const foundInOtherSector = allSectors.find(s => s.lots?.some(l => l.id === planData.lotId))
      
      console.error('❌ Lot not found in specified sector. Lot exists in other sector:', !!foundInOtherSector)
      console.error('Available lot IDs in sector:', sector.lots?.map(l => l.id) || [])
      
      throw createErrorResponse('Lote no encontrado en el sector especificado', 404)
    }
    
    const existingPlans = MockDB.findBy('harvestPlans', { 
      sectorId: planData.sectorId,
      status: 'planned'
    })
    
    const conflictingPlan = existingPlans.find(plan => {
      const planDate = new Date(plan.plannedDate)
      const newDate = new Date(planData.plannedDate)
      const dayDiff = Math.abs(planDate - newDate) / (1000 * 60 * 60 * 24)
      return dayDiff < 7
    })
    
    if (conflictingPlan) {
      throw createErrorResponse('Ya existe una cosecha planificada para fechas cercanas en este sector', 409)
    }
    
    const newPlan = {
      ...planData,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('💾 [MockAPI] New plan object - estimatedQuantity:', newPlan.estimatedQuantity, 'type:', typeof newPlan.estimatedQuantity)
    console.log('💾 [MockAPI] Complete new plan:', newPlan)

    MockDB.add('harvestPlans', newPlan)
    console.log('💾 [MockAPI] Harvest plan created successfully:', newPlan.id)
    return createResponse(newPlan, true, 'Plan de cosecha creado exitosamente')
  },
  
  async getPricing() {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const pricing = MockDB.get('pricing')
    const activePricing = pricing.filter(p => p.isActive)
    
    return createResponse(activePricing)
  },
  
  async createPricing(pricingData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validatePricing(pricingData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const newPricing = {
      ...pricingData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    }
    
    MockDB.add('pricing', newPricing)
    return createResponse(newPricing, true, 'Precio registrado exitosamente')
  },

  async getHarvestCostCategories() {
    console.log('💰 [MockAPI] Getting harvest cost categories')
    await delay()
    
    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in getHarvestCostCategories')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const categories = MockDB.get('harvestCostCategories')
    console.log('💰 [MockAPI] Found', categories.length, 'total categories in database')
    
    const activeCategories = categories.filter(c => c.isActive)
    console.log('💰 [MockAPI] Filtered to', activeCategories.length, 'active categories')
    
    return createResponse(activeCategories)
  },

  async createHarvestCostCategory(categoryData) {
    console.log('💰 [MockAPI] Creating harvest cost category:', categoryData)
    await delay()

    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in createHarvestCostCategory')
      throw createErrorResponse('Error del servidor', 500)
    }

    const categories = MockDB.get('harvestCostCategories')
    const newCategory = {
      id: generateUUID(),
      ...categoryData,
      createdAt: new Date().toISOString()
    }

    categories.push(newCategory)
    MockDB.set('harvestCostCategories', categories)

    console.log('💰 [MockAPI] Harvest cost category created successfully:', newCategory.id)
    return createResponse(newCategory)
  },

  async updateHarvestCostCategory(categoryId, updateData) {
    console.log('💰 [MockAPI] Updating harvest cost category:', categoryId)
    await delay()

    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in updateHarvestCostCategory')
      throw createErrorResponse('Error del servidor', 500)
    }

    const categories = MockDB.get('harvestCostCategories')
    const categoryIndex = categories.findIndex(c => c.id === categoryId)

    if (categoryIndex === -1) {
      throw createErrorResponse('Categoría de costo no encontrada', 404)
    }

    categories[categoryIndex] = {
      ...categories[categoryIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    MockDB.set('harvestCostCategories', categories)

    console.log('💰 [MockAPI] Harvest cost category updated successfully:', categoryId)
    return createResponse(categories[categoryIndex])
  },

  async deleteHarvestCostCategory(categoryId) {
    console.log('💰 [MockAPI] Deleting harvest cost category:', categoryId)
    await delay()

    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in deleteHarvestCostCategory')
      throw createErrorResponse('Error del servidor', 500)
    }

    const categories = MockDB.get('harvestCostCategories')
    const categoryIndex = categories.findIndex(c => c.id === categoryId)

    if (categoryIndex === -1) {
      throw createErrorResponse('Categoría de costo no encontrada', 404)
    }

    categories.splice(categoryIndex, 1)
    MockDB.set('harvestCostCategories', categories)

    console.log('💰 [MockAPI] Harvest cost category deleted successfully:', categoryId)
    return createResponse({ message: 'Categoría de costo eliminada exitosamente' })
  },

  async updateHarvestPlan(planData) {
    console.log('✏️ [MockAPI] Updating harvest plan:', planData.id, 'with data:', planData)
    await delay()
    
    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in updateHarvestPlan')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingPlan = MockDB.findById('harvestPlans', planData.id)
    if (!existingPlan) {
      console.error('❌ [MockAPI] Harvest plan not found:', planData.id)
      throw createErrorResponse('Plan de cosecha no encontrado', 404)
    }
    
    const updatedPlan = {
      ...existingPlan,
      ...planData,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('harvestPlans', planData.id, updatedPlan)
    console.log('✏️ [MockAPI] Harvest plan updated successfully:', updatedPlan.id)
    
    // FLUJO DE CAJA: Automatically create income record when harvest is completed
    if (updatedPlan.status === 'completed' && existingPlan.status !== 'completed') {
      console.log('🎣💰 [MockAPI] Harvest completed - automatically registering income')
      
      try {
        // Get sector information
        const sectors = MockDB.get('sectors')
        const sectorData = sectors.find(s => s.id === updatedPlan.sectorId)
        
        // Get current pricing data
        const pricing = MockDB.get('pricing')
        
        if (sectorData && pricing.length > 0) {
          // Create income record from harvest
          const incomeResult = await this.createIncomeFromHarvest(updatedPlan, sectorData, pricing)
          console.log('✅ [MockAPI] Income record created automatically:', incomeResult.data.id)
          
          // DISTRIBUCIÓN AUTOMÁTICA: Distribute returns to investors when harvest is completed
          try {
            console.log('💰📊 [MockAPI] Starting automatic distribution of returns to investors')
            const distributionResults = await this.distributeReturnsToInvestors(updatedPlan, incomeResult.data, sectorData)
            console.log('✅ [MockAPI] Returns distributed to investors:', distributionResults.length, 'distributions created')
          } catch (distError) {
            console.error('❌ [MockAPI] Error distributing returns to investors:', distError)
            // Don't fail the harvest if distribution fails - income is already recorded
          }
        } else {
          console.warn('⚠️ [MockAPI] Could not create income record - missing sector or pricing data')
        }
      } catch (incomeError) {
        console.error('❌ [MockAPI] Error creating automatic income record:', incomeError)
        // Don't fail the harvest update if income creation fails
        // Just log the error and continue
      }
    }
    
    return createResponse(updatedPlan, true, 'Plan de cosecha actualizado exitosamente')
  },

  async deleteHarvestPlan(planId) {
    console.log('🗑️ [MockAPI] Deleting harvest plan:', planId)
    await delay()
    
    if (shouldSimulateError()) {
      console.error('❌ [MockAPI] Simulating error in deleteHarvestPlan')
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingPlan = MockDB.findById('harvestPlans', planId)
    if (!existingPlan) {
      console.error('❌ [MockAPI] Harvest plan not found:', planId)
      throw createErrorResponse('Plan de cosecha no encontrado', 404)
    }

    // Solo permitir eliminar planes en estado 'planning'
    if (existingPlan.status !== 'planning') {
      console.error('❌ [MockAPI] Cannot delete plan - invalid status:', existingPlan.status)
      throw createErrorResponse('Solo se pueden eliminar planes en estado de planificación', 400)
    }
    
    MockDB.delete('harvestPlans', planId)
    console.log('🗑️ [MockAPI] Harvest plan deleted successfully:', planId)
    return createResponse(null, true, 'Plan de cosecha eliminado exitosamente')
  },
  
  async getInventory() {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const inventory = MockDB.get('inventory')
    return createResponse(inventory)
  },
  
  async createInventoryItem(itemData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateInventory(itemData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const newItem = {
      ...itemData,
      id: generateUUID(),
      totalValue: itemData.quantity * itemData.unitCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('inventory', newItem)
    return createResponse(newItem, true, 'Item de inventario creado exitosamente')
  },

  async updateInventoryItem(itemId, itemData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingItem = MockDB.findById('inventory', itemId)
    if (!existingItem) {
      throw createErrorResponse('Item de inventario no encontrado', 404)
    }
    
    const errors = validateInventory(itemData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const updatedItem = {
      ...existingItem,
      ...itemData,
      totalValue: itemData.quantity * itemData.unitCost,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('inventory', itemId, updatedItem)
    return createResponse(updatedItem, true, 'Item de inventario actualizado exitosamente')
  },
  
  async createInventoryMovement(movementData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateInventoryMovement(movementData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const item = MockDB.findById('inventory', movementData.inventoryId)
    if (!item) {
      throw createErrorResponse('Item de inventario no encontrado', 404)
    }
    
    const newQuantity = movementData.type === 'in'
      ? item.quantity + movementData.quantity
      : item.quantity - movementData.quantity
    
    if (newQuantity < 0) {
      throw createErrorResponse('No hay suficiente inventario disponible', 400)
    }
    
    const movement = {
      ...movementData,
      id: generateUUID(),
      previousQuantity: item.quantity,
      newQuantity,
      date: new Date().toISOString()
    }
    
    MockDB.add('inventoryMovements', movement)
    MockDB.update('inventory', item.id, { 
      quantity: newQuantity,
      updatedAt: new Date().toISOString()
    })
    
    return createResponse(movement, true, 'Movimiento de inventario registrado')
  },

  async getSeedOrigins() {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const seedOrigins = MockDB.get('seedOrigins')
    return createResponse(seedOrigins)
  },

  async createSeedOrigin(originData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateSeedOrigin(originData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    // Check for duplicate name
    const existingOrigins = MockDB.get('seedOrigins')
    const existingOrigin = existingOrigins.find(origin => 
      origin.name.toLowerCase() === originData.name.toLowerCase()
    )
    
    if (existingOrigin) {
      throw createErrorResponse('Ya existe un origen con este nombre', 409)
    }
    
    const newOrigin = {
      ...originData,
      id: generateUUID(),
      monthlyGrowthRate: parseFloat(originData.monthlyGrowthRate),
      monthlyMortalityRate: parseFloat(originData.monthlyMortalityRate),
      pricePerUnit: parseFloat(originData.pricePerUnit),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('seedOrigins', newOrigin)
    return createResponse(newOrigin, true, 'Origen de semilla creado exitosamente')
  },

  async updateSeedOrigin(originId, updatedData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingOrigin = MockDB.findById('seedOrigins', originId)
    if (!existingOrigin) {
      throw createErrorResponse('Origen de semilla no encontrado', 404)
    }
    
    const errors = validateSeedOrigin(updatedData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    // Check for duplicate name (excluding current origin)
    const allOrigins = MockDB.get('seedOrigins')
    const duplicateOrigin = allOrigins.find(origin => 
      origin.id !== originId && 
      origin.name.toLowerCase() === updatedData.name.toLowerCase()
    )
    
    if (duplicateOrigin) {
      throw createErrorResponse('Ya existe un origen con este nombre', 409)
    }
    
    const updatedOrigin = {
      ...existingOrigin,
      ...updatedData,
      monthlyGrowthRate: parseFloat(updatedData.monthlyGrowthRate),
      monthlyMortalityRate: parseFloat(updatedData.monthlyMortalityRate),
      pricePerUnit: parseFloat(updatedData.pricePerUnit),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('seedOrigins', originId, updatedOrigin)
    return createResponse(updatedOrigin, true, 'Origen de semilla actualizado exitosamente')
  },

  async deleteSeedOrigin(originId) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingOrigin = MockDB.findById('seedOrigins', originId)
    if (!existingOrigin) {
      throw createErrorResponse('Origen de semilla no encontrado', 404)
    }
    
    // Check if origin is being used in any seedings
    const lots = MockDB.get('lots')
    const isInUse = lots.some(lot => lot.origin === existingOrigin.name)
    
    if (isInUse) {
      throw createErrorResponse('No se puede eliminar este origen porque está siendo usado en siembras existentes', 400)
    }
    
    MockDB.delete('seedOrigins', originId)
    return createResponse(null, true, 'Origen de semilla eliminado exitosamente')
  },
  
  // Cultivation Lines Management
  async getCultivationLines(sectorId, batteryId = null) {
    await delay()

    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }

    let lines = MockDB.get('cultivationLines') || []

    if (sectorId) {
      lines = lines.filter(line => line.sectorId === sectorId)
    }

    if (batteryId) {
      lines = lines.filter(line => line.batteryId === batteryId)
    }

    return createResponse(lines)
  },
  
  async createCultivationLine(lineData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateCultivationLine(lineData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const existingLines = MockDB.get('cultivationLines') || []
    const batteryLines = existingLines.filter(line => line.batteryId === lineData.batteryId)

    if (batteryLines.some(line => line.lineNumber === lineData.lineNumber)) {
      throw createErrorResponse(`Ya existe una línea con el número ${lineData.lineNumber} en esta batería`, 400)
    }
    
    const newLine = {
      id: generateUUID(),
      ...lineData,
      totalSystems: lineData.totalSystems || 100,
      floorsPerSystem: lineData.floorsPerSystem || 10,
      occupiedSystems: lineData.occupiedSystems || [],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (!MockDB.get('cultivationLines')) {
      MockDB.set('cultivationLines', [])
    }
    
    MockDB.add('cultivationLines', newLine)
    
    return createResponse(newLine)
  },
  
  async updateCultivationLine(lineId, lineData) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingLine = MockDB.findById('cultivationLines', lineId)
    if (!existingLine) {
      throw createErrorResponse('Línea de cultivo no encontrada', 404)
    }
    
    const errors = validateCultivationLine({ ...existingLine, ...lineData })
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const allLines = MockDB.get('cultivationLines') || []
    const batteryLines = allLines.filter(line =>
      line.batteryId === existingLine.batteryId && line.id !== lineId
    )

    if (lineData.lineNumber && batteryLines.some(line => line.lineNumber === lineData.lineNumber)) {
      throw createErrorResponse(`Ya existe una línea con el número ${lineData.lineNumber} en esta batería`, 400)
    }
    
    const updatedLine = {
      ...existingLine,
      ...lineData,
      updatedAt: new Date().toISOString()
    }
    
    const occupationRate = (updatedLine.occupiedSystems?.length || 0) / updatedLine.totalSystems
    if (occupationRate === 0) {
      updatedLine.status = 'available'
    } else if (occupationRate === 1) {
      updatedLine.status = 'full'
    } else {
      updatedLine.status = 'partial'
    }
    
    MockDB.update('cultivationLines', lineId, updatedLine)
    
    return createResponse(updatedLine)
  },
  
  async deleteCultivationLine(lineId) {
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingLine = MockDB.findById('cultivationLines', lineId)
    if (!existingLine) {
      throw createErrorResponse('Línea de cultivo no encontrada', 404)
    }
    
    const lots = MockDB.get('lots') || []
    const isInUse = lots.some(lot => lot.lineId === lineId)
    
    if (isInUse) {
      throw createErrorResponse('No se puede eliminar esta línea porque tiene siembras activas', 400)
    }
    
    MockDB.delete('cultivationLines', lineId)
    
    return createResponse({ id: lineId })
  },

  // Income Records Management
  async getIncomeRecords(userId = null, filters = {}) {
    console.log('💰 [MockAPI] Fetching income records for user:', userId, 'filters:', filters)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let incomeRecords = MockDB.get('incomeRecords')
    
    if (userId) {
      incomeRecords = incomeRecords.filter(record => record.userId === userId)
    }
    
    // Apply filters
    if (filters.status) {
      incomeRecords = incomeRecords.filter(record => record.status === filters.status)
    }
    
    if (filters.type) {
      incomeRecords = incomeRecords.filter(record => record.type === filters.type)
    }
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      incomeRecords = incomeRecords.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= start && recordDate <= end
      })
    }
    
    // Sort by date descending
    incomeRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    console.log('💰 [MockAPI] Found', incomeRecords.length, 'income records')
    return createResponse(incomeRecords)
  },

  async createIncomeRecord(recordData) {
    console.log('💾 [MockAPI] Creating income record:', recordData)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateIncomeRecord(recordData)
    if (errors.length > 0) {
      throw createErrorResponse(`Datos inválidos: ${errors.join(', ')}`, 400)
    }
    
    const newRecord = {
      id: generateUUID(),
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('incomeRecords', newRecord)
    console.log('💾 [MockAPI] Income record created successfully:', newRecord.id)
    return createResponse(newRecord, true, 'Registro de ingreso creado exitosamente')
  },

  async updateIncomeRecord(recordData) {
    console.log('✏️ [MockAPI] Updating income record:', recordData.id, 'with data:', recordData)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingRecord = MockDB.findById('incomeRecords', recordData.id)
    if (!existingRecord) {
      throw createErrorResponse('Registro de ingreso no encontrado', 404)
    }
    
    const updatedRecord = {
      ...existingRecord,
      ...recordData,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('incomeRecords', recordData.id, updatedRecord)
    console.log('✏️ [MockAPI] Income record updated successfully:', updatedRecord.id)
    return createResponse(updatedRecord, true, 'Registro de ingreso actualizado exitosamente')
  },

  async deleteIncomeRecord(recordId) {
    console.log('🗑️ [MockAPI] Deleting income record:', recordId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingRecord = MockDB.findById('incomeRecords', recordId)
    if (!existingRecord) {
      throw createErrorResponse('Registro de ingreso no encontrado', 404)
    }
    
    MockDB.delete('incomeRecords', recordId)
    console.log('🗑️ [MockAPI] Income record deleted successfully:', recordId)
    return createResponse(null, true, 'Registro de ingreso eliminado exitosamente')
  },

  // Helper function to create income record from completed harvest
  async createIncomeFromHarvest(harvestPlan, sectorData, pricing) {
    console.log('🎣💰 [MockAPI] Creating income record from harvest:', harvestPlan.id)
    
    try {
      // Calculate total amount based on size distribution and pricing
      let totalAmount = 0
      const sizeDistribution = harvestPlan.sizeDistribution || {}
      
      Object.entries(sizeDistribution).forEach(([size, quantity]) => {
        const price = pricing.find(p => p.sizeCategory === size && p.isActive)
        if (price && quantity) {
          totalAmount += quantity * price.pricePerUnit
        }
      })
      
      // Create income record data
      const incomeData = {
        userId: sectorData.userId,
        harvestPlanId: harvestPlan.id,
        sectorId: harvestPlan.sectorId,
        lotId: harvestPlan.lotId,
        date: harvestPlan.actualDate || harvestPlan.plannedDate,
        type: 'harvest_sale',
        description: `Ingresos por cosecha del sector ${sectorData.name} - Lote ${harvestPlan.lotId}`,
        quantity: harvestPlan.actualQuantity || harvestPlan.estimatedQuantity,
        sizeDistribution: sizeDistribution,
        totalAmount: totalAmount,
        currency: 'PEN',
        status: 'confirmed',
        notes: `Registro automático generado al completar cosecha. ${harvestPlan.notes || ''}`.trim(),
        metadata: {
          autoGenerated: true,
          harvestPlanData: {
            totalHarvestExpenses: harvestPlan.totalHarvestExpenses || 0,
            totalActualCost: harvestPlan.totalActualCost || 0
          }
        }
      }
      
      return await this.createIncomeRecord(incomeData)
    } catch (error) {
      console.error('❌ [MockAPI] Error creating income record from harvest:', error)
      throw error
    }
  },

  // Income Statement Closures Management
  async getIncomeStatementClosures(userId = null, filters = {}) {
    console.log('📊 [MockAPI] Fetching income statement closures for user:', userId, 'filters:', filters)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let closures = MockDB.get('incomeStatementClosures')
    
    if (userId) {
      closures = closures.filter(closure => closure.userId === userId)
    }
    
    // Apply filters
    if (filters.status) {
      closures = closures.filter(closure => closure.status === filters.status)
    }
    
    if (filters.closureType) {
      closures = closures.filter(closure => closure.closureType === filters.closureType)
    }
    
    if (filters.year) {
      closures = closures.filter(closure => {
        const startYear = new Date(closure.periodStartDate).getFullYear()
        return startYear === filters.year
      })
    }
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      closures = closures.filter(closure => {
        const closureStart = new Date(closure.periodStartDate)
        const closureEnd = new Date(closure.periodEndDate)
        return closureStart >= start && closureEnd <= end
      })
    }
    
    // Sort by period end date descending
    closures.sort((a, b) => new Date(b.periodEndDate) - new Date(a.periodEndDate))
    
    console.log('📊 [MockAPI] Found', closures.length, 'income statement closures')
    return createResponse(closures)
  },

  async createIncomeStatementClosure(closureData) {
    console.log('💾 [MockAPI] Creating income statement closure:', closureData)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateIncomeStatementClosure(closureData)
    if (errors.length > 0) {
      throw createErrorResponse(`Datos inválidos: ${errors.join(', ')}`, 400)
    }
    
    // Check for overlapping closures
    const existingClosures = MockDB.get('incomeStatementClosures')
    const overlapping = existingClosures.find(closure => {
      const existingStart = new Date(closure.periodStartDate)
      const existingEnd = new Date(closure.periodEndDate)
      const newStart = new Date(closureData.periodStartDate)
      const newEnd = new Date(closureData.periodEndDate)
      
      return closure.userId === closureData.userId &&
             closure.status !== 'draft' &&
             ((newStart >= existingStart && newStart <= existingEnd) ||
              (newEnd >= existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd))
    })
    
    if (overlapping) {
      throw createErrorResponse('Ya existe un cierre finalizado que se superpone con este período', 409)
    }
    
    const newClosure = {
      id: generateUUID(),
      ...closureData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.add('incomeStatementClosures', newClosure)
    console.log('💾 [MockAPI] Income statement closure created successfully:', newClosure.id)
    return createResponse(newClosure, true, 'Cierre del estado de resultados creado exitosamente')
  },

  async updateIncomeStatementClosure(closureData) {
    console.log('✏️ [MockAPI] Updating income statement closure:', closureData.id, 'with data:', closureData)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingClosure = MockDB.findById('incomeStatementClosures', closureData.id)
    if (!existingClosure) {
      throw createErrorResponse('Cierre del estado de resultados no encontrado', 404)
    }
    
    // Don't allow modification of finalized closures
    if (existingClosure.status === 'finalized' || existingClosure.status === 'registered_in_cash_flow') {
      throw createErrorResponse('No se puede modificar un cierre finalizado o registrado en flujo de caja', 400)
    }
    
    const updatedClosure = {
      ...existingClosure,
      ...closureData,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('incomeStatementClosures', closureData.id, updatedClosure)
    console.log('✏️ [MockAPI] Income statement closure updated successfully:', updatedClosure.id)
    return createResponse(updatedClosure, true, 'Cierre del estado de resultados actualizado exitosamente')
  },

  async finalizeIncomeStatementClosure(closureId, finalizedBy) {
    console.log('🔒 [MockAPI] Finalizing income statement closure:', closureId, 'by:', finalizedBy)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingClosure = MockDB.findById('incomeStatementClosures', closureId)
    if (!existingClosure) {
      throw createErrorResponse('Cierre del estado de resultados no encontrado', 404)
    }
    
    if (existingClosure.status !== 'draft') {
      throw createErrorResponse('Solo se pueden finalizar cierres en estado borrador', 400)
    }
    
    const finalizedClosure = {
      ...existingClosure,
      status: 'finalized',
      finalizedAt: new Date().toISOString(),
      finalizedBy: finalizedBy,
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('incomeStatementClosures', closureId, finalizedClosure)
    console.log('🔒 [MockAPI] Income statement closure finalized successfully:', finalizedClosure.id)
    return createResponse(finalizedClosure, true, 'Cierre del estado de resultados finalizado exitosamente')
  },

  async registerClosureInCashFlow(closureId) {
    console.log('💰 [MockAPI] Registering closure in cash flow:', closureId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingClosure = MockDB.findById('incomeStatementClosures', closureId)
    if (!existingClosure) {
      throw createErrorResponse('Cierre del estado de resultados no encontrado', 404)
    }
    
    if (existingClosure.status !== 'finalized') {
      throw createErrorResponse('Solo se pueden registrar en flujo de caja los cierres finalizados', 400)
    }
    
    // Create cash flow entry
    let description = `Cierre Estado de Resultados - ${existingClosure.closureType}`
    
    if (existingClosure.closureType === 'seeding' && existingClosure.seedingInfo) {
      description = `Cierre por Siembra - ${existingClosure.seedingInfo.sectorName} (${existingClosure.seedingInfo.origin}) - ${new Date(existingClosure.seedingInfo.entryDate).toLocaleDateString('es-PE')}`
    } else {
      description += ` (${new Date(existingClosure.periodStartDate).toLocaleDateString('es-PE')} - ${new Date(existingClosure.periodEndDate).toLocaleDateString('es-PE')})`
    }
    
    const cashFlowEntry = {
      id: generateUUID(),
      userId: existingClosure.userId,
      type: 'income_statement_closure',
      description: description,
      amount: existingClosure.netProfit,
      date: existingClosure.periodEndDate,
      category: 'operational',
      isIncomeStatementClosure: true,
      closureId: closureId,
      metadata: {
        closureDetails: {
          totalRevenues: existingClosure.totalRevenues,
          totalExpenses: existingClosure.totalExpenses,
          grossProfit: existingClosure.grossProfit,
          netProfit: existingClosure.netProfit,
          profitMargin: existingClosure.profitMargin,
          period: {
            start: existingClosure.periodStartDate,
            end: existingClosure.periodEndDate,
            type: existingClosure.closureType
          },
          seedingInfo: existingClosure.seedingInfo || null
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add to cash flow (expenses collection - considering net profit can be positive or negative)
    MockDB.add('expenses', cashFlowEntry)
    
    // Update closure status
    const updatedClosure = {
      ...existingClosure,
      status: 'registered_in_cash_flow',
      cashFlowEntryId: cashFlowEntry.id,
      registeredInCashFlowAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    MockDB.update('incomeStatementClosures', closureId, updatedClosure)
    
    console.log('💰 [MockAPI] Closure registered in cash flow successfully:', updatedClosure.id)
    console.log('💰 [MockAPI] Cash flow entry created:', cashFlowEntry.id)
    
    return createResponse(updatedClosure, true, 'Cierre registrado en flujo de caja exitosamente')
  },

  async deleteIncomeStatementClosure(closureId) {
    console.log('🗑️ [MockAPI] Deleting income statement closure:', closureId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const existingClosure = MockDB.findById('incomeStatementClosures', closureId)
    if (!existingClosure) {
      throw createErrorResponse('Cierre del estado de resultados no encontrado', 404)
    }
    
    // Only allow deletion of draft closures
    if (existingClosure.status !== 'draft') {
      throw createErrorResponse('Solo se pueden eliminar cierres en estado borrador', 400)
    }
    
    MockDB.delete('incomeStatementClosures', closureId)
    console.log('🗑️ [MockAPI] Income statement closure deleted successfully:', closureId)
    return createResponse(null, true, 'Cierre del estado de resultados eliminado exitosamente')
  },

  // Helper function to generate closure from current income statement data
  async generateIncomeStatementClosureFromCurrentData(userId, periodStart, periodEnd, closureType = 'custom') {
    console.log('📈 [MockAPI] Generating closure from current data for user:', userId, 'period:', periodStart, 'to', periodEnd)
    
    try {
      // Get all relevant data for the period
      const harvestPlans = MockDB.get('harvestPlans').filter(plan => 
        plan.status === 'completed' && 
        plan.actualDate >= periodStart && 
        plan.actualDate <= periodEnd
      )
      
      const expenses = MockDB.get('expenses').filter(expense => 
        expense.userId === userId &&
        expense.date >= periodStart && 
        expense.date <= periodEnd &&
        !expense.isIncomeStatementClosure
      )
      
      const incomeRecords = MockDB.get('incomeRecords').filter(record => 
        record.userId === userId &&
        record.date >= periodStart && 
        record.date <= periodEnd
      )
      
      const pricing = MockDB.get('pricing')
      
      // Calculate totals
      let totalRevenues = 0
      harvestPlans.forEach(plan => {
        if (plan.sizeDistribution && pricing.length > 0) {
          Object.entries(plan.sizeDistribution).forEach(([size, quantity]) => {
            const price = pricing.find(p => p.sizeCategory === size && p.isActive)
            if (price && quantity) {
              totalRevenues += quantity * price.pricePerUnit
            }
          })
        }
      })
      
      // Add other income records
      const otherIncome = incomeRecords.reduce((sum, record) => sum + record.totalAmount, 0)
      totalRevenues += otherIncome
      
      // Calculate total expenses by category
      const expenseBreakdown = {
        operational: 0,
        harvesting: 0,
        equipment: 0,
        materials: 0,
        labor: 0,
        other: 0
      }
      
      expenses.forEach(expense => {
        expenseBreakdown[expense.category] = (expenseBreakdown[expense.category] || 0) + expense.amount
      })
      
      // Add harvest-specific expenses
      const harvestingExpenses = harvestPlans.reduce((sum, plan) => sum + (plan.totalActualCost || 0), 0)
      expenseBreakdown.harvesting += harvestingExpenses
      
      const totalExpenses = Object.values(expenseBreakdown).reduce((sum, amount) => sum + amount, 0)
      
      const grossProfit = totalRevenues - totalExpenses
      const netProfit = grossProfit // Simplified - in real scenario might have taxes, etc.
      const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0
      
      // Volume metrics
      const totalQuantityHarvested = harvestPlans.reduce((sum, plan) => sum + (plan.actualQuantity || 0), 0)
      const numberOfHarvests = harvestPlans.length
      const averageRevenuePerHarvest = numberOfHarvests > 0 ? totalRevenues / numberOfHarvests : 0
      
      return {
        userId,
        closureType,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        totalRevenues,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMargin,
        revenueBreakdown: {
          harvestSales: totalRevenues - otherIncome,
          otherIncome: otherIncome
        },
        expenseBreakdown,
        totalQuantityHarvested,
        numberOfHarvests,
        averageRevenuePerHarvest,
        status: 'draft',
        appliedFilters: {
          includeOnlyCompleted: true
        },
        includedHarvestIds: harvestPlans.map(p => p.id),
        includedExpenseIds: expenses.map(e => e.id),
        includedIncomeIds: incomeRecords.map(r => r.id)
      }
    } catch (error) {
      console.error('❌ [MockAPI] Error generating closure from current data:', error)
      throw error
    }
  },

  // Investment Management Methods
  async createInvestment(investmentData) {
    const { InvestmentSchema, validateInvestment } = await import('./schemas/investment.js')
    
    try {
      const errors = validateInvestment(investmentData)
      if (errors.length > 0) {
        throw new Error(errors.join(', '))
      }

      const investment = {
        id: InvestmentSchema.id.default(),
        ...investmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Update lot with investment info
      const lots = this.getFromLocalStorage('lots')
      const lotIndex = lots.findIndex(l => l.id === investmentData.lotId)
      if (lotIndex !== -1) {
        lots[lotIndex].hasInvestors = true
        lots[lotIndex].investmentIds = [...(lots[lotIndex].investmentIds || []), investment.id]
        lots[lotIndex].totalInvestment = (lots[lotIndex].totalInvestment || 0) + investmentData.amount
        
        // Update ownership distribution
        if (!lots[lotIndex].ownershipDistribution) {
          lots[lotIndex].ownershipDistribution = {}
        }
        lots[lotIndex].ownershipDistribution[investmentData.investorId] = {
          percentage: investmentData.percentage,
          amount: investmentData.amount
        }
        
        this.saveToLocalStorage('lots', lots)
      }

      const investments = this.getFromLocalStorage('investments')
      investments.push(investment)
      this.saveToLocalStorage('investments', investments)

      console.log('✅ [MockAPI] Investment created:', investment)
      return investment
    } catch (error) {
      console.error('❌ [MockAPI] Error creating investment:', error)
      throw error
    }
  },

  async getInvestments(filters = {}) {
    const investments = this.getFromLocalStorage('investments')
    
    let filtered = [...investments]
    
    if (filters.investorId) {
      filtered = filtered.filter(inv => inv.investorId === filters.investorId)
    }
    
    if (filters.maricultorId) {
      filtered = filtered.filter(inv => inv.maricultorId === filters.maricultorId)
    }
    
    if (filters.lotId) {
      filtered = filtered.filter(inv => inv.lotId === filters.lotId)
    }
    
    if (filters.status) {
      filtered = filtered.filter(inv => inv.status === filters.status)
    }
    
    return filtered
  },

  async getInvestmentsByLot(lotId) {
    const investments = this.getFromLocalStorage('investments')
    return investments.filter(inv => inv.lotId === lotId)
  },

  async updateInvestment(investmentId, updates) {
    const investments = this.getFromLocalStorage('investments')
    const index = investments.findIndex(inv => inv.id === investmentId)
    
    if (index === -1) {
      throw new Error('Investment not found')
    }
    
    investments[index] = {
      ...investments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    this.saveToLocalStorage('investments', investments)
    
    // Update lot if amount or percentage changed
    if (updates.amount !== undefined || updates.percentage !== undefined) {
      const lots = this.getFromLocalStorage('lots')
      const lotIndex = lots.findIndex(l => l.id === investments[index].lotId)
      
      if (lotIndex !== -1) {
        // Recalculate total investment
        const lotInvestments = investments.filter(inv => inv.lotId === lots[lotIndex].id)
        lots[lotIndex].totalInvestment = lotInvestments.reduce((sum, inv) => sum + inv.amount, 0)
        
        // Update ownership distribution
        lots[lotIndex].ownershipDistribution[investments[index].investorId] = {
          percentage: investments[index].percentage,
          amount: investments[index].amount
        }
        
        this.saveToLocalStorage('lots', lots)
      }
    }
    
    console.log('✅ [MockAPI] Investment updated:', investments[index])
    return investments[index]
  },

  async deleteInvestment(investmentId) {
    const investments = this.getFromLocalStorage('investments')
    const investment = investments.find(inv => inv.id === investmentId)
    
    if (!investment) {
      throw new Error('Investment not found')
    }
    
    // Update lot
    const lots = this.getFromLocalStorage('lots')
    const lotIndex = lots.findIndex(l => l.id === investment.lotId)
    
    if (lotIndex !== -1) {
      lots[lotIndex].investmentIds = lots[lotIndex].investmentIds.filter(id => id !== investmentId)
      lots[lotIndex].totalInvestment = (lots[lotIndex].totalInvestment || 0) - investment.amount
      
      delete lots[lotIndex].ownershipDistribution[investment.investorId]
      
      if (lots[lotIndex].investmentIds.length === 0) {
        lots[lotIndex].hasInvestors = false
      }
      
      this.saveToLocalStorage('lots', lots)
    }
    
    const filtered = investments.filter(inv => inv.id !== investmentId)
    this.saveToLocalStorage('investments', filtered)
    
    console.log('✅ [MockAPI] Investment deleted:', investmentId)
    return true
  },

  async distributeInvestmentReturns(lotId, distributionData) {
    const investments = this.getFromLocalStorage('investments')
    const lotInvestments = investments.filter(inv => inv.lotId === lotId)
    
    const distributions = []
    
    for (const investment of lotInvestments) {
      const distribution = distributionData.distributions.find(d => d.investmentId === investment.id)
      
      if (distribution) {
        const index = investments.findIndex(inv => inv.id === investment.id)
        
        investments[index].totalDistributed = (investments[index].totalDistributed || 0) + distribution.amount
        investments[index].lastDistributionDate = new Date().toISOString()
        investments[index].distributedReturns = [
          ...(investments[index].distributedReturns || []),
          {
            date: new Date().toISOString(),
            amount: distribution.amount,
            type: distribution.type || 'harvest',
            notes: distribution.notes
          }
        ]
        
        distributions.push({
          investmentId: investment.id,
          amount: distribution.amount,
          success: true
        })
      }
    }
    
    this.saveToLocalStorage('investments', investments)
    
    console.log('✅ [MockAPI] Returns distributed:', distributions)
    return { success: true, distributions }
  },

  async getDistributions(filters = {}) {
    console.log('📊 [MockAPI] Getting distributions with filters:', filters)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let distributions = MockDB.get('distributions') || []
    
    // Apply filters
    if (filters.investorId) {
      distributions = distributions.filter(d => d.investorId === filters.investorId)
    }
    
    if (filters.maricultorId) {
      distributions = distributions.filter(d => d.maricultorId === filters.maricultorId)
    }
    
    if (filters.lotId) {
      distributions = distributions.filter(d => d.lotId === filters.lotId)
    }
    
    if (filters.harvestPlanId) {
      distributions = distributions.filter(d => d.harvestPlanId === filters.harvestPlanId)
    }
    
    if (filters.status) {
      distributions = distributions.filter(d => d.status === filters.status)
    }
    
    // Sort by date descending
    distributions.sort((a, b) => new Date(b.distributionDate) - new Date(a.distributionDate))
    
    console.log('✅ [MockAPI] Found', distributions.length, 'distributions')
    return createResponse(distributions)
  },

  async getDistributionById(distributionId) {
    console.log('🔍 [MockAPI] Getting distribution:', distributionId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const distribution = MockDB.findById('distributions', distributionId)
    
    if (!distribution) {
      console.error('❌ [MockAPI] Distribution not found:', distributionId)
      throw createErrorResponse('Distribución no encontrada', 404)
    }
    
    return createResponse(distribution)
  },

  async getInvestorReturns(investorId) {
    console.log('💰 [MockAPI] Getting returns for investor:', investorId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const distributions = (MockDB.get('distributions') || []).filter(d => 
      d.investorId === investorId
    )
    
    const investments = MockDB.get('investments').filter(inv => 
      inv.investorId === investorId
    )
    
    // Calculate summary statistics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReturned = distributions.reduce((sum, dist) => sum + dist.distributedAmount, 0)
    const averageROI = distributions.length > 0 
      ? distributions.reduce((sum, dist) => sum + dist.roi, 0) / distributions.length 
      : 0
    
    const summary = {
      totalInvested,
      totalReturned,
      netProfit: totalReturned - totalInvested,
      averageROI,
      totalDistributions: distributions.length,
      activeInvestments: investments.filter(inv => inv.status === 'active').length,
      completedInvestments: investments.filter(inv => inv.status === 'completed').length
    }
    
    console.log('✅ [MockAPI] Returns summary for investor:', summary)
    
    return createResponse({
      distributions,
      investments,
      summary
    })
  },

  async getNotifications(userId, filters = {}) {
    console.log('🔔 [MockAPI] Getting notifications for user:', userId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let notifications = MockDB.get('notifications') || []
    
    // Filter by user
    notifications = notifications.filter(n => n.userId === userId)
    
    // Apply additional filters
    if (filters.status) {
      notifications = notifications.filter(n => n.status === filters.status)
    }
    
    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type)
    }
    
    if (filters.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority)
    }
    
    // Sort by date descending (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    console.log('✅ [MockAPI] Found', notifications.length, 'notifications')
    return createResponse(notifications)
  },

  async markNotificationAsRead(notificationId) {
    console.log('✅ [MockAPI] Marking notification as read:', notificationId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const notification = MockDB.findById('notifications', notificationId)
    
    if (!notification) {
      console.error('❌ [MockAPI] Notification not found:', notificationId)
      throw createErrorResponse('Notificación no encontrada', 404)
    }
    
    const updatedNotification = {
      ...notification,
      status: 'read',
      readAt: new Date().toISOString()
    }
    
    MockDB.update('notifications', notificationId, updatedNotification)
    console.log('✅ [MockAPI] Notification marked as read')
    
    return createResponse(updatedNotification)
  },

  async markAllNotificationsAsRead(userId) {
    console.log('✅ [MockAPI] Marking all notifications as read for user:', userId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const notifications = (MockDB.get('notifications') || []).filter(n => 
      n.userId === userId && n.status === 'unread'
    )
    
    const now = new Date().toISOString()
    notifications.forEach(notification => {
      MockDB.update('notifications', notification.id, {
        ...notification,
        status: 'read',
        readAt: now
      })
    })
    
    console.log('✅ [MockAPI] Marked', notifications.length, 'notifications as read')
    return createResponse({ count: notifications.length })
  },

  async deleteNotification(notificationId) {
    console.log('🗑️ [MockAPI] Deleting notification:', notificationId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const notification = MockDB.findById('notifications', notificationId)
    
    if (!notification) {
      console.error('❌ [MockAPI] Notification not found:', notificationId)
      throw createErrorResponse('Notificación no encontrada', 404)
    }
    
    MockDB.delete('notifications', notificationId)
    console.log('✅ [MockAPI] Notification deleted')
    
    return createResponse(null, true, 'Notificación eliminada')
  },

  async createNotification(notificationData) {
    console.log('📝 [MockAPI] Creating notification')
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const errors = validateNotification(notificationData)
    if (errors.length > 0) {
      throw createErrorResponse(errors.join(', '), 400)
    }
    
    const notification = {
      ...notificationData,
      id: generateUUID(),
      status: 'unread',
      createdAt: new Date().toISOString()
    }
    
    // Initialize notifications array if it doesn't exist
    if (!MockDB.data.notifications) {
      MockDB.data.notifications = []
    }
    
    MockDB.add('notifications', notification)
    console.log('✅ [MockAPI] Notification created:', notification.id)
    
    return createResponse(notification)
  },

  async getUnreadCount(userId) {
    console.log('🔢 [MockAPI] Getting unread count for user:', userId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const count = (MockDB.get('notifications') || []).filter(n => 
      n.userId === userId && n.status === 'unread'
    ).length
    
    console.log('✅ [MockAPI] Unread count:', count)
    return createResponse({ count })
  },

  async distributeReturnsToInvestors(harvestPlan, incomeRecord, sectorData) {
    console.log('💰📊 [MockAPI] Distributing returns for harvest:', harvestPlan.id)
    
    try {
      // Get all active investments for this lot
      const investments = MockDB.get('investments').filter(inv => 
        inv.lotId === harvestPlan.lotId && 
        inv.status === 'active' &&
        inv.maricultorId === sectorData.userId
      )
      
      if (investments.length === 0) {
        console.log('ℹ️ [MockAPI] No active investments found for lot:', harvestPlan.lotId)
        return []
      }
      
      console.log('📊 [MockAPI] Found', investments.length, 'active investments for distribution')
      
      // Get all expenses for this lot to calculate net profit
      const expenses = MockDB.get('expenses').filter(exp => 
        exp.lotId === harvestPlan.lotId
      )
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
      const harvestRevenue = incomeRecord.totalAmount || 0
      const netProfit = harvestRevenue - totalExpenses
      
      console.log('💰 [MockAPI] Financial summary:')
      console.log('  - Harvest Revenue:', harvestRevenue)
      console.log('  - Total Expenses:', totalExpenses)
      console.log('  - Net Profit:', netProfit)
      
      // Initialize distributions array to store in DB
      if (!MockDB.data.distributions) {
        MockDB.data.distributions = []
      }
      
      const distributions = []
      
      // Create distribution record for each investment
      for (const investment of investments) {
        const distributedAmount = (netProfit * investment.percentage) / 100
        const roi = ((distributedAmount - investment.amount) / investment.amount) * 100
        
        const distribution = {
          id: generateUUID(),
          harvestPlanId: harvestPlan.id,
          lotId: harvestPlan.lotId,
          maricultorId: sectorData.userId,
          investmentId: investment.id,
          investorId: investment.investorId,
          distributionDate: new Date().toISOString(),
          harvestRevenue: harvestRevenue,
          harvestExpenses: totalExpenses,
          netProfit: netProfit,
          investmentPercentage: investment.percentage,
          distributedAmount: Math.max(0, distributedAmount), // Never distribute negative amounts
          originalInvestment: investment.amount,
          roi: roi,
          status: 'paid', // Automatically mark as paid since it's automatic distribution
          paymentMethod: 'bank_transfer',
          paymentDate: new Date().toISOString(),
          notes: `Distribución automática de retornos - Cosecha ${harvestPlan.id}`,
          metadata: {
            autoGenerated: true,
            harvestData: {
              actualQuantity: harvestPlan.actualQuantity,
              sizeDistribution: harvestPlan.sizeDistribution
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        }
        
        // Add to distributions array
        distributions.push(distribution)
        MockDB.add('distributions', distribution)
        
        // Update investment with actual return and distribution info
        const updatedInvestment = {
          ...investment,
          actualReturn: distributedAmount,
          status: 'completed',
          distributedReturns: [
            ...(investment.distributedReturns || []),
            {
              distributionId: distribution.id,
              amount: distributedAmount,
              date: distribution.distributionDate
            }
          ],
          lastDistributionDate: distribution.distributionDate,
          totalDistributed: (investment.totalDistributed || 0) + distributedAmount,
          updatedAt: new Date().toISOString()
        }
        
        MockDB.update('investments', investment.id, updatedInvestment)
        console.log(`✅ [MockAPI] Distribution created for investor ${investment.investorId}: $${distributedAmount.toFixed(2)} (${investment.percentage}% of net profit)`)
        
        // Create notification for the investor
        try {
          const notificationData = createNotificationFromTemplate('distribution_received', investment.investorId, {
            amount: distributedAmount,
            harvestId: harvestPlan.id,
            distributionId: distribution.id,
            lotName: lot?.lineName || lot?.origin || 'Lote ' + harvestPlan.lotId,
            percentage: investment.percentage,
            roi: roi.toFixed(2)
          })
          
          // Initialize notifications array if it doesn't exist
          if (!MockDB.data.notifications) {
            MockDB.data.notifications = []
          }
          
          const notification = {
            ...notificationData,
            id: generateUUID()
          }
          
          MockDB.add('notifications', notification)
          console.log('🔔 [MockAPI] Notification created for investor:', investment.investorId)
        } catch (notifError) {
          console.error('⚠️ [MockAPI] Could not create notification:', notifError)
          // Don't fail distribution if notification fails
        }
      }
      
      // Also update the lot to mark that distributions have been made
      const lots = MockDB.get('lots')
      const lot = lots.find(l => l.id === harvestPlan.lotId)
      if (lot) {
        const updatedLot = {
          ...lot,
          distributionCompleted: true,
          distributionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        MockDB.update('lots', lot.id, updatedLot)
      }
      
      console.log('✅ [MockAPI] All distributions completed successfully')
      return distributions
      
    } catch (error) {
      console.error('❌ [MockAPI] Error in distributeReturnsToInvestors:', error)
      throw error
    }
  },

  // INVESTOR INVITATIONS MANAGEMENT
  async searchInvestor(emailOrName) {
    console.log('🔍 [MockAPI] Searching investor:', emailOrName)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    const users = MockDB.get('users')
    const investor = users.find(user => 
      user.role === 'investor' &&
      user.status === 'active' &&
      (
        user.email.toLowerCase().includes(emailOrName.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(emailOrName.toLowerCase())
      )
    )
    
    if (investor) {
      console.log('✓ [MockAPI] Investor found:', investor.email)
      return createResponse({
        found: true,
        investor: {
          id: investor.id,
          email: investor.email,
          name: `${investor.firstName} ${investor.lastName}`,
          firstName: investor.firstName,
          lastName: investor.lastName
        }
      })
    } else {
      console.log('⚠️ [MockAPI] Investor not found for:', emailOrName)
      return createResponse({
        found: false,
        investor: null
      })
    }
  },

  async createInvestorInvitation(invitationData) {
    console.log('📫 [MockAPI] Creating investor invitation:', invitationData)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    try {
      const invitations = MockDB.get('investorInvitations') || []
      
      // Verificar si ya existe una invitación pendiente para este inversor y siembra
      const existingInvitation = invitations.find(inv => 
        inv.seedingId === invitationData.seedingId &&
        inv.investorId === invitationData.investorId &&
        inv.status === 'pending'
      )
      
      if (existingInvitation) {
        throw createErrorResponse('Ya existe una invitación pendiente para este inversor en esta siembra', 400)
      }
      
      const newInvitation = createInvestorInvitation(invitationData)
      invitations.push(newInvitation)
      MockDB.set('investorInvitations', invitations)
      
      // Crear notificación para el inversor
      const notification = createNotificationFromTemplate(
        'investment_invitation_received',
        invitationData.investorId,
        {
          maricultorName: invitationData.maricultorName || 'Maricultor',
          sectorName: invitationData.sectorName || 'Sector',
          amount: invitationData.invitedAmount,
          percentage: invitationData.invitedPercentage,
          invitationId: newInvitation.id,
          expirationDate: newInvitation.expirationDate
        }
      )
      
      await this.createNotification(notification)
      
      console.log('✓ [MockAPI] Investor invitation created:', newInvitation.id)
      return createResponse(newInvitation)
      
    } catch (error) {
      console.error('❌ [MockAPI] Error creating investor invitation:', error)
      throw error
    }
  },

  async getInvestorInvitations(userId, userRole = 'investor') {
    console.log('📫 [MockAPI] Fetching investor invitations for:', userId, 'role:', userRole)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    let invitations = MockDB.get('investorInvitations') || []
    
    // Filtrar por rol
    if (userRole === 'investor') {
      invitations = invitations.filter(inv => inv.investorId === userId)
    } else if (userRole === 'maricultor') {
      invitations = invitations.filter(inv => inv.maricultorId === userId)
    }
    
    // Marcar como expiradas las invitaciones que hayan pasado la fecha
    const now = new Date()
    invitations.forEach(invitation => {
      if (invitation.status === 'pending' && new Date(invitation.expirationDate) < now) {
        invitation.status = 'expired'
        invitation.updatedAt = now.toISOString()
      }
    })
    
    // Actualizar en la base de datos
    MockDB.set('investorInvitations', MockDB.get('investorInvitations').map(inv => {
      const updated = invitations.find(i => i.id === inv.id)
      return updated || inv
    }))
    
    // Ordenar por fecha de invitación descendente
    invitations.sort((a, b) => new Date(b.invitationDate) - new Date(a.invitationDate))
    
    console.log('📫 [MockAPI] Found', invitations.length, 'invitations')
    return createResponse(invitations)
  },

  async respondToInvestorInvitation(invitationId, response) {
    console.log('⚙️ [MockAPI] Responding to invitation:', invitationId, 'response:', response.status)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    try {
      const invitations = MockDB.get('investorInvitations') || []
      const invitationIndex = invitations.findIndex(inv => inv.id === invitationId)
      
      if (invitationIndex === -1) {
        throw createErrorResponse('Invitación no encontrada', 404)
      }
      
      const invitation = invitations[invitationIndex]
      
      if (invitation.status !== 'pending') {
        throw createErrorResponse('Esta invitación ya fue respondida o está expirada', 400)
      }
      
      // Verificar expiración
      if (new Date(invitation.expirationDate) < new Date()) {
        invitation.status = 'expired'
        invitation.updatedAt = new Date().toISOString()
        invitations[invitationIndex] = invitation
        MockDB.set('investorInvitations', invitations)
        throw createErrorResponse('Esta invitación ha expirado', 400)
      }
      
      // Actualizar invitación
      invitation.status = response.status
      invitation.responseDate = new Date().toISOString()
      invitation.responseMessage = response.message || ''
      invitation.updatedAt = new Date().toISOString()
      
      if (response.status === 'accepted') {
        invitation.confirmedAmount = response.amount || invitation.invitedAmount
        invitation.confirmedPercentage = response.percentage || invitation.invitedPercentage
        
        // Crear la inversión si fue aceptada
        const investmentData = {
          userId: invitation.investorId,
          lotId: invitation.seedingId,
          amount: invitation.confirmedAmount,
          percentage: invitation.confirmedPercentage,
          investmentDate: new Date().toISOString(),
          status: 'active',
          notes: `Inversión creada por aceptación de invitación. ${response.message || ''}`.trim()
        }
        
        await this.createInvestment(investmentData)
      }
      
      invitations[invitationIndex] = invitation
      MockDB.set('investorInvitations', invitations)
      
      // Crear notificación para el maricultor
      const notificationType = response.status === 'accepted' ? 'investment_invitation_accepted' : 'investment_invitation_rejected'
      const notification = createNotificationFromTemplate(
        notificationType,
        invitation.maricultorId,
        {
          investorName: invitation.investorName,
          sectorName: invitation.sectorName || 'Sector',
          amount: invitation.confirmedAmount || invitation.invitedAmount,
          percentage: invitation.confirmedPercentage || invitation.invitedPercentage,
          message: response.message
        }
      )
      
      await this.createNotification(notification)
      
      console.log('✓ [MockAPI] Invitation responded successfully:', invitationId)
      return createResponse(invitation)
      
    } catch (error) {
      console.error('❌ [MockAPI] Error responding to invitation:', error)
      throw error
    }
  },

  async cancelInvestorInvitation(invitationId, maricultorId) {
    console.log('🚫 [MockAPI] Cancelling invitation:', invitationId, 'by maricultor:', maricultorId)
    await delay()
    
    if (shouldSimulateError()) {
      throw createErrorResponse('Error del servidor', 500)
    }
    
    try {
      const invitations = MockDB.get('investorInvitations') || []
      const invitationIndex = invitations.findIndex(inv => 
        inv.id === invitationId && inv.maricultorId === maricultorId
      )
      
      if (invitationIndex === -1) {
        throw createErrorResponse('Invitación no encontrada o sin permisos', 404)
      }
      
      const invitation = invitations[invitationIndex]
      
      if (invitation.status !== 'pending') {
        throw createErrorResponse('Solo se pueden cancelar invitaciones pendientes', 400)
      }
      
      invitation.status = 'cancelled'
      invitation.updatedAt = new Date().toISOString()
      invitations[invitationIndex] = invitation
      MockDB.set('investorInvitations', invitations)
      
      // Crear notificación para el inversor
      const notification = createNotificationFromTemplate(
        'investment_invitation_cancelled',
        invitation.investorId,
        {
          maricultorName: invitation.maricultorName || 'Maricultor',
          sectorName: invitation.sectorName || 'Sector'
        }
      )
      
      await this.createNotification(notification)
      
      console.log('✓ [MockAPI] Invitation cancelled successfully:', invitationId)
      return createResponse(invitation)
      
    } catch (error) {
      console.error('❌ [MockAPI] Error cancelling invitation:', error)
      throw error
    }
  }
}

class MockAPIServer {
  getFromLocalStorage(key) {
    return MockDB.get(key) || []
  }
  
  saveToLocalStorage(key, data) {
    MockDB.set(key, data)
  }
  
  // Copy all methods from MockAPI
  constructor() {
    Object.assign(this, MockAPI)
  }
}

export const mockAPI = new MockAPIServer()