import { OdooDate, OdooDateTime } from '../types/odoo';

// Constantes para formatos de fecha
const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Interfaz para opciones de formato
interface FormatOptions {
  locale?: string;
  showTime?: boolean;
  showSeconds?: boolean;
}

/**
 * Convierte una fecha de Odoo a un objeto Date de JavaScript
 * @param odooDate Fecha en formato Odoo (YYYY-MM-DD)
 * @returns Objeto Date o null si la fecha es inválida
 */
export function parseOdooDate(odooDate: OdooDate | null | undefined): Date | null {
  if (!odooDate) return null;
  
  // Validar formato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(odooDate)) {
    console.error(`Formato de fecha inválido: ${odooDate}`);
    return null;
  }
  
  const date = new Date(odooDate);
  // Verificar si es una fecha válida
  if (isNaN(date.getTime())) {
    console.error(`Fecha inválida: ${odooDate}`);
    return null;
  }
  
  return date;
}

/**
 * Convierte una fecha y hora de Odoo a un objeto Date de JavaScript
 * @param odooDateTime Fecha y hora en formato Odoo (YYYY-MM-DD HH:mm:ss)
 * @returns Objeto Date o null si la fecha es inválida
 */
export function parseOdooDateTime(odooDateTime: OdooDateTime | null | undefined): Date | null {
  if (!odooDateTime) return null;
  
  // Validar formato
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(odooDateTime)) {
    console.error(`Formato de fecha y hora inválido: ${odooDateTime}`);
    return null;
  }
  
  const date = new Date(odooDateTime.replace(' ', 'T'));
  // Verificar si es una fecha válida
  if (isNaN(date.getTime())) {
    console.error(`Fecha y hora inválida: ${odooDateTime}`);
    return null;
  }
  
  return date;
}

/**
 * Formatea una fecha para mostrarla al usuario
 * @param date Objeto Date o string en formato Odoo
 * @param options Opciones de formato
 * @returns String formateado o cadena vacía si la fecha es inválida
 */
export function formatDate(date: Date | OdooDate | null | undefined, options: FormatOptions = {}): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : parseOdooDate(date as OdooDate);
  if (!dateObj) return '';
  
  const locale = options.locale || 'es-ES';
  
  return dateObj.toLocaleDateString(locale);
}

/**
 * Formatea una fecha y hora para mostrarla al usuario
 * @param date Objeto Date o string en formato Odoo
 * @param options Opciones de formato
 * @returns String formateado o cadena vacía si la fecha es inválida
 */
export function formatDateTime(date: Date | OdooDateTime | null | undefined, options: FormatOptions = {}): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : parseOdooDateTime(date as OdooDateTime);
  if (!dateObj) return '';
  
  const locale = options.locale || 'es-ES';
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: options.showSeconds ? '2-digit' : undefined,
  };
  
  if (options.showTime === false) {
    return dateObj.toLocaleDateString(locale);
  }
  
  return `${dateObj.toLocaleDateString(locale)} ${dateObj.toLocaleTimeString(locale, timeOptions)}`;
}

/**
 * Convierte un objeto Date a formato de fecha Odoo (YYYY-MM-DD)
 * @param date Objeto Date
 * @returns String en formato Odoo o null si la fecha es inválida
 */
export function toOdooDate(date: Date | null | undefined): OdooDate | null {
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un objeto Date a formato de fecha y hora Odoo (YYYY-MM-DD HH:mm:ss)
 * @param date Objeto Date
 * @returns String en formato Odoo o null si la fecha es inválida
 */
export function toOdooDateTime(date: Date | null | undefined): OdooDateTime | null {
  if (!date) return null;
  
  const dateStr = toOdooDate(date);
  if (!dateStr) return null;
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}:${seconds}`;
}