import { create } from 'zustand';
import { inventoryService } from '../services/api';

export const useInventoryStore = create((set, get) => ({
  // Estado
  inventory: [],
  movements: [],
  loading: false,
  error: null,

  // Obtener inventario
  fetchInventory: async (userId) => {
    set({ loading: true, error: null });
    try {
      const inventory = await inventoryService.getAll({ userId });
      set({ inventory, loading: false });
      return { success: true, data: inventory };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear item de inventario
  createInventoryItem: async (itemData) => {
    set({ loading: true, error: null });
    try {
      const newItem = await inventoryService.create(itemData);
      set((state) => ({
        inventory: [...state.inventory, newItem],
        loading: false
      }));
      return { success: true, data: newItem };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));