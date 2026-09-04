'use strict';

/**
 * PLOP Recibidas Constants
 * ========================
 * Centralized configuration for products, categories, and system constants.
 */

// Products catalog (15 items)
export const PRODUCTS = [
  {id:'marco-rectangular',category:'Marcos',name:'Marco selfie rectangular',price:35000,image:'marco-rectangular.jpg?v=37.0',summary:'Marco para fotos rectangular, clásico y versátil para cualquier evento.',details:['100 × 70 cm','FoamBoard 1cm','Personalizable'],theme:'aqua'},
  {id:'marco-redondo',category:'Marcos',name:'Marco redondo',price:38000,image:'marco-redondo.jpg?v=37.0',summary:'Un formato distinto para destacar en las fotos.',details:['70 × 70 cm','FoamBoard 1cm','Soporte interno'],theme:'pink'},
  {id:'marco-nube',category:'Marcos',name:'Marco tipo nube',price:38000,image:'marco-nube.jpg?v=37.0',summary:'Llamativo, delicado y totalmente personalizado.',details:['50 × 100 cm','FoamBoard + diseño','Formas suaves'],theme:'purple'},
  {id:'marco-forma',category:'Marcos',name:'Marco con forma',price:38000,image:'marco-forma.jpg?v=37.0',summary:'Original, divertido y único para tu festejo.',details:['Hasta 100 × 70 cm','FoamBoard + diseño','Forma personalizada'],theme:'yellow'},
  {id:'banda',category:'Bandas',name:'Banda para graduados',price:12000,image:'banda-graduados.jpg?v=37.0',summary:'Colores, carrera y frase elegidos por vos.',details:['150 × 11 cm','Lona impresa','Personalizable'],theme:'aqua'},
  {id:'cartel-chico',category:'Carteles colgantes',name:'Cartel colgante chico',price:7000,image:'cartel-chico.jpg?v=37.0',summary:'Liviano y listo para colgar.',details:['25 × 35 cm','FoamBoard 1cm','Fácil de colgar'],theme:'pink'},
  {id:'cartel-mediano',category:'Carteles colgantes',name:'Cartel colgante mediano',price:12000,image:'cartel-mediano.jpg?v=37.0',summary:'El tamaño más elegido para la recibida.',details:['40 × 55 cm','FoamBoard 1cm','Clásico'],theme:'aqua'},
  {id:'cartel-grande',category:'Carteles colgantes',name:'Cartel colgante grande',price:30000,image:'cartel-grande.jpg?v=37.0',summary:'Alta visibilidad para todas las fotos.',details:['70 × 100 cm','FoamBoard 1cm','Gran impacto'],theme:'purple'},
  {id:'lona-mediana',category:'Lonas',name:'Cartel de lona mediano',price:25000,image:'lona-mediana.jpg?v=37.0',summary:'Ideal para auto, fiesta, capa o fondo de fotos.',details:['100 × 60 cm','Lona impresa','Reutilizable'],theme:'pink'},
  {id:'lona-grande',category:'Lonas',name:'Cartel de lona grande',price:30000,image:'lona-grande.jpg?v=37.0',summary:'Vistoso, resistente y fácil de lucir.',details:['140 × 60 cm','Lona impresa','Extra resistente'],theme:'yellow'},
  {id:'props-unidad',category:'Props',name:'Prop individual',price:2000,image:'props-unidad.jpg?v=37.0',summary:'Una frase, meme, emoji o foto listo para usar.',details:['15 × 21 cm aprox.','Papel premium','Mango de madera'],theme:'purple'},
  {id:'props-pack',category:'Props',name:'Pack de 8 props',price:12000,image:'props-pack.jpg?v=37.0',summary:'Más variedad para todas las fotos.',details:['8 unidades','15 × 21 cm aprox.','Papel premium + mangos'],theme:'aqua'},
  {id:'combo-1',category:'Combos',name:'Combo 1',price:50000,image:'combo-1.jpg?v=37.0',summary:'Marco selfie + cartel colgante chico + 8 props.',details:['Marco selfie','Cartel colgante chico','8 props','Diseño coordinado'],theme:'pink'},
  {id:'combo-2',category:'Combos',name:'Combo 2',price:55000,image:'combo-2.jpg?v=37.0',summary:'Marco selfie + banda para egresados + 8 props.',details:['Marco selfie','Banda para egresados','8 props','Diseño coordinado'],theme:'aqua'},
  {id:'combo-3',category:'Combos',name:'Combo 3',price:34000,image:'combo-3.jpg?v=37.0',summary:'Cartel de lona mediano + 8 props.',details:['Cartel de lona mediano','8 props','Diseño coordinado'],theme:'purple'},
  {id:'combo-4',category:'Combos',name:'Combo 4',price:76000,image:'combo-4.jpg?v=37.0',summary:'Marco para fotos rectangular + banda + 8 props + cartel de lona grande.',details:['Marco para fotos rectangular','Banda para egresados','8 props','Cartel de lona grande','Completo'],theme:'yellow'},
  {id:'combo-5',category:'Combos',name:'Combo 5',price:54000,image:'combo-5.jpg?v=37.0',summary:'Cartel colgante grande + cartel de lona grande.',details:['Cartel colgante grande','Cartel de lona grande','Diseño coordinado'],theme:'aqua'}
];

export const CATEGORIES = ['Combos','Marcos','Carteles colgantes','Lonas','Props','Bandas'];

export const CATEGORY_COPY = {
  'Marcos':'Los protagonistas de la foto: elegí forma, tamaño y estilo.',
  'Bandas':'La banda personalizada para lucir carrera, nombre y colores.',
  'Carteles colgantes':'Carteles livianos para casa, auto, fiesta o recibida.',
  'Lonas':'Alta presencia visual, resistentes y fáciles de trasladar.',
  'Props':'Frases, memes y accesorios para fotos espontáneas.',
  'Combos':'Opciones armadas para elegir rápido según lo que incluye cada combo.'
};

export const PRODUCT_BADGES = {
  'marco-rectangular':'Más pedido',
  'marco-redondo':'Ideal para fotos',
  'marco-nube':'Estilo suave',
  'marco-forma':'Único',
  'banda':'Imprescindible',
  'cartel-chico':'Económico',
  'cartel-mediano':'Más elegido',
  'cartel-grande':'Alto impacto',
  'lona-mediana':'Versátil',
  'lona-grande':'Gran formato',
  'props-unidad':'Por unidad',
  'props-pack':'Fotos divertidas',
  'combo-1':'Inicio ideal',
  'combo-2':'Fotos + banda',
  'combo-3':'Lona + props',
  'combo-4':'Completo',
  'combo-5':'Gran formato'
};

// System constants
export const SUPABASE_URL = 'https://tcjybxmkwdcutvswfmoi.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_We6azmFAiRM7TRHIZF6C7g_2Xu0leRW';
export const TRACKING_CLIENT_URL = 'https://plopseguimientos.netlify.app/cliente/';

// Storage keys (versioned)
export const STORAGE_KEYS = {
  CART: 'plop.web.cart.v37',
  DRAFT: 'plop.web.checkout.v37',
  PENDING: 'plop.web.pending.v37',
  LAST_ORDER: 'plop.web.last-order.v37'
};

// Validation constants
export const VALIDATION = {
  MAX_FORM_BYTES: 7.5 * 1024 * 1024,
  MAX_RECEIPT_SIZE: 8 * 1024 * 1024,
  MIN_IMAGE_WIDTH: 450,
  MIN_IMAGE_HEIGHT: 300,
  MAX_CART_QUANTITY: 20,
  MIN_DELIVERY_DAYS: 5
};

// Payment methods
export const PAYMENT_METHODS = {
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  OTHER: 'Otro medio de pago'
};

// File type allowlist
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Delivery date configuration
export const DELIVERY_CONFIG = {
  minDays: 5,
  excludeWeekends: true,
  maxOptions: 100
};

export default {
  PRODUCTS,
  CATEGORIES,
  CATEGORY_COPY,
  PRODUCT_BADGES,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  TRACKING_CLIENT_URL,
  STORAGE_KEYS,
  VALIDATION,
  PAYMENT_METHODS,
  ALLOWED_RECEIPT_TYPES,
  DELIVERY_CONFIG
};