import { generateUUID } from '../../../utils/uuid.js'

export const MonitoringSchema = {
  id: {
    type: 'string',
    required: true,
    default: () => generateUUID()
  },
  lotId: {
    type: 'string',
    required: true
  },
  date: {
    type: 'string',
    required: true,
    validate: (value) => !isNaN(new Date(value).getTime())
  },
  waterTemperature: {
    type: 'number',
    required: false,
    min: 0,
    max: 50
  },
  salinity: {
    type: 'number',
    required: false,
    min: 0,
    max: 50
  },
  oxygenLevel: {
    type: 'number',
    required: false,
    min: 0,
    max: 20
  },
  pH: {
    type: 'number',
    required: false,
    min: 0,
    max: 14
  },
  turbidity: {
    type: 'number',
    required: false,
    min: 0
  },
  currentQuantity: {
    type: 'number',
    required: true,
    min: 0
  },
  mortalityCount: {
    type: 'number',
    required: false,
    min: 0
  },
  averageSize: {
    type: 'number',
    required: false,
    min: 0
  },
  maxSize: {
    type: 'number',
    required: false,
    min: 0
  },
  minSize: {
    type: 'number',
    required: false,
    min: 0
  },
  observations: {
    type: 'string',
    required: false
  },
  recordedBy: {
    type: 'string',
    required: true
  },
  recordDate: {
    type: 'string',
    required: true,
    default: () => new Date().toISOString()
  },
  notes: {
    type: 'string',
    required: false
  },
  dissolvedOxygen: {
    type: 'number',
    required: false,
    min: 0,
    max: 20
  },
  samplingPoints: {
    type: 'array',
    required: false,
    default: () => []
  },
  createdAt: {
    type: 'string',
    required: true,
    default: () => new Date().toISOString()
  }
}

export const validateMonitoring = (data) => {
  const errors = []
  
  for (const [field, rules] of Object.entries(MonitoringSchema)) {
    const value = data[field]
    
    // Skip validation for auto-generated fields (they will be added by the server)
    if (field === 'id' || field === 'createdAt') {
      continue
    }
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} es requerido`)
    }
    
    if (value !== undefined && value !== null && rules.validate && !rules.validate(value)) {
      errors.push(`${field} no tiene un formato válido`)
    }
    
    if (typeof value === 'number' && rules.min !== undefined && value < rules.min) {
      errors.push(`${field} debe ser mayor o igual a ${rules.min}`)
    }
    
    if (typeof value === 'number' && rules.max !== undefined && value > rules.max) {
      errors.push(`${field} debe ser menor o igual a ${rules.max}`)
    }
  }
  
  return errors
}