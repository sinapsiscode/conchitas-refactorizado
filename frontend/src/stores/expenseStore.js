import { create } from 'zustand'
// import { MockAPI } from '../services/mock/server.js' // DESACTIVADO - Migrado a JSON Server

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  loading: false,
  error: null,
  filters: {
    lotId: null,
    sectorId: null,
    category: null,
    startDate: null,
    endDate: null
  },
  
  fetchExpenses: async (filters = {}) => {
    set({ loading: true, error: null, filters })
    
    try {
      // const response = await MockAPI.getExpenses(filters) // TODO: Migrar a nuevo store con JSON Server
      
      set({
        expenses: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        expenses: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createExpense: async (expenseData) => {
    set({ loading: true, error: null })
    
    try {
      // const response = await MockAPI.createExpense(expenseData) // TODO: Migrar a nuevo store con JSON Server
      const newExpense = response.data
      
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newExpense }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  getTotalExpenses: () => {
    const { expenses } = get()
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  },
  
  getExpensesByCategory: () => {
    const { expenses } = get()
    const byCategory = {}
    
    expenses.forEach(expense => {
      if (!byCategory[expense.category]) {
        byCategory[expense.category] = 0
      }
      byCategory[expense.category] += expense.amount
    })
    
    return byCategory
  },
  
  getExpensesByLot: (lotId) => {
    const { expenses } = get()
    return expenses.filter(expense => expense.lotId === lotId)
  },
  
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }))
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      expenses: [],
      loading: false,
      error: null,
      filters: {
        lotId: null,
        sectorId: null,
        category: null,
        startDate: null,
        endDate: null
      }
    })
  }
}))