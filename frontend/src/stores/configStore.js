import { create } from 'zustand';
import { configService } from '../services/api/configService';

/**
 * Store de Configuración Global
 * Centraliza todas las configuraciones del sistema
 */
export const useConfigStore = create((set, get) => ({
  // Estado
  configurations: {
    expenseCategories: [],
    inventoryCategories: [],
    sizeCategories: [],
    harvestCostCategories: [],
    pricing: [],
    systemSettings: {}
  },
  loading: false,
  error: null,
  initialized: false,

  /**
   * Inicializar todas las configuraciones
   * Debe llamarse al inicio de la aplicación
   */
  initializeConfigurations: async () => {
    // Si ya está inicializado, no recargar
    if (get().initialized) {
      return { success: true, cached: true };
    }

    set({ loading: true, error: null });

    try {
      // Cargar todas las configuraciones en paralelo
      const [
        expenseCategories,
        inventoryCategories,
        sizeCategories,
        harvestCostCategories,
        pricing,
        systemSettings
      ] = await Promise.all([
        configService.getExpenseCategories(),
        configService.getInventoryCategories(),
        configService.getSizeCategories(),
        configService.getHarvestCostCategories(),
        configService.getPricing(),
        configService.getSystemSettings()
      ]);

      set({
        configurations: {
          expenseCategories,
          inventoryCategories,
          sizeCategories,
          harvestCostCategories,
          pricing,
          systemSettings
        },
        loading: false,
        initialized: true
      });

      return { success: true };
    } catch (error) {
      set({
        error: error.message,
        loading: false
      });
      return { success: false, error: error.message };
    }
  },

  /**
   * Obtener categorías de gastos
   */
  getExpenseCategories: () => {
    const { configurations } = get();
    return configurations.expenseCategories;
  },

  /**
   * Obtener categorías de inventario
   */
  getInventoryCategories: () => {
    const { configurations } = get();
    return configurations.inventoryCategories;
  },

  /**
   * Obtener categorías de tallas
   */
  getSizeCategories: () => {
    const { configurations } = get();
    return configurations.sizeCategories;
  },

  /**
   * Obtener categorías de costos de cosecha
   */
  getHarvestCostCategories: () => {
    const { configurations } = get();
    return configurations.harvestCostCategories;
  },

  /**
   * Obtener tabla de precios
   */
  getPricing: () => {
    const { configurations } = get();
    return configurations.pricing;
  },

  /**
   * Obtener configuraciones del sistema
   */
  getSystemSettings: () => {
    const { configurations } = get();
    return configurations.systemSettings;
  },

  /**
   * Crear nueva categoría
   */
  createCategory: async (categoryData) => {
    set({ loading: true, error: null });

    try {
      const newCategory = await configService.createCategory(categoryData);

      // Recargar configuraciones
      await get().refreshConfigurations();

      return { success: true, data: newCategory };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar categoría
   */
  updateCategory: async (categoryId, categoryData) => {
    set({ loading: true, error: null });

    try {
      const updatedCategory = await configService.updateCategory(categoryId, categoryData);

      // Recargar configuraciones
      await get().refreshConfigurations();

      return { success: true, data: updatedCategory };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Eliminar categoría
   */
  deleteCategory: async (categoryId) => {
    set({ loading: true, error: null });

    try {
      await configService.deleteCategory(categoryId);

      // Recargar configuraciones
      await get().refreshConfigurations();

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Actualizar tabla de precios
   */
  updatePricing: async (pricingData) => {
    set({ loading: true, error: null });

    try {
      const updatedPricing = await configService.updatePricing(pricingData);

      // Actualizar estado local
      set((state) => ({
        configurations: {
          ...state.configurations,
          pricing: updatedPricing
        },
        loading: false
      }));

      return { success: true, data: updatedPricing };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  /**
   * Refrescar configuraciones desde el servidor
   */
  refreshConfigurations: async () => {
    // Limpiar cache del servicio
    configService.clearCache();

    // Marcar como no inicializado para forzar recarga
    set({ initialized: false });

    // Recargar todo
    return await get().initializeConfigurations();
  },

  /**
   * Limpiar errores
   */
  clearError: () => set({ error: null })
}));

// Hook para usar categorías específicas
export const useExpenseCategories = () => {
  const categories = useConfigStore(state => state.configurations.expenseCategories);
  const loading = useConfigStore(state => state.loading);
  return { categories, loading };
};

export const useInventoryCategories = () => {
  const categories = useConfigStore(state => state.configurations.inventoryCategories);
  const loading = useConfigStore(state => state.loading);
  return { categories, loading };
};

export const useSizeCategories = () => {
  const categories = useConfigStore(state => state.configurations.sizeCategories);
  const loading = useConfigStore(state => state.loading);
  return { categories, loading };
};

export const useHarvestCostCategories = () => {
  const categories = useConfigStore(state => state.configurations.harvestCostCategories);
  const loading = useConfigStore(state => state.loading);
  return { categories, loading };
};

export const usePricing = () => {
  const pricing = useConfigStore(state => state.configurations.pricing);
  const loading = useConfigStore(state => state.loading);
  return { pricing, loading };
};