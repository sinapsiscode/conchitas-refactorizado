import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useIncomeStatementClosureStore = create((set, get) => ({
  closures: [],
  loading: false,
  error: null,
  
  fetchClosures: async (userId = null, filters = {}) => {
    console.log('📊 [ClosureStore] Fetching income statement closures for user:', userId, 'filters:', filters)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.getIncomeStatementClosures(userId, filters) // TODO: Migrar a nuevo store con JSON Server
      console.log('📊 [ClosureStore] Closures fetched successfully:', response.data.length, 'closures')
      
      set({
        closures: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ [ClosureStore] Error fetching closures:', error)
      set({
        loading: false,
        error: error.message,
        closures: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createClosure: async (closureData) => {
    console.log('💾 [ClosureStore] Creating income statement closure:', closureData)
    console.log('🔍 [ClosureStore] Date validation check:', {
      periodStartDate: closureData.periodStartDate,
      periodEndDate: closureData.periodEndDate,
      startDateObj: new Date(closureData.periodStartDate),
      endDateObj: new Date(closureData.periodEndDate),
      comparison: new Date(closureData.periodStartDate) <= new Date(closureData.periodEndDate),
      closureType: closureData.closureType
    })
    set({ loading: true, error: null })

    try {
      // const response = await MockAPI.createIncomeStatementClosure(closureData) // TODO: Migrar a nuevo store con JSON Server
      const newClosure = response.data
      console.log('💾 [ClosureStore] Closure created successfully:', newClosure.id)
      
      set((state) => ({
        closures: [...state.closures, newClosure],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newClosure }
    } catch (error) {
      console.error('❌ [ClosureStore] Error creating closure:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  finalizeClosure: async (closureId, finalizedBy) => {
    console.log('🔒 [ClosureStore] Finalizing closure:', closureId)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.finalizeIncomeStatementClosure(closureId, finalizedBy) // TODO: Migrar a nuevo store con JSON Server
      const finalizedClosure = response.data
      console.log('🔒 [ClosureStore] Closure finalized successfully:', finalizedClosure.id)
      
      set((state) => ({
        closures: state.closures.map(closure => 
          closure.id === closureId ? finalizedClosure : closure
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: finalizedClosure }
    } catch (error) {
      console.error('❌ [ClosureStore] Error finalizing closure:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  registerClosureInCashFlow: async (closureId) => {
    console.log('💰 [ClosureStore] Registering closure in cash flow:', closureId)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.registerClosureInCashFlow(closureId) // TODO: Migrar a nuevo store con JSON Server
      const updatedClosure = response.data
      console.log('💰 [ClosureStore] Closure registered in cash flow:', updatedClosure.id)
      
      set((state) => ({
        closures: state.closures.map(closure => 
          closure.id === closureId ? updatedClosure : closure
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedClosure }
    } catch (error) {
      console.error('❌ [ClosureStore] Error registering in cash flow:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  updateClosure: async (updateData) => {
    console.log('✏️ [ClosureStore] Updating closure:', updateData.id, 'with data:', updateData)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.updateIncomeStatementClosure(updateData) // TODO: Migrar a nuevo store con JSON Server
      const updatedClosure = response.data
      console.log('✏️ [ClosureStore] Closure updated successfully:', updatedClosure.id)
      
      set((state) => ({
        closures: state.closures.map(closure => 
          closure.id === updateData.id ? updatedClosure : closure
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedClosure }
    } catch (error) {
      console.error('❌ [ClosureStore] Error updating closure:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  deleteClosure: async (closureId) => {
    console.log('🗑️ [ClosureStore] Deleting closure:', closureId)
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.deleteIncomeStatementClosure(closureId) // TODO: Migrar a nuevo store con JSON Server
      console.log('🗑️ [ClosureStore] Closure deleted successfully:', closureId)
      
      set((state) => ({
        closures: state.closures.filter(closure => closure.id !== closureId),
        loading: false,
        error: null
      }))
      
      return { success: true, message: response.message }
    } catch (error) {
      console.error('❌ [ClosureStore] Error deleting closure:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  // Helper methods
  getClosuresByPeriod: (year, type = 'all') => {
    const { closures } = get()
    return closures.filter(closure => {
      const startYear = new Date(closure.periodStartDate).getFullYear()
      return startYear === year && (type === 'all' || closure.closureType === type)
    })
  },
  
  getClosuresByStatus: (status) => {
    const { closures } = get()
    return closures.filter(closure => closure.status === status)
  },
  
  getFinalizedClosures: () => {
    const { closures } = get()
    return closures.filter(closure => closure.status === 'finalized' || closure.status === 'registered_in_cash_flow')
  },
  
  getTotalNetProfitByPeriod: (startDate, endDate) => {
    const { closures } = get()
    return closures
      .filter(closure => {
        const closureStart = new Date(closure.periodStartDate)
        const closureEnd = new Date(closure.periodEndDate)
        const rangeStart = new Date(startDate)
        const rangeEnd = new Date(endDate)
        
        return (closureStart >= rangeStart && closureEnd <= rangeEnd) && 
               (closure.status === 'finalized' || closure.status === 'registered_in_cash_flow')
      })
      .reduce((total, closure) => total + closure.netProfit, 0)
  },
  
  getLastClosureDate: () => {
    const { closures } = get()
    const finalizedClosures = closures.filter(c => c.status === 'finalized' || c.status === 'registered_in_cash_flow')
    if (finalizedClosures.length === 0) return null
    
    return finalizedClosures
      .sort((a, b) => new Date(b.periodEndDate) - new Date(a.periodEndDate))[0]
      .periodEndDate
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      closures: [],
      loading: false,
      error: null
    })
  }
}))