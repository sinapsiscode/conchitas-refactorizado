import { create } from 'zustand';
import { monitoringService, lotsService, sectorsService } from '../services/api';

export const useMonitoringStore = create((set, get) => ({
  // Estado
  monitoringRecords: [],
  lots: [],
  sectors: [],
  selectedLot: null,
  loading: false,
  error: null,

  // Obtener sectores con lotes
  fetchSectorsWithLots: async (userId) => {
    set({ loading: true, error: null });
    try {
      const sectors = await sectorsService.getAll({ userId });

      // Para cada sector, obtener sus lotes
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

  // Obtener registros de monitoreo
  fetchMonitoringRecords: async (lotId) => {
    set({ loading: true, error: null });
    try {
      const records = await monitoringService.getAll({ lotId });
      set({ monitoringRecords: records, loading: false });
      return { success: true, data: records };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener todos los registros de monitoreo (para inversores)
  fetchAllMonitoring: async () => {
    set({ loading: true, error: null });
    try {
      // Obtener todos los registros de monitoreo sin filtro
      const records = await monitoringService.getAll();
      set({ monitoringRecords: records, loading: false });
      return { success: true, data: records };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear nuevo registro de monitoreo
  createMonitoringRecord: async (recordData) => {
    set({ loading: true, error: null });
    try {
      const newRecord = await monitoringService.create(recordData);
      set((state) => ({
        monitoringRecords: [...state.monitoringRecords, newRecord],
        loading: false
      }));
      return { success: true, data: newRecord };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar registro de monitoreo
  updateMonitoringRecord: async (recordId, recordData) => {
    set({ loading: true, error: null });
    try {
      const updatedRecord = await monitoringService.update(recordId, recordData);
      set((state) => ({
        monitoringRecords: state.monitoringRecords.map(r =>
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

  // Eliminar registro de monitoreo
  deleteMonitoringRecord: async (recordId) => {
    set({ loading: true, error: null });
    try {
      await monitoringService.delete(recordId);
      set((state) => ({
        monitoringRecords: state.monitoringRecords.filter(r => r.id !== recordId),
        loading: false
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Seleccionar lote
  selectLot: (lot) => {
    set({ selectedLot: lot });
  },

  // Crear nuevo lote
  createLot: async (lotData) => {
    set({ loading: true, error: null });
    try {
      const newLot = await lotsService.create(lotData);

      // Actualizar el sector correspondiente
      set((state) => ({
        sectors: state.sectors.map(sector =>
          sector.id === newLot.sectorId
            ? { ...sector, lots: [...(sector.lots || []), newLot] }
            : sector
        ),
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
      const updatedLot = await lotsService.update(lotId, lotData);

      // Actualizar en los sectores
      set((state) => ({
        sectors: state.sectors.map(sector => ({
          ...sector,
          lots: (sector.lots || []).map(lot =>
            lot.id === lotId ? updatedLot : lot
          )
        })),
        selectedLot: state.selectedLot?.id === lotId ? updatedLot : state.selectedLot,
        loading: false
      }));

      return { success: true, data: updatedLot };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Alias para mantener compatibilidad con LotMonitoringPage
  createMonitoring: async (recordData) => {
    const store = get();
    return await store.createMonitoringRecord(recordData);
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null });
  }
}));