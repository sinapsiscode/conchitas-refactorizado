import React, { useState, useEffect } from 'react'
import { useSectorStore } from '../../stores/sectorStore'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Modal from '../common/Modal'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const LineManager = ({ battery, onClose }) => {
  const {
    cultivationLines,
    fetchCultivationLines,
    createCultivationLine,
    updateCultivationLine,
    deleteCultivationLine,
    loading
  } = useSectorStore()

  const [showLineForm, setShowLineForm] = useState(false)
  const [editingLine, setEditingLine] = useState(null)
  const [lineForm, setLineForm] = useState({
    lineNumber: '',
    totalSystems: '100',
    description: ''
  })

  // Filtrar líneas de esta batería específica
  const batteryLines = cultivationLines.filter(line => line.batteryId === battery.id)

  useEffect(() => {
    if (battery?.id) {
      fetchCultivationLines(battery.sectorId, battery.id)
    }
  }, [battery?.id, battery?.sectorId, fetchCultivationLines])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Generar el nombre automáticamente en formato A-1, B-2, etc.
    const lineName = `${battery.letter}-${lineForm.lineNumber}`

    // Verificar que no exista otra línea con el mismo número en esta batería
    const existingLine = batteryLines.find(line =>
      line.lineNumber === parseInt(lineForm.lineNumber) &&
      line.id !== editingLine?.id
    )

    if (existingLine) {
      MySwal.fire({
        icon: 'error',
        title: 'Número duplicado',
        text: `Ya existe la línea ${lineName} en esta batería`
      })
      return
    }

    const lineData = {
      sectorId: battery.sectorId,
      batteryId: battery.id,
      name: lineName,
      batteryLetter: battery.letter,
      lineNumber: parseInt(lineForm.lineNumber),
      totalSystems: parseInt(lineForm.totalSystems),
      floorsPerSystem: 10, // Valor fijo, siempre 10 pisos por sistema
      occupiedSystems: [],
      status: 'available',
      description: lineForm.description
    }

    let result
    if (editingLine) {
      result = await updateCultivationLine(editingLine.id, lineData)
    } else {
      result = await createCultivationLine(lineData)
    }

    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: editingLine ? 'Línea actualizada' : 'Línea creada',
        text: `La línea ${lineName} se ${editingLine ? 'actualizó' : 'creó'} exitosamente`,
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

  const handleEdit = (line) => {
    setEditingLine(line)
    setLineForm({
      lineNumber: line.lineNumber.toString(),
      totalSystems: line.totalSystems?.toString() || '100',
      description: line.description || ''
    })
    setShowLineForm(true)
  }

  const handleDelete = async (line) => {
    // Verificar si la línea tiene sistemas ocupados
    const hasOccupiedSystems = line.occupiedSystems && line.occupiedSystems.length > 0

    if (hasOccupiedSystems) {
      MySwal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: `Esta línea tiene sistemas ocupados. Libera todos los sistemas antes de eliminarla.`
      })
      return
    }

    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la línea "${line.name}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      const deleteResult = await deleteCultivationLine(line.id)
      if (deleteResult.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Línea eliminada',
          text: 'La línea se eliminó exitosamente',
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
    setLineForm({
      lineNumber: '',
      totalSystems: '100',
      description: ''
    })
    setEditingLine(null)
    setShowLineForm(false)
  }

  const getNextAvailableNumber = () => {
    const usedNumbers = batteryLines.map(line => line.lineNumber).sort((a, b) => a - b)

    for (let i = 1; i <= 999; i++) {
      if (!usedNumbers.includes(i)) {
        return i.toString()
      }
    }
    return '1'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disponible' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Parcial' },
      full: { bg: 'bg-red-100', text: 'text-red-800', label: 'Completa' },
      maintenance: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Mantenimiento' }
    }

    const config = statusConfig[status] || statusConfig.available

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const renderSystemOccupation = (line) => {
    const occupied = line.occupiedSystems?.length || 0
    const total = line.totalSystems || 100
    const percentage = (occupied / total) * 100

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sistemas ocupados</span>
          <span className="font-medium">{occupied} / {total}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              percentage === 0 ? 'bg-gray-400' :
              percentage < 50 ? 'bg-green-500' :
              percentage < 80 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {percentage.toFixed(1)}% de ocupación
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              🚢 Gestión de Líneas - Batería {battery.letter}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Administra las líneas de cultivo de la batería {battery.name}
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
                Líneas de la Batería {battery.letter}
              </h3>
              <p className="text-sm text-gray-600">
                {batteryLines.length} línea{batteryLines.length !== 1 ? 's' : ''} configurada{batteryLines.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setLineForm(prev => ({ ...prev, lineNumber: getNextAvailableNumber() }))
                setShowLineForm(true)
              }}
              className="btn-primary"
              disabled={loading}
            >
              <span className="mr-2">➕</span>
              Nueva Línea {battery.letter}-{getNextAvailableNumber()}
            </button>
          </div>

          {loading && batteryLines.length === 0 ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" message="Cargando líneas..." />
            </div>
          ) : batteryLines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batteryLines
                .sort((a, b) => a.lineNumber - b.lineNumber)
                .map((line) => (
                <div key={line.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🚢</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{line.name}</h4>
                        <p className="text-sm text-gray-600">Línea #{line.lineNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(line.status)}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(line)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Editar línea"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(line)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar línea"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* System Occupation */}
                  <div className="mb-4">
                    {renderSystemOccupation(line)}
                  </div>

                  {/* Technical Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Sistemas totales:</span>
                      <p className="text-gray-900">{line.totalSystems || 100}</p>
                    </div>
                    <div>
                      <span className="font-medium">Pisos por sistema:</span>
                      <p className="text-gray-900">{line.floorsPerSystem || 10}</p>
                    </div>
                  </div>

                  {line.description && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{line.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No hay líneas configuradas"
              message={`La batería ${battery.letter} no tiene líneas de cultivo. Crea la primera línea para comenzar a gestionar los sistemas de cultivo.`}
              icon="🚢"
              action={
                <button
                  onClick={() => {
                    setLineForm(prev => ({ ...prev, lineNumber: getNextAvailableNumber() }))
                    setShowLineForm(true)
                  }}
                  className="btn-primary"
                >
                  Crear Línea {battery.letter}-1
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Line Form Modal */}
      <Modal
        isOpen={showLineForm}
        onClose={resetForm}
        title={editingLine ? `🚢 Editar ${editingLine.name}` : `🚢 Nueva Línea ${battery.letter}-${lineForm.lineNumber}`}
        subtitle={editingLine ? 'Modifica los datos de la línea' : 'Configura una nueva línea de cultivo'}
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
              form="line-form"
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
                  <span className="mr-2">{editingLine ? '✏️' : '➕'}</span>
                  {editingLine ? 'Actualizar' : 'Crear'} Línea
                </>
              )}
            </button>
          </Modal.Actions>
        }
      >
        <form id="line-form" onSubmit={handleSubmit}>
          <Modal.Content>
            <div className="space-y-6">
              {/* Número de Línea */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">🔢</span>
                  Número de Línea
                  <span className="text-danger-500 ml-1">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
                    <span className="font-bold text-gray-700">{battery.letter}-</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    required
                    className="input-field flex-1"
                    value={lineForm.lineNumber}
                    onChange={(e) => setLineForm({...lineForm, lineNumber: e.target.value})}
                    placeholder="1"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Número único para la línea dentro de esta batería (ej: {battery.letter}-1, {battery.letter}-2)
                </p>
              </div>

              {/* Sistemas Totales */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">🏗️</span>
                  Sistemas Totales
                  <span className="text-danger-500 ml-1">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  className="input-field"
                  value={lineForm.totalSystems}
                  onChange={(e) => setLineForm({...lineForm, totalSystems: e.target.value})}
                  placeholder="100"
                />
                <p className="text-xs text-slate-500">
                  Número total de sistemas de cultivo en esta línea
                </p>
              </div>

              {/* Pisos por Sistema (Campo fijo) */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <span className="mr-2">📊</span>
                  Pisos por Sistema
                </label>
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                  <span className="text-gray-900 font-medium">10 pisos</span>
                  <span className="ml-2 text-xs text-gray-500">(valor fijo)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Cada sistema de cultivo siempre tiene exactamente 10 pisos
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
                  value={lineForm.description}
                  onChange={(e) => setLineForm({...lineForm, description: e.target.value})}
                  placeholder="Descripción opcional de la línea de cultivo..."
                />
                <p className="text-xs text-slate-500">
                  Información adicional sobre la ubicación o características de esta línea
                </p>
              </div>

              {/* Información calculada */}
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-info-600 mr-3 mt-0.5">📋</span>
                  <div>
                    <h4 className="text-sm font-medium text-info-800 mb-1">
                      Información Calculada
                    </h4>
                    <div className="text-xs text-info-700 space-y-1">
                      <p>• Nombre de la línea: <strong>{battery.letter}-{lineForm.lineNumber || '?'}</strong></p>
                      <p>• Capacidad total: <strong>{(parseInt(lineForm.totalSystems) || 0) * 10} posiciones</strong></p>
                      <p>• Estado inicial: Disponible (sin ocupación)</p>
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

export default LineManager