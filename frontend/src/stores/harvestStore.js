import { create } from 'zustand'
import { MockAPI } from '../services/mock/server.js'

export const useHarvestStore = create((set, get) => ({
  harvestPlans: [],
  harvestCostCategories: [],
  pricing: [],
  loading: false,
  error: null,
  
  fetchHarvestPlans: async (userId = null, sectorId = null) => {
    console.log('📋 [HarvestStore] Fetching harvest plans for user:', userId, 'sector:', sectorId)
    set({ loading: true, error: null })

    try {
      const response = await MockAPI.getHarvestPlans(userId, sectorId)
      console.log('📋 [HarvestStore] Harvest plans fetched successfully:', response.data.length, 'plans')
      console.log('📋 [HarvestStore] DETAILED PLANS DATA:')
      response.data.forEach((plan, index) => {
        console.log(`📋 [HarvestStore] Plan ${index + 1}:`, {
          id: plan.id,
          status: plan.status,
          plannedDate: plan.plannedDate,
          estimatedQuantity: plan.estimatedQuantity,
          estimatedQuantityType: typeof plan.estimatedQuantity,
          isValidNumber: !isNaN(parseFloat(plan.estimatedQuantity)),
          parsedValue: parseFloat(plan.estimatedQuantity)
        })
      })

      set({
        harvestPlans: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ [HarvestStore] Error fetching harvest plans:', error)
      set({
        loading: false,
        error: error.message,
        harvestPlans: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createHarvestPlan: async (planData) => {
    console.log('💾 [HarvestStore] Creating harvest plan with estimatedQuantity:', planData.estimatedQuantity, 'type:', typeof planData.estimatedQuantity)
    console.log('💾 [HarvestStore] Complete plan data:', planData)
    set({ loading: true, error: null })

    try {
      const response = await MockAPI.createHarvestPlan(planData)
      const newPlan = response.data
      console.log('💾 [HarvestStore] Harvest plan created successfully:', newPlan.id)
      console.log('💾 [HarvestStore] Created plan estimatedQuantity:', newPlan.estimatedQuantity, 'type:', typeof newPlan.estimatedQuantity)
      console.log('💾 [HarvestStore] Full created plan:', newPlan)
      
      set((state) => ({
        harvestPlans: [...state.harvestPlans, newPlan],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newPlan }
    } catch (error) {
      console.error('❌ [HarvestStore] Error creating harvest plan:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  fetchPricing: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.getPricing()
      
      set({
        pricing: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        pricing: []
      })
      
      return { success: false, error: error.message }
    }
  },

  fetchHarvestCostCategories: async () => {
    console.log('💰 [HarvestStore] Fetching harvest cost categories')
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.getHarvestCostCategories()
      console.log('💰 [HarvestStore] Cost categories fetched:', response.data.length, 'categories')
      
      set({
        harvestCostCategories: response.data,
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      console.error('❌ [HarvestStore] Error fetching cost categories:', error)
      set({
        loading: false,
        error: error.message,
        harvestCostCategories: []
      })
      
      return { success: false, error: error.message }
    }
  },

  updateHarvestPlan: async (updateData) => {
    console.log('✏️ [HarvestStore] Updating harvest plan:', updateData.id, 'with data:', updateData)
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.updateHarvestPlan(updateData)
      const updatedPlan = response.data
      console.log('✏️ [HarvestStore] Harvest plan updated successfully:', updatedPlan.id)
      
      // Si la cosecha se completó, actualizar las cantidades en las líneas de cultivo
      if (updateData.status === 'completed' && updateData.actualQuantity) {
        const { sectorStore } = await import('./sectorStore')
        const harvestPlans = get().harvestPlans
        const originalPlan = harvestPlans.find(p => p.id === updateData.id)
        
        if (originalPlan?.selectedLot) {
          const lineId = originalPlan.selectedLot.id
          const selectedSystems = originalPlan.selectedLot.selectedSystems || []
          const quantityToReduce = updateData.actualQuantity
          
          console.log('📦 [HarvestStore] Reducing line quantity:', { lineId, selectedSystems, quantityToReduce })
          
          // Actualizar la cantidad en la línea de cultivo
          await sectorStore.getState().updateLineQuantityAfterHarvest(
            lineId, 
            selectedSystems, 
            quantityToReduce
          )
        }
      }
      
      set((state) => ({
        harvestPlans: state.harvestPlans.map(plan => 
          plan.id === updateData.id ? updatedPlan : plan
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedPlan }
    } catch (error) {
      console.error('❌ [HarvestStore] Error updating harvest plan:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  deleteHarvestPlan: async (planId) => {
    console.log('🗑️ [HarvestStore] Deleting harvest plan:', planId)
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.deleteHarvestPlan(planId)
      console.log('🗑️ [HarvestStore] Harvest plan deleted successfully:', planId)
      
      set((state) => ({
        harvestPlans: state.harvestPlans.filter(plan => plan.id !== planId),
        loading: false,
        error: null
      }))
      
      return { success: true, message: response.message }
    } catch (error) {
      console.error('❌ [HarvestStore] Error deleting harvest plan:', error)
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createPricing: async (pricingData) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.createPricing(pricingData)
      const newPricing = response.data
      
      set((state) => ({
        pricing: [...state.pricing, newPricing],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newPricing }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  getUpcomingHarvests: () => {
    const { harvestPlans } = get()
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    
    return harvestPlans.filter(plan => {
      const plannedDate = new Date(plan.plannedDate)
      return plan.status === 'planned' && 
             plannedDate >= today && 
             plannedDate <= thirtyDaysFromNow
    })
  },
  
  getPriceBySize: (size) => {
    const { pricing } = get()
    return pricing.find(p => p.sizeCategory === size && p.isActive)
  },
  
  getHarvestCalendar: () => {
    const { harvestPlans } = get()
    const calendar = {}
    
    harvestPlans.forEach(plan => {
      const month = new Date(plan.plannedDate).toISOString().substring(0, 7)
      if (!calendar[month]) {
        calendar[month] = []
      }
      calendar[month].push(plan)
    })
    
    return calendar
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  createHarvestCostCategory: async (categoryData) => {
    console.log('💰 [HarvestStore] Creating harvest cost category:', categoryData)
    set({ loading: true, error: null })

    try {
      const response = await MockAPI.createHarvestCostCategory(categoryData)
      console.log('💰 [HarvestStore] Category created successfully:', response.data)

      set((state) => ({
        harvestCostCategories: [...state.harvestCostCategories, response.data],
        loading: false,
        error: null
      }))

      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ [HarvestStore] Error creating cost category:', error)
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  updateHarvestCostCategory: async (categoryId, updateData) => {
    console.log('💰 [HarvestStore] Updating harvest cost category:', categoryId)
    set({ loading: true, error: null })

    try {
      const response = await MockAPI.updateHarvestCostCategory(categoryId, updateData)
      console.log('💰 [HarvestStore] Category updated successfully:', response.data)

      set((state) => ({
        harvestCostCategories: state.harvestCostCategories.map(category =>
          category.id === categoryId ? response.data : category
        ),
        loading: false,
        error: null
      }))

      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ [HarvestStore] Error updating cost category:', error)
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  deleteHarvestCostCategory: async (categoryId) => {
    console.log('💰 [HarvestStore] Deleting harvest cost category:', categoryId)
    set({ loading: true, error: null })

    try {
      const response = await MockAPI.deleteHarvestCostCategory(categoryId)
      console.log('💰 [HarvestStore] Category deleted successfully:', categoryId)

      set((state) => ({
        harvestCostCategories: state.harvestCostCategories.filter(category => category.id !== categoryId),
        loading: false,
        error: null
      }))

      return { success: true, message: response.message }
    } catch (error) {
      console.error('❌ [HarvestStore] Error deleting cost category:', error)
      set({
        loading: false,
        error: error.message
      })

      return { success: false, error: error.message }
    }
  },

  resetStore: () => {
    set({
      harvestPlans: [],
      harvestCostCategories: [],
      pricing: [],
      loading: false,
      error: null
    })
  }
}))