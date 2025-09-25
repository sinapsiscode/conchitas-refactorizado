import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useInventoryStore } from '../../stores/inventoryStore'
import { useSectorStore } from '../../stores/sectorStore'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatCard from '../../components/common/StatCard'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const InventoryPage = () => {
  const { user } = useAuthStore()
  const { sectors, fetchSectors } = useSectorStore()
  const { 
    inventory, 
    categories, 
    fetchInventory, 
    createInventoryItem, 
    updateInventoryItem,
    createMovement, 
    createCategory,
    updateCategory,
    deleteCategory,
    getTotalValue, 
    getLowStockItems, 
    loading 
  } = useInventoryStore()
  
  const [showItemForm, setShowItemForm] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState('items')
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'list'
  
  const [itemForm, setItemForm] = useState({
    category: '',
    name: '',
    description: '',
    origin: 'national',
    quantity: '',
    unit: 'units',
    unitCost: '',
    minStock: '',
    location: '',
    supplier: '',
    lastPurchaseDate: '',
    status: 'disponible', // 'disponible', 'asignado', 'mantenimiento'
    assignedTo: '', // lot ID
    assignmentDate: '',
    assignmentNotes: ''
  })
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '📦',
    color: '#6B7280'
  })
  
  const [movementForm, setMovementForm] = useState({
    type: 'status_change',
    newStatus: 'disponible',
    quantity: '',
    assignedQuantity: '',
    maintenanceQuantity: '',
    assignedToLot: '',
    assignmentDate: new Date().toISOString().split('T')[0],
    assignmentNotes: '',
    maintenanceNotes: '',
    reason: '',
    multipleAssignments: [] // Array of {lotId, quantity, date, notes}
  })
  
  useEffect(() => {
    fetchInventory()
    if (user?.id) {
      fetchSectors(user.id)
    }
  }, [fetchInventory, fetchSectors, user?.id])
  
  const handleCreateItem = async (e) => {
    e.preventDefault()
    
    const quantity = parseInt(itemForm.quantity) || 0
    const unitCost = parseFloat(itemForm.unitCost) || 0
    const totalValue = quantity * unitCost
    
    const result = await createInventoryItem({
      ...itemForm,
      quantity,
      unitCost,
      totalValue,
      minStock: itemForm.minStock ? parseInt(itemForm.minStock) : null
    })
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Item creado',
        text: 'El item se agregó al inventario',
        timer: 1500,
        showConfirmButton: false
      })
      setItemForm({
        category: '',
        name: '',
        description: '',
        origin: 'national',
        quantity: '',
        unit: 'units',
        unitCost: '',
        minStock: '',
        location: '',
        supplier: '',
        lastPurchaseDate: '',
        status: 'disponible',
        assignedTo: '',
        assignmentDate: '',
        assignmentNotes: ''
      })
      setShowItemForm(false)
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }
  
  const handleCreateCategory = (e) => {
    e.preventDefault()
    
    if (editingCategory) {
      const result = updateCategory(editingCategory.id, categoryForm)
      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Categoría actualizada',
          text: 'La categoría se actualizó correctamente',
          timer: 1500,
          showConfirmButton: false
        })
      }
    } else {
      const result = createCategory(categoryForm)
      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Categoría creada',
          text: 'La categoría se agregó correctamente',
          timer: 1500,
          showConfirmButton: false
        })
      }
    }
    
    setCategoryForm({
      name: '',
      description: '',
      icon: '📦',
      color: '#6B7280'
    })
    setShowCategoryForm(false)
    setEditingCategory(null)
  }
  
  const handleDeleteCategory = (category) => {
    MySwal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de eliminar la categoría "${category.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteResult = deleteCategory(category.id)
        if (deleteResult.success) {
          MySwal.fire({
            icon: 'success',
            title: 'Categoría eliminada',
            text: 'La categoría se eliminó correctamente',
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
    })
  }
  
  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color
    })
    setEditingCategory(category)
    setShowCategoryForm(true)
  }
  
  const handleCreateMovement = async (e) => {
    e.preventDefault()
    
    if (movementForm.type === 'status_change') {
      // Handle status change and quantity allocation with multiple assignments
      const totalAssignedQty = movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)
      const maintenanceQty = parseInt(movementForm.maintenanceQuantity) || 0
      const availableQty = selectedItem.quantity - totalAssignedQty - maintenanceQty

      if (totalAssignedQty + maintenanceQty > selectedItem.quantity) {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'La suma de cantidades asignadas excede el stock disponible'
        })
        return
      }

      // Determine new status based on quantities
      let newStatus = 'disponible'
      let assignmentNotes = ''

      if (totalAssignedQty > 0 && maintenanceQty === 0) {
        newStatus = 'asignado'
        // Create notes with all assignments
        const assignmentsList = movementForm.multipleAssignments.map(a => {
          const lot = getAllLots().find(l => l.id === a.lotId)
          return `${lot ? lot.sectorName + ' - ' + lot.origin : a.lotId}: ${a.quantity} ${selectedItem.unit}`
        }).join('; ')
        assignmentNotes = assignmentsList
      } else if (totalAssignedQty === 0 && maintenanceQty > 0) {
        newStatus = 'mantenimiento'
        assignmentNotes = movementForm.maintenanceNotes
      } else if (totalAssignedQty > 0 && maintenanceQty > 0) {
        // Mixed status - we'll track this in metadata
        newStatus = 'mixed'
        const assignmentsList = movementForm.multipleAssignments.map(a => {
          const lot = getAllLots().find(l => l.id === a.lotId)
          return `${lot ? lot.sectorName : a.lotId}: ${a.quantity}`
        }).join(', ')
        assignmentNotes = `En uso: ${assignmentsList} | Mantenimiento: ${maintenanceQty} | ${movementForm.maintenanceNotes || ''}`.trim()
      }

      const updateData = {
        ...selectedItem,
        status: newStatus,
        assignmentNotes,
        quantityBreakdown: {
          available: availableQty,
          assigned: totalAssignedQty,
          maintenance: maintenanceQty
        },
        multipleAssignments: movementForm.multipleAssignments
      }
      
      const result = await updateInventoryItem(selectedItem.id, updateData)
      
      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: 'El estado del item se actualizó exitosamente',
          timer: 1500,
          showConfirmButton: false
        })
        
        setMovementForm({
          type: 'status_change',
          newStatus: 'disponible',
          quantity: '',
          assignedQuantity: '',
          maintenanceQuantity: '',
          assignedToLot: '',
          assignmentDate: new Date().toISOString().split('T')[0],
          assignmentNotes: '',
          maintenanceNotes: '',
          reason: '',
          multipleAssignments: []
        })
        setShowMovementForm(false)
        setSelectedItem(null)
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error
        })
      }
    } else {
      // Handle traditional movement (in/out/adjustment)
      const movementQuantity = parseInt(movementForm.quantity) || 0
      const previousQuantity = selectedItem.quantity || 0
      
      // Calculate new quantity based on movement type
      let newQuantity = previousQuantity
      if (movementForm.type === 'in') {
        newQuantity = previousQuantity + movementQuantity
      } else if (movementForm.type === 'out') {
        newQuantity = previousQuantity - movementQuantity
      } else if (movementForm.type === 'adjustment') {
        newQuantity = movementQuantity // For adjustment, the quantity becomes the new total
      }
      
      const result = await createMovement({
        inventoryId: selectedItem.id,
        type: movementForm.type,
        quantity: movementQuantity,
        previousQuantity: previousQuantity,
        newQuantity: newQuantity,
        reason: movementForm.reason || 'Movimiento de inventario',
        date: new Date().toISOString(),
        createdBy: user.id || 'system'
      })
      
      if (result.success) {
        MySwal.fire({
          icon: 'success',
          title: 'Movimiento registrado',
          text: 'El movimiento se registró exitosamente',
          timer: 1500,
          showConfirmButton: false
        })
        
        setMovementForm({
          type: 'status_change',
          newStatus: 'disponible',
          quantity: '',
          assignedQuantity: '',
          maintenanceQuantity: '',
          assignedToLot: '',
          assignmentDate: new Date().toISOString().split('T')[0],
          assignmentNotes: '',
          maintenanceNotes: '',
          reason: '',
          multipleAssignments: []
        })
        setShowMovementForm(false)
        setSelectedItem(null)
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: result.error
        })
      }
    }
  }

  // Get all lots for assignment
  const getAllLots = () => {
    return sectors.flatMap(sector => 
      (sector.lots || []).map(lot => ({
        ...lot,
        sectorName: sector.name
      }))
    )
  }

  // Get status color and label
  const getStatusInfo = (status) => {
    const statusMap = {
      'disponible': { 
        color: 'bg-green-100 text-green-800', 
        label: 'Disponible',
        icon: '✅'
      },
      'asignado': { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Asignado',
        icon: '📌'
      },
      'mantenimiento': { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'En mantenimiento',
        icon: '🔧'
      },
      'mixed': { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Estado mixto',
        icon: '🔄'
      }
    }
    return statusMap[status] || statusMap['disponible']
  }

  // Handle status change
  const handleChangeStatus = async (item, newStatus) => {
    const updateData = { 
      ...item, 
      status: newStatus,
      // Clear assignment if changing to maintenance or available
      ...(newStatus !== 'asignado' && {
        assignedTo: '',
        assignmentDate: '',
        assignmentNotes: ''
      })
    }

    const result = await updateInventoryItem(item.id, updateData)
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Estado actualizado',
        text: `El ítem ahora está ${getStatusInfo(newStatus).label.toLowerCase()}`,
        timer: 1500,
        showConfirmButton: false
      })
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }

  // Handle item assignment to siembra
  const handleAssignToSiembra = async (assignmentData) => {
    const updateData = {
      ...selectedItem,
      status: 'asignado',
      assignedTo: assignmentData.lotId,
      assignmentDate: assignmentData.date,
      assignmentNotes: assignmentData.notes
    }

    const result = await updateInventoryItem(selectedItem.id, updateData)
    
    if (result.success) {
      MySwal.fire({
        icon: 'success',
        title: 'Ítem asignado',
        text: 'El ítem se asignó exitosamente a la siembra',
        timer: 1500,
        showConfirmButton: false
      })
      setShowAssignmentModal(false)
      setSelectedItem(null)
    } else {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error
      })
    }
  }

  // Get lot info for assigned item
  const getLotInfo = (lotId) => {
    const allLots = getAllLots()
    const lot = allLots.find(l => l.id === lotId)
    if (!lot) return 'Siembra no encontrada'
    
    return {
      display: `${lot.sectorName} - ${lot.origin}`,
      sector: lot.sectorName,
      origin: lot.origin,
      entryDate: lot.entryDate,
      currentQuantity: lot.currentQuantity,
      status: lot.status
    }
  }
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount)
  }
  
  const getCategoryById = (categoryId) => {
    return categories.find(c => c.id === categoryId) || { name: categoryId, icon: '📦', color: '#6B7280' }
  }
  
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      damaged: 'bg-red-100 text-red-800',
      depleted: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors.available
  }
  
  const getStatusText = (status) => {
    const texts = {
      available: 'Disponible',
      in_use: 'En uso',
      maintenance: 'Mantenimiento',
      damaged: 'Dañado',
      depleted: 'Agotado'
    }
    return texts[status] || status
  }
  
  const totalValue = getTotalValue()
  const lowStockItems = getLowStockItems()
  
  // Calculate inventory statistics by status
  const getInventoryStats = () => {
    const available = inventory.filter(item => item.status === 'disponible')
    const assigned = inventory.filter(item => item.status === 'asignado' || item.status === 'mixed')
    const maintenance = inventory.filter(item => item.status === 'mantenimiento')
    const mixed = inventory.filter(item => item.status === 'mixed')
    
    // For mixed items, calculate proportional values
    let assignedValue = 0
    let maintenanceValue = 0
    let availableValue = 0
    
    inventory.forEach(item => {
      const itemValue = item.totalValue || 0
      
      if (item.status === 'disponible') {
        availableValue += itemValue
      } else if (item.status === 'asignado') {
        assignedValue += itemValue
      } else if (item.status === 'mantenimiento') {
        maintenanceValue += itemValue
      } else if (item.status === 'mixed' && item.quantityBreakdown) {
        const total = item.quantity
        const unitValue = itemValue / total
        
        availableValue += (item.quantityBreakdown.available || 0) * unitValue
        assignedValue += (item.quantityBreakdown.assigned || 0) * unitValue
        maintenanceValue += (item.quantityBreakdown.maintenance || 0) * unitValue
      }
    })
    
    return {
      available: {
        count: available.length + mixed.length,
        value: availableValue
      },
      assigned: {
        count: assigned.length,
        value: assignedValue
      },
      maintenance: {
        count: maintenance.length + mixed.length,
        value: maintenanceValue
      }
    }
  }
  
  const inventoryStats = getInventoryStats()
  
  const availableIcons = ['📦', '🔧', '🌊', '⚓', '🔵', '🎣', '🦺', '🔬', '📋', '⚙️', '🪢', '🏷️']
  const availableColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
    '#0EA5E9', '#14B8A6', '#84CC16', '#F97316'
  ]
  
  if (loading && inventory.length === 0) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" message="Cargando inventario..." />
      </div>
    )
  }
  
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventario de Materiales</h1>
          <p className="text-gray-600 mt-1">
            Control de materiales y equipos para cultivo
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          {activeTab === 'items' && (
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'list' : 'cards')}
              className="btn-secondary w-full sm:w-auto"
              title={viewMode === 'cards' ? 'Ver en lista' : 'Ver en tarjetas'}
            >
              {viewMode === 'cards' ? '📋 Vista Lista' : '🎴 Vista Tarjetas'}
            </button>
          )}
          <button
            onClick={() => setActiveTab(activeTab === 'items' ? 'categories' : 'items')}
            className="btn-secondary w-full sm:w-auto"
          >
            {activeTab === 'items' ? 'Ver Categorías' : 'Ver Items'}
          </button>
          <button
            onClick={() => activeTab === 'items' ? setShowItemForm(true) : setShowCategoryForm(true)}
            className="btn-primary w-full sm:w-auto"
            disabled={loading}
          >
            {activeTab === 'items' ? 'Agregar Item' : 'Nueva Categoría'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 lg:gap-6">
        <StatCard
          title="Disponibles"
          value={inventoryStats.available.count}
          subtitle={`${formatCurrency(inventoryStats.available.value)}`}
          icon="✅"
          color="green"
        />
        
        <StatCard
          title="En Uso"
          value={inventoryStats.assigned.count}
          subtitle={`${formatCurrency(inventoryStats.assigned.value)}`}
          icon="📌"
          color="blue"
        />
        
        <StatCard
          title="Mantenimiento"
          value={inventoryStats.maintenance.count}
          subtitle={`${formatCurrency(inventoryStats.maintenance.value)}`}
          icon="🔧"
          color="yellow"
        />
        
        <StatCard
          title="Stock Bajo"
          value={lowStockItems.length}
          subtitle="Items por reabastecer"
          icon="⚠️"
          color={lowStockItems.length > 0 ? 'red' : 'green'}
        />
        
        <StatCard
          title="Valor Total"
          value={formatCurrency(totalValue)}
          subtitle={`${inventory.length} items`}
          icon="💰"
          color="primary"
        />
      </div>
      
      {lowStockItems.length > 0 && activeTab === 'items' && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Items con Stock Bajo</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {lowStockItems.map(item => {
              const category = getCategoryById(item.category)
              return (
                <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm font-medium flex items-center space-x-1">
                    <span>{category.icon}</span>
                    <span>{item.name}</span>
                  </span>
                  <span className="text-sm text-red-600">
                    {item.quantity} / {item.minStock} {item.unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {activeTab === 'items' ? (
        inventory.length === 0 ? (
          <EmptyState
            title="No hay items en el inventario"
            message="Agrega tu primer item para comenzar a gestionar el inventario."
            icon="📦"
            action={
              <button
                onClick={() => setShowItemForm(true)}
                className="btn-primary"
              >
                Agregar primer item
              </button>
            }
          />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-6">
            {inventory.map((item) => {
              const category = getCategoryById(item.category)
              return (
                <div key={item.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-xs text-gray-500">{category.name}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusInfo(item.status).color}`}>
                      {getStatusInfo(item.status).icon} {getStatusInfo(item.status).label}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cantidad total:</span>
                      <span className={`font-medium ${item.quantity <= (item.minStock || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    
                    {/* Show quantity breakdown if available */}
                    {item.quantityBreakdown && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium text-gray-700 mb-1">Distribución:</div>
                        <div className="space-y-1">
                          {item.quantityBreakdown.available > 0 && (
                            <div className="flex justify-between">
                              <span className="text-green-600">✅ Disponible:</span>
                              <span className="font-medium">{item.quantityBreakdown.available} {item.unit}</span>
                            </div>
                          )}
                          {item.quantityBreakdown.assigned > 0 && (
                            <div className="flex justify-between">
                              <span className="text-blue-600">📌 En uso:</span>
                              <span className="font-medium">{item.quantityBreakdown.assigned} {item.unit}</span>
                            </div>
                          )}
                          {item.quantityBreakdown.maintenance > 0 && (
                            <div className="flex justify-between">
                              <span className="text-yellow-600">🔧 Mantenimiento:</span>
                              <span className="font-medium">{item.quantityBreakdown.maintenance} {item.unit}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Costo unitario:</span>
                      <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium">{formatCurrency(item.totalValue)}</span>
                    </div>
                    
                    {item.origin && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Origen:</span>
                        <span className="font-medium">
                          {item.origin === 'national' ? '🇵🇪 Nacional' : '🌍 Importado'}
                        </span>
                      </div>
                    )}
                    
                    {item.minStock && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock mínimo:</span>
                        <span className="font-medium">{item.minStock} {item.unit}</span>
                      </div>
                    )}

                    {item.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ubicación:</span>
                        <span className="font-medium">{item.location}</span>
                      </div>
                    )}

                    {item.supplier && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proveedor:</span>
                        <span className="font-medium">{item.supplier}</span>
                      </div>
                    )}

                    {item.lastPurchaseDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última compra:</span>
                        <span className="font-medium">
                          {new Date(item.lastPurchaseDate).toLocaleDateString('es-PE')}
                        </span>
                      </div>
                    )}

                    {item.status === 'asignado' && item.assignedTo && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-blue-800">🎣 Asignado a Siembra</div>
                          <div className="text-xs text-blue-600">
                            {new Date(item.assignmentDate).toLocaleDateString('es-PE')}
                          </div>
                        </div>
                        
                        {(() => {
                          const lotInfo = getLotInfo(item.assignedTo)
                          if (typeof lotInfo === 'string') {
                            return <div className="text-sm text-blue-900">{lotInfo}</div>
                          }
                          
                          return (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-blue-900">
                                🏭 {lotInfo.sector} • {lotInfo.origin}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                                <div>
                                  📅 Sembrado: {new Date(lotInfo.entryDate).toLocaleDateString('es-PE')}
                                </div>
                                <div>
                                  📊 Cantidad: {lotInfo.currentQuantity?.toLocaleString() || 'N/A'}
                                </div>
                              </div>
                              {lotInfo.status && (
                                <div className="text-xs text-blue-600">
                                  Estado: {
                                    lotInfo.status === 'seeded' ? '🌱 Sembrado' :
                                    lotInfo.status === 'growing' ? '📈 Creciendo' :
                                    lotInfo.status === 'ready' ? '✅ Listo para cosecha' :
                                    lotInfo.status === 'harvested' ? '🎣 Cosechado' :
                                    lotInfo.status
                                  }
                                </div>
                              )}
                              {item.assignmentNotes && (
                                <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                                  💬 {item.assignmentNotes}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item)
                          // Initialize form with current quantity breakdown if exists
                          const totalAssigned = item.quantityBreakdown?.assigned || 0
                          setMovementForm({
                            type: 'status_change',
                            newStatus: item.status || 'disponible',
                            quantity: '',
                            assignedQuantity: totalAssigned.toString(),
                            maintenanceQuantity: item.quantityBreakdown?.maintenance?.toString() || '',
                            assignedToLot: '',
                            assignmentDate: new Date().toISOString().split('T')[0],
                            assignmentNotes: '',
                            maintenanceNotes: '',
                            reason: '',
                            multipleAssignments: item.multipleAssignments || []
                          })
                          setShowMovementForm(true)
                        }}
                        className="btn-secondary text-sm w-full sm:flex-1"
                      >
                        📋 Movimiento
                      </button>
                      
                      {item.status === 'disponible' && (
                        <button
                          onClick={() => {
                            setSelectedItem(item)
                            setShowAssignmentModal(true)
                          }}
                          className="btn-primary text-sm w-full sm:flex-1"
                        >
                          📌 Asignar
                        </button>
                      )}
                      
                      {item.status === 'asignado' && (
                        <button
                          onClick={() => handleChangeStatus(item, 'disponible')}
                          className="btn-secondary text-sm w-full sm:flex-1"
                        >
                          🔓 Liberar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // List view
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => {
                    const category = getCategoryById(item.category)
                    const statusInfo = getStatusInfo(item.status)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{category.icon}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500">{item.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {item.status === 'asignado' && item.assignedTo && (
                            <div className="text-xs text-gray-500 mt-1">
                              📌 {(() => {
                                const lotInfo = getLotInfo(item.assignedTo)
                                return typeof lotInfo === 'string' ? lotInfo : lotInfo.display
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${item.quantity <= (item.minStock || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity} {item.unit}
                          </div>
                          {item.quantityBreakdown && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.quantityBreakdown.available > 0 && (
                                <span className="mr-2">✅ {item.quantityBreakdown.available}</span>
                              )}
                              {item.quantityBreakdown.assigned > 0 && (
                                <span className="mr-2">📌 {item.quantityBreakdown.assigned}</span>
                              )}
                              {item.quantityBreakdown.maintenance > 0 && (
                                <span>🔧 {item.quantityBreakdown.maintenance}</span>
                              )}
                            </div>
                          )}
                          {item.minStock && (
                            <div className="text-xs text-gray-500">
                              Min: {item.minStock}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.totalValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.location || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {item.supplier || '-'}
                          </div>
                          {item.lastPurchaseDate && (
                            <div className="text-xs text-gray-400">
                              {new Date(item.lastPurchaseDate).toLocaleDateString('es-PE')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setSelectedItem(item)
                                // Initialize form with current quantity breakdown if exists
                                const totalAssigned = item.quantityBreakdown?.assigned || 0
                                setMovementForm({
                                  type: 'status_change',
                                  newStatus: item.status || 'disponible',
                                  quantity: '',
                                  assignedQuantity: totalAssigned.toString(),
                                  maintenanceQuantity: item.quantityBreakdown?.maintenance?.toString() || '',
                                  assignedToLot: '',
                                  assignmentDate: new Date().toISOString().split('T')[0],
                                  assignmentNotes: '',
                                  maintenanceNotes: '',
                                  reason: '',
                                  multipleAssignments: item.multipleAssignments || []
                                })
                                setShowMovementForm(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50"
                              title="Movimiento"
                            >
                              📋
                            </button>
                            {item.status === 'disponible' && (
                              <button
                                onClick={() => {
                                  setSelectedItem(item)
                                  setShowAssignmentModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                                title="Asignar"
                              >
                                📌
                              </button>
                            )}
                            {item.status === 'asignado' && (
                              <button
                                onClick={() => handleChangeStatus(item, 'disponible')}
                                className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                                title="Liberar"
                              >
                                🔓
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // Tab de Categorías
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 lg:gap-6">
            {categories.map((category) => {
              const itemsInCategory = inventory.filter(item => item.category === category.id)
              const categoryValue = itemsInCategory.reduce((sum, item) => sum + item.totalValue, 0)
              
              return (
                <div 
                  key={category.id} 
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderColor: category.color }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span 
                        className="text-3xl p-2 rounded-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-xs text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{itemsInCategory.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor total:</span>
                      <span className="font-medium">{formatCurrency(categoryValue)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="btn-secondary text-sm w-full sm:flex-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm w-full sm:w-auto"
                      disabled={itemsInCategory.length > 0}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Agregar Item al Inventario</h2>
            <form onSubmit={handleCreateItem} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  className="input-field"
                  value={itemForm.category}
                  onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  placeholder="Ej: Boyas nacionales de 20cm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="Descripción del item"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <select
                  className="input-field"
                  value={itemForm.origin}
                  onChange={(e) => setItemForm({...itemForm, origin: e.target.value})}
                >
                  <option value="national">Nacional</option>
                  <option value="imported">Importado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input-field"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({...itemForm, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad *
                </label>
                <select
                  required
                  className="input-field"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
                >
                  <option value="units">Unidades</option>
                  <option value="meters">Metros</option>
                  <option value="kg">Kilogramos</option>
                  <option value="sets">Sets</option>
                  <option value="pieces">Piezas</option>
                  <option value="boxes">Cajas</option>
                  <option value="rolls">Rollos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario (PEN) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={itemForm.unitCost}
                  onChange={(e) => setItemForm({...itemForm, unitCost: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={itemForm.minStock}
                  onChange={(e) => setItemForm({...itemForm, minStock: e.target.value})}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={itemForm.location}
                  onChange={(e) => setItemForm({...itemForm, location: e.target.value})}
                  placeholder="Ej: Almacén A, Sector 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={itemForm.supplier}
                  onChange={(e) => setItemForm({...itemForm, supplier: e.target.value})}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Última Compra
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={itemForm.lastPurchaseDate}
                  onChange={(e) => setItemForm({...itemForm, lastPurchaseDate: e.target.value})}
                />
              </div>


              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
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
      
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="Ej: Sistemas de Cultivo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="Descripción de la categoría"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icono
                </label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {availableIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryForm({...categoryForm, icon})}
                      className={`p-2 text-2xl rounded border-2 ${
                        categoryForm.icon === icon 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {availableColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({...categoryForm, color})}
                      className={`h-8 rounded border-2 ${
                        categoryForm.color === color 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false)
                    setEditingCategory(null)
                    setCategoryForm({
                      name: '',
                      description: '',
                      icon: '📦',
                      color: '#6B7280'
                    })
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showMovementForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              Gestionar Estado - {selectedItem.name}
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                Stock total: <span className="font-medium">{selectedItem.quantity} {selectedItem.unit}</span>
              </p>
            </div>
            <form onSubmit={handleCreateMovement} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Operación *
                </label>
                <select
                  required
                  className="input-field"
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({...movementForm, type: e.target.value})}
                >
                  <option value="status_change">Cambiar Estado y Asignación</option>
                  <option value="in">Entrada de Stock</option>
                  <option value="out">Salida de Stock</option>
                  <option value="adjustment">Ajuste de Inventario</option>
                </select>
              </div>

              {movementForm.type === 'status_change' ? (
                <>
                  {/* Status Change Form */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-3">Distribución de Cantidades</h3>
                    
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {/* Available Quantity - Calculated */}
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          ✅ Cantidad Disponible
                        </label>
                        <div className="text-lg font-semibold text-green-900">
                          {(() => {
                            // Calculate based on total quantity minus ALL assigned and maintenance quantities
                            const totalQty = selectedItem.quantity || 0
                            const totalAssigned = movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)
                            const currentMaintenance = parseInt(movementForm.maintenanceQuantity) || 0
                            const availableQty = totalQty - totalAssigned - currentMaintenance
                            return `${availableQty} ${selectedItem.unit}`
                          })()}
                        </div>
                        <p className="text-xs text-green-600">Total: {selectedItem.quantity} {selectedItem.unit}</p>
                      </div>

                      {/* Assigned Quantity with Multiple Lots */}
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <label className="block text-sm font-medium text-blue-800 mb-2">
                          📌 Cantidad En Uso
                        </label>

                        {/* Total assigned display */}
                        <div className="text-lg font-semibold text-blue-900 mb-3">
                          Total asignado: {movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)} {selectedItem.unit}
                        </div>

                        {/* Existing assignments */}
                        {movementForm.multipleAssignments.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <div className="text-xs font-medium text-blue-700">Asignaciones actuales:</div>
                            {movementForm.multipleAssignments.map((assignment, index) => {
                              const lot = getAllLots().find(l => l.id === assignment.lotId)
                              return (
                                <div key={index} className="bg-white p-2 rounded border border-blue-200 text-sm">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="font-medium text-blue-900">
                                        {lot ? `${lot.sectorName} - ${lot.origin}` : 'Siembra no encontrada'}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {assignment.quantity} {selectedItem.unit} - {new Date(assignment.date).toLocaleDateString('es-PE')}
                                      </div>
                                      {assignment.notes && (
                                        <div className="text-xs text-gray-500 mt-1">{assignment.notes}</div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newAssignments = movementForm.multipleAssignments.filter((_, i) => i !== index)
                                        setMovementForm({...movementForm, multipleAssignments: newAssignments})
                                      }}
                                      className="text-red-500 hover:text-red-700 ml-2"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Add new assignment form */}
                        <div className="border-t pt-2">
                          <div className="text-xs font-medium text-blue-700 mb-2">Agregar nueva asignación:</div>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min="0"
                                max={selectedItem.quantity - movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0) - (parseInt(movementForm.maintenanceQuantity) || 0)}
                                className="input-field text-sm"
                                value={movementForm.assignedQuantity}
                                onChange={(e) => {
                                  const inputValue = e.target.value
                                  const value = parseInt(inputValue) || 0

                                  // Don't allow negative values
                                  if (value < 0) {
                                    return
                                  }

                                  const totalAssigned = movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)
                                  const maintenanceQty = parseInt(movementForm.maintenanceQuantity) || 0
                                  const maxAllowed = selectedItem.quantity - totalAssigned - maintenanceQty

                                  if (value <= maxAllowed) {
                                    setMovementForm({...movementForm, assignedQuantity: inputValue})
                                  } else {
                                    setMovementForm({...movementForm, assignedQuantity: maxAllowed.toString()})
                                  }
                                }}
                                placeholder="Cantidad"
                              />
                              <input
                                type="date"
                                className="input-field text-sm"
                                value={movementForm.assignmentDate}
                                onChange={(e) => setMovementForm({...movementForm, assignmentDate: e.target.value})}
                              />
                            </div>

                            <select
                              className="input-field text-sm"
                              value={movementForm.assignedToLot}
                              onChange={(e) => setMovementForm({...movementForm, assignedToLot: e.target.value})}
                            >
                              <option value="">Seleccionar siembra</option>
                              {getAllLots().map(lot => (
                                <option key={lot.id} value={lot.id}>
                                  {lot.sectorName} - {lot.origin} ({new Date(lot.entryDate).toLocaleDateString('es-PE')})
                                </option>
                              ))}
                            </select>

                            <textarea
                              rows="2"
                              className="input-field text-sm"
                              value={movementForm.assignmentNotes}
                              onChange={(e) => setMovementForm({...movementForm, assignmentNotes: e.target.value})}
                              placeholder="Notas (opcional)..."
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (movementForm.assignedQuantity && movementForm.assignedToLot) {
                                  const qtyToAdd = parseInt(movementForm.assignedQuantity)

                                  // Don't allow negative or zero values
                                  if (qtyToAdd <= 0) {
                                    MySwal.fire({
                                      icon: 'error',
                                      title: 'Cantidad inválida',
                                      text: 'La cantidad debe ser mayor a 0',
                                      confirmButtonColor: '#3B82F6'
                                    })
                                    return
                                  }

                                  const totalAssigned = movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)
                                  const maintenanceQty = parseInt(movementForm.maintenanceQuantity) || 0
                                  const availableAfterAdd = selectedItem.quantity - totalAssigned - qtyToAdd - maintenanceQty

                                  // Validate that adding this quantity won't make available quantity negative
                                  if (availableAfterAdd < 0) {
                                    MySwal.fire({
                                      icon: 'error',
                                      title: 'Cantidad excedida',
                                      text: `No puede asignar ${qtyToAdd} ${selectedItem.unit}. Cantidad máxima disponible: ${selectedItem.quantity - totalAssigned - maintenanceQty} ${selectedItem.unit}`,
                                      confirmButtonColor: '#3B82F6'
                                    })
                                    return
                                  }

                                  const newAssignment = {
                                    lotId: movementForm.assignedToLot,
                                    quantity: qtyToAdd,
                                    date: movementForm.assignmentDate,
                                    notes: movementForm.assignmentNotes
                                  }
                                  setMovementForm({
                                    ...movementForm,
                                    multipleAssignments: [...movementForm.multipleAssignments, newAssignment],
                                    assignedQuantity: '',
                                    assignedToLot: '',
                                    assignmentNotes: ''
                                  })
                                }
                              }}
                              className="btn-primary text-sm w-full"
                              disabled={!movementForm.assignedQuantity || !movementForm.assignedToLot}
                            >
                              ➕ Agregar Asignación
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Maintenance Quantity */}
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                        <label className="block text-sm font-medium text-yellow-800 mb-1">
                          🔧 Cantidad en Mantenimiento
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedItem.quantity - movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)}
                          className="input-field"
                          value={movementForm.maintenanceQuantity}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            const value = parseInt(inputValue) || 0

                            // Don't allow negative values
                            if (value < 0) {
                              return
                            }

                            const totalAssigned = movementForm.multipleAssignments.reduce((sum, a) => sum + (parseInt(a.quantity) || 0), 0)
                            if (value + totalAssigned <= selectedItem.quantity) {
                              setMovementForm({...movementForm, maintenanceQuantity: inputValue})
                            }
                          }}
                          placeholder="0"
                        />
                        
                        {parseInt(movementForm.maintenanceQuantity) > 0 && (
                          <div className="mt-2">
                            <label className="block text-xs font-medium text-yellow-700 mb-1">
                              Notas de mantenimiento
                            </label>
                            <textarea
                              rows="2"
                              className="input-field text-sm"
                              value={movementForm.maintenanceNotes}
                              onChange={(e) => setMovementForm({...movementForm, maintenanceNotes: e.target.value})}
                              placeholder="Tipo de mantenimiento requerido..."
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Validation Warning */}
                    {(parseInt(movementForm.assignedQuantity) || 0) + (parseInt(movementForm.maintenanceQuantity) || 0) > selectedItem.quantity && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          ⚠️ La suma de cantidades excede el stock disponible
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Traditional Movement Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={movementForm.type === 'out' ? selectedItem.quantity : undefined}
                      className="input-field"
                      value={movementForm.quantity}
                      onChange={(e) => setMovementForm({...movementForm, quantity: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón *
                    </label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={movementForm.reason}
                      onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})}
                      placeholder="Motivo del movimiento"
                    />
                  </div>
                </>
              )}
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementForm(false)
                    setSelectedItem(null)
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : movementForm.type === 'status_change' ? 'Actualizar Estado' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              Asignar ítem a siembra
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Ítem seleccionado:</div>
              <div className="font-medium text-gray-900">{selectedItem.name}</div>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleAssignToSiembra({
                  lotId: formData.get('lotId'),
                  date: formData.get('date') || new Date().toISOString().split('T')[0],
                  notes: formData.get('notes') || ''
                })
              }}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Siembra *
                </label>
                <select
                  name="lotId"
                  required
                  className="input-field"
                >
                  <option value="">Seleccionar siembra</option>
                  {getAllLots().map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.sectorName} - {lot.origin} ({new Date(lot.entryDate).toLocaleDateString('es-PE')})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de asignación *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  className="input-field"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  className="input-field"
                  placeholder="Notas sobre la asignación..."
                />
              </div>
              
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentModal(false)
                    setSelectedItem(null)
                  }}
                  className="btn-secondary w-full sm:flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary w-full sm:flex-1"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" message="" /> : 'Asignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryPage