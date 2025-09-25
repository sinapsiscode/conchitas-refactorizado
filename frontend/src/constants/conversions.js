// Constantes de conversión para conchas de abanico
export const CONVERSIONS = {
  // Conversiones de peso
  CONCHITAS_POR_KG: 111,           // 111 conchitas = 1 Kg
  CONCHITAS_POR_MANOJO: 96,        // 1 manojo = 96 conchitas
  MANOJOS_POR_MALLA: 3,            // 1 malla = 3 manojos
  CONCHITAS_POR_MALLA: 288,        // 1 malla = 288 conchitas
  KG_POR_MALLA: 2.6,                // 1 malla = 2.6 Kg
}

// Función para convertir Kg a unidades de conchitas
export const kgToConchitas = (kg) => {
  return Math.round(kg * CONVERSIONS.CONCHITAS_POR_KG)
}

// Función para convertir conchitas a Kg
export const conchitasToKg = (conchitas) => {
  return (conchitas / CONVERSIONS.CONCHITAS_POR_KG).toFixed(2)
}

// Función para convertir Kg a manojos
export const kgToManojos = (kg) => {
  const conchitas = kgToConchitas(kg)
  return Math.round(conchitas / CONVERSIONS.CONCHITAS_POR_MANOJO)
}

// Función para convertir Kg a mallas
export const kgToMallas = (kg) => {
  return (kg / CONVERSIONS.KG_POR_MALLA).toFixed(2)
}

// Función para convertir manojos a mallas
export const manojosToMallas = (manojos) => {
  return (manojos / CONVERSIONS.MANOJOS_POR_MALLA).toFixed(2)
}

// Función para convertir conchas individuales a mallas
export const conchitasToMallas = (conchitas) => {
  return (conchitas / CONVERSIONS.CONCHITAS_POR_MALLA).toFixed(2)
}

// Función para obtener todas las conversiones de un peso en Kg
export const getAllConversions = (kg) => {
  return {
    kg: parseFloat(kg),
    conchitas: kgToConchitas(kg),
    manojos: kgToManojos(kg),
    mallas: kgToMallas(kg)
  }
}

// Función para obtener todas las conversiones desde conchitas individuales
export const getAllConversionsFromConchitas = (conchitas) => {
  return {
    conchitas: parseInt(conchitas),
    manojos: Math.floor(conchitas / CONVERSIONS.CONCHITAS_POR_MANOJO),
    mallas: conchitasToMallas(conchitas),
    kg: conchitasToKg(conchitas)
  }
}

// Función para convertir manojos a conchitas
export const manojosToConchitas = (manojos) => {
  return Math.round(manojos * CONVERSIONS.CONCHITAS_POR_MANOJO)
}

// Función para convertir manojos a Kg
export const manojosToKg = (manojos) => {
  const conchitas = manojosToConchitas(manojos)
  return conchitasToKg(conchitas)
}

// Función para convertir mallas a manojos
export const mallasToManojos = (mallas) => {
  return Math.round(mallas * CONVERSIONS.MANOJOS_POR_MALLA)
}

// Función para convertir mallas a conchitas
export const mallasToConchitas = (mallas) => {
  return Math.round(mallas * CONVERSIONS.CONCHITAS_POR_MALLA)
}

// Función para obtener todas las conversiones desde manojos
export const getAllConversionsFromManojos = (manojos) => {
  const conchitas = manojosToConchitas(manojos)
  return {
    manojos: parseInt(manojos),
    conchitas: conchitas,
    mallas: manojosToMallas(manojos),
    kg: parseFloat(manojosToKg(manojos))
  }
}

// Función para obtener todas las conversiones desde mallas
export const getAllConversionsFromMallas = (mallas) => {
  const conchitas = mallasToConchitas(mallas)
  const manojos = mallasToManojos(mallas)
  return {
    mallas: parseFloat(mallas),
    manojos: manojos,
    conchitas: conchitas,
    kg: parseFloat(conchitasToKg(conchitas))
  }
}

// Presentaciones por defecto
export const DEFAULT_PRESENTATIONS = [
  { id: 'fresh', name: 'Fresco', editable: true },
  { id: 'frozen', name: 'Congelado', editable: true },
  { id: 'halfShell', name: 'Media Valva', editable: true },
  { id: 'processed', name: 'Procesado', editable: true }
]

// Medidas por defecto para cada presentación
export const DEFAULT_MEASURES = {
  fresh: [
    { id: 'small', name: 'Pequeña (60-70mm)', pricePerKg: 18 },
    { id: 'medium', name: 'Mediana (70-80mm)', pricePerKg: 22 },
    { id: 'large', name: 'Grande (80-90mm)', pricePerKg: 25 }
  ],
  frozen: [
    { id: 'pack10-20', name: '10-20 piezas/kg', pricePerKg: 25 },
    { id: 'pack20-30', name: '20-30 piezas/kg', pricePerKg: 30 }
  ],
  halfShell: [
    { id: 'tray12', name: 'Bandeja 12 unid', pricePerKg: 35 },
    { id: 'bulk', name: 'Granel/kg', pricePerKg: 45 }
  ],
  processed: [
    { id: 'pulp500', name: 'Pulpa 500g', pricePerKg: 56 },
    { id: 'pulp1000', name: 'Pulpa 1kg', pricePerKg: 52 }
  ]
}