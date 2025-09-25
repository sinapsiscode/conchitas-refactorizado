import { create } from 'zustand'
import { mockAPI } from '../services/mock/server'
import { projectionService } from '../services/projections/projectionService'
import { ProjectionParametersSchema } from '../services/mock/schemas/projection'

export const useProjectionStore = create((set, get) => ({
  projections: [],
  currentProjection: null,
  projectionResults: null,
  parameters: ProjectionParametersSchema,
  scenarios: [],
  loading: false,
  calculating: false,
  error: null,
  
  // Fetch all projections for user
  fetchProjections: async (userId) => {
    set({ loading: true, error: null })
    try {
      // Mock API call - in real app this would fetch from backend
      const storedProjections = localStorage.getItem(`projections_${userId}`)
      const projections = storedProjections ? JSON.parse(storedProjections) : []
      
      set({ projections, loading: false })
      return { success: true, data: projections }
    } catch (error) {
      set({ error: error.message, loading: false })
      return { success: false, error: error.message }
    }
  },
  
  // Create new projection
  createProjection: (projectionData) => {
    const newProjection = {
      id: `proj_${Date.now()}`,
      ...projectionData,
      scenarios: projectionService.createStandardScenarios(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    set(state => ({
      projections: [...state.projections, newProjection],
      currentProjection: newProjection
    }))
    
    // Save to localStorage
    const userId = projectionData.userId
    const allProjections = [...get().projections]
    localStorage.setItem(`projections_${userId}`, JSON.stringify(allProjections))
    
    return newProjection
  },
  
  // Update projection
  updateProjection: (projectionId, updates) => {
    set(state => ({
      projections: state.projections.map(proj =>
        proj.id === projectionId
          ? { ...proj, ...updates, updatedAt: new Date().toISOString() }
          : proj
      ),
      currentProjection: state.currentProjection?.id === projectionId
        ? { ...state.currentProjection, ...updates, updatedAt: new Date().toISOString() }
        : state.currentProjection
    }))
    
    // Save to localStorage
    const projections = get().projections
    const userId = projections.find(p => p.id === projectionId)?.userId
    if (userId) {
      localStorage.setItem(`projections_${userId}`, JSON.stringify(projections))
    }
  },
  
  // Delete projection
  deleteProjection: (projectionId) => {
    const projections = get().projections
    const projection = projections.find(p => p.id === projectionId)
    
    set(state => ({
      projections: state.projections.filter(proj => proj.id !== projectionId),
      currentProjection: state.currentProjection?.id === projectionId 
        ? null 
        : state.currentProjection
    }))
    
    // Update localStorage
    if (projection?.userId) {
      const updatedProjections = get().projections
      localStorage.setItem(`projections_${projection.userId}`, JSON.stringify(updatedProjections))
    }
  },
  
  // Set current projection
  setCurrentProjection: (projection) => {
    set({ currentProjection: projection })
  },
  
  // Calculate projection results
  calculateProjection: async (projectionData) => {
    set({ calculating: true, error: null })
    
    try {
      // Use projection service to calculate
      const results = projectionService.calculateProjection(projectionData)
      
      // Update projection with results
      const updatedProjection = {
        ...projectionData,
        projectionResults: results,
        status: 'calculated',
        calculatedAt: new Date().toISOString()
      }
      
      // Update in store
      get().updateProjection(projectionData.id, {
        projectionResults: results,
        status: 'calculated',
        calculatedAt: new Date().toISOString()
      })
      
      set({ 
        projectionResults: results,
        calculating: false 
      })
      
      return { success: true, data: results }
    } catch (error) {
      set({ error: error.message, calculating: false })
      return { success: false, error: error.message }
    }
  },
  
  // Run Monte Carlo simulation
  runMonteCarloSimulation: async (projectionData, iterations = 1000) => {
    set({ calculating: true, error: null })
    
    try {
      const results = projectionService.monteCarloSimulation(projectionData, iterations)
      
      set({ 
        projectionResults: {
          ...get().projectionResults,
          monteCarloResults: results
        },
        calculating: false 
      })
      
      return { success: true, data: results }
    } catch (error) {
      set({ error: error.message, calculating: false })
      return { success: false, error: error.message }
    }
  },
  
  // Update scenario
  updateScenario: (scenarioId, updates) => {
    set(state => ({
      scenarios: state.scenarios.map(scenario =>
        scenario.id === scenarioId
          ? { ...scenario, ...updates }
          : scenario
      )
    }))
    
    // Update current projection if it has this scenario
    const currentProjection = get().currentProjection
    if (currentProjection) {
      const updatedScenarios = currentProjection.scenarios.map(scenario =>
        scenario.id === scenarioId
          ? { ...scenario, ...updates }
          : scenario
      )
      
      get().updateProjection(currentProjection.id, { scenarios: updatedScenarios })
    }
  },
  
  // Add custom scenario
  addScenario: (scenario) => {
    const newScenario = {
      id: `scenario_${Date.now()}`,
      type: 'custom',
      probability: 0,
      ...scenario
    }
    
    set(state => ({
      scenarios: [...state.scenarios, newScenario]
    }))
    
    // Update current projection
    const currentProjection = get().currentProjection
    if (currentProjection) {
      get().updateProjection(currentProjection.id, {
        scenarios: [...currentProjection.scenarios, newScenario]
      })
    }
    
    return newScenario
  },
  
  // Remove scenario
  removeScenario: (scenarioId) => {
    set(state => ({
      scenarios: state.scenarios.filter(s => s.id !== scenarioId)
    }))
    
    // Update current projection
    const currentProjection = get().currentProjection
    if (currentProjection) {
      get().updateProjection(currentProjection.id, {
        scenarios: currentProjection.scenarios.filter(s => s.id !== scenarioId)
      })
    }
  },
  
  // Get projection by ID
  getProjectionById: (projectionId) => {
    return get().projections.find(p => p.id === projectionId)
  },
  
  // Get default parameters
  getDefaultParameters: () => {
    return ProjectionParametersSchema
  },
  
  // Reset scenarios to standard
  resetScenariosToStandard: () => {
    const standardScenarios = projectionService.createStandardScenarios()
    set({ scenarios: standardScenarios })
    
    // Update current projection
    const currentProjection = get().currentProjection
    if (currentProjection) {
      get().updateProjection(currentProjection.id, { scenarios: standardScenarios })
    }
  },
  
  // Clear results
  clearResults: () => {
    set({ projectionResults: null })
  }
}))