import { create } from 'zustand';
import { incomeStatementClosuresService } from '../services/api';

export const useIncomeStatementClosureStore = create((set, get) => ({
  // Estado
  closures: [],
  loading: false,
  error: null,

  // Obtener cierres
  fetchClosures: async (userId) => {
    set({ loading: true, error: null });
    try {
      const closures = await incomeStatementClosuresService.getAll({ userId });
      set({ closures, loading: false });
      return { success: true, data: closures };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));