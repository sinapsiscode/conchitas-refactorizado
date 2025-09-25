export const UI_TEXTS = {
  app: {
    title: 'Sistema de Cultivo de Conchas de Abanico',
    subtitle: 'Gestión integral para acuicultura marina en Piura-Sechura'
  },
  nav: {
    home: 'Inicio',
    dashboard: 'Panel',
    sectors: 'Sectores',
    monitoring: 'Monitoreo',
    harvest: 'Cosecha',
    inventory: 'Inventario',
    reports: 'Reportes',
    logout: 'Cerrar Sesión'
  },
  auth: {
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    forgotPassword: 'Olvidé mi contraseña',
    backToLogin: 'Volver al login'
  },
  dashboard: {
    welcome: 'Bienvenido',
    totalSectors: 'Total de Sectores',
    activeLots: 'Lotes Activos',
    pendingHarvest: 'Cosechas Pendientes',
    mortalityRate: 'Tasa de Mortalidad'
  },
  sectors: {
    title: 'Gestión de Sectores',
    addSector: 'Agregar Sector',
    sectorName: 'Nombre del Sector',
    entryDate: 'Fecha de Ingreso',
    origin: 'Origen',
    quantity: 'Cantidad',
    expectedMortality: 'Mortalidad Esperada',
    cost: 'Costo',
    averageSize: 'Talla Promedio',
    maxSize: 'Talla Mayor',
    minSize: 'Talla Menor'
  },
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    loading: 'Cargando...',
    noData: 'No hay datos disponibles',
    error: 'Ha ocurrido un error',
    success: 'Operación exitosa'
  },
  investor: {
    title: 'Panel del Inversor',
    welcome: 'Bienvenido',
    dashboardSection: 'Dashboard',
    investmentsSection: 'Mis Inversiones',
    invitationsSection: 'Invitaciones',
    projectionsSection: 'Proyecciones',
    myInvestments: 'Mis Inversiones',
    totalInvested: 'Total Invertido',
    totalReturns: 'Retornos Totales',
    overallROI: 'ROI Global',
    activeInvestments: 'Inversiones Activas',
    completedInvestments: 'Inversiones Completadas',
    recentReturns: 'Retornos Recientes',
    investmentDetails: 'Detalles de Inversión',
    investmentDate: 'Fecha de Inversión',
    investedAmount: 'Monto Invertido',
    participation: 'Participación',
    returns: 'Retornos',
    status: {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    },
    actions: {
      viewDetails: 'Ver Detalles',
      downloadReport: 'Descargar Reporte'
    },
    filters: {
      all: 'Todas',
      active: 'Activas',
      completed: 'Completadas'
    },
    noInvestments: 'No tienes inversiones registradas',
    contactMaricultor: 'Contacta con un maricultor para participar en sus siembras'
  },
  investments: {
    title: 'Gestión de Inversores',
    addInvestor: 'Agregar Inversor',
    investorName: 'Nombre del Inversor',
    investmentAmount: 'Monto de Inversión',
    percentage: 'Porcentaje de Participación',
    expectedReturn: 'Retorno Esperado',
    distributeReturns: 'Distribuir Retornos',
    distributionHistory: 'Historial de Distribuciones',
    totalDistributed: 'Total Distribuido',
    pendingDistribution: 'Pendiente de Distribución',
    noInvestors: 'No hay inversores en esta siembra',
    addFirstInvestor: 'Agregar primer inversor'
  },
  notifications: {
    title: 'Notificaciones',
    unreadCount: 'sin leer',
    markAllAsRead: 'Marcar todas como leídas',
    markAsRead: 'Marcar como leída',
    delete: 'Eliminar',
    noNotifications: 'No hay notificaciones',
    filters: {
      all: 'Todas',
      unread: 'No leídas',
      read: 'Leídas',
      allPriorities: 'Todas las prioridades',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    },
    types: {
      distribution_received: 'Retorno Distribuido',
      harvest_completed: 'Cosecha Completada',
      harvest_upcoming: 'Cosecha Próxima',
      investment_accepted: 'Inversión Aceptada',
      mortality_alert: 'Alerta de Mortalidad',
      new_monitoring: 'Nuevo Monitoreo',
      lot_status_change: 'Cambio de Estado',
      payment_received: 'Pago Recibido',
      system: 'Sistema'
    },
    timeAgo: {
      justNow: 'Justo ahora',
      minutesAgo: 'Hace {count} minutos',
      hoursAgo: 'Hace {count} horas',
      daysAgo: 'Hace {count} días'
    },
    actions: {
      viewMore: 'Ver más',
      viewDetails: 'Ver detalles',
      goToInvestment: 'Ir a inversión',
      goToHarvest: 'Ir a cosecha',
      goToLot: 'Ir al lote'
    }
  },
  reports: {
    title: 'Generación de Reportes',
    subtitle: 'Descarga reportes detallados de tus inversiones y retornos',
    generateReport: 'Generar Reporte',
    reportType: 'Tipo de Reporte',
    period: 'Período',
    startDate: 'Fecha Inicio',
    endDate: 'Fecha Fin',
    preview: 'Vista Previa del Reporte',
    types: {
      complete: 'Reporte Completo',
      investments: 'Solo Inversiones',
      distributions: 'Solo Distribuciones',
      summary: 'Resumen Ejecutivo',
      financial: 'Análisis Financiero',
      monthly: 'Reporte Mensual',
      annual: 'Reporte Anual'
    },
    periods: {
      all: 'Todo el período',
      month: 'Último mes',
      quarter: 'Último trimestre',
      semester: 'Último semestre',
      year: 'Último año',
      custom: 'Personalizado'
    },
    export: {
      pdf: 'Descargar PDF',
      excel: 'Descargar Excel',
      generating: 'Generando...',
      success: 'Reporte generado exitosamente',
      error: 'Error al generar el reporte'
    },
    sections: {
      summary: 'Resumen General',
      investments: 'Detalle de Inversiones',
      distributions: 'Historial de Distribuciones',
      financial: 'Análisis Financiero',
      monthlyAnalysis: 'Análisis Mensual',
      charts: 'Gráficos y Estadísticas'
    },
    metrics: {
      totalInvested: 'Total Invertido',
      totalReturns: 'Retornos Totales',
      netProfit: 'Ganancia Neta',
      averageROI: 'ROI Promedio',
      activeInvestments: 'Inversiones Activas',
      completedInvestments: 'Inversiones Completadas',
      investmentsIncluded: 'Inversiones incluidas',
      distributionsIncluded: 'Distribuciones incluidas'
    },
    info: 'Los reportes incluyen toda la información financiera detallada de tus inversiones, distribuciones y análisis de rendimiento. Los archivos se descargan automáticamente en tu carpeta de descargas.'
  },
  projections: {
    title: 'Proyecciones de Inversión',
    subtitle: 'Analiza el retorno potencial de tus inversiones con diferentes escenarios',
    tabs: {
      new: 'Nueva Proyección',
      edit: 'Proyección Actual',
      scenarios: 'Escenarios',
      history: 'Historial'
    },
    form: {
      basicInfo: 'Información Básica',
      name: 'Nombre de la Proyección',
      description: 'Descripción',
      initialInvestment: 'Inversión Inicial',
      period: 'Período (meses)',
      marketVariables: 'Variables de Mercado',
      pricePerUnit: 'Precio por Unidad',
      mortalityRate: 'Tasa de Mortalidad',
      harvestCycles: 'Ciclos de Cosecha',
      monthsPerCycle: 'Meses por Ciclo',
      costStructure: 'Estructura de Costos',
      seedCost: 'Costo de Semilla',
      maintenanceCost: 'Mantenimiento Mensual',
      harvestCost: 'Costo de Cosecha',
      fixedCosts: 'Costos Fijos Mensuales',
      riskFactors: 'Factores de Riesgo',
      climaticRisk: 'Riesgo Climático',
      marketRisk: 'Riesgo de Mercado',
      operationalRisk: 'Riesgo Operacional',
      financialRisk: 'Riesgo Financiero',
      totalRisk: 'Riesgo Total'
    },
    scenarios: {
      title: 'Gestión de Escenarios',
      add: 'Agregar Escenario',
      restore: 'Restaurar Estándar',
      optimistic: 'Escenario Optimista',
      realistic: 'Escenario Realista',
      pessimistic: 'Escenario Pesimista',
      custom: 'Personalizado',
      priceAdjustment: 'Ajuste de Precio',
      mortalityAdjustment: 'Ajuste de Mortalidad',
      costAdjustment: 'Ajuste de Costos',
      volumeAdjustment: 'Ajuste de Volumen',
      probability: 'Probabilidad',
      monteCarlo: 'Simulación Monte Carlo',
      calculateWithScenarios: 'Calcular con Escenarios'
    },
    results: {
      executiveSummary: 'Resumen Ejecutivo',
      recommendation: 'Recomendación',
      riskLevel: 'Nivel de Riesgo',
      profitability: 'Rentabilidad',
      expectedROI: 'ROI Esperado',
      paybackPeriod: 'Período de Recuperación',
      netProfit: 'Ganancia Neta',
      confidence: 'Confianza',
      financialResults: 'Resultados Financieros',
      baseScenario: 'Escenario Base',
      riskAdjusted: 'Ajustado por Riesgo',
      totalRevenue: 'Ingresos Totales',
      totalCosts: 'Costos Totales',
      scenarioAnalysis: 'Análisis de Escenarios',
      weightedAverage: 'Promedio Ponderado',
      monteCarloAnalysis: 'Análisis Monte Carlo',
      averageROI: 'ROI Promedio',
      standardDeviation: 'Desviación Estándar',
      probabilityOfProfit: 'Probabilidad de Ganancia',
      confidenceInterval: 'Intervalo de Confianza'
    },
    recommendations: {
      highlyRecommended: 'Altamente Recomendado',
      recommended: 'Recomendado',
      acceptable: 'Aceptable',
      marginal: 'Marginal',
      notRecommended: 'No Recomendado'
    },
    risk: {
      low: 'Bajo',
      moderate: 'Moderado',
      high: 'Alto',
      veryHigh: 'Muy Alto'
    },
    profitabilityLevels: {
      excellent: 'Excelente',
      veryGood: 'Muy Buena',
      good: 'Buena',
      moderate: 'Moderada',
      low: 'Baja',
      negative: 'Negativa'
    },
    actions: {
      save: 'Guardar Proyección',
      update: 'Actualizar Proyección',
      calculate: 'Calcular Resultados',
      delete: 'Eliminar',
      createFirst: 'Crear primera proyección'
    },
    info: {
      basedOnHistorical: 'Las proyecciones se basan en datos históricos del mercado de conchas de abanico en Piura-Sechura',
      scenariosHelp: 'Los escenarios permiten evaluar diferentes condiciones de mercado y riesgo',
      monteCarloHelp: 'El análisis Monte Carlo simula miles de escenarios para mayor precisión',
      disclaimer: 'Los resultados son estimaciones y no garantizan retornos futuros'
    },
    messages: {
      projectionCreated: 'Proyección Creada',
      projectionCreatedText: 'La proyección se ha creado exitosamente',
      noProjection: 'Sin Proyección',
      noProjectionText: 'Por favor, crea o selecciona una proyección primero',
      calculationCompleted: 'Cálculo Completado',
      calculationCompletedText: 'La proyección se ha calculado exitosamente',
      calculationError: 'Error en Cálculo',
      calculationErrorText: 'No se pudo calcular la proyección',
      nameRequired: 'Nombre Requerido',
      nameRequiredText: 'Por favor ingresa un nombre para el escenario',
      scenarioAdded: 'Escenario Agregado',
      scenarioAddedText: 'El nuevo escenario se ha agregado exitosamente',
      deleteScenario: '¿Eliminar Escenario?',
      deleteScenarioText: 'Esta acción no se puede deshacer',
      confirmDelete: 'Sí, eliminar',
      cancel: 'Cancelar',
      deleted: 'Eliminado',
      deletedText: 'El escenario ha sido eliminado',
      simulationCompleted: 'Simulación Completada',
      simulationCompletedText: 'Se han simulado 1000 escenarios exitosamente',
      selectProjectionFirst: 'Por favor selecciona una proyección primero',
      calculating: 'Calculando...',
      calculateProjection: 'Calcular Proyección',
      updateProjection: 'Actualizar Proyección',
      saveProjection: 'Guardar Proyección'
    },
    placeholders: {
      projectionName: 'Ej: Inversión Lote Primavera 2024',
      projectionDescription: 'Describe el objetivo de esta proyección',
      scenarioName: 'Nombre del escenario'
    },
    status: {
      calculated: 'Calculado',
      draft: 'Borrador'
    },
    tabs: {
      newProjection: 'Nueva Proyección',
      currentProjection: 'Proyección Actual',
      scenarios: 'Escenarios',
      history: 'Historial'
    },
    icons: {
      add: '➕',
      edit: '✏️',
      target: '🎯',
      chart: '📊'
    }
  },
  distributions: {
    title: 'Distribución de Retornos',
    autoDistribution: 'Distribución Automática',
    manualDistribution: 'Distribución Manual',
    distributionDate: 'Fecha de Distribución',
    harvestRevenue: 'Ingresos de Cosecha',
    harvestExpenses: 'Gastos de Cosecha',
    netProfit: 'Ganancia Neta',
    distributedAmount: 'Monto Distribuido',
    originalInvestment: 'Inversión Original',
    returnOnInvestment: 'Retorno sobre Inversión',
    paymentStatus: 'Estado del Pago',
    paymentMethod: 'Método de Pago',
    paymentReference: 'Referencia de Pago',
    status: {
      pending: 'Pendiente',
      paid: 'Pagado',
      cancelled: 'Cancelado'
    },
    paymentMethods: {
      bank_transfer: 'Transferencia Bancaria',
      cash: 'Efectivo',
      check: 'Cheque',
      other: 'Otro'
    },
    noDistributions: 'No hay distribuciones registradas',
    distributionSuccess: 'Retornos distribuidos exitosamente',
    distributionError: 'Error al distribuir retornos',
    autoDistributionNote: 'Distribución automática de retornos - Cosecha'
  },
  investorInvitations: {
    title: 'Invitación de Inversores',
    searchInvestor: 'Buscar Inversor',
    investorEmail: 'Correo del Inversor',
    investorName: 'Nombre del Inversor',
    searchPlaceholder: 'Buscar por email o nombre...',
    inviteAmount: 'Monto Sugerido (opcional)',
    invitePercentage: 'Porcentaje Sugerido (opcional)',
    personalMessage: 'Mensaje Personal (opcional)',
    sendInvitation: 'Enviar Invitación',
    investorFound: 'Inversor encontrado',
    investorNotFound: 'Este inversor no existe',
    createAccount: 'El inversor deberá crear una cuenta primero',
    invitationSent: 'Invitación Enviada',
    invitationSentMessage: 'Se ha enviado la invitación al inversor exitosamente',
    invitationError: 'Error al enviar invitación',
    pendingInvitations: 'Invitaciones Pendientes',
    noInvitations: 'No hay invitaciones pendientes',
    acceptInvitation: 'Aceptar Invitación',
    rejectInvitation: 'Rechazar Invitación',
    invitationAccepted: 'Invitación Aceptada',
    invitationRejected: 'Invitación Rechazada',
    confirmAmount: 'Confirmar Monto de Inversión',
    confirmPercentage: 'Confirmar Porcentaje de Participación',
    responseMessage: 'Mensaje de Respuesta (opcional)',
    status: {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      expired: 'Expirada',
      cancelled: 'Cancelada'
    },
    expiresIn: 'Expira en',
    expiredOn: 'Expiró el',
    respondedOn: 'Respondió el',
    invitedOn: 'Invitado el',
    projectDetails: 'Detalles del Proyecto',
    sectorLocation: 'Sector y Ubicación',
    seedingDate: 'Fecha de Siembra',
    projectedHarvest: 'Cosecha Proyectada',
    totalInvestment: 'Inversión Total',
    availablePercentage: 'Porcentaje Disponible'
  },
  myInvestments: {
    title: 'Mis Inversiones',
    subtitle: 'Gestiona y monitorea todas tus inversiones en proyectos de maricultura',
    
    // Summary cards
    totalInvested: 'Total Invertido',
    totalReturns: 'Retornos Totales',
    netProfit: 'Ganancia Neta',
    avgROI: 'ROI Promedio',
    
    // Card subtitles
    totalInvestmentsSubtitle: 'En {count} inversiones',
    distributedReturnsSubtitle: 'Ganancias distribuidas',
    netProfitSubtitle: 'Retorno - Inversión',
    activeInvestmentsSubtitle: '{count} activas',
    
    // Filters section
    filtersTitle: 'Filtros',
    statusFilter: 'Estado de Inversión',
    sectorFilter: 'Sector',
    periodFilter: 'Período',
    
    // Filter options
    statusOptions: {
      all: 'Todas las inversiones',
      active: 'Inversiones Activas',
      completed: 'Inversiones Completadas',
      cancelled: 'Inversiones Canceladas'
    },
    sectorOptions: {
      all: 'Todos los sectores'
    },
    periodOptions: {
      all: 'Todo el tiempo',
      thirtyDays: 'Últimos 30 días',
      threeMonths: 'Últimos 3 meses',
      sixMonths: 'Últimos 6 meses',
      year: 'Último año'
    },
    
    // Table headers
    projectSector: 'Proyecto / Sector',
    investmentDate: 'Fecha Inversión',
    investedAmount: 'Monto Invertido',
    participation: 'Participación',
    returns: 'Retornos',
    roi: 'ROI',
    status: 'Estado',
    actions: 'Acciones',
    
    // Table content
    investmentsCount: 'Inversiones ({count})',
    investmentsDetails: 'Detalle de tus participaciones en siembras',
    sector: 'Sector:',
    maricultor: 'Maricultor:',
    viewDetails: 'Ver Detalles',
    
    // Status labels
    statusLabels: {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    },
    
    // Empty states
    noInvestments: 'No hay inversiones',
    noInvestmentsMessage: 'Aún no has realizado ninguna inversión en proyectos de maricultura',
    noFilteredInvestments: 'No se encontraron inversiones que coincidan con los filtros aplicados',
    clearFilters: 'Limpiar Filtros',
    
    // Fallback values
    noName: 'Sin nombre',
    noSector: 'Sin sector',
    noLocation: 'Sin ubicación',
    notAvailable: 'N/A'
  }
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MARICULTOR: '/maricultor',
  DASHBOARD: '/dashboard',
  SECTORS: '/sectors',
  MONITORING: '/monitoring',
  HARVEST: '/harvest',
  INVENTORY: '/inventory',
  REPORTS: '/reports'
}