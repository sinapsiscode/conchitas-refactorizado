const fs = require('fs');
const path = require('path');

// Leer db.json
const dbPath = path.join(__dirname, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Verificar si ya existe
if (db.investmentInvitations) {
  console.log('⚠️  La colección investmentInvitations ya existe');
  process.exit(0);
}

// Datos de ejemplo para invitaciones
const sampleInvitations = [
  {
    id: "invitation-001",
    maricultorId: "maricultor-001",
    maricultorName: "Juan Pérez",
    investorId: "investor-001",
    investorEmail: "investor1@conchas.com",
    sectorId: "sector-001",
    sectorName: "Sector Norte",
    lotId: "lot-001",
    status: "pending", // pending, accepted, rejected, expired
    invitedAmount: 30000,
    invitedPercentage: 25,
    message: "Te invitamos a participar en nuestro proyecto de cultivo en el Sector Norte. Esperamos una buena temporada de crecimiento.",
    invitationDate: "2025-09-20T10:00:00.000Z",
    expirationDate: "2025-10-05T23:59:59.999Z",
    responseDate: null,
    responseMessage: null,
    acceptedAmount: null,
    acceptedPercentage: null,
    createdAt: "2025-09-20T10:00:00.000Z",
    updatedAt: "2025-09-20T10:00:00.000Z"
  },
  {
    id: "invitation-002",
    maricultorId: "maricultor-001",
    maricultorName: "Juan Pérez",
    investorId: "investor-test-001",
    investorEmail: "inversor.prueba@example.com",
    sectorId: "sector-002",
    sectorName: "Sector Sur",
    lotId: "lot-002",
    status: "accepted",
    invitedAmount: 50000,
    invitedPercentage: 30,
    message: "Excelente oportunidad de inversión en el Sector Sur con proyección de alta rentabilidad.",
    invitationDate: "2025-09-15T10:00:00.000Z",
    expirationDate: "2025-09-30T23:59:59.999Z",
    responseDate: "2025-09-18T14:30:00.000Z",
    responseMessage: "Acepto la invitación. Me interesa mucho participar en este proyecto.",
    acceptedAmount: 50000,
    acceptedPercentage: 30,
    createdAt: "2025-09-15T10:00:00.000Z",
    updatedAt: "2025-09-18T14:30:00.000Z"
  },
  {
    id: "invitation-003",
    maricultorId: "maricultor-001",
    maricultorName: "Juan Pérez",
    investorId: "investor-001",
    investorEmail: "investor1@conchas.com",
    sectorId: "sector-001",
    sectorName: "Sector Norte",
    lotId: "lot-003",
    status: "rejected",
    invitedAmount: 40000,
    invitedPercentage: 20,
    message: "Nueva oportunidad en el Sector Norte con siembra reciente.",
    invitationDate: "2025-08-25T10:00:00.000Z",
    expirationDate: "2025-09-10T23:59:59.999Z",
    responseDate: "2025-08-28T16:00:00.000Z",
    responseMessage: "Gracias por la invitación, pero en este momento no puedo participar.",
    acceptedAmount: null,
    acceptedPercentage: null,
    createdAt: "2025-08-25T10:00:00.000Z",
    updatedAt: "2025-08-28T16:00:00.000Z"
  }
];

// Agregar la colección después de investments
const newDb = {};
for (const [key, value] of Object.entries(db)) {
  newDb[key] = value;
  if (key === 'investments') {
    newDb['investmentInvitations'] = sampleInvitations;
    console.log('✅ Colección investmentInvitations agregada con', sampleInvitations.length, 'registros de ejemplo');
  }
}

// Guardar
fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf8');
console.log('✅ db.json actualizado exitosamente');