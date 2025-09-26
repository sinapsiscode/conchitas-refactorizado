import { create } from 'zustand';
import { seedOriginsService } from '../services/api';

export const useSeedOriginStore = create((set, get) => ({
  // Estado
  seedOrigins: [],
  loading: false,
  error: null,

  // Obtener orígenes de semilla
  fetchSeedOrigins: async (userId) => {
    set({ loading: true, error: null });
    try {
      const params = userId ? { userId } : {};
      const seedOrigins = await seedOriginsService.getAll(params);
      set({ seedOrigins, loading: false });
      return { success: true, data: seedOrigins };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Crear origen de semilla
  createSeedOrigin: async (seedOriginData) => {
    set({ loading: true, error: null });
    try {
      const newSeedOrigin = await seedOriginsService.create({
        ...seedOriginData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        seedOrigins: [...state.seedOrigins, newSeedOrigin],
        loading: false
      }));

      return { success: true, data: newSeedOrigin };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Actualizar origen de semilla
  updateSeedOrigin: async (seedOriginId, seedOriginData) => {
    set({ loading: true, error: null });
    try {
      const updatedSeedOrigin = await seedOriginsService.update(seedOriginId, {
        ...seedOriginData,
        updatedAt: new Date().toISOString()
      });

      set((state) => ({
        seedOrigins: state.seedOrigins.map(so =>
          so.id === seedOriginId ? updatedSeedOrigin : so
        ),
        loading: false
      }));

      return { success: true, data: updatedSeedOrigin };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Eliminar origen de semilla
  deleteSeedOrigin: async (seedOriginId) => {
    set({ loading: true, error: null });
    try {
      await seedOriginsService.delete(seedOriginId);

      set((state) => ({
        seedOrigins: state.seedOrigins.filter(so => so.id !== seedOriginId),
        loading: false
      }));

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Obtener origen de semilla por ID
  getSeedOriginById: (seedOriginId) => {
    const seedOrigin = get().seedOrigins.find(so => so.id === seedOriginId);
    return seedOrigin || null;
  },

  // Limpiar errores
  clearError: () => set({ error: null })
}));