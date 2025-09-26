import React, { useState } from 'react'
import { useProjectionStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import Swal from 'sweetalert2'

const ScenarioManager = ({ projection, onCalculate }) => {
  const {
    updateScenario,
    addScenario,
    removeScenario,
    resetScenariosToStandard,
    runMonteCarloSimulation
  } = useProjectionStore()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newScenario, setNewScenario] = useState({
    name: '',
    adjustments: {
      priceAdjustment: 0,
      mortalityAdjustment: 0,
      costAdjustment: 0,
      volumeAdjustment: 0
    },
    probability: 0
  })
  
  const scenarios = projection?.scenarios || []
  
  const handleUpdateScenario = (scenarioId, field, value) => {
    if (field.includes('.')) {
      const [section, subfield] = field.split('.')
      updateScenario(scenarioId, {
        [section]: {
          ...scenarios.find(s => s.id === scenarioId)?.[section],
          [subfield]: parseFloat(value) || 0
        }
      })
    } else {
      updateScenario(scenarioId, { [field]: parseFloat(value) || value })
    }
  }
  
  const handleAddScenario = () => {
    if (!newScenario.name) {
      Swal.fire({
        icon: 'warning',
        title: UI_TEXTS.projections.messages.nameRequired,
        text: UI_TEXTS.projections.messages.nameRequiredText,
        confirmButtonColor: '#f59e0b'
      })
      return
    }
    
    addScenario(newScenario)
    setNewScenario({
      name: '',
      adjustments: {
        priceAdjustment: 0,
        mortalityAdjustment: 0,
        costAdjustment: 0,
        volumeAdjustment: 0
      },
      probability: 0
    })
    setShowAddForm(false)
    
    Swal.fire({
      icon: 'success',
      title: UI_TEXTS.projections.messages.scenarioAdded,
      text: UI_TEXTS.projections.messages.scenarioAddedText,
      confirmButtonColor: '#3b82f6'
    })
  }
  
  const handleRemoveScenario = (scenarioId) => {
    Swal.fire({
      title: UI_TEXTS.projections.messages.deleteScenario,
      text: UI_TEXTS.projections.messages.deleteScenarioText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: UI_TEXTS.projections.messages.confirmDelete,
      cancelButtonText: UI_TEXTS.projections.messages.cancel
    }).then((result) => {
      if (result.isConfirmed) {
        removeScenario(scenarioId)
        Swal.fire({
          icon: 'success',
          title: UI_TEXTS.projections.messages.deleted,
          text: UI_TEXTS.projections.messages.deletedText,
          confirmButtonColor: '#3b82f6'
        })
      }
    })
  }
  
  const handleMonteCarloSimulation = async () => {
    if (!projection) {
      Swal.fire({
        icon: 'warning',
        title: UI_TEXTS.projections.messages.noProjection,
        text: UI_TEXTS.projections.messages.selectProjectionFirst,
        confirmButtonColor: '#f59e0b'
      })
      return
    }
    
    const result = await runMonteCarloSimulation(projection, 1000)
    
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: UI_TEXTS.projections.messages.simulationCompleted,
        text: UI_TEXTS.projections.messages.simulationCompletedText,
        confirmButtonColor: '#3b82f6'
      })
    }
  }
  
  const getScenarioTypeColor = (type) => {
    const colors = {
      optimistic: 'bg-green-100 text-green-800',
      realistic: 'bg-blue-100 text-blue-800',
      pessimistic: 'bg-red-100 text-red-800',
      custom: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || colors.custom
  }
  
  if (!projection) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500">
            Selecciona o crea una proyección para gestionar escenarios
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {UI_TEXTS.projections.scenarios.title}
          </h3>
          <div className="space-x-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              {UI_TEXTS.projections.scenarios.add}
            </button>
            <button
              onClick={resetScenariosToStandard}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
            >
              {UI_TEXTS.projections.scenarios.restore}
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Define diferentes escenarios para analizar cómo variaciones en el mercado afectan tu inversión
        </p>
      </div>
      
      {/* Add New Scenario Form */}
      {showAddForm && (
        <div className="card bg-blue-50">
          <h4 className="font-medium text-gray-900 mb-4">Nuevo Escenario</h4>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder={UI_TEXTS.projections.placeholders.scenarioName}
              value={newScenario.name}
              onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.priceAdjustment}</label>
                <input
                  type="number"
                  value={newScenario.adjustments.priceAdjustment}
                  onChange={(e) => setNewScenario({
                    ...newScenario,
                    adjustments: { ...newScenario.adjustments, priceAdjustment: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.mortalityAdjustment}</label>
                <input
                  type="number"
                  value={newScenario.adjustments.mortalityAdjustment}
                  onChange={(e) => setNewScenario({
                    ...newScenario,
                    adjustments: { ...newScenario.adjustments, mortalityAdjustment: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.costAdjustment}</label>
                <input
                  type="number"
                  value={newScenario.adjustments.costAdjustment}
                  onChange={(e) => setNewScenario({
                    ...newScenario,
                    adjustments: { ...newScenario.adjustments, costAdjustment: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.probability}</label>
                <input
                  type="number"
                  value={newScenario.probability}
                  onChange={(e) => setNewScenario({ ...newScenario, probability: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddScenario}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {UI_TEXTS.common.save}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Scenarios List */}
      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getScenarioTypeColor(scenario.type)}`}>
                  {scenario.type}
                </span>
              </div>
              {scenario.type === 'custom' && (
                <button
                  onClick={() => handleRemoveScenario(scenario.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.priceAdjustment}</label>
                <input
                  type="number"
                  value={scenario.adjustments.priceAdjustment}
                  onChange={(e) => handleUpdateScenario(scenario.id, 'adjustments.priceAdjustment', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.mortalityAdjustment}</label>
                <input
                  type="number"
                  value={scenario.adjustments.mortalityAdjustment}
                  onChange={(e) => handleUpdateScenario(scenario.id, 'adjustments.mortalityAdjustment', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.costAdjustment}</label>
                <input
                  type="number"
                  value={scenario.adjustments.costAdjustment}
                  onChange={(e) => handleUpdateScenario(scenario.id, 'adjustments.costAdjustment', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="-50"
                  max="50"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-700">{UI_TEXTS.projections.scenarios.probability}</label>
                <input
                  type="number"
                  value={scenario.probability}
                  onChange={(e) => handleUpdateScenario(scenario.id, 'probability', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="card bg-gray-50">
        <div className="flex gap-4">
          <button
            onClick={onCalculate}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {UI_TEXTS.projections.scenarios.calculateWithScenarios}
          </button>
          
          <button
            onClick={handleMonteCarloSimulation}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            {UI_TEXTS.projections.scenarios.monteCarlo}
          </button>
        </div>
        
        <p className="text-xs text-gray-600 mt-3">
          La simulación Monte Carlo ejecuta 1000 escenarios aleatorios para proporcionar un análisis probabilístico más preciso
        </p>
      </div>
    </div>
  )
}

export default ScenarioManager