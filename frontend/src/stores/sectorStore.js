import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useSectorStore = create((set, get) => ({
  sectors: [],
  selectedSector: null,
  batteries: [],
  selectedBattery: null,
  cultivationLines: [],
  selectedLine: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  
  fetchSectors: async (userId, page = 1, limit = 10) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getSectors(userId, page, limit) // TODO: Migrar a nuevo store con JSON Server
      
      set({
        sectors: response.data.sectors,
        pagination: response.data.pagination,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        sectors: []
      })
      
      return { success: false, error: error.message }
    }
  },

  fetchAllSectors: async () => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getAllSectors() // TODO: Migrar a nuevo store con JSON Server
      
      set({
        sectors: response.data,
        loading: false,
        error: null
      })
      
      return { success: true, data: response.data }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        sectors: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createSector: async (sectorData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.createSector(sectorData) // TODO: Migrar a nuevo store con JSON Server
      const newSector = { ...response.data, lots: [] }
      
      set((state) => ({
        sectors: [...state.sectors, newSector],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newSector }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  // Funciones para manejo de Baterías
  fetchBatteries: async (sectorId) => {
    set({ loading: true, error: null })

    try {
      // const response = await MockAPI.getBatteries(sectorId) // TODO: Migrar a nuevo store con JSON Server

      set({
        batteries: response.data,
        loading: false,
        error: null
      })

      return { success: true, data: response.data }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        batteries: []
      })

      return { success: false, error: error.message }
    }
  },

  createBattery: async (batteryData) => {
    set({ loading: true, error: null })

    try {
      // const response = await MockAPI.createBattery(batteryData) // TODO: Migrar a nuevo store con JSON Server
      const newBattery = response.data

      set((state) => ({
        batteries: [...state.batteries, newBattery],
        loading: false,
        error: null
      }))

      return { success: true, data: newBattery }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  updateBattery: async (batteryId, batteryData) => {
    set({ loading: true, error: null })

    try {
      // const response = await MockAPI.updateBattery(batteryId, batteryData) // TODO: Migrar a nuevo store con JSON Server
      const updatedBattery = response.data

      set((state) => ({
        batteries: state.batteries.map(battery =>
          battery.id === batteryId ? updatedBattery : battery
        ),
        loading: false,
        error: null
      }))

      return { success: true, data: updatedBattery }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  deleteBattery: async (batteryId) => {
    set({ loading: true, error: null })

    try {
      // await MockAPI.deleteBattery(batteryId) // TODO: Migrar a nuevo store con JSON Server

      set((state) => ({
        batteries: state.batteries.filter(battery => battery.id !== batteryId),
        loading: false,
        error: null
      }))

      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  createLot: async (lotData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.createLot(lotData) // TODO: Migrar a nuevo store con JSON Server
      const newLot = response.data
      
      set((state) => ({
        sectors: state.sectors.map(sector => 
          sector.id === lotData.sectorId
            ? { ...sector, lots: [...sector.lots, newLot] }
            : sector
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: newLot }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  fetchCultivationLines: async (sectorId, batteryId = null) => {
    set({ loading: true, error: null })

    try {
      // const response = await MockAPI.getCultivationLines(sectorId, batteryId) // TODO: Migrar a nuevo store con JSON Server

      set({
        cultivationLines: response.data,
        loading: false,
        error: null
      })

      return { success: true, data: response.data }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        cultivationLines: []
      })

      return { success: false, error: error.message }
    }
  },
  
  createCultivationLine: async (lineData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.createCultivationLine(lineData) // TODO: Migrar a nuevo store con JSON Server
      const newLine = response.data
      
      set((state) => ({
        cultivationLines: [...state.cultivationLines, newLine],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newLine }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  updateCultivationLine: async (lineId, lineData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.updateCultivationLine(lineId, lineData) // TODO: Migrar a nuevo store con JSON Server
      const updatedLine = response.data
      
      set((state) => ({
        cultivationLines: state.cultivationLines.map(line => 
          line.id === lineId ? updatedLine : line
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedLine }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  deleteCultivationLine: async (lineId) => {
    set({ loading: true, error: null })
    
    try {
      // await MockAPI.deleteCultivationLine(lineId) // TODO: Migrar a nuevo store con JSON Server
      
      set((state) => ({
        cultivationLines: state.cultivationLines.filter(line => line.id !== lineId),
        loading: false,
        error: null
      }))
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  updateLot: async (lotId, sectorId, lotData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.updateLot(lotId, lotData) // TODO: Migrar a nuevo store con JSON Server
      const updatedLot = response.data
      
      set((state) => ({
        sectors: state.sectors.map(sector => 
          sector.id === sectorId
            ? { 
                ...sector, 
                lots: sector.lots.map(lot => 
                  lot.id === lotId ? updatedLot : lot
                ) 
              }
            : sector
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedLot }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  selectSector: (sector) => {
    set({ selectedSector: sector, selectedBattery: null, selectedLine: null })
  },

  selectBattery: (battery) => {
    set({ selectedBattery: battery, selectedLine: null })
  },

  selectLine: (line) => {
    set({ selectedLine: line })
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  // Actualizar cantidad de línea después de cosecha
  updateLineQuantityAfterHarvest: async (lineId, selectedSystems, quantityHarvested) => {
    set({ loading: true, error: null })
    
    try {
      // Obtener la línea actual
      const currentLine = get().cultivationLines.find(line => line.id === lineId)
      
      if (!currentLine) {
        throw new Error('Línea de cultivo no encontrada')
      }
      
      // Calcular la nueva cantidad
      // Si hay sistemas seleccionados, solo reducir de esos sistemas
      // Si no, reducir proporcionalmente de todos los sistemas
      let newQuantity = currentLine.currentQuantity
      
      if (selectedSystems && selectedSystems.length > 0) {
        // Calcular proporción basada en sistemas seleccionados
        const totalSystems = currentLine.systems?.length || 1
        const selectedSystemsCount = selectedSystems.length
        const proportion = selectedSystemsCount / totalSystems
        
        // Reducir cantidad proporcional
        newQuantity = Math.max(0, currentLine.currentQuantity - quantityHarvested)
      } else {
        // Reducir toda la cantidad cosechada
        newQuantity = Math.max(0, currentLine.currentQuantity - quantityHarvested)
      }
      
      // Actualizar la línea con la nueva cantidad
      const updatedLineData = {
        ...currentLine,
        currentQuantity: newQuantity
      }
      
      // const response = await MockAPI.updateCultivationLine(lineId, updatedLineData) // TODO: Migrar a nuevo store con JSON Server
      const updatedLine = response.data
      
      // Actualizar estado local
      set((state) => ({
        cultivationLines: state.cultivationLines.map(line => 
          line.id === lineId ? updatedLine : line
        ),
        sectors: state.sectors.map(sector => {
          if (sector.id === updatedLine.sectorId) {
            return {
              ...sector,
              lines: sector.lines?.map(line => 
                line.id === lineId ? updatedLine : line
              ) || []
            }
          }
          return sector
        }),
        loading: false,
        error: null
      }))
      
      console.log('✅ [SectorStore] Line quantity updated after harvest:', { lineId, newQuantity })
      
      return { success: true, data: updatedLine }
    } catch (error) {
      console.error('❌ [SectorStore] Error updating line quantity after harvest:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  resetStore: () => {
    set({
      sectors: [],
      selectedSector: null,
      batteries: [],
      selectedBattery: null,
      cultivationLines: [],
      selectedLine: null,
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    })
  }
}))