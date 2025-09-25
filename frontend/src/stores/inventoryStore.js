import { create } from 'zustand'
import { MockAPI } from '../services/mock/server.js'
import { MockDB } from '../services/mock/db.js'
import { generateUUID } from '../utils/uuid.js'

export const useInventoryStore = create((set, get) => ({
  inventory: [],
  categories: [],
  movements: [],
  loading: false,
  error: null,
  
  fetchInventory: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.getInventory()
      const categories = MockDB.get('inventoryCategories')
      
      set({
        inventory: response.data,
        categories: categories || [],
        loading: false,
        error: null
      })
      
      return { success: true }
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        inventory: [],
        categories: []
      })
      
      return { success: false, error: error.message }
    }
  },
  
  fetchCategories: () => {
    const categories = MockDB.get('inventoryCategories')
    set({ categories: categories || [] })
    return categories || []
  },
  
  createCategory: (categoryData) => {
    const newCategory = {
      id: generateUUID(),
      ...categoryData,
      createdAt: new Date().toISOString()
    }
    
    const currentCategories = MockDB.get('inventoryCategories') || []
    const updatedCategories = [...currentCategories, newCategory]
    MockDB.set('inventoryCategories', updatedCategories)
    
    set({ categories: updatedCategories })
    return { success: true, data: newCategory }
  },
  
  updateCategory: (categoryId, updates) => {
    const categories = MockDB.get('inventoryCategories') || []
    const index = categories.findIndex(c => c.id === categoryId)
    
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates }
      MockDB.set('inventoryCategories', categories)
      set({ categories })
      return { success: true }
    }
    
    return { success: false, error: 'Categoría no encontrada' }
  },
  
  deleteCategory: (categoryId) => {
    const { inventory } = get()
    const itemsInCategory = inventory.filter(item => item.category === categoryId)
    
    if (itemsInCategory.length > 0) {
      return { success: false, error: 'No se puede eliminar una categoría con items' }
    }
    
    const categories = MockDB.get('inventoryCategories') || []
    const filteredCategories = categories.filter(c => c.id !== categoryId)
    MockDB.set('inventoryCategories', filteredCategories)
    
    set({ categories: filteredCategories })
    return { success: true }
  },
  
  createInventoryItem: async (itemData) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.createInventoryItem(itemData)
      const newItem = response.data
      
      set((state) => ({
        inventory: [...state.inventory, newItem],
        loading: false,
        error: null
      }))
      
      return { success: true, data: newItem }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },

  updateInventoryItem: async (itemId, updates) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.updateInventoryItem(itemId, updates)
      const updatedItem = response.data
      
      set((state) => ({
        inventory: state.inventory.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: updatedItem }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  createMovement: async (movementData) => {
    set({ loading: true, error: null })
    
    try {
      const response = await MockAPI.createInventoryMovement(movementData)
      const movement = response.data
      
      set((state) => ({
        movements: [movement, ...state.movements],
        inventory: state.inventory.map(item => 
          item.id === movementData.inventoryId
            ? { ...item, quantity: movement.newQuantity }
            : item
        ),
        loading: false,
        error: null
      }))
      
      return { success: true, data: movement }
    } catch (error) {
      set({
        loading: false,
        error: error.message
      })
      
      return { success: false, error: error.message }
    }
  },
  
  getItemById: (id) => {
    const { inventory } = get()
    return inventory.find(item => item.id === id)
  },
  
  getLowStockItems: () => {
    const { inventory } = get()
    return inventory.filter(item => item.quantity <= (item.minStock || 0))
  },
  
  getTotalValue: () => {
    const { inventory } = get()
    return inventory.reduce((sum, item) => sum + item.totalValue, 0)
  },
  
  getItemsByCategory: (category) => {
    const { inventory } = get()
    return inventory.filter(item => item.category === category)
  },

  fetchMovements: () => {
    const movements = MockDB.get('inventoryMovements') || []
    set({ movements })
    return movements
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  resetStore: () => {
    set({
      inventory: [],
      categories: [],
      movements: [],
      loading: false,
      error: null
    })
  }
}))