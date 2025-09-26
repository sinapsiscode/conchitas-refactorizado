import { create } from 'zustand';
import { incomeService } from '../services/api';

export const useIncomeStore = create((set, get) => ({
  // Estado
  incomeRecords: [],
  loading: false,
  error: null,

  // Obtener ingresos
  fetchIncomeRecords: async (userId) => {
    set({ loading: true, error: null });
    try {
      const records = await incomeService.getAll({ userId });
      set({ incomeRecords: records, loading: false });
      return { success: true, data: records };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear registro de ingreso
  createIncomeRecord: async (recordData) => {
    set({ loading: true, error: null });
    try {
      const newRecord = await incomeService.create(recordData);
      set((state) => ({
        incomeRecords: [...state.incomeRecords, newRecord],
        loading: false
      }));
      return { success: true, data: newRecord };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar registro de ingreso
  updateIncomeRecord: async (recordId, recordData) => {
    set({ loading: true, error: null });
    try {
      const updatedRecord = await incomeService.update(recordId, recordData);
      set((state) => ({
        incomeRecords: state.incomeRecords.map(r =>
          r.id === recordId ? updatedRecord : r
        ),
        loading: false
      }));
      return { success: true, data: updatedRecord };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar registro de ingreso
  deleteIncomeRecord: async (recordId) => {
    set({ loading: true, error: null });
    try {
      await incomeService.delete(recordId);
      set((state) => ({
        incomeRecords: state.incomeRecords.filter(r => r.id !== recordId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener total de ingresos
  getTotalIncome: (filters = {}) => {
    const { incomeRecords } = get();
    let filtered = incomeRecords;

    if (filters.dateFrom) {
      filtered = filtered.filter(r => r.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => r.date <= filters.dateTo);
    }
    if (filters.harvestId) {
      filtered = filtered.filter(r => r.harvestId === filters.harvestId);
    }

    return filtered.reduce((total, record) => total + (record.amount || 0), 0);
  },

  // Obtener ingresos por mes
  getIncomeByMonth: () => {
    const { incomeRecords } = get();
    return incomeRecords.reduce((acc, record) => {
      if (record.date) {
        const month = record.date.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + (record.amount || 0);
      }
      return acc;
    }, {});
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null });
  }
}));