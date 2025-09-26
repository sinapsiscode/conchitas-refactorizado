import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useSeedOriginStore = create((set, get) => ({
  seedOrigins: [],
  loading: false,
  error: null,
  
  fetchSeedOrigins: async () => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getSeedOrigins() // TODO: Migrar a nuevo store con JSON Server
      
      set({
        seedOrigins: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        seedOrigins: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createSeedOrigin: async (originData) => {
    set({ loading: true, error: null })
    
    try {
      const dataWithComputedPrice = {
        ...originData,
        pricePerUnit: originData.pricePerBundle / (originData.bundleSize || 96)
      }
      
      // const response = await MockAPI.createSeedOrigin(dataWithComputedPrice) // TODO: Migrar a nuevo store con JSON Server
      const newOrigin = response.data
      
      set((state) => ({
        seedOrigins: [newOrigin, ...state.seedOrigins],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newOrigin }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  updateSeedOrigin: async (originId, updatedData) => {
    set({ loading: true, error: null })
    
    try {
      const dataWithComputedPrice = {
        ...updatedData,
        pricePerUnit: updatedData.pricePerBundle ? updatedData.pricePerBundle / (updatedData.bundleSize || 96) : updatedData.pricePerUnit
      }
      
      // const response = await MockAPI.updateSeedOrigin(originId, dataWithComputedPrice) // TODO: Migrar a nuevo store con JSON Server
      const updatedOrigin = response.data
      
      set((state) => ({
        seedOrigins: state.seedOrigins.map(origin => 
          origin.id === originId ? updatedOrigin : origin
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedOrigin }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  deleteSeedOrigin: async (originId) => {
    set({ loading: true, error: null })
    
    try {
      // await MockAPI.deleteSeedOrigin(originId) // TODO: Migrar a nuevo store con JSON Server
      
      set((state) => ({
        seedOrigins: state.seedOrigins.filter(origin => origin.id !== originId),
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
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      seedOrigins: [],
      loading: false,
      error: null
    })
  }
}))