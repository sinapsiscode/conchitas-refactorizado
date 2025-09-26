import React, { useState, useEffect } from 'react'
import { useHarvestStore } from '../../stores/harvestStoreNew'
import LoadingSpinner from '../common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const CostCategoryManager = ({ isOpen, onClose, onUpdate }) => {
  const {
    harvestCostCategories,
    fetchHarvestCostCategories,
    createHarvestCostCategory,
    updateHarvestCostCategory,
    deleteHarvestCostCategory,
    loading
  } = useHarvestStore()

  const [categories, setCategories] = useState([])
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'unit',
    estimatedCost: '',
    isActive: true
  })

  const unitOptions = [
    { value: 'day', label: 'Día' },
    { value: 'trip', label: 'Viaje' },
    { value: 'unit', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramo' },
    { value: 'ton', label: 'Tonelada' },
    { value: 'hour', label: 'Hora' },
    { value: 'person', label: 'Persona' },
    { value: 'liter', label: 'Litro' },
    { value: 'gallon', label: 'Galón' },
    { value: 'box', label: 'Caja' },
    { value: 'bag', label: 'Saco' },
    { value: 'package', label: 'Paquete' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchHarvestCostCategories()
    }
  }, [isOpen, fetchHarvestCostCategories])

  useEffect(() => {
    setCategories(harvestCostCategories)
  }, [harvestCostCategories])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      unit: 'unit',
      estimatedCost: '',
      isActive: true
    })
    setEditingCategory(null)
  }

  const handleEdit = (category) => {
    setEditingCategory(category.id)
    setFormData({
      name: category.name,
      description: category.description,
      unit: category.unit,
      estimatedCost: category.estimatedCost.toString(),
      isActive: category.isActive
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El nombre del campo es requerido'
      })
      return
    }

    if (!formData.estimatedCost || parseFloat(formData.estimatedCost) < 0) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El costo estimado debe ser un número válido mayor o igual a 0'
      })
      return
    }

    const categoryData = {
      ...formData,
      estimatedCost: parseFloat(formData.estimatedCost)
    }

    try {
      if (editingCategory) {
        // Actualizar categoría existente
        const result = await updateHarvestCostCategory(editingCategory, categoryData)

        if (result.success) {
          MySwal.fire({
            icon: 'success',
            title: 'Campo actualizado',
            text: 'El campo se actualizó correctamente',
            timer: 2000,
            showConfirmButton: false
          })

          // Actualizar estado local
          const updatedCategories = categories.map(cat =>
            cat.id === editingCategory ? result.data : cat
          )
          setCategories(updatedCategories)
        } else {
          throw new Error(result.error)
        }
      } else {
        // Crear nueva categoría
        const result = await createHarvestCostCategory(categoryData)

        if (result.success) {
          MySwal.fire({
            icon: 'success',
            title: 'Campo agregado',
            text: 'El nuevo campo se agregó correctamente',
            timer: 2000,
            showConfirmButton: false
          })

          // Actualizar estado local
          setCategories([...categories, result.data])
        } else {
          throw new Error(result.error)
        }
      }

      resetForm()
      onUpdate && onUpdate(categories)
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al guardar el campo'
      })
    }
  }

  const handleToggleActive = async (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (!category) return

    try {
      const result = await updateHarvestCostCategory(categoryId, { isActive: !category.isActive })

      if (result.success) {
        const updatedCategories = categories.map(cat =>
          cat.id === categoryId ? result.data : cat
        )
        setCategories(updatedCategories)
        onUpdate && onUpdate(updatedCategories)
      }
    } catch (error) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al actualizar el estado del campo'
      })
    }
  }

  const handleDelete = async (categoryId) => {
    const result = await MySwal.fire({
      title: '¿Eliminar campo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        const deleteResult = await deleteHarvestCostCategory(categoryId)

        if (deleteResult.success) {
          const updatedCategories = categories.filter(cat => cat.id !== categoryId)
          setCategories(updatedCategories)
          onUpdate && onUpdate(updatedCategories)

          MySwal.fire({
            icon: 'success',
            title: 'Campo eliminado',
            text: 'El campo se eliminó correctamente',
            timer: 2000,
            showConfirmButton: false
          })
        }
      } catch (error) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al eliminar el campo'
        })
      }
    }
  }

  const getUnitLabel = (unitValue) => {
    const unit = unitOptions.find(opt => opt.value === unitValue)
    return unit ? unit.label : unitValue
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                ⚙️ Configurar Campos de Costos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Personaliza los campos de la sección "💰 Estimación de Costos"
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Form Section */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? '✏️ Editar Campo' : '➕ Agregar Nuevo Campo'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del campo *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Buzos especializados"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de medida *
                </label>
                <select
                  className="input-field"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                >
                  {unitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo estimado (S/) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Campo activo</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                rows="2"
                className="input-field"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descripción opcional del campo..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : (editingCategory ? 'Actualizar' : 'Agregar Campo')}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Campos Configurados ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg font-medium">No hay campos configurados</p>
                <p className="text-sm mt-2">Agrega tu primer campo de costo personalizado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`border rounded-lg p-4 transition-all ${
                      category.isActive
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-200 bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {category.name}
                          </h4>
                          {!category.isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              Inactivo
                            </span>
                          )}
                        </div>

                        {category.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {category.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            <span className="font-medium">Unidad:</span> {getUnitLabel(category.unit)}
                          </span>
                          <span>
                            <span className="font-medium">Costo:</span> S/ {category.estimatedCost}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleActive(category.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            category.isActive
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={category.isActive ? 'Desactivar campo' : 'Activar campo'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar campo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar campo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t px-6 py-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Los cambios se aplicarán inmediatamente en la planificación de cosechas
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CostCategoryManager