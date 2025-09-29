import { create } from 'zustand';
import { lotsService, sectorsService, batteriesService, seedOriginsService } from '../services/api';

export const useSeedingStore = create((set, get) => ({
  // Estado
  lots: [],
  sectors: [],
  batteries: [],
  seedOrigins: [],
  loading: false,
  error: null,

  // Obtener lotes
  fetchLots: async (params) => {
    set({ loading: true, error: null });
    try {
      const lots = await lotsService.getAll(params);
      set({ lots, loading: false });
      return { success: true, data: lots };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear nuevo lote
  createLot: async (lotData) => {
    set({ loading: true, error: null });
    try {
      const newLot = await lotsService.create({
        ...lotData,
        status: lotData.status || 'seeded',
        currentQuantity: lotData.initialQuantity,
        mortalityRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        lots: [...state.lots, newLot],
        loading: false
      }));

      return { success: true, data: newLot };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar lote
  updateLot: async (lotId, lotData) => {
    set({ loading: true, error: null });
    try {
      const updatedLot = await lotsService.update(lotId, {
        ...lotData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        lots: state.lots.map(lot =>
          lot.id === lotId ? updatedLot : lot
        ),
        loading: false
      }));

      return { success: true, data: updatedLot };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar lote
  deleteLot: async (lotId) => {
    set({ loading: true, error: null });
    try {
      await lotsService.delete(lotId);

      set((state) => ({
        lots: state.lots.filter(lot => lot.id !== lotId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener sectores para siembra
  fetchSectorsForSeeding: async (userId) => {
    set({ loading: true, error: null });
    try {
      const sectors = await sectorsService.getAll({ userId });

      // Obtener baterías para cada sector
      const sectorsWithBatteries = await Promise.all(
        sectors.map(async (sector) => {
          const batteries = await batteriesService.getAll({ sectorId: sector.id });
          return { ...sector, batteries };
        })
      );

      set({ sectors: sectorsWithBatteries, loading: false });
      return { success: true, data: sectorsWithBatteries };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

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

  // Calcular mortalidad
  calculateMortality: (initialQuantity, currentQuantity) => {
    if (!initialQuantity || initialQuantity === 0) return 0;
    const mortality = ((initialQuantity - currentQuantity) / initialQuantity) * 100;
    return Math.max(0, Math.min(100, mortality));
  },

  // Calcular crecimiento
  calculateGrowth: (seedDate, averageSize) => {
    if (!seedDate || !averageSize) return null;

    const now = new Date();
    const seed = new Date(seedDate);
    const monthsDiff = (now.getFullYear() - seed.getFullYear()) * 12 +
                      (now.getMonth() - seed.getMonth());

    if (monthsDiff === 0) return null;

    const growthRate = averageSize / monthsDiff;
    return {
      monthlyRate: growthRate.toFixed(2),
      currentSize: averageSize,
      age: monthsDiff
    };
  },

  // Obtener lote por ID
  getLotById: (lotId) => {
    return get().lots.find(lot => lot.id === lotId);
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));