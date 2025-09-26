// Script para poblar db.json con datos iniciales del seeder
// Este script genera los mismos datos que el seeder original pero para JSON Server

const generateUUID = () => {
  return 'xxxx-xxxx-xxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
};

const generateInitialData = () => {
  const data = {
    users: [
      {
        id: "admin-001",
        email: "admin@conchas.com",
        password: "password123",
        firstName: "Admin",
        lastName: "Sistema",
        role: "admin",
        status: "approved",
        phone: "+51 999 999 999",
        location: "Piura-Sechura",
        totalHectares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "maricultor-001",
        email: "maricultor1@conchas.com",
        password: "password123",
        firstName: "Juan",
        lastName: "Pérez",
        role: "maricultor",
        status: "approved",
        phone: "+51 987 654 321",
        location: "Sechura",
        totalHectares: 8.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "investor-001",
        email: "investor1@conchas.com",
        password: "password123",
        firstName: "María",
        lastName: "García",
        role: "investor",
        status: "approved",
        phone: "+51 976 543 210",
        location: "Lima",
        totalHectares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    sectors: [],
    batteries: [],
    cultivationLines: [],
    lots: [],
    monitoring: [],
    expenses: [],
    harvests: [],
    income: [],
    inventory: [],
    investments: [],
    notifications: [],
    seedOrigins: [],
    projections: [],
    incomeStatementClosures: [],
    distributions: [],
    investorInvitations: []
  };

  // Generar sectores para el maricultor
  const maricultorId = "maricultor-001";
  for (let i = 1; i <= 3; i++) {
    const sectorId = `sector-${i}`;
    const sector = {
      id: sectorId,
      name: `Sector ${i}`,
      userId: maricultorId,
      location: "Bahía de Sechura",
      hectares: Math.round((Math.random() * 4 + 0.5) * 10) / 10,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.sectors.push(sector);

    // Generar 2-3 baterías por sector
    const numBatteries = Math.floor(Math.random() * 2) + 2;
    for (let b = 0; b < numBatteries; b++) {
      const batteryId = `battery-${sectorId}-${b}`;
      const batteryLetter = String.fromCharCode(65 + b); // A, B, C...

      const battery = {
        id: batteryId,
        sectorId: sectorId,
        letter: batteryLetter,
        name: `Batería ${batteryLetter}`,
        description: `Batería ${batteryLetter} del sector ${i}`,
        status: "active",
        totalLines: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.batteries.push(battery);

      // Generar 3-5 líneas por batería
      const numLines = Math.floor(Math.random() * 3) + 3;
      for (let l = 1; l <= numLines; l++) {
        const lineId = `line-${batteryId}-${l}`;
        const lineName = `${batteryLetter}-${l}`;

        const line = {
          id: lineId,
          sectorId: sectorId,
          batteryId: batteryId,
          name: lineName,
          batteryLetter: batteryLetter,
          lineNumber: l,
          totalSystems: 100,
          floorsPerSystem: 10,
          occupiedSystems: [],
          status: Math.random() > 0.7 ? "partial" : "available",
          description: `Línea ${lineName} de cultivo suspendido`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.cultivationLines.push(line);
      }

      // Actualizar total de líneas en la batería
      battery.totalLines = numLines;
    }

    // Generar 1-2 lotes por sector
    const numLots = Math.floor(Math.random() * 2) + 1;
    for (let lt = 1; lt <= numLots; lt++) {
      const lotId = `lot-${sectorId}-${lt}`;
      const entryDate = new Date();
      entryDate.setMonth(entryDate.getMonth() - Math.floor(Math.random() * 8) - 1);

      const initialQuantity = Math.floor(Math.random() * 50000) + 10000;
      const mortalityRate = Math.random() * 0.15;
      const currentQuantity = Math.floor(initialQuantity * (1 - mortalityRate));

      const lot = {
        id: lotId,
        sectorId: sectorId,
        entryDate: entryDate.toISOString().split('T')[0],
        origin: Math.random() > 0.5 ? "Semillero Local" : "Laboratorio Acuícola",
        initialQuantity: initialQuantity,
        currentQuantity: currentQuantity,
        expectedMonthlyMortality: Math.floor(Math.random() * 8) + 2,
        cost: Math.floor(Math.random() * 10000) + 5000,
        averageSize: Math.floor(Math.random() * 60) + 20,
        maxSize: Math.floor(Math.random() * 80) + 30,
        minSize: Math.floor(Math.random() * 30) + 10,
        status: Math.random() > 0.5 ? "growing" : "seeded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.lots.push(lot);

      // Generar registros de monitoreo para cada lote
      const numMonitoring = Math.floor(Math.random() * 10) + 5;
      for (let m = 0; m < numMonitoring; m++) {
        const monitoringDate = new Date();
        monitoringDate.setDate(monitoringDate.getDate() - m * 7); // Registros semanales

        const monitoring = {
          id: `monitoring-${lotId}-${m}`,
          lotId: lotId,
          sectorId: sectorId,
          recordedBy: maricultorId,
          date: monitoringDate.toISOString().split('T')[0],
          averageSize: lot.averageSize + Math.random() * 10 - 5,
          minSize: lot.minSize + Math.random() * 5 - 2,
          maxSize: lot.maxSize + Math.random() * 10 - 5,
          estimatedQuantity: currentQuantity - Math.floor(Math.random() * 100),
          mortalityRate: Math.random() * 5 + 1,
          waterTemperature: 18 + Math.random() * 8,
          salinity: 30 + Math.random() * 10,
          pH: 7.5 + Math.random() * 1.2,
          oxygen: 5.5 + Math.random() * 4,
          observations: "Monitoreo rutinario",
          createdAt: monitoringDate.toISOString(),
          updatedAt: monitoringDate.toISOString()
        };
        data.monitoring.push(monitoring);
      }
    }
  }

  // Generar algunos gastos de ejemplo
  const expenseCategories = ["Alimentación", "Mantenimiento", "Personal", "Equipos", "Transporte"];
  for (let e = 0; e < 20; e++) {
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 60));

    const expense = {
      id: `expense-${e}`,
      userId: maricultorId,
      category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
      description: "Gasto operacional",
      amount: Math.floor(Math.random() * 5000) + 100,
      date: expenseDate.toISOString().split('T')[0],
      createdAt: expenseDate.toISOString(),
      updatedAt: expenseDate.toISOString()
    };
    data.expenses.push(expense);
  }

  return data;
};

// Exportar la función para uso en Node.js o en el navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateInitialData };
} else {
  console.log('Datos generados:', generateInitialData());
}