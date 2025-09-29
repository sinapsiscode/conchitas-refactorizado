import apiClient from './config';

/**
 * Servicio base con operaciones CRUD genéricas
 * @param {string} endpoint - Endpoint de la API (ej: 'sectors', 'lots')
 */
class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  /**
   * Obtener todos los registros
   * @param {Object} params - Parámetros de consulta opcionales
   * @returns {Promise} Array de registros
   */
  async getAll(params = {}) {
    try {
      return await apiClient.get(`/${this.endpoint}`, { params });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener un registro por ID
   * @param {string} id - ID del registro
   * @returns {Promise} Registro encontrado
   */
  async getById(id) {
    try {
      return await apiClient.get(`/${this.endpoint}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear un nuevo registro
   * @param {Object} data - Datos del nuevo registro
   * @returns {Promise} Registro creado
   */
  async create(data) {
    try {
      const newRecord = {
        ...data,
        id: data.id || `${this.endpoint}-${Date.now()}`,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      return await apiClient.post(`/${this.endpoint}`, newRecord);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar un registro existente
   * @param {string} id - ID del registro
   * @param {Object} data - Datos a actualizar
   * @returns {Promise} Registro actualizado
   */
  async update(id, data) {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return await apiClient.patch(`/${this.endpoint}/${id}`, updatedData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar un registro
   * @param {string} id - ID del registro
   * @returns {Promise} Respuesta de eliminación
   */
  async delete(id) {
    try {
      return await apiClient.delete(`/${this.endpoint}/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar registros con filtros complejos
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise} Array de registros filtrados
   */
  async search(filters) {
    try {
      // Construir query params para búsqueda
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params[key] = filters[key];
        }
      });
      return await apiClient.get(`/${this.endpoint}`, { params });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Operación batch para crear múltiples registros
   * @param {Array} records - Array de registros a crear
   * @returns {Promise} Array de registros creados
   */
  async createBatch(records) {
    try {
      const promises = records.map(record => this.create(record));
      return await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Operación batch para actualizar múltiples registros
   * @param {Array} updates - Array de {id, data} para actualizar
   * @returns {Promise} Array de registros actualizados
   */
  async updateBatch(updates) {
    try {
      const promises = updates.map(({ id, data }) => this.update(id, data));
      return await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }
}

export default BaseService;