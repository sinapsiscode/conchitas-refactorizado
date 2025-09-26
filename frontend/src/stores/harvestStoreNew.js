import { create } from 'zustand';
import { harvestsService, sectorsService, lotsService, incomeService } from '../services/api';

export const useHarvestStore = create((set, get) => ({
  // Estado
  harvests: [],
  harvestPlans: [],
  sectors: [],
  lots: [],
  loading: false,
  error: null,

  // Datos para formularios
  sizeCategories: ['XS', 'S', 'M', 'L', 'XL'],
  costCategories: [
    { id: 'labor', name: 'Mano de obra', defaultCost: 50 },
    { id: 'equipment', name: 'Equipos', defaultCost: 30 },
    { id: 'transport', name: 'Transporte', defaultCost: 25 },
    { id: 'processing', name: 'Procesamiento', defaultCost: 40 },
    { id: 'packaging', name: 'Empaquetado', defaultCost: 15 },
    { id: 'other', name: 'Otros', defaultCost: 10 }
  ],
  pricing: [
    { sizeCategory: 'XS', pricePerUnit: 0.50, isActive: true },
    { sizeCategory: 'S', pricePerUnit: 0.75, isActive: true },
    { sizeCategory: 'M', pricePerUnit: 1.00, isActive: true },
    { sizeCategory: 'L', pricePerUnit: 1.25, isActive: true },
    { sizeCategory: 'XL', pricePerUnit: 1.50, isActive: true }
  ],
  pricingData: [
    { sizeCategory: 'XS', pricePerUnit: 0.50, isActive: true },
    { sizeCategory: 'S', pricePerUnit: 0.75, isActive: true },
    { sizeCategory: 'M', pricePerUnit: 1.00, isActive: true },
    { sizeCategory: 'L', pricePerUnit: 1.25, isActive: true },
    { sizeCategory: 'XL', pricePerUnit: 1.50, isActive: true }
  ],

  // Obtener sectores con lotes para cosecha
  fetchSectorsWithLots: async (userId) => {
    set({ loading: true, error: null });
    try {
      const sectors = await sectorsService.getAll({ userId });

      // Para cada sector, obtener sus lotes listos para cosecha
      const sectorsWithLots = await Promise.all(
        sectors.map(async (sector) => {
          const lots = await lotsService.getAll({ sectorId: sector.id });
          // Filtrar lotes que pueden ser cosechados
          const harvestableLots = lots.filter(lot =>
            lot.status === 'growing' || lot.status === 'ready'
          );
          return { ...sector, lots: harvestableLots };
        })
      );

      set({ sectors: sectorsWithLots, loading: false });
      return { success: true, data: sectorsWithLots };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear plan de cosecha
  createHarvestPlan: async (planData) => {
    set({ loading: true, error: null });
    try {
      const newPlan = await harvestsService.create({
        ...planData,
        type: 'plan',
        status: 'planned'
      });

      set((state) => ({
        harvestPlans: [...state.harvestPlans, newPlan],
        loading: false
      }));

      return { success: true, data: newPlan };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Ejecutar cosecha
  executeHarvest: async (harvestData) => {
    set({ loading: true, error: null });
    try {
      // Crear registro de cosecha ejecutada
      const executedHarvest = await harvestsService.create({
        ...harvestData,
        type: 'executed',
        status: 'completed',
        actualDate: new Date().toISOString().split('T')[0]
      });

      // Si hay distribución de tallas, crear registro de ingresos
      if (harvestData.sizeDistribution && harvestData.totalIncome > 0) {
        const incomeData = {
          userId: harvestData.userId,
          harvestId: executedHarvest.id,
          lotId: harvestData.lotId,
          sectorId: harvestData.sectorId,
          amount: harvestData.totalIncome,
          quantity: harvestData.actualQuantity,
          sizeDistribution: harvestData.sizeDistribution,
          date: executedHarvest.actualDate,
          description: `Ingresos por cosecha del lote ${harvestData.lotName || harvestData.lotId}`
        };

        await incomeService.create(incomeData);
      }

      // Actualizar estado del lote a 'harvested'
      if (harvestData.lotId) {
        await lotsService.update(harvestData.lotId, {
          status: 'harvested',
          harvestDate: executedHarvest.actualDate,
          finalQuantity: harvestData.actualQuantity
        });
      }

      set((state) => ({
        harvests: [...state.harvests, executedHarvest],
        loading: false
      }));

      return { success: true, data: executedHarvest };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener cosechas
  fetchHarvests: async (userId) => {
    set({ loading: true, error: null });
    try {
      const allHarvests = await harvestsService.getAll({ userId });

      const plans = allHarvests.filter(h => h.type === 'plan');
      const executed = allHarvests.filter(h => h.type === 'executed');

      set({
        harvestPlans: plans,
        harvests: executed,
        loading: false
      });

      return { success: true, data: { plans, executed } };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener planes de cosecha (alias para compatibilidad)
  fetchHarvestPlans: async (userId) => {
    return get().fetchHarvests(userId);
  },

  // Obtener datos de precios
  fetchPricing: async () => {
    // Los precios ya están definidos en el estado inicial
    // Esta función existe para compatibilidad
    return { success: true, data: get().pricing };
  },

  // Obtener sectores (alias para fetchSectorsWithLots)
  fetchSectors: async (userId) => {
    return get().fetchSectorsWithLots(userId);
  },

  // Actualizar plan de cosecha
  updateHarvestPlan: async (planId, planData) => {
    set({ loading: true, error: null });
    try {
      const updatedPlan = await harvestsService.update(planId, planData);
      set((state) => ({
        harvestPlans: state.harvestPlans.map(p =>
          p.id === planId ? updatedPlan : p
        ),
        loading: false
      }));
      return { success: true, data: updatedPlan };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar plan de cosecha
  deleteHarvestPlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      await harvestsService.delete(planId);
      set((state) => ({
        harvestPlans: state.harvestPlans.filter(p => p.id !== planId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Calcular ingresos esperados
  calculateExpectedIncome: (sizeDistribution, pricingData) => {
    if (!sizeDistribution || !pricingData) return 0;

    return Object.entries(sizeDistribution).reduce((total, [size, quantity]) => {
      const pricing = pricingData.find(p => p.sizeCategory === size && p.isActive);
      if (pricing && quantity > 0) {
        total += quantity * pricing.pricePerUnit;
      }
      return total;
    }, 0);
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null });
  }
}));