import React, { useState, useEffect } from 'react'
import { useSectorStore } from '../../stores'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const CultivationLineManager = ({ sector, onClose }) => {
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
    name: '',
    lineNumber: '',
    description: ''
  })
  const [selectedLine, setSelectedLine] = useState(null)
  
  useEffect(() => {
    if (sector?.id) {
      fetchCultivationLines(sector.id)
    }
  }, [sector?.id, fetchCultivationLines])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const lineData = {
      sectorId: sector.id,
      name: lineForm.name,
      lineNumber: parseInt(lineForm.lineNumber),
      description: lineForm.description,
      totalSystems: 100,
      floorsPerSystem: 10
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
        text: `La línea se ${editingLine ? 'actualizó' : 'creó'} exitosamente`,
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
      name: line.name,
      lineNumber: line.lineNumber.toString(),
      description: line.description || ''
    })
    setShowLineForm(true)
  }
  
  const handleDelete = async (line) => {
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
      name: '',
      lineNumber: '',
      description: ''
    })
    setEditingLine(null)
    setShowLineForm(false)
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
  
  if (loading && cultivationLines.length === 0) {
    return <LoadingSpinner size="lg" message="Cargando líneas de cultivo..." />
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Líneas de Cultivo - {sector.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona las líneas de cultivo de este sector (100 sistemas por línea, 10 pisos por sistema)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {!showLineForm && (
            <div className="mb-4">
              <button
                onClick={() => setShowLineForm(true)}
                className="btn-primary"
              >
                Nueva Línea de Cultivo
              </button>
            </div>
          )}
          
          {showLineForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingLine ? 'Editar Línea' : 'Nueva Línea de Cultivo'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Línea *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={lineForm.name}
                    onChange={(e) => setLineForm({...lineForm, name: e.target.value})}
                    placeholder="Ej: Línea A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Línea *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={lineForm.lineNumber}
                    onChange={(e) => setLineForm({...lineForm, lineNumber: e.target.value})}
                    onWheel={(e) => e.target.blur()}
                    placeholder="Ej: 1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    rows="2"
                    className="input-field"
                    value={lineForm.description}
                    onChange={(e) => setLineForm({...lineForm, description: e.target.value})}
                    placeholder="Descripción adicional de la línea..."
                  />
                </div>
                
                <div className="md:col-span-2 flex space-x-3">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? (
                      <LoadingSpinner size="sm" message="" />
                    ) : (
                      editingLine ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {cultivationLines.length === 0 ? (
            <EmptyState
              title="No hay líneas de cultivo"
              message="Comienza creando la primera línea de cultivo para este sector."
              icon="🌊"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cultivationLines.map((line) => (
                <div
                  key={line.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedLine(line)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {line.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Línea #{line.lineNumber}
                      </p>
                    </div>
                    {getStatusBadge(line.status)}
                  </div>
                  
                  {renderSystemOccupation(line)}
                  
                  {line.description && (
                    <p className="text-sm text-gray-600 mt-3">
                      {line.description}
                    </p>
                  )}
                  
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(line)
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(line)
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {selectedLine && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Detalles de {selectedLine.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Total: {selectedLine.totalSystems} sistemas × {selectedLine.floorsPerSystem} pisos = {selectedLine.totalSystems * selectedLine.floorsPerSystem} posiciones
                </p>
              </div>
              <button
                onClick={() => setSelectedLine(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CultivationLineManager