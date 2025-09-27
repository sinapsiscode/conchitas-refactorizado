import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores'
import { useSeedOriginStore } from '../../stores'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const SettingsPage = () => {
  const { user } = useAuthStore()
  const { seedOrigins, fetchSeedOrigins, createSeedOrigin, updateSeedOrigin, deleteSeedOrigin, loading } = useSeedOriginStore()
  const [showOriginForm, setShowOriginForm] = useState(false)
  const [editingOrigin, setEditingOrigin] = useState(null)
  const [originForm, setOriginForm] = useState({
    name: '',
    monthlyGrowthRate: '',
    monthlyMortalityRate: '',
    pricePerBundle: '',
    bundleSize: 96,
    description: '',
    isActive: true
  })
  const [priceDisplay, setPriceDisplay] = useState('bundle')

  useEffect(() => {
    fetchSeedOrigins()
  }, [fetchSeedOrigins])

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    
    const originData = {
      ...originForm,
      monthlyGrowthRate: parseFloat(originForm.monthlyGrowthRate),
      monthlyMortalityRate: parseFloat(originForm.monthlyMortalityRate),
      pricePerBundle: parseFloat(originForm.pricePerBundle),
      bundleSize: parseInt(originForm.bundleSize),
      pricePerUnit: parseFloat(originForm.pricePerBundle) / parseInt(originForm.bundleSize)
    }

    let result
    if (editingOrigin) {
      result = await updateSeedOrigin(editingOrigin.id, originData)
    } else {
      result = await createSeedOrigin(originData)
    }

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: editingOrigin ? 'Origen actualizado' : 'Origen creado',
        text: `El origen de semilla se ${editingOrigin ? 'actualizó' : 'creó'} exitosamente`,
        timer: 2000,
        showConfirmButton: false
      })
      
      resetForm()
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }

  const handleEdit = (origin) => {
    setEditingOrigin(origin)
    const pricePerBundle = origin.pricePerBundle || (origin.pricePerUnit * (origin.bundleSize || 96))
    setOriginForm({
      name: origin.name,
      monthlyGrowthRate: origin.monthlyGrowthRate.toString(),
      monthlyMortalityRate: origin.monthlyMortalityRate.toString(),
      pricePerBundle: pricePerBundle.toString(),
      bundleSize: origin.bundleSize || 96,
      description: origin.description || '',
      isActive: origin.isActive
    })
    setShowOriginForm(true)
  }

  const handleDelete = async (origin) => {
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el origen "${origin.name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      const deleteResult = await deleteSeedOrigin(origin.id)
      
      if (deleteResult.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El origen de semilla se eliminó exitosamente',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: deleteResult.error
        })
      }
    }
  }

  const resetForm = () => {
    setOriginForm({
      name: '',
      monthlyGrowthRate: '',
      monthlyMortalityRate: '',
      pricePerBundle: '',
      bundleSize: 96,
      description: '',
      isActive: true
    })
    setPriceDisplay('bundle')
    setShowOriginForm(false)
    setEditingOrigin(null)
  }

  const toggleStatus = async (origin) => {
    const result = await updateSeedOrigin(origin.id, {
      ...origin,
      isActive: !origin.isActive
    })

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El origen se ${!origin.isActive ? 'activó' : 'desactivó'} exitosamente`,
        timer: 1500,
        showConfirmButton: false
      })
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }

  if (loading && seedOrigins.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando configuración..." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Administra los parámetros y configuraciones del sistema
          </p>
        </div>
      </div>

      {/* Sección de Creación de Origen de Semillas */}
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">🌱 Creación de Origen de Semillas</h2>
              <p className="text-sm text-gray-600">
                Configura los diferentes orígenes de semillas con sus parámetros específicos de crecimiento y mortalidad
              </p>
            </div>
            <button
              onClick={() => setShowOriginForm(true)}
              className="btn-primary"
            >
              Nuevo Origen
            </button>
          </div>

          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crecimiento Mensual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mortalidad Mensual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio por Manojo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio por Unidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {seedOrigins.map((origin) => (
                    <tr key={origin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{origin.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{origin.monthlyGrowthRate}</span> mm/mes
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{origin.monthlyMortalityRate}</span>%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">S/ {(origin.pricePerBundle && typeof origin.pricePerBundle === 'number') ? origin.pricePerBundle.toFixed(2) : ((origin.pricePerUnit || 0) * (origin.bundleSize || 96)).toFixed(2)}</span>
                          <span className="text-xs text-gray-500 block">(96 unidades)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">S/ {(origin.pricePerUnit && typeof origin.pricePerUnit === 'number') ? origin.pricePerUnit.toFixed(4) : (((origin.pricePerBundle || 0) / (origin.bundleSize || 96)).toFixed(4))}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {origin.description || 'Sin descripción'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(origin)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                            origin.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {origin.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(origin)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(origin)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      {showOriginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-md my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {editingOrigin ? 'Editar Origen de Semilla' : 'Nuevo Origen de Semilla'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Origen *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={originForm.name}
                  onChange={(e) => setOriginForm({...originForm, name: e.target.value})}
                  placeholder="Ej: Isla, Laboratorio XYZ, Semillero Local"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crecimiento Promedio Mensual (mm/mes) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="20"
                  className="input-field"
                  value={originForm.monthlyGrowthRate}
                  onChange={(e) => setOriginForm({...originForm, monthlyGrowthRate: e.target.value})}
                  placeholder="Ej: 3.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Crecimiento esperado en milímetros por mes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mortalidad Esperada Mensual (%) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="50"
                  className="input-field"
                  value={originForm.monthlyMortalityRate}
                  onChange={(e) => setOriginForm({...originForm, monthlyMortalityRate: e.target.value})}
                  placeholder="Ej: 5.0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Porcentaje de mortalidad mensual esperado
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    Mostrar precio por:
                  </label>
                  <div className="flex space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="priceDisplay"
                        value="bundle"
                        checked={priceDisplay === 'bundle'}
                        onChange={(e) => setPriceDisplay(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Manojo (96 unidades)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="priceDisplay"
                        value="unit"
                        checked={priceDisplay === 'unit'}
                        onChange={(e) => setPriceDisplay(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">Unidad</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio por Manojo (PEN) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="10000"
                    className="input-field"
                    value={originForm.pricePerBundle}
                    onChange={(e) => setOriginForm({...originForm, pricePerBundle: e.target.value})}
                    placeholder="Ej: 14.40"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio en soles por manojo de 96 conchas
                  </p>
                </div>

                {originForm.pricePerBundle && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium text-blue-900">Conversión automática:</span>
                      <div className="mt-1 space-y-1">
                        <div className="text-blue-700">
                          • Precio por manojo: <span className="font-semibold">S/ {parseFloat(originForm.pricePerBundle || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-blue-700">
                          • Precio por unidad: <span className="font-semibold">S/ {(parseFloat(originForm.pricePerBundle || 0) / parseInt(originForm.bundleSize || 96)).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows="3"
                  className="input-field"
                  value={originForm.description}
                  onChange={(e) => setOriginForm({...originForm, description: e.target.value})}
                  placeholder="Descripción adicional del origen de semillas..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={originForm.isActive}
                  onChange={(e) => setOriginForm({...originForm, isActive: e.target.checked})}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Origen activo (disponible para nuevas siembras)
                </label>
              </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" message="" />
                    ) : (
                      editingOrigin ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsPage