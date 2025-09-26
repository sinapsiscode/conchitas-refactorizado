import { create } from 'zustand';
import { sectorsService, batteriesService, cultivationLinesService, lotsService } from '../services/api';

export const useSectorStore = create((set, get) => ({
  // Estado
  sectors: [],
  batteries: [],
  cultivationLines: [],
  selectedSector: null,
  selectedBattery: null,
  loading: false,
  error: null,

  // Acciones para Sectores
  fetchSectors: async (userId) => {
    set({ loading: true, error: null });
    try {
      const sectors = await sectorsService.getAll({ userId });

      // Para cada sector, cargar sus lotes
      const sectorsWithLots = await Promise.all(
        sectors.map(async (sector) => {
          const lots = await lotsService.getAll({ sectorId: sector.id });
          return { ...sector, lots };
        })
      );

      set({ sectors: sectorsWithLots, loading: false });
      return { success: true, data: sectorsWithLots };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  createSector: async (sectorData) => {
    set({ loading: true, error: null });
    try {
      const newSector = await sectorsService.create(sectorData);
      set((state) => ({
        sectors: [...state.sectors, { ...newSector, lots: [] }],
        loading: false
      }));
      return { success: true, data: newSector };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  updateSector: async (sectorId, sectorData) => {
    set({ loading: true, error: null });
    try {
      const updatedSector = await sectorsService.update(sectorId, sectorData);
      set((state) => ({
        sectors: state.sectors.map(s =>
          s.id === sectorId ? { ...s, ...updatedSector } : s
        ),
        loading: false
      }));
      return { success: true, data: updatedSector };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteSector: async (sectorId) => {
    set({ loading: true, error: null });
    try {
      await sectorsService.delete(sectorId);
      set((state) => ({
        sectors: state.sectors.filter(s => s.id !== sectorId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  selectSector: (sector) => {
    set({ selectedSector: sector });
  },

  // Acciones para Baterías
  fetchBatteries: async (sectorId) => {
    set({ loading: true, error: null });
    try {
      const batteries = await batteriesService.getAll({ sectorId });
      set({ batteries, loading: false });
      return { success: true, data: batteries };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  createBattery: async (batteryData) => {
    set({ loading: true, error: null });
    try {
      const newBattery = await batteriesService.create(batteryData);
      set((state) => ({
        batteries: [...state.batteries, newBattery],
        loading: false
      }));
      return { success: true, data: newBattery };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  updateBattery: async (batteryId, batteryData) => {
    set({ loading: true, error: null });
    try {
      const updatedBattery = await batteriesService.update(batteryId, batteryData);
      set((state) => ({
        batteries: state.batteries.map(b =>
          b.id === batteryId ? updatedBattery : b
        ),
        loading: false
      }));
      return { success: true, data: updatedBattery };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteBattery: async (batteryId) => {
    set({ loading: true, error: null });
    try {
      await batteriesService.delete(batteryId);
      set((state) => ({
        batteries: state.batteries.filter(b => b.id !== batteryId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  selectBattery: (battery) => {
    set({ selectedBattery: battery });
  },

  // Acciones para Líneas de Cultivo
  fetchCultivationLines: async (sectorId, batteryId) => {
    set({ loading: true, error: null });
    try {
      const params = {};
      if (sectorId) params.sectorId = sectorId;
      if (batteryId) params.batteryId = batteryId;

      const lines = await cultivationLinesService.getAll(params);
      set({ cultivationLines: lines, loading: false });
      return { success: true, data: lines };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  createCultivationLine: async (lineData) => {
    set({ loading: true, error: null });
    try {
      const newLine = await cultivationLinesService.create(lineData);
      set((state) => ({
        cultivationLines: [...state.cultivationLines, newLine],
        loading: false
      }));

      // Actualizar el contador de líneas en la batería
      if (lineData.batteryId) {
        const battery = get().batteries.find(b => b.id === lineData.batteryId);
        if (battery) {
          await get().updateBattery(battery.id, {
            totalLines: (battery.totalLines || 0) + 1
          });
        }
      }

      return { success: true, data: newLine };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  updateCultivationLine: async (lineId, lineData) => {
    set({ loading: true, error: null });
    try {
      const updatedLine = await cultivationLinesService.update(lineId, lineData);
      set((state) => ({
        cultivationLines: state.cultivationLines.map(l =>
          l.id === lineId ? updatedLine : l
        ),
        loading: false
      }));
      return { success: true, data: updatedLine };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteCultivationLine: async (lineId) => {
    set({ loading: true, error: null });
    try {
      const line = get().cultivationLines.find(l => l.id === lineId);
      await cultivationLinesService.delete(lineId);

      set((state) => ({
        cultivationLines: state.cultivationLines.filter(l => l.id !== lineId),
        loading: false
      }));

      // Actualizar el contador de líneas en la batería
      if (line?.batteryId) {
        const battery = get().batteries.find(b => b.id === line.batteryId);
        if (battery) {
          await get().updateBattery(battery.id, {
            totalLines: Math.max(0, (battery.totalLines || 0) - 1)
          });
        }
      }

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null });
  }
}));