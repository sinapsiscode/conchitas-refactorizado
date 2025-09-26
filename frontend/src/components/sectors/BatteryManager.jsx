import React, { useState, useEffect } from 'react'
import { useSectorStore } from '../../stores'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Modal from '../common/Modal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const BatteryManager = ({ sector, onClose }) => {
  const {
    batteries,
    fetchBatteries,
    createBattery,
    updateBattery,
    deleteBattery,
    loading
  } = useSectorStore()

  const [showBatteryForm, setShowBatteryForm] = useState(false)
  const [editingBattery, setEditingBattery] = useState(null)
  const [batteryForm, setBatteryForm] = useState({
    letter: '',
    name: '',
    description: ''
  })

  useEffect(() => {
    if (sector?.id) {
      fetchBatteries(sector.id)
    }
  }, [sector?.id, fetchBatteries])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const batteryData = {
      sectorId: sector.id,
      letter: batteryForm.letter.toUpperCase(),
      name: batteryForm.name || `Batería ${batteryForm.letter.toUpperCase()}`,
      description: batteryForm.description,
      status: 'active',
      totalLines: 0
    }

    let result
    if (editingBattery) {
      result = await updateBattery(editingBattery.id, batteryData)
    } else {
      result = await createBattery(batteryData)
    }

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: editingBattery ? 'Batería actualizada' : 'Batería creada',
        text: `La batería se ${editingBattery ? 'actualizó' : 'creó'} exitosamente`,
        timer: 1500,
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

  const handleEdit = (battery) => {
    setEditingBattery(battery)
    setBatteryForm({
      letter: battery.letter,
      name: '',
      description: battery.description || ''
    })
    setShowBatteryForm(true)
  }

  const handleDelete = async (battery) => {
    if (battery.totalLines > 0) {
      MySwal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: `Esta batería tiene ${battery.totalLines} línea${battery.totalLines > 1 ? 's' : ''} configurada${battery.totalLines > 1 ? 's' : ''}. Elimina primero las líneas.`
      })
      return
    }

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la batería "${battery.name}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      const deleteResult = await deleteBattery(battery.id)
      if (deleteResult.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Batería eliminada',
          text: 'La batería se eliminó exitosamente',
          timer: 1500,
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
    setBatteryForm({ letter: '', name: '', description: '' })
    setShowBatteryForm(false)
    setEditingBattery(null)
  }

  const getNextAvailableLetter = () => {
    const usedLetters = batteries.map(b => b.letter)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

    for (let letter of letters) {
      if (!usedLetters.includes(letter)) {
        return letter
      }
    }
    return 'A'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              🔋 Gestión de Baterías - {sector.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Administra las baterías (agrupaciones de líneas) de este sector
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Baterías del Sector
              </h3>
              <p className="text-sm text-gray-600">
                {batteries.length} batería{batteries.length !== 1 ? 's' : ''} configurada{batteries.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setBatteryForm(prev => ({ ...prev, letter: getNextAvailableLetter() }))
                setShowBatteryForm(true)
              }}
              className="btn-primary"
              disabled={loading}
            >
              <span className="mr-2">➕</span>
              Nueva Batería
            </button>
          </div>

          {loading && batteries.length === 0 ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" message="Cargando baterías..." />
            </div>
          ) : batteries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batteries.map((battery) => (
                <div key={battery.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🔋</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{battery.name}</h4>
                        <p className="text-sm text-gray-600">Batería {battery.letter}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(battery)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar batería"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(battery)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar batería"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {battery.description && (
                      <p>{battery.description}</p>
                    )}
                    <div className="flex justify-between">
                      <span>Líneas:</span>
                      <span className="font-medium">{battery.totalLines || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        battery.status === 'active' ? 'bg-green-100 text-green-700' :
                        battery.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {battery.status === 'active' ? 'Activa' :
                         battery.status === 'inactive' ? 'Inactiva' : 'Mantenimiento'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay baterías configuradas"
              message="Las baterías agrupan las líneas de cultivo. Crea tu primera batería para organizar mejor tus líneas."
              icon="🔋"
              action={
                <button
                  onClick={() => {
                    setBatteryForm(prev => ({ ...prev, letter: getNextAvailableLetter() }))
                    setShowBatteryForm(true)
                  }}
                  className="btn-primary"
                >
                  Crear Primera Batería
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Battery Form Modal */}
      <Modal
        isOpen={showBatteryForm}
        onClose={resetForm}
        title={editingBattery ? '🔋 Editar Batería' : '🔋 Nueva Batería'}
        subtitle={editingBattery ? 'Modifica los datos de la batería' : 'Crea una nueva batería para agrupar líneas'}
        size="md"
        footer={
          <Modal.Actions>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="battery-form"
              className="btn-primary flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" message="" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <>
                  <span className="mr-2">{editingBattery ? '✏️' : '➕'}</span>
                  {editingBattery ? 'Actualizar' : 'Crear'} Batería
                </>
              )}
            </button>
          </Modal.Actions>
        }
      >
        <form id="battery-form" onSubmit={handleSubmit}>
          <Modal.Content>
            <div className="space-y-6">
              {/* Letra de la Batería */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">🔤</span>
                  Letra de la Batería
                  <span className="text-danger-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={1}
                  className="input-field uppercase text-center text-lg font-bold"
                  value={batteryForm.letter}
                  onChange={(e) => setBatteryForm({...batteryForm, letter: e.target.value.toUpperCase()})}
                  placeholder="A"
                />
                <p className="text-xs text-slate-500">
                  Letra única para identificar la batería (A, B, C, etc.)
                </p>
              </div>


              {/* Descripción */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">📄</span>
                  Descripción
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={batteryForm.description}
                  onChange={(e) => setBatteryForm({...batteryForm, description: e.target.value})}
                  placeholder="Descripción opcional de la batería..."
                />
                <p className="text-xs text-slate-500">
                  Información adicional sobre la ubicación o características de esta batería
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-info-600 mr-3 mt-0.5">ℹ️</span>
                  <div>
                    <h4 className="text-sm font-medium text-info-800 mb-1">
                      Información sobre Baterías
                    </h4>
                    <div className="text-xs text-info-700 space-y-1">
                      <p>• Las baterías agrupan las líneas de cultivo para mejor organización</p>
                      <p>• Cada línea tendrá un nombre como "{batteryForm.letter}-1", "{batteryForm.letter}-2", etc.</p>
                      <p>• Puedes gestionar las líneas individuales después de crear la batería</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Content>
        </form>
      </Modal>
    </div>
  )
}

export default BatteryManager