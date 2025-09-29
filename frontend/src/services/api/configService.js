import axios from 'axios';

const API_URL = 'http://localhost:4077';

/**
 * Servicio de Configuración Centralizado
 * Maneja todas las configuraciones del sistema que antes estaban hardcodeadas
 */
class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hora en ms
  }

  /**
   * Obtener configuración con cache
   */
  async getCachedData(key, fetcher) {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Obtener todas las categorías del sistema
   */
  async getCategories(type = null) {
    return this.getCachedData(`categories_${type || 'all'}`, async () => {
      try {
        const params = type ? { type } : {};
        const response = await axios.get(`${API_URL}/categories`, { params });
        return response.data;
      } catch (error) {
        return [];
      }
    });
  }

  /**
   * Obtener categorías de gastos
   */
  async getExpenseCategories() {
    return this.getCategories('expense');
  }

  /**
   * Obtener categorías de inventario
   */
  async getInventoryCategories() {
    return this.getCategories('inventory');
  }

  /**
   * Obtener categorías de tallas
   */
  async getSizeCategories() {
    return this.getCategories('size');
  }

  /**
   * Obtener categorías de costos de cosecha
   */
  async getHarvestCostCategories() {
    return this.getCategories('harvest_cost');
  }

  /**
   * Obtener tabla de precios actualizada
   */
  async getPricing() {
    return this.getCachedData('pricing', async () => {
      try {
        const response = await axios.get(`${API_URL}/pricing`);
        return response.data;
      } catch (error) {
        return [];
      }
    });
  }

  /**
   * Obtener configuraciones del sistema
   */
  async getSystemSettings() {
    return this.getCachedData('settings', async () => {
      try {
        const response = await axios.get(`${API_URL}/systemSettings`);
        return response.data;
      } catch (error) {
        return {};
      }
    });
  }

  /**
   * Crear nueva categoría
   */
  async createCategory(categoryData) {
    try {
      const response = await axios.post(`${API_URL}/categories`, {
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Limpiar cache
      this.clearCache('categories');

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar categoría
   */
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await axios.patch(`${API_URL}/categories/${categoryId}`, {
        ...categoryData,
        updatedAt: new Date().toISOString()
      });

      // Limpiar cache
      this.clearCache('categories');

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar categoría
   */
  async deleteCategory(categoryId) {
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);

      // Limpiar cache
      this.clearCache('categories');

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar precios
   */
  async updatePricing(pricingData) {
    try {
      const response = await axios.post(`${API_URL}/pricing`, {
        ...pricingData,
        updatedAt: new Date().toISOString()
      });

      // Limpiar cache
      this.clearCache('pricing');

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Limpiar cache específico o todo
   */
  clearCache(key = null) {
    if (key) {
      // Limpiar cache específico
      Array.from(this.cache.keys())
        .filter(k => k.startsWith(key))
        .forEach(k => this.cache.delete(k));
    } else {
      // Limpiar todo el cache
      this.cache.clear();
    }
  }

  /**
   * Precalentar cache al iniciar la aplicación
   */
  async warmupCache() {
    // Cargar todas las configuraciones críticas
    await Promise.all([
      this.getCategories(),
      this.getPricing(),
      this.getSystemSettings()
    ]);

    }
}

export const configService = new ConfigService();