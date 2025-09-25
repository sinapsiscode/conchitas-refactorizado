import { generateUUID } from '../../../utils/uuid.js'

export const InvestmentSchema = {
  id: {
    type: 'string',
    required: true,
    default: () => generateUUID()
  },
  investorId: {
    type: 'string',
    required: true
  },
  lotId: {
    type: 'string',
    required: true
  },
  maricultorId: {
    type: 'string',
    required: true
  },
  amount: {
    type: 'number',
    required: true,
    min: 0
  },
  percentage: {
    type: 'number',
    required: true,
    min: 0,
    max: 100
  },
  investmentDate: {
    type: 'string',
    required: true,
    validate: (value) => !isNaN(new Date(value).getTime())
  },
  expectedReturn: {
    type: 'number',
    required: false,
    min: 0
  },
  actualReturn: {
    type: 'number',
    required: false,
    min: 0
  },
  status: {
    type: 'string',
    required: true,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: 'string',
    required: false
  },
  // Financial tracking
  distributedReturns: {
    type: 'array',
    required: false,
    default: []
  },
  lastDistributionDate: {
    type: 'string',
    required: false,
    validate: (value) => !value || !isNaN(new Date(value).getTime())
  },
  totalDistributed: {
    type: 'number',
    required: false,
    default: 0
  },
  // Audit fields
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

export const validateInvestment = (data) => {
  const errors = []
  
  for (const [field, rules] of Object.entries(InvestmentSchema)) {
    // Skip auto-generated fields
    if (['id', 'createdAt', 'updatedAt'].includes(field)) {
      continue
    }
    
    const value = data[field]
    
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
    
    if (value && rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} debe ser uno de: ${rules.enum.join(', ')}`)
    }
  }
  
  return errors
}