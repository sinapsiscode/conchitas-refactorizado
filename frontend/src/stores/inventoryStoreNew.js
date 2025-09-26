import { create } from 'zustand';
import { inventoryService } from '../services/api';
import configManager from '../config';

export const useInventoryStore = create((set, get) => ({
  // Estado
  inventory: [],
  movements: [],
  categories: [], // Se cargará desde API
  loading: false,
  error: null,
  categoriesLoaded: false,

  // Cargar categorías desde API
  loadCategories: async () => {
    if (get().categoriesLoaded) return;

    try {
      const categories = await configManager.getCategories('inventory');
      set({ categories, categoriesLoaded: true });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ categories: [], categoriesLoaded: true });
    }
  },

  // Obtener inventario
  fetchInventory: async (userId) => {
    // Cargar categorías si no están cargadas
    if (!get().categoriesLoaded) {
      await get().loadCategories();
    }

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

  // Actualizar item de inventario
  updateInventoryItem: async (itemId, itemData) => {
    set({ loading: true, error: null });
    try {
      const updatedItem = await inventoryService.update(itemId, itemData);
      set((state) => ({
        inventory: state.inventory.map(item =>
          item.id === itemId ? updatedItem : item
        ),
        loading: false
      }));
      return { success: true, data: updatedItem };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar item de inventario
  deleteInventoryItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      await inventoryService.delete(itemId);
      set((state) => ({
        inventory: state.inventory.filter(item => item.id !== itemId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar stock de un item
  updateStock: async (itemId, quantity, type = 'add') => {
    const item = get().inventory.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Item no encontrado' };
    }

    const newQuantity = type === 'add'
      ? item.quantity + quantity
      : Math.max(0, item.quantity - quantity);

    return await get().updateInventoryItem(itemId, {
      quantity: newQuantity,
      updatedAt: new Date().toISOString()
    });
  },

  // Obtener valor total del inventario
  getTotalValue: () => {
    const inventory = get().inventory;
    return inventory.reduce((total, item) => {
      const value = (item.quantity || 0) * (item.unitPrice || 0);
      return total + value;
    }, 0);
  },

  // Obtener items con stock bajo
  getLowStockItems: () => {
    const inventory = get().inventory;
    return inventory.filter(item =>
      item.minimumStock &&
      item.quantity < item.minimumStock
    );
  },

  // Crear categoría (para compatibilidad)
  createCategory: async (categoryData) => {
    // Las categorías se manejan como strings en el inventario actual
    console.log('Category creation not implemented in current system');
    return { success: true };
  },

  // Actualizar categoría (para compatibilidad)
  updateCategory: async (categoryId, categoryData) => {
    console.log('Category update not implemented in current system');
    return { success: true };
  },

  // Eliminar categoría (para compatibilidad)
  deleteCategory: async (categoryId) => {
    console.log('Category deletion not implemented in current system');
    return { success: true };
  },

  // Crear movimiento de inventario
  createMovement: async (movementData) => {
    set({ loading: true, error: null });
    try {
      // Actualizar cantidad del item basado en el tipo de movimiento
      const item = get().inventory.find(i => i.id === movementData.itemId);
      if (!item) throw new Error('Item no encontrado');

      let newQuantity = item.quantity;
      if (movementData.type === 'entrada') {
        newQuantity += movementData.quantity;
      } else if (movementData.type === 'salida') {
        newQuantity -= movementData.quantity;
      }

      // Actualizar el item
      const result = await get().updateInventoryItem(movementData.itemId, {
        quantity: newQuantity
      });

      // Registrar el movimiento (si tuviéramos una colección de movimientos)
      const movement = {
        ...movementData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        movements: [...(state.movements || []), movement],
        loading: false
      }));

      return result;
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },


  // Limpiar errores
  clearError: () => set({ error: null })
}));