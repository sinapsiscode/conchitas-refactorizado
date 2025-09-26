import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useMonitoringStore = create((set, get) => ({
  monitoringRecords: [],
  selectedLot: null,
  loading: false,
  error: null,
  dateRange: {
    startDate: null,
    endDate: null
  },
  
  fetchMonitoring: async (lotId, startDate = null, endDate = null) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getMonitoring(lotId, startDate, endDate) // TODO: Migrar a nuevo store con JSON Server
      
      set({
        monitoringRecords: response.data,
        loading: false,
        error: null,
        dateRange: { startDate, endDate }
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        monitoringRecords: []
      })
      
      return { success: false, error: error.message }
    }
  },

  fetchAllMonitoring: async () => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getAllMonitoring() // TODO: Migrar a nuevo store con JSON Server
      
      set({
        monitoringRecords: response.data,
        loading: false,
        error: null
      })
      
      return { success: true, data: response.data }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        monitoringRecords: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createMonitoring: async (monitoringData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.createMonitoring(monitoringData) // TODO: Migrar a nuevo store con JSON Server
      const newRecord = response.data
      
      set((state) => ({
        monitoringRecords: [newRecord, ...state.monitoringRecords],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newRecord }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  updateMonitoring: async (recordId, additionalData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.updateMonitoring(recordId, additionalData) // TODO: Migrar a nuevo store con JSON Server
      const updatedRecord = response.data
      
      set((state) => ({
        monitoringRecords: state.monitoringRecords.map(record => 
          record.id === recordId ? updatedRecord : record
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedRecord }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  selectLot: (lot) => {
    set({ selectedLot: lot })
  },
  
  setDateRange: (startDate, endDate) => {
    set({ dateRange: { startDate, endDate } })
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      monitoringRecords: [],
      selectedLot: null,
      loading: false,
      error: null,
      dateRange: {
        startDate: null,
        endDate: null
      }
    })
  }
}))