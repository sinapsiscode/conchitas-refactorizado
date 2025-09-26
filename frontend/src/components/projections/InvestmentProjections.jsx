import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores'
import { useProjectionStore } from '../../stores'
import { UI_TEXTS } from '../../constants/ui'
import ProjectionForm from './ProjectionForm'
import ProjectionResults from './ProjectionResults'
import ScenarioManager from './ScenarioManager'
import Swal from 'sweetalert2'

const InvestmentProjections = () => {
  const { user } = useAuthStore()
  const {
    projections,
    currentProjection,
    projectionResults,
    calculating,
    fetchProjections,
    createProjection,
    calculateProjection,
    setCurrentProjection,
    clearResults
  } = useProjectionStore()
  
  const [activeTab, setActiveTab] = useState('new')
  const [showResults, setShowResults] = useState(false)
  
  useEffect(() => {
    if (user?.id) {
      fetchProjections(user.id)
    }
  }, [user?.id, fetchProjections])
  
  useEffect(() => {
    if (projectionResults) {
      setShowResults(true)
    }
  }, [projectionResults])
  
  const handleCreateProjection = (data) => {
    const newProjection = createProjection({
      ...data,
      userId: user.id
    })
    
    Swal.fire({
      icon: 'success',
      title: UI_TEXTS.projections.messages.projectionCreated,
      text: UI_TEXTS.projections.messages.projectionCreatedText,
      confirmButtonColor: '#3b82f6'
    })
    
    return newProjection
  }
  
  const handleCalculate = async () => {
    if (!currentProjection) {
      Swal.fire({
        icon: 'warning',
        title: UI_TEXTS.projections.messages.noProjection,
        text: UI_TEXTS.projections.messages.noProjectionText,
        confirmButtonColor: '#f59e0b'
      })
      return
    }
    
    const result = await calculateProjection(currentProjection)
    
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: UI_TEXTS.projections.messages.calculationCompleted,
        text: UI_TEXTS.projections.messages.calculationCompletedText,
        confirmButtonColor: '#3b82f6'
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: UI_TEXTS.projections.messages.calculationError,
        text: result.error || UI_TEXTS.projections.messages.calculationErrorText,
        confirmButtonColor: '#ef4444'
      })
    }
  }
  
  const handleSelectProjection = (projection) => {
    setCurrentProjection(projection)
    clearResults()
    setShowResults(false)
    setActiveTab('edit')
  }
  
  const tabs = [
    { id: 'new', label: UI_TEXTS.projections.tabs.newProjection, icon: UI_TEXTS.projections.icons.add },
    { id: 'edit', label: UI_TEXTS.projections.tabs.currentProjection, icon: UI_TEXTS.projections.icons.edit },
    { id: 'scenarios', label: UI_TEXTS.projections.tabs.scenarios, icon: UI_TEXTS.projections.icons.target },
    { id: 'history', label: UI_TEXTS.projections.tabs.history, icon: UI_TEXTS.projections.icons.chart }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {UI_TEXTS.projections.title}
          </h2>
          <p className="text-gray-600">
            {UI_TEXTS.projections.subtitle}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Forms/Controls */}
        <div className="space-y-6">
          {activeTab === 'new' && (
            <ProjectionForm
              onSubmit={handleCreateProjection}
              onCalculate={handleCalculate}
            />
          )}
          
          {activeTab === 'edit' && currentProjection && (
            <ProjectionForm
              projection={currentProjection}
              onSubmit={(data) => {
                // Update existing projection
                setCurrentProjection({ ...currentProjection, ...data })
              }}
              onCalculate={handleCalculate}
              isEdit={true}
            />
          )}
          
          {activeTab === 'scenarios' && (
            <ScenarioManager
              projection={currentProjection}
              onCalculate={handleCalculate}
            />
          )}
          
          {activeTab === 'history' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Proyecciones Guardadas
              </h3>
              
              {projections.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📈</div>
                  <p className="text-gray-500">No hay proyecciones guardadas</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    {UI_TEXTS.projections.actions.createFirst}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projections.map(projection => (
                    <div
                      key={projection.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectProjection(projection)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {projection.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {projection.description}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>💰 S/ {projection.baseInvestment?.toLocaleString()}</span>
                            <span>📅 {projection.projectionMonths} meses</span>
                            <span className={`px-2 py-1 rounded-full ${
                              projection.status === 'calculated'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {projection.status === 'calculated' ? UI_TEXTS.projections.status.calculated : UI_TEXTS.projections.status.draft}
                            </span>
                          </div>
                        </div>
                        {projection.projectionResults?.summary && (
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {projection.projectionResults.summary.keyMetrics.expectedROI.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">ROI Esperado</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Column - Results */}
        <div>
          {showResults && projectionResults ? (
            <ProjectionResults results={projectionResults} />
          ) : (
            <div className="card">
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Resultados de Proyección
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea o selecciona una proyección y calcula los resultados para ver el análisis detallado
                </p>
                {currentProjection && (
                  <button
                    onClick={handleCalculate}
                    disabled={calculating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {calculating ? UI_TEXTS.projections.messages.calculating : UI_TEXTS.projections.messages.calculateProjection}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Info Section */}
      <div className="card bg-blue-50">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Sobre las Proyecciones
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>{UI_TEXTS.projections.info.basedOnHistorical}</li>
                <li>{UI_TEXTS.projections.info.scenariosHelp}</li>
                <li>{UI_TEXTS.projections.info.monteCarloHelp}</li>
                <li>{UI_TEXTS.projections.info.disclaimer}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvestmentProjections