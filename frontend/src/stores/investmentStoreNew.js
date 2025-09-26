import { create } from 'zustand';
import { investmentsService } from '../services/api';

export const useInvestmentStore = create((set, get) => ({
  // Estado
  investments: [],
  loading: false,
  error: null,

  // Obtener inversiones
  fetchInvestments: async (userId) => {
    set({ loading: true, error: null });
    try {
      const investments = await investmentsService.getAll({ userId });
      set({ investments, loading: false });
      return { success: true, data: investments };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));