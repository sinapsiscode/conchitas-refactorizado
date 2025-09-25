import { create } from 'zustand'
import { MockAPI } from '../services/mock/server.js'

export const useSeedOriginStore = create((set, get) => ({
  seedOrigins: [],
  loading: false,
  error: null,
  
  fetchSeedOrigins: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.getSeedOrigins()
      
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
      
      const response = await MockAPI.createSeedOrigin(dataWithComputedPrice)
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
      
      const response = await MockAPI.updateSeedOrigin(originId, dataWithComputedPrice)
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
      await MockAPI.deleteSeedOrigin(originId)
      
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