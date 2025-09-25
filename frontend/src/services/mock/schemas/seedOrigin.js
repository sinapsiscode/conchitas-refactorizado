import { generateUUID } from '../../../utils/uuid.js'

export const SeedOriginSchema = {
  id: {
    type: 'string',
    required: true,
    default: () => generateUUID()
  },
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100
  },
  monthlyGrowthRate: {
    type: 'number',
    required: true,
    min: 0,
    max: 20
  },
  monthlyMortalityRate: {
    type: 'number',
    required: true,
    min: 0,
    max: 50
  },
  pricePerBundle: {
    type: 'number',
    required: true,
    min: 0,
    max: 10000
  },
  pricePerUnit: {
    type: 'number',
    required: false,
    min: 0,
    max: 10000,
    computed: true
  },
  bundleSize: {
    type: 'number',
    required: true,
    default: 96
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  isActive: {
    type: 'boolean',
    required: true,
    default: true
  },
  createdAt: {
    type: 'string',
    required: true,
    default: () => new Date().toISOString()
  },
  updatedAt: {
    type: 'string',
    required: true,
    default: () => new Date().toISOString()
  }
}

export const validateSeedOrigin = (data) => {
  const errors = []
  
  for (const [field, rules] of Object.entries(SeedOriginSchema)) {
    const value = data[field]
    
    // Skip validation for auto-generated fields
    if (field === 'id' || field === 'createdAt' || field === 'updatedAt') {
      continue
    }
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} es requerido`)
    }
    
    if (value !== undefined && value !== null && value !== '') {
      // String validations
      if (rules.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${field} debe ser texto`)
        } else {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${field} debe tener al menos ${rules.minLength} caracteres`)
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${field} debe tener máximo ${rules.maxLength} caracteres`)
          }
        }
      }
      
      // Number validations
      if (rules.type === 'number') {
        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
          errors.push(`${field} debe ser un número válido`)
        } else {
          if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`${field} debe ser mayor o igual a ${rules.min}`)
          }
          if (rules.max !== undefined && numValue > rules.max) {
            errors.push(`${field} debe ser menor o igual a ${rules.max}`)
          }
        }
      }
      
      // Boolean validations
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} debe ser verdadero o falso`)
      }
    }
  }
  
  return errors
}