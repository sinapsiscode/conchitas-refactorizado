import { create } from 'zustand';
import { expensesService } from '../services/api';

export const useExpenseStore = create((set, get) => ({
  // Estado
  expenses: [],
  categories: [
    'Alimentación',
    'Mantenimiento',
    'Personal',
    'Equipos',
    'Transporte',
    'Combustible',
    'Materiales',
    'Servicios',
    'Otros'
  ],
  loading: false,
  error: null,

  // Obtener gastos
  fetchExpenses: async (userId) => {
    set({ loading: true, error: null });
    try {
      const expenses = await expensesService.getAll({ userId });
      set({ expenses, loading: false });
      return { success: true, data: expenses };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear gasto
  createExpense: async (expenseData) => {
    set({ loading: true, error: null });
    try {
      const newExpense = await expensesService.create(expenseData);
      set((state) => ({
        expenses: [...state.expenses, newExpense],
        loading: false
      }));
      return { success: true, data: newExpense };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar gasto
  updateExpense: async (expenseId, expenseData) => {
    set({ loading: true, error: null });
    try {
      const updatedExpense = await expensesService.update(expenseId, expenseData);
      set((state) => ({
        expenses: state.expenses.map(e =>
          e.id === expenseId ? updatedExpense : e
        ),
        loading: false
      }));
      return { success: true, data: updatedExpense };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar gasto
  deleteExpense: async (expenseId) => {
    set({ loading: true, error: null });
    try {
      await expensesService.delete(expenseId);
      set((state) => ({
        expenses: state.expenses.filter(e => e.id !== expenseId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener gastos por categoría
  getExpensesByCategory: () => {
    const { expenses } = get();
    return expenses.reduce((acc, expense) => {
      const category = expense.category || 'Sin categoría';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(expense);
      return acc;
    }, {});
  },

  // Obtener total de gastos
  getTotalExpenses: (filters = {}) => {
    const { expenses } = get();
    let filtered = expenses;

    if (filters.dateFrom) {
      filtered = filtered.filter(e => e.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(e => e.date <= filters.dateTo);
    }
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    return filtered.reduce((total, expense) => total + (expense.amount || 0), 0);
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null });
  }
}));