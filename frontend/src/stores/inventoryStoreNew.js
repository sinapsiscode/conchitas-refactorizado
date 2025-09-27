import { create } from 'zustand';
import { inventoryService, categoriesService } from '../services/api';
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
      // Cargar todas las categorías desde JSON Server
      const categories = await categoriesService.getAll({ type: 'inventory' });
      set({ categories, categoriesLoaded: true });
    } catch (error) {
      console.error('Error loading categories:', error);
      set({ categories: [], categoriesLoaded: true });
    }
  },

  // Obtener inventario - SIMPLIFICADO
  fetchInventory: async (userId) => {
    console.log('📦 [InventoryStore] Cargando inventario compartido...');
    set({ loading: true, error: null });

    try {
      // Traer TODO el inventario sin filtrar por usuario
      // El inventario es un recurso compartido en la operación
      const response = await fetch('http://localhost:4077/inventory');
      const data = await response.json();

      console.log('📦 [InventoryStore] Datos recibidos:', data);

      // Guardar en el estado
      set({
        inventory: data || [],
        loading: false,
        error: null
      });

      console.log('✅ [InventoryStore] Inventario cargado:', data?.length || 0, 'items');
      return { success: true, data: data || [] };
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

  // Crear categoría en JSON Server
  createCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const newCategory = await categoriesService.create({
        ...categoryData,
        type: 'inventory',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        categories: [...state.categories, newCategory],
        loading: false
      }));

      return { success: true, data: newCategory };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar categoría en JSON Server
  updateCategory: async (categoryId, categoryData) => {
    set({ loading: true, error: null });
    try {
      const updatedCategory = await categoriesService.update(categoryId, {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        categories: state.categories.map(cat =>
          cat.id === categoryId ? updatedCategory : cat
        ),
        loading: false
      }));

      return { success: true, data: updatedCategory };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar categoría de JSON Server
  deleteCategory: async (categoryId) => {
    set({ loading: true, error: null });
    try {
      await categoriesService.delete(categoryId);

      set((state) => ({
        categories: state.categories.filter(cat => cat.id !== categoryId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
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