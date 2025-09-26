import { create } from 'zustand';
import { seedOriginsService } from '../services/api';

export const useSeedOriginStore = create((set, get) => ({
  // Estado
  seedOrigins: [],
  loading: false,
  error: null,

  // Obtener orígenes de semilla
  fetchSeedOrigins: async () => {
    set({ loading: true, error: null });
    try {
      const seedOrigins = await seedOriginsService.getAll();
      set({ seedOrigins, loading: false });
      return { success: true, data: seedOrigins };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));