import { create } from 'zustand'
// import { mockAPI } from '../services/mock/server' // DESACTIVADO - Migrado a JSON Server

export const useInvestmentStore = create((set, get) => ({
  investments: [],
  distributions: [],
  investorReturns: null,
  loading: false,
  error: null,

  // Fetch all investments (filtered by user role)
  fetchInvestments: async (userId, role) => {
    set({ loading: true, error: null })
    try {
      const filters = {}
      if (role === 'investor') {
        filters.investorId = userId
      } else if (role === 'maricultor') {
        filters.maricultorId = userId
      }
      
      // const investments = await mockAPI.getInvestments(filters) // TODO: Migrar a nuevo store con JSON Server
      set({ investments, loading: false })
      return { success: true, data: investments }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Fetch investments for a specific lot
  fetchInvestmentsByLot: async (lotId) => {
    set({ loading: true, error: null })
    try {
      // const investments = await mockAPI.getInvestmentsByLot(lotId) // TODO: Migrar a nuevo store con JSON Server
      set({ investments, loading: false })
      return { success: true, data: investments }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Create a new investment
  createInvestment: async (investmentData) => {
    set({ loading: true, error: null })
    try {
      // const newInvestment = await mockAPI.createInvestment(investmentData) // TODO: Migrar a nuevo store con JSON Server
      set(state => ({
        investments: [...state.investments, newInvestment],
        loading: false
      }))
      return { success: true, data: newInvestment }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Update an investment
  updateInvestment: async (investmentId, updates) => {
    set({ loading: true, error: null })
    try {
      // const updatedInvestment = await mockAPI.updateInvestment(investmentId, updates) // TODO: Migrar a nuevo store con JSON Server
      set(state => ({
        investments: state.investments.map(inv =>
          inv.id === investmentId ? updatedInvestment : inv
        ),
        loading: false
      }))
      return { success: true, data: updatedInvestment }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Delete an investment
  deleteInvestment: async (investmentId) => {
    set({ loading: true, error: null })
    try {
      // await mockAPI.deleteInvestment(investmentId) // TODO: Migrar a nuevo store con JSON Server
      set(state => ({
        investments: state.investments.filter(inv => inv.id !== investmentId),
        loading: false
      }))
      return { success: true }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Calculate investment returns
  calculateReturns: (investment, harvestData) => {
    const { amount, percentage } = investment
    const totalRevenue = harvestData?.totalRevenue || 0
    const totalExpenses = harvestData?.totalExpenses || 0
    const netProfit = totalRevenue - totalExpenses
    
    const investorShare = (netProfit * percentage) / 100
    const roi = amount > 0 ? ((investorShare - amount) / amount) * 100 : 0
    
    return {
      investorShare,
      roi,
      netProfit,
      totalRevenue
    }
  },

  // Distribute returns to investors
  distributeReturns: async (lotId, distributionData) => {
    set({ loading: true, error: null })
    try {
      // const result = await mockAPI.distributeInvestmentReturns(lotId, distributionData) // TODO: Migrar a nuevo store con JSON Server
      
      // Update local state with distributed returns
      set(state => ({
        investments: state.investments.map(inv => {
          if (inv.lotId === lotId) {
            const distribution = distributionData.distributions.find(d => d.investmentId === inv.id)
            if (distribution) {
              return {
                ...inv,
                totalDistributed: (inv.totalDistributed || 0) + distribution.amount,
                lastDistributionDate: new Date().toISOString(),
                distributedReturns: [...(inv.distributedReturns || []), distribution]
              }
            }
          }
          return inv
        }),
        loading: false
      }))
      
      return { success: true, data: result }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Get investment summary for an investor
  getInvestorSummary: (investorId) => {
    const investments = get().investments.filter(inv => inv.investorId === investorId)
    
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.totalDistributed || 0), 0)
    const activeInvestments = investments.filter(inv => inv.status === 'active').length
    const completedInvestments = investments.filter(inv => inv.status === 'completed').length
    
    const overallROI = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0
    
    return {
      totalInvested,
      totalReturns,
      activeInvestments,
      completedInvestments,
      overallROI,
      investments
    }
  },

  // Get investment summary for a lot
  getLotInvestmentSummary: (lotId) => {
    const investments = get().investments.filter(inv => inv.lotId === lotId)
    
    const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0)
    const investorCount = investments.length
    const ownershipDistribution = {}
    
    investments.forEach(inv => {
      ownershipDistribution[inv.investorId] = {
        amount: inv.amount,
        percentage: inv.percentage,
        investorName: inv.investorName || 'Unknown'
      }
    })
    
    return {
      totalInvestment,
      investorCount,
      ownershipDistribution,
      investments
    }
  },

  // Fetch distributions for an investor
  fetchInvestorReturns: async (investorId) => {
    set({ loading: true, error: null })
    try {
      // const response = await mockAPI.getInvestorReturns(investorId) // TODO: Migrar a nuevo store con JSON Server
      const { distributions, investments, summary } = response.data
      
      set({ 
        distributions: distributions || [],
        investorReturns: summary,
        investments: investments || [],
        loading: false 
      })
      
      return { success: true, data: response.data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Fetch all distributions (with filters)
  fetchDistributions: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      // const response = await mockAPI.getDistributions(filters) // TODO: Migrar a nuevo store con JSON Server
      set({ 
        distributions: response.data || [],
        loading: false 
      })
      return { success: true, data: response.data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },

  // Get distribution by ID
  getDistributionById: async (distributionId) => {
    set({ loading: true, error: null })
    try {
      // const response = await mockAPI.getDistributionById(distributionId) // TODO: Migrar a nuevo store con JSON Server
      return { success: true, data: response.data }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  }
}))