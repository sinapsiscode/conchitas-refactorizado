import { create } from 'zustand';
import { investmentsService } from '../services/api';

export const useInvestmentStore = create((set, get) => ({
  // Estado
  investments: [],
  distributions: [],
  investorReturns: null,
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

  // Crear nueva inversión
  createInvestment: async (investmentData) => {
    set({ loading: true, error: null });
    try {
      const newInvestment = await investmentsService.create({
        ...investmentData,
        status: investmentData.status || 'active',
        returns: investmentData.returns || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        investments: [...state.investments, newInvestment],
        loading: false
      }));

      return { success: true, data: newInvestment };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar inversión
  updateInvestment: async (investmentId, investmentData) => {
    set({ loading: true, error: null });
    try {
      const updatedInvestment = await investmentsService.update(investmentId, {
        ...investmentData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        investments: state.investments.map(inv =>
          inv.id === investmentId ? updatedInvestment : inv
        ),
        loading: false
      }));

      return { success: true, data: updatedInvestment };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar inversión
  deleteInvestment: async (investmentId) => {
    set({ loading: true, error: null });
    try {
      await investmentsService.delete(investmentId);

      set((state) => ({
        investments: state.investments.filter(inv => inv.id !== investmentId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Calcular retorno de inversión
  calculateROI: (investmentId) => {
    const investment = get().investments.find(inv => inv.id === investmentId);
    if (!investment) return null;

    const roi = ((investment.returns - investment.amount) / investment.amount) * 100;
    return roi.toFixed(2);
  },

  // Obtener retornos de inversor
  fetchInvestorReturns: async (investorId) => {
    set({ loading: true, error: null });
    try {
      // Buscar inversiones del inversor
      const investments = await investmentsService.getAll({ investorId });

      // Calcular métricas agregadas
      const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalReturned = investments.reduce((sum, inv) => sum + (inv.totalDistributed || 0), 0);
      const activeInvestments = investments.filter(inv => inv.status === 'active').length;
      const completedInvestments = investments.filter(inv => inv.status === 'completed').length;
      const netProfit = totalReturned - totalInvested;
      const averageROI = totalInvested > 0 ? ((totalReturned - totalInvested) / totalInvested) * 100 : 0;

      const investorReturns = {
        investorId,
        totalInvested,
        totalReturned,
        activeInvestments,
        completedInvestments,
        netProfit,
        averageROI
      };

      set({ investorReturns, loading: false });
      return { success: true, data: investorReturns };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener resumen de inversiones (función compatible)
  getInvestorSummary: (investorId) => {
    const investments = get().investments.filter(inv => inv.investorId === investorId);
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.totalDistributed || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active');

    // Calcular ROI promedio
    let averageROI = 0;
    if (totalInvested > 0) {
      averageROI = ((totalReturns - totalInvested) / totalInvested) * 100;
    }

    return {
      total: investments.length,
      totalInvested,
      totalReturns,
      activeCount: activeInvestments.length,
      activeInvestments: activeInvestments.length,
      completedInvestments: investments.filter(inv => inv.status === 'completed').length,
      netProfit: totalReturns - totalInvested,
      overallROI: averageROI || 0,
      investments: investments
    };
  },

  // Obtener resumen de inversiones
  getInvestmentSummary: () => {
    const investments = get().investments;
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.returns || 0), 0);
    const activeInvestments = investments.filter(inv => inv.status === 'active');

    // Calcular ROI promedio
    let averageROI = 0;
    if (totalInvested > 0) {
      averageROI = ((totalReturns - totalInvested) / totalInvested) * 100;
    }

    return {
      total: investments.length,
      totalInvested,
      totalReturns,
      activeCount: activeInvestments.length,
      active: activeInvestments.length, // Para compatibilidad
      completed: investments.filter(inv => inv.status === 'completed').length,
      averageROI: averageROI || 0
    };
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));