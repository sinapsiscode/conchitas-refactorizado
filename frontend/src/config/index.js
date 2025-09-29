/**
 * ConfigManager - Gestor centralizado de configuraciones
 * Todos los datos se cargan desde la API (db.json)
 */

class ConfigManager {
  constructor() {
    this.cache = new Map();
    this.apiEnabled = true; // ACTIVADO - Usando db.json
    this.apiUrl = 'http://localhost:4077';
  }

  /**
   * Obtener categorías por tipo
   * Futuro: intentará desde API primero
   */
  async getCategories(type) {
    // Siempre intentar desde API
    try {
      const cached = this.cache.get(`categories_${type}`);
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }

      const response = await fetch(`${this.apiUrl}/categories?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        this.cache.set(`categories_${type}`, {
          data,
          timestamp: Date.now()
        });
        return data;
      }
    } catch (error) {
      // Error silently handled
    }

    // Si falla, retornar array vacío
    return [];
  }

  /**
   * Obtener tabla de precios
   * Futuro: desde API con cache
   */
  async getPricing() {
    // Siempre intentar desde API
    try {
      const cached = this.cache.get('pricing');
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }

      const response = await fetch(`${this.apiUrl}/pricing`);
      if (response.ok) {
        const data = await response.json();
        this.cache.set('pricing', {
          data,
          timestamp: Date.now()
        });
        return data;
      }
    } catch (error) {
      // Error silently handled
    }

    // Si falla, retornar array vacío
    return [];
  }

  /**
   * Obtener configuraciones del sistema
   */
  async getSettings() {
    // Siempre intentar desde API
    try {
      const cached = this.cache.get('settings');
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }

      const response = await fetch(`${this.apiUrl}/systemSettings`);
      if (response.ok) {
        const data = await response.json();
        this.cache.set('settings', {
          data,
          timestamp: Date.now()
        });
        return data;
      }
    } catch (error) {
      // Error silently handled
    }

    // Si falla, retornar objeto vacío
    return {};
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Habilitar/deshabilitar modo API
   */
  setApiMode(enabled) {
    this.apiEnabled = enabled;
    if (enabled) {
      } else {
      }
  }
}

// Instancia única (Singleton)
const configManager = new ConfigManager();

// Exportar la instancia
export default configManager;