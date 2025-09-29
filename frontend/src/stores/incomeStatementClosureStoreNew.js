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

  // Crear nuevo cierre contable
  createClosure: async (closureData) => {
    set({ loading: true, error: null });
    try {
      // Calcular totales si no están incluidos
      const processedData = {
        ...closureData,
        totalIncome: closureData.totalIncome || 0,
        totalExpenses: closureData.totalExpenses || 0,
        netProfit: (closureData.totalIncome || 0) - (closureData.totalExpenses || 0),
        status: closureData.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newClosure = await incomeStatementClosuresService.create(processedData);

      set((state) => ({
        closures: [...state.closures, newClosure],
        loading: false
      }));

      return { success: true, data: newClosure };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar cierre contable
  updateClosure: async (closureId, closureData) => {
    set({ loading: true, error: null });
    try {
      // Recalcular beneficio neto si cambian ingresos o gastos
      const processedData = { ...closureData };
      if (closureData.totalIncome !== undefined || closureData.totalExpenses !== undefined) {
        const closure = get().closures.find(c => c.id === closureId);
        const income = closureData.totalIncome ?? closure?.totalIncome ?? 0;
        const expenses = closureData.totalExpenses ?? closure?.totalExpenses ?? 0;
        processedData.netProfit = income - expenses;
      }

      processedData.updatedAt = new Date().toISOString();

      const updatedClosure = await incomeStatementClosuresService.update(closureId, processedData);

      set((state) => ({
        closures: state.closures.map(closure =>
          closure.id === closureId ? updatedClosure : closure
        ),
        loading: false
      }));

      return { success: true, data: updatedClosure };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar cierre contable
  deleteClosure: async (closureId) => {
    set({ loading: true, error: null });
    try {
      await incomeStatementClosuresService.delete(closureId);

      set((state) => ({
        closures: state.closures.filter(closure => closure.id !== closureId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Finalizar cierre (cambiar estado a 'finalized')
  finalizeClosure: async (closureId) => {
    return await get().updateClosure(closureId, {
      status: 'finalized',
      finalizedAt: new Date().toISOString()
    });
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));