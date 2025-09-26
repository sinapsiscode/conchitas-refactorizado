import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useIncomeStore = create((set, get) => ({
  incomeRecords: [],
  loading: false,
  error: null,
  
  fetchIncomeRecords: async (userId = null, filters = {}) => {
    console.log('💰 [IncomeStore] Fetching income records for user:', userId, 'filters:', filters)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getIncomeRecords(userId, filters) // TODO: Migrar a nuevo store con JSON Server
      console.log('💰 [IncomeStore] Income records fetched successfully:', response.data.length, 'records')
      
      set({
        incomeRecords: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ [IncomeStore] Error fetching income records:', error)
      set({
        loading: false,
        error: error.message,
        incomeRecords: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createIncomeRecord: async (incomeData) => {
    console.log('💾 [IncomeStore] Creating income record:', incomeData)
    set({ loading: true, error: null })
    
    try {
      // Calcular análisis por unidad si hay datos de presentación
      if (incomeData.presentationDistribution && incomeData.presentationDistribution.totals) {
        const totals = incomeData.presentationDistribution.totals
        incomeData.unitAnalysis = {
          manojos: totals.totalManojos || 0,
          mallas: parseFloat(totals.totalMallas) || 0,
          conchitas: totals.totalConchitas || 0,
          pricePerManojo: totals.totalManojos > 0 ? totals.totalRevenue / totals.totalManojos : 0,
          pricePerMalla: parseFloat(totals.totalMallas) > 0 ? totals.totalRevenue / parseFloat(totals.totalMallas) : 0,
          pricePerConchita: totals.totalConchitas > 0 ? totals.totalRevenue / totals.totalConchitas : 0
        }
      }
      
      // const response = await MockAPI.createIncomeRecord(incomeData) // TODO: Migrar a nuevo store con JSON Server
      const newRecord = response.data
      console.log('💾 [IncomeStore] Income record created successfully:', newRecord.id)
      
      set((state) => ({
        incomeRecords: [...state.incomeRecords, newRecord],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newRecord }
    } catch (error) {
      console.error('❌ [IncomeStore] Error creating income record:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  updateIncomeRecord: async (updateData) => {
    console.log('✏️ [IncomeStore] Updating income record:', updateData.id, 'with data:', updateData)
    set({ loading: true, error: null })
    
    try {
      // Calcular análisis por unidad si hay datos de presentación
      if (updateData.presentationDistribution && updateData.presentationDistribution.totals) {
        const totals = updateData.presentationDistribution.totals
        updateData.unitAnalysis = {
          manojos: totals.totalManojos || 0,
          mallas: parseFloat(totals.totalMallas) || 0,
          conchitas: totals.totalConchitas || 0,
          pricePerManojo: totals.totalManojos > 0 ? totals.totalRevenue / totals.totalManojos : 0,
          pricePerMalla: parseFloat(totals.totalMallas) > 0 ? totals.totalRevenue / parseFloat(totals.totalMallas) : 0,
          pricePerConchita: totals.totalConchitas > 0 ? totals.totalRevenue / totals.totalConchitas : 0
        }
      }
      
      // const response = await MockAPI.updateIncomeRecord(updateData) // TODO: Migrar a nuevo store con JSON Server
      const updatedRecord = response.data
      console.log('✏️ [IncomeStore] Income record updated successfully:', updatedRecord.id)
      
      set((state) => ({
        incomeRecords: state.incomeRecords.map(record => 
          record.id === updateData.id ? updatedRecord : record
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedRecord }
    } catch (error) {
      console.error('❌ [IncomeStore] Error updating income record:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  deleteIncomeRecord: async (recordId) => {
    console.log('🗑️ [IncomeStore] Deleting income record:', recordId)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.deleteIncomeRecord(recordId) // TODO: Migrar a nuevo store con JSON Server
      console.log('🗑️ [IncomeStore] Income record deleted successfully:', recordId)
      
      set((state) => ({
        incomeRecords: state.incomeRecords.filter(record => record.id !== recordId),
        loading: false,
        error: null
      }))
      
      return { success: true, message: response.message }
    } catch (error) {
      console.error('❌ [IncomeStore] Error deleting income record:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  // Helper methods
  getTotalIncomeByPeriod: (startDate, endDate) => {
    const { incomeRecords } = get()
    return incomeRecords
      .filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= startDate && recordDate <= endDate
      })
      .reduce((total, record) => total + record.totalAmount, 0)
  },
  
  getIncomeByHarvest: (harvestPlanId) => {
    const { incomeRecords } = get()
    return incomeRecords.find(record => record.harvestPlanId === harvestPlanId)
  },
  
  getIncomeRecordsByStatus: (status) => {
    const { incomeRecords } = get()
    return incomeRecords.filter(record => record.status === status)
  },
  
  getTotalIncomeByMonth: (year, month) => {
    const { incomeRecords } = get()
    return incomeRecords
      .filter(record => {
        const recordDate = new Date(record.date)
        return recordDate.getFullYear() === year && recordDate.getMonth() === month
      })
      .reduce((total, record) => total + record.totalAmount, 0)
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      incomeRecords: [],
      loading: false,
      error: null
    })
  }
}))