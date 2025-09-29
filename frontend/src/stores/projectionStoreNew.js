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

  // Crear nueva proyección
  createProjection: async (projectionData) => {
    set({ loading: true, error: null });
    try {
      const newProjection = await projectionsService.create({
        ...projectionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        projections: [...state.projections, newProjection],
        loading: false
      }));

      return { success: true, data: newProjection };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar proyección
  updateProjection: async (projectionId, projectionData) => {
    set({ loading: true, error: null });
    try {
      const updatedProjection = await projectionsService.update(projectionId, {
        ...projectionData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        projections: state.projections.map(proj =>
          proj.id === projectionId ? updatedProjection : proj
        ),
        loading: false
      }));

      return { success: true, data: updatedProjection };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar proyección
  deleteProjection: async (projectionId) => {
    set({ loading: true, error: null });
    try {
      await projectionsService.delete(projectionId);

      set((state) => ({
        projections: state.projections.filter(proj => proj.id !== projectionId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Calcular proyección financiera
  calculateProjection: (lotId, parameters) => {
    const {
      initialQuantity,
      monthlyMortality,
      growthRate,
      harvestMonth,
      pricePerUnit,
      operationalCosts
    } = parameters;

    // Calcular supervivencia
    const survivalRate = Math.pow(1 - monthlyMortality / 100, harvestMonth);
    const finalQuantity = Math.floor(initialQuantity * survivalRate);

    // Calcular ingresos
    const revenue = finalQuantity * pricePerUnit;

    // Calcular costos totales
    const totalCosts = operationalCosts * harvestMonth;

    // Calcular beneficio
    const profit = revenue - totalCosts;
    const roi = ((profit / totalCosts) * 100).toFixed(2);

    return {
      finalQuantity,
      revenue,
      totalCosts,
      profit,
      roi,
      projectionDate: new Date().toISOString()
    };
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));