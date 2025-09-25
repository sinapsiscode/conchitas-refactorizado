import React, { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useExpenseStore } from '../../stores/expenseStore'
import { useSectorStore } from '../../stores/sectorStore'
import { useHarvestStore } from '../../stores/harvestStore'
import { useIncomeStatementClosureStore } from '../../stores/incomeStatementClosureStore'
import { useIncomeStore } from '../../stores/incomeStore'
import { useInvestmentStore } from '../../stores/investmentStore'
import { ExpenseTypeSchema } from '../../services/mock/schemas/expense'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatCard from '../../components/common/StatCard'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const ExpensesPage = () => {
  const { user } = useAuthStore()
  const { expenses, fetchExpenses, createExpense, getTotalExpenses, getExpensesByCategory, loading } = useExpenseStore()
  const { sectors, fetchSectors } = useSectorStore()
  const { harvestPlans, fetchHarvestPlans, pricing, fetchPricing } = useHarvestStore()
  const { closures, fetchClosures } = useIncomeStatementClosureStore()
  const { incomeRecords, fetchIncomeRecords } = useIncomeStore()
  const { investments, distributions, fetchInvestments } = useInvestmentStore()
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [customCategories, setCustomCategories] = useState(() => {
    // Cargar categorías personalizadas desde localStorage
    const saved = localStorage.getItem('customExpenseCategories')
    return saved ? JSON.parse(saved) : []
  })
  const [newCategory, setNewCategory] = useState({
    id: '',
    name: '',
    description: ''
  })
  const [expenseForm, setExpenseForm] = useState({
    category: 'operational',
    type: 'expense',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    lotId: '',
    sectorId: '',
    isRecurring: false,
    frequency: 'monthly'
  })
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: '', // 'income' or 'expense' or ''
    category: '',
    period: 'all', // 'today', 'week', 'month', 'quarter', 'year', 'custom', 'all'
    lotId: ''
  })
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc' // 'asc' or 'desc'
  })
  
  useEffect(() => {
    if (user?.id) {
      fetchExpenses()
      fetchSectors(user.id)
      fetchHarvestPlans(user.id)
      fetchPricing()
      fetchClosures({ userId: user.id })
      fetchIncomeRecords(user.id)
      fetchInvestments(user.id, 'maricultor')
    }
  }, [user?.id, fetchExpenses, fetchSectors, fetchHarvestPlans, fetchPricing, fetchClosures, fetchIncomeRecords, fetchInvestments])
  
  const handleCreateExpense = async (e) => {
    e.preventDefault()
    
    const result = await createExpense({
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      type: 'expense' // Agregar el campo type que es requerido
    })
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Gasto registrado',
        text: 'El gasto se registró exitosamente',
        timer: 1500,
        showConfirmButton: false
      })
      setExpenseForm({
        category: 'operational',
        type: 'expense',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        lotId: '',
        sectorId: '',
        isRecurring: false,
        frequency: 'monthly'
      })
      setShowExpenseForm(false)
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }
  
  const getCategoryColor = (category) => {
    const colors = {
      operational: 'bg-blue-100 text-blue-800',
      harvest: 'bg-green-100 text-green-800',
      material: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    }

    // Si es una categoría personalizada, usar un color distintivo
    if (category && category.startsWith('custom_')) {
      return 'bg-indigo-100 text-indigo-800'
    }

    return colors[category] || colors.other
  }
  
  const getCategoryName = (category) => {
    const names = {
      operational: 'Operativo',
      harvest: 'Cosecha',
      material: 'Materiales',
      maintenance: 'Mantenimiento',
      other: 'Otros'
    }

    // Verificar si es una categoría personalizada
    if (category && category.startsWith('custom_')) {
      const customCat = customCategories.find(cat => cat.id === category)
      if (customCat) {
        return customCat.name
      }
    }

    return names[category] || category
  }

  // Get income data from income records (registered in the Income section)
  const getIncomeData = () => {
    // Map income records to cash flow format
    return (incomeRecords || []).map(income => ({
      id: income.id,
      type: 'income',
      category: income.type || 'harvest_sale',
      description: income.description || 'Ingreso por cosecha',
      amount: income.totalAmount || 0,
      date: income.date,
      lotId: income.lotId,
      sectorId: income.sectorId,
      harvestPlanId: income.harvestPlanId,
      status: income.status
    }))
  }

  // Get investor income data from investments
  const getInvestorIncomeData = () => {
    // Map investments to cash flow format as income entries
    return (investments || []).map(investment => ({
      id: `investor_${investment.id}`,
      type: 'income',
      category: 'investor_income',
      description: `Inversión de ${investment.investorName || 'Inversionista'} - ${investment.percentage}%`,
      amount: investment.amount || 0,
      date: investment.createdAt || investment.date,
      lotId: investment.lotId,
      sectorId: investment.sectorId,
      investmentId: investment.id,
      investorName: investment.investorName,
      percentage: investment.percentage,
      status: investment.status
    }))
  }

  // Get all cash flow data (income + expenses)
  const getAllCashFlowData = () => {
    const incomes = getIncomeData()
    const investorIncomes = getInvestorIncomeData()
    const expensesData = expenses.map(expense => ({
      ...expense,
      type: 'expense'
    }))

    console.log('📊 [ExpensesPage] getAllCashFlowData:')
    console.log('   - Incomes with categories:', incomes.map(i => ({ id: i.id, category: i.category, type: i.type })))
    console.log('   - Investor incomes:', investorIncomes.map(i => ({ id: i.id, category: i.category, type: i.type, investorName: i.investorName })))
    console.log('   - Expenses with categories:', expensesData.map(e => ({ id: e.id, category: e.category, type: e.type })))

    return [...incomes, ...investorIncomes, ...expensesData]
  }

  // Apply date range filter based on period
  const getDateRange = (period) => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    switch (period) {
      case 'today':
        return {
          from: startOfToday,
          to: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case 'week':
        const startOfWeek = new Date(startOfToday)
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
        return {
          from: startOfWeek,
          to: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        }
      case 'month':
        return {
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
        }
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        return {
          from: new Date(today.getFullYear(), quarter * 3, 1),
          to: new Date(today.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
        }
      case 'year':
        return {
          from: new Date(today.getFullYear(), 0, 1),
          to: new Date(today.getFullYear(), 11, 31, 23, 59, 59)
        }
      case 'custom':
        return {
          from: filters.dateFrom ? new Date(filters.dateFrom) : null,
          to: filters.dateTo ? new Date(filters.dateTo) : null
        }
      default:
        return { from: null, to: null }
    }
  }

  // Apply all filters with useMemo for optimization
  const filteredCashFlowData = useMemo(() => {
    let data = getAllCashFlowData()
    console.log('🔍 [ExpensesPage] Filtering cash flow data:')
    console.log('   - Total data before filters:', data.length)
    console.log('   - Current filters:', filters)

    // Apply date filters
    const dateRange = getDateRange(filters.period)
    if (dateRange.from || dateRange.to) {
      data = data.filter(item => {
        const itemDate = new Date(item.date)
        if (dateRange.from && itemDate < dateRange.from) return false
        if (dateRange.to && itemDate > dateRange.to) return false
        return true
      })
      console.log('   - After date filter:', data.length)
    }

    // Apply type filter
    if (filters.type) {
      const beforeCount = data.length
      data = data.filter(item => item.type === filters.type)
      console.log(`   - After type filter (${filters.type}): ${data.length} (was ${beforeCount})`)
    }

    // Apply category filter
    if (filters.category) {
      const beforeCount = data.length
      data = data.filter(item => {
        const matches = item.category === filters.category
        console.log(`     - Item category: ${item.category}, filter: ${filters.category}, matches: ${matches}`)
        return matches
      })
      console.log(`   - After category filter (${filters.category}): ${data.length} (was ${beforeCount})`)
    }

    // Apply lot filter
    if (filters.lotId) {
      const beforeCount = data.length
      data = data.filter(item => item.lotId === filters.lotId)
      console.log(`   - After lot filter (${filters.lotId}): ${data.length} (was ${beforeCount})`)
    }

    console.log('   - Final filtered data count:', data.length)
    return data
  }, [expenses, harvestPlans, incomeRecords, investments, closures, filters, sectors])

  // All lots for filtering and sorting
  const allLots = sectors.flatMap(sector => 
    (sector.lots || []).map(lot => ({
      ...lot,
      sectorName: sector.name
    }))
  )

  // Get categories based on type
  const getCategoriesForType = (type) => {
    if (type === 'income') {
      return [
        { value: 'harvest_sale', label: 'Venta de Cosecha' },
        { value: 'sales', label: 'Ventas' },
        { value: 'subsidies', label: 'Subsidios' },
        { value: 'investments', label: 'Inversiones' },
        { value: 'investor_income', label: 'Ingreso por inversionista' },
        { value: 'other_income', label: 'Otros ingresos' }
      ]
    } else if (type === 'expense') {
      return [
        { value: 'operational', label: 'Operativo' },
        { value: 'harvest', label: 'Cosecha' },
        { value: 'material', label: 'Materiales' },
        { value: 'maintenance', label: 'Mantenimiento' },
        { value: 'labor', label: 'Mano de obra' },
        { value: 'transport', label: 'Transporte' },
        { value: 'other', label: 'Otros' }
      ]
    }
    return []
  }

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Sort data based on current sort config
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Handle special cases for sorting
      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'amount':
          aValue = parseFloat(a.amount) || 0
          bValue = parseFloat(b.amount) || 0
          break
        case 'type':
          aValue = a.type === 'income' ? 'Ingreso' : 'Gasto'
          bValue = b.type === 'income' ? 'Ingreso' : 'Gasto'
          break
        case 'category':
          if (a.type === 'income') {
            aValue = getCategoriesForType('income').find(c => c.value === a.category)?.label || a.category
          } else {
            aValue = getCategoryName(a.category)
          }
          if (b.type === 'income') {
            bValue = getCategoriesForType('income').find(c => c.value === b.category)?.label || b.category
          } else {
            bValue = getCategoryName(b.category)
          }
          break
        case 'siembra':
          if (a.lotId === 'company_expenses') {
            aValue = '🏫 Gastos de la empresa'
          } else {
            const aLot = allLots.find(l => l.id === a.lotId)
            aValue = aLot ? `${aLot.sectorName} - ${aLot.origin}` : 'No especificada'
          }
          if (b.lotId === 'company_expenses') {
            bValue = '🏫 Gastos de la empresa'
          } else {
            const bLot = allLots.find(l => l.id === b.lotId)
            bValue = bLot ? `${bLot.sectorName} - ${bLot.origin}` : 'No especificada'
          }
          break
        default:
          // For string values, convert to lowercase for case-insensitive sorting
          if (typeof aValue === 'string') aValue = aValue.toLowerCase()
          if (typeof bValue === 'string') bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // Get sort icon for column headers
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️' // Default sort icon
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const filteredData = sortData(filteredCashFlowData)
  
  // Calculate totals from filtered data
  const totalIncome = filteredData.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = filteredData.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const netCashFlow = totalIncome - totalExpenses
  
  // Get category breakdown
  const expensesByCategory = getExpensesByCategory()
  
  if (loading && expenses.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando gastos..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Flujo de Caja</h1>
          <p className="text-gray-600 mt-1">
            Analiza ingresos, gastos y utilidad neta de efectivo
          </p>
        </div>
        <button
          onClick={() => setShowExpenseForm(true)}
          className="btn-primary w-full sm:w-auto"
          disabled={loading}
        >
          Registrar Gasto
        </button>
      </div>

      {/* Filters Section */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <p className="text-sm text-gray-600">Filtra la información por temporalidad, tipo y categoría</p>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 lg:gap-6">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              className="input-field"
              value={filters.period}
              onChange={(e) => {
                const newPeriod = e.target.value
                setFilters(prev => ({
                  ...prev,
                  period: newPeriod,
                  // Reset custom dates if not custom period
                  dateFrom: newPeriod === 'custom' ? prev.dateFrom : '',
                  dateTo: newPeriod === 'custom' ? prev.dateTo : ''
                }))
              }}
            >
              <option value="all">Todos</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Custom Date Range - Only show if custom period selected */}
          {filters.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
                />
              </div>
            </>
          )}

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-xs text-blue-600">(paso 1)</span>
            </label>
            <select
              className={`input-field ${!filters.type ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
              value={filters.type}
              onChange={(e) => {
                console.log('🏷️ [ExpensesPage] Type filter changed:', {
                  previousType: filters.type,
                  newType: e.target.value,
                  resettingCategory: filters.category,
                  availableCategoriesForNewType: getCategoriesForType(e.target.value)
                })
                setFilters(prev => ({
                  ...prev,
                  type: e.target.value,
                  category: '' // Reset category when type changes
                }))
              }}
            >
              <option value="">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Gastos</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
              {filters.type ? (
                <span className="text-xs text-blue-600">(paso 2)</span>
              ) : (
                <span className="text-xs text-orange-600">(selecciona tipo primero)</span>
              )}
            </label>
            <select
              className={`input-field ${!filters.type ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={filters.category}
              onChange={(e) => {
                console.log('🏷️ [ExpensesPage] Category filter changed:', {
                  previousCategory: filters.category,
                  newCategory: e.target.value,
                  type: filters.type,
                  availableCategories: getCategoriesForType(filters.type)
                })
                setFilters(prev => ({...prev, category: e.target.value}))
              }}
              disabled={!filters.type}
              title={!filters.type ? 'Selecciona un tipo (Ingreso o Gasto) primero' : 'Filtra por categoría específica'}
            >
              <option value="">{!filters.type ? 'Selecciona tipo primero' : 'Todas las categorías'}</option>
              {getCategoriesForType(filters.type).map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Lot Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Siembra
            </label>
            <select
              className="input-field"
              value={filters.lotId}
              onChange={(e) => setFilters(prev => ({...prev, lotId: e.target.value}))}
            >
              <option value="">Todas</option>
              <option value="company_expenses">🏫 Gastos de la empresa</option>
              <optgroup label="Siembras">
                {allLots.map(lot => (
                  <option key={lot.id} value={lot.id}>
                    {lot.sectorName} - {lot.origin}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({
              dateFrom: '',
              dateTo: '',
              type: '',
              category: '',
              period: 'all',
              lotId: ''
            })}
            className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 lg:gap-6">
        <StatCard
          title="Total Ingresos"
          value={formatCurrency(totalIncome)}
          subtitle="Desde sección Ingresos"
          icon="💵"
          color="green"
        />

        <StatCard
          title="Ingresos por Inversionista"
          value={formatCurrency(filteredData.filter(item => item.category === 'investor_income').reduce((sum, item) => sum + item.amount, 0))}
          subtitle={`${filteredData.filter(item => item.category === 'investor_income').length} inversiones`}
          icon="👥"
          color="blue"
        />

        <StatCard
          title="Total Gastos"
          value={formatCurrency(totalExpenses)}
          subtitle="Gastos del período"
          icon="💸"
          color="red"
        />

        <StatCard
          title="Utilidad Neta"
          value={formatCurrency(netCashFlow)}
          subtitle={netCashFlow >= 0 ? "Ganancia" : "Pérdida"}
          icon={netCashFlow >= 0 ? "📈" : "📉"}
          color={netCashFlow >= 0 ? "blue" : "orange"}
        />

        <StatCard
          title="Transacciones"
          value={filteredData.length}
          subtitle="Total movimientos"
          icon="📊"
          color="purple"
        />
      </div>

      {/* Cash Flow Table */}
      <div className="card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos de Efectivo</h2>
          <p className="text-sm text-gray-600">
            {filters.period !== 'all' && `Período: ${filters.period === 'custom' 
              ? `${filters.dateFrom || 'inicio'} - ${filters.dateTo || 'fin'}` 
              : filters.period}`}
            {filteredData.length > 0 && ` • ${filteredData.length} movimientos`}
            {filteredData.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                💡 Haz clic en los encabezados para ordenar
              </span>
            )}
          </p>
        </div>

        {filteredData.length === 0 ? (
          <EmptyState
            title="No hay movimientos"
            message="No se encontraron transacciones con los filtros aplicados"
            icon="💰"
          />
        ) : (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha</span>
                      <span className="text-gray-400">{getSortIcon('date')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      <span className="text-gray-400">{getSortIcon('type')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Categoría</span>
                      <span className="text-gray-400">{getSortIcon('category')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Descripción</span>
                      <span className="text-gray-400">{getSortIcon('description')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Monto</span>
                      <span className="text-gray-400">{getSortIcon('amount')}</span>
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('siembra')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Siembra</span>
                      <span className="text-gray-400">{getSortIcon('siembra')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => {
                  const lot = allLots.find(l => l.id === item.lotId)
                  return (
                    <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.date).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          item.type === 'income' 
                            ? 'bg-blue-100 text-blue-800' 
                            : getCategoryColor(item.category)
                        }`}>
                          {item.type === 'income' 
                            ? getCategoriesForType('income').find(c => c.value === item.category)?.label || item.category
                            : getCategoryName(item.category)
                          }
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-900">
                        <div>{item.description}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${
                          item.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.lotId === 'company_expenses' 
                          ? '🏫 Gastos de la empresa'
                          : lot ? `${lot.sectorName} - ${lot.origin}` : 'No especificada'
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Registrar Gasto</h2>
            <form onSubmit={handleCreateExpense} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  className="input-field"
                  value={expenseForm.category}
                  onChange={(e) => {
                    setExpenseForm({...expenseForm, category: e.target.value})
                  }}
                >
                  <option value="operational">Operativo</option>
                  <option value="harvest">Cosecha</option>
                  <option value="material">Materiales</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="other">Otros</option>
                  {/* Categorías personalizadas */}
                  {customCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Agregar nueva categoría
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Descripción del gasto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (PEN) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Siembra (Lote) *
                </label>
                <select
                  className="input-field"
                  value={expenseForm.lotId}
                  onChange={(e) => {
                    if (e.target.value === 'company_expenses') {
                      setExpenseForm({
                        ...expenseForm, 
                        lotId: 'company_expenses',
                        sectorId: 'company'
                      })
                    } else {
                      const selectedLot = sectors
                        .flatMap(sector => sector.lots?.map(lot => ({ ...lot, sectorName: sector.name })) || [])
                        .find(lot => lot.id === e.target.value)
                      
                      setExpenseForm({
                        ...expenseForm, 
                        lotId: e.target.value,
                        sectorId: selectedLot?.sectorId || ''
                      })
                    }
                  }}
                  required
                >
                  <option value="">Seleccionar siembra</option>
                  <option value="company_expenses" className="font-semibold bg-blue-50">
                    🏫 Gastos de la empresa
                  </option>
                  <optgroup label="Siembras activas">
                    {sectors.map(sector => 
                      sector.lots?.map(lot => (
                        <option key={lot.id} value={lot.id}>
                          {sector.name} - {lot.origin} ({new Date(lot.entryDate).toLocaleDateString('es-PE')})
                        </option>
                      )) || []
                    )}
                  </optgroup>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {expenseForm.lotId === 'company_expenses' 
                    ? 'El gasto se registrará como gasto general de la empresa'
                    : 'El gasto se vinculará específicamente a esta siembra/lote'
                  }
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={expenseForm.isRecurring}
                  onChange={(e) => setExpenseForm({...expenseForm, isRecurring: e.target.checked})}
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-700">
                  Es un gasto recurrente
                </label>
              </div>
              
              {expenseForm.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia
                  </label>
                  <select
                    className="input-field"
                    value={expenseForm.frequency}
                    onChange={(e) => setExpenseForm({...expenseForm, frequency: e.target.value})}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              )}
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para agregar nueva categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Agregar Nueva Categoría</h2>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const newCat = {
                  id: `custom_${Date.now()}`,
                  name: newCategory.name,
                  description: newCategory.description
                }
                const updatedCategories = [...customCategories, newCat]
                setCustomCategories(updatedCategories)
                // Guardar en localStorage
                localStorage.setItem('customExpenseCategories', JSON.stringify(updatedCategories))
                setNewCategory({ id: '', name: '', description: '' })
                setShowCategoryModal(false)
                MySwal.fire({
                  icon: 'success',
                  title: 'Categoría creada',
                  text: `La categoría "${newCat.name}" se creó exitosamente`,
                  timer: 2000,
                  showConfirmButton: false
                })
              }}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Ej: Alimentación"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Breve descripción de la categoría"
                />
              </div>
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setNewCategory({ id: '', name: '', description: '' })
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpensesPage