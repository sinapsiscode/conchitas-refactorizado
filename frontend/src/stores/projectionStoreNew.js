import { create } from 'zustand';
import { projectionsService } from '../services/api';

export const useProjectionStore = create((set, get) => ({
  // Estado
  projections: [],
  loading: false,
  error: null,

  // Obtener proyecciones
  fetchProjections: async (userId) => {
    set({ loading: true, error: null });
    try {
      const projections = await projectionsService.getAll({ userId });
      set({ projections, loading: false });
      return { success: true, data: projections };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));