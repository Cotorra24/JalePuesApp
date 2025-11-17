// src/constants/nicaraguaConstants.js

export const CATEGORIES = [
  'Plomería',
  'Electricidad',
  'Limpieza',
  'Jardinería',
  'Carpintería',
  'Pintura',
  'Mudanza',
  'Tecnología',
  'Construcción',
  'Mecánica',
  'Albañilería',
  'Costura',
  'Cocina/Chef',
  'Cuidado de niños',
  'Cuidado de adultos mayores',
  'Mascotas',
  'Fotografía',
  'Diseño',
  'Otros'
];

export const LOCATIONS = [
  // Managua
  'Managua Centro',
  'Villa Fontana',
  'Los Robles',
  'Altamira',
  'Bolonia',
  'Linda Vista',
  'Las Colinas',
  'Carretera Masaya',
  'Ciudad Jardín',
  
  // Otros departamentos
  'León',
  'Granada',
  'Masaya',
  'Matagalpa',
  'Estelí',
  'Chinandega',
  'Jinotega',
  'Rivas',
  'Carazo',
  'Boaco',
  'Chontales',
  'Madriz',
  'Nueva Segovia',
  'Río San Juan',
  'RAAN',
  'RAAS'
];

export const CURRENCY = {
  symbol: 'C$',
  code: 'NIO',
  name: 'Córdoba'
};

export const PHONE_CONFIG = {
  countryCode: '+505',
  placeholder: '8888-8888',
  mask: '9999-9999',
  length: 8
};

export const JOB_STATUS = {
  ACTIVE: 'active',           // Trabajo publicado y disponible
  IN_PROGRESS: 'in-progress', // Trabajo en proceso
  COMPLETED: 'completed'      // Trabajo finalizado
};

export const formatPrice = (price) => {
  return `C$ ${price.toLocaleString('es-NI')}`;
};

export const formatPhone = (phone) => {
  // Eliminar espacios y guiones
  const cleaned = phone.replace(/\D/g, '');
  
  // Formatear como 8888-8888
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
};