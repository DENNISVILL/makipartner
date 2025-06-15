// Importación correcta
import axios from 'axios';
import config from '../config/odooConfig';
import { handleOdooError, ErrorType, StandardError } from './errorHandler';
import cacheService from './cacheService';
import { z } from 'zod';
import logger from '../utils/logger';
import { parseOdooDate, parseOdooDateTime, formatDate, formatDateTime } from '../utils/dateUtils';
import { 
  validateData, 
  validateArray, 
  loginResponseSchema,
  saleOrderSchema,
  partnerSchema,
  invoiceSchema,
  productSchema,
  employeeSchema,
  projectSchema
} from '../schemas/odooSchemas';
import type {
  OdooId,
  OdooRelation,
  OdooDate,
  OdooDateTime,
  Partner,
  User,
  SaleOrder,
  Invoice,
  Product,
  Employee,
  Project,
  LoginResponse
} from '../types/odoo';

// Usar la configuración centralizada
const API_URL = config.apiUrl;
const PUBLIC_API_URL = config.publicApiUrl;
const API_TIMEOUT = config.apiTimeout;

class OdooService {
  private session_id: string | null = null;
  private uid: number | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private sessionExpiryTime: number | null = null;
  private autoRefreshEnabled: boolean = true;
  private readonly SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 horas
  private readonly REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutos
  
  async login(db: string, login: string, password: string, rememberMe: boolean = true): Promise<LoginResponse | null> {
    try {
      // Usar PUBLIC_API_URL para las solicitudes desde el navegador
      logger.info(`Intentando conectar a: ${PUBLIC_API_URL}/web/session/authenticate`);
      const response = await axios.post(`${PUBLIC_API_URL}/web/session/authenticate`, {
        jsonrpc: '2.0',
        params: {
          db,
          login,
          password,
        }
      }, {
        withCredentials: true,
        timeout: API_TIMEOUT
      });
      
      if (response.data.result) {
        // Validar la respuesta
        const validatedResult = validateData(response.data.result, loginResponseSchema);
        
        this.session_id = validatedResult.session_id;
        this.uid = validatedResult.uid;
        
        // Establecer tiempo de expiración de la sesión
        this.sessionExpiryTime = Date.now() + this.SESSION_DURATION;
        
        // Guardar credenciales y configuración de sesión
        const sessionData = {
          session_id: this.session_id,
          uid: this.uid,
          expiry_time: this.sessionExpiryTime,
          db,
          login,
          remember_me: rememberMe,
          created_at: Date.now()
        };
        
        if (rememberMe) {
          localStorage.setItem('odoo_session_data', JSON.stringify(sessionData));
          localStorage.setItem('odoo_remember_me', 'true');
          // Guardar credenciales encriptadas para renovación automática
          localStorage.setItem('odoo_credentials', btoa(JSON.stringify({ db, login, password })));
        } else {
          sessionStorage.setItem('odoo_session_data', JSON.stringify(sessionData));
          localStorage.setItem('odoo_remember_me', 'false');
          // Limpiar datos persistentes
          localStorage.removeItem('odoo_session_data');
          localStorage.removeItem('odoo_credentials');
        }
        
        // Iniciar renovación automática de token
        this.startTokenRefresh();
        
        logger.info('Sesión iniciada exitosamente');
        return validatedResult;
      }
      return null;
    } catch (error) {
      const standardError = handleOdooError(error, 'login');
      throw standardError;
    }
  }
  
  // Método para restaurar la sesión si existe
  async restoreSession(): Promise<boolean> {
    try {
      // Intentar restaurar desde localStorage primero (sesión persistente)
      let sessionDataStr = localStorage.getItem('odoo_session_data');
      let isFromLocalStorage = true;
      
      // Si no encontramos en localStorage, intentar desde sessionStorage
      if (!sessionDataStr) {
        sessionDataStr = sessionStorage.getItem('odoo_session_data');
        isFromLocalStorage = false;
      }
      
      if (!sessionDataStr) {
        return false;
      }
      
      const sessionData = JSON.parse(sessionDataStr);
      const currentTime = Date.now();
      
      // Verificar si la sesión ha expirado
      if (sessionData.expiry_time && currentTime > sessionData.expiry_time) {
        logger.info('Sesión expirada, intentando renovación automática');
        
        // Intentar renovación automática si está habilitada y tenemos credenciales
        if (this.autoRefreshEnabled && isFromLocalStorage) {
          const success = await this.attemptTokenRefresh();
          if (success) {
            return true;
          }
        }
        
        // Si no se pudo renovar, limpiar sesión expirada
        this.clearExpiredSession();
        return false;
      }
      
      // Restaurar datos de sesión
      this.session_id = sessionData.session_id;
      this.uid = sessionData.uid;
      this.sessionExpiryTime = sessionData.expiry_time;
      
      // Verificar que la sesión sigue siendo válida en el servidor
      const isValid = await this.validateSession();
      if (!isValid) {
        logger.warn('Sesión inválida en el servidor');
        this.clearExpiredSession();
        return false;
      }
      
      // Reiniciar el temporizador de renovación
      this.startTokenRefresh();
      
      logger.info('Sesión restaurada exitosamente');
      return true;
    } catch (error) {
      logger.error('Error al restaurar sesión:', error);
      this.clearExpiredSession();
      return false;
    }
  }
  
  // Método para cerrar sesión
  logout(): void {
    // Detener renovación automática
    this.stopTokenRefresh();
    
    // Limpiar caché relacionado con la sesión
    this.clearSessionCache();
    
    this.session_id = null;
    this.uid = null;
    this.sessionExpiryTime = null;
    
    // Limpiar todos los datos de sesión
    localStorage.removeItem('odoo_session_data');
    localStorage.removeItem('odoo_credentials');
    localStorage.removeItem('odoo_remember_me');
    
    sessionStorage.removeItem('odoo_session_data');
    
    logger.info('Sesión cerrada exitosamente');
  }
  
  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.session_id && (!this.sessionExpiryTime || Date.now() < this.sessionExpiryTime);
  }

  // Iniciar renovación automática de token
  private startTokenRefresh(): void {
    this.stopTokenRefresh(); // Limpiar cualquier temporizador existente
    
    if (!this.autoRefreshEnabled) {
      return;
    }
    
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.attemptTokenRefresh();
      } catch (error) {
        logger.error('Error en renovación automática:', error);
        // Si falla la renovación, detener el temporizador
        this.stopTokenRefresh();
      }
    }, this.REFRESH_INTERVAL);
    
    logger.info('Renovación automática de token iniciada');
  }

  // Detener renovación automática de token
  private stopTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
      logger.info('Renovación automática de token detenida');
    }
  }

  // Intentar renovar el token automáticamente
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const credentialsStr = localStorage.getItem('odoo_credentials');
      if (!credentialsStr) {
        logger.warn('No hay credenciales guardadas para renovación automática');
        return false;
      }
      
      const credentials = JSON.parse(atob(credentialsStr));
      const { db, login, password } = credentials;
      
      logger.info('Intentando renovación automática de token');
      
      // Realizar nuevo login
      const result = await this.login(db, login, password, true);
      
      if (result) {
        logger.info('Token renovado exitosamente');
        return true;
      } else {
        logger.warn('Falló la renovación automática del token');
        return false;
      }
    } catch (error) {
      logger.error('Error en renovación automática:', error);
      return false;
    }
  }

  // Validar que la sesión sigue siendo válida en el servidor
  private async validateSession(): Promise<boolean> {
    try {
      if (!this.session_id) {
        return false;
      }
      
      // Hacer una llamada simple para verificar que la sesión es válida
      const response = await axios.post(`${API_URL}/web/session/get_session_info`, {
        jsonrpc: '2.0',
        params: {}
      }, {
        withCredentials: true,
        headers: {
          'X-Openerp-Session-Id': this.session_id
        },
        timeout: 5000 // Timeout corto para validación
      });
      
      return response.data.result && response.data.result.uid;
    } catch (error) {
      logger.warn('Validación de sesión falló:', error);
      return false;
    }
  }

  // Limpiar sesión expirada
  private clearExpiredSession(): void {
    this.stopTokenRefresh();
    this.session_id = null;
    this.uid = null;
    this.sessionExpiryTime = null;
    
    // Limpiar solo datos de sesión, mantener preferencias
    localStorage.removeItem('odoo_session_data');
    sessionStorage.removeItem('odoo_session_data');
    
    logger.info('Sesión expirada limpiada');
  }

  // Configurar renovación automática
  setAutoRefresh(enabled: boolean): void {
    this.autoRefreshEnabled = enabled;
    if (enabled && this.isAuthenticated()) {
      this.startTokenRefresh();
    } else {
      this.stopTokenRefresh();
    }
  }

  // Obtener información de la sesión
  getSessionInfo() {
    return {
      isAuthenticated: this.isAuthenticated(),
      uid: this.uid,
      sessionId: this.session_id,
      expiryTime: this.sessionExpiryTime,
      autoRefreshEnabled: this.autoRefreshEnabled,
      timeUntilExpiry: this.sessionExpiryTime ? Math.max(0, this.sessionExpiryTime - Date.now()) : 0
    };
  }
  
  async callMethod(model: string, method: string, args: any[] = [], kwargs: any = {}) {
    try {
      // Intentar restaurar la sesión si no está establecida
      if (!this.session_id) {
        const restored = await this.restoreSession();
        if (!restored) {
          throw {
            type: ErrorType.AUTHENTICATION,
            message: 'No hay una sesión activa. Por favor inicie sesión nuevamente.'
          };
        }
      }
      
      // Verificar si la sesión ha expirado
      if (!this.isAuthenticated()) {
        // Intentar renovación automática si está habilitada
        if (this.autoRefreshEnabled) {
          const refreshed = await this.attemptTokenRefresh();
          if (!refreshed) {
            this.clearExpiredSession();
            throw {
              type: ErrorType.AUTHENTICATION,
              message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
            };
          }
        } else {
          this.clearExpiredSession();
          throw {
            type: ErrorType.AUTHENTICATION,
            message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
          };
        }
      }
      
      const response = await axios.post(`${API_URL}/web/dataset/call_kw`, {
        jsonrpc: '2.0',
        params: {
          model,
          method,
          args,
          kwargs
        }
      }, {
        withCredentials: true,
        headers: {
          'X-Openerp-Session-Id': this.session_id
        },
        timeout: API_TIMEOUT
      });
      
      return response.data.result;
    } catch (error) {
      const standardError = handleOdooError(error, `callMethod(${model}, ${method})`);
      
      // Si es un error de autenticación, intentar renovación una vez más
      if (standardError.type === ErrorType.AUTHENTICATION) {
        if (this.autoRefreshEnabled && !kwargs._retryAttempt) {
          try {
            const refreshed = await this.attemptTokenRefresh();
            if (refreshed) {
              // Reintentar la llamada una vez
              kwargs._retryAttempt = true;
              return await this.callMethod(model, method, args, kwargs);
            }
          } catch (refreshError) {
            logger.error('Error en reintento de renovación:', refreshError);
          }
        }
        
        // Si llegamos aquí, la renovación falló o no está habilitada
        this.clearExpiredSession();
      }
      
      throw standardError;
    }
  }

  // Estandarizar todos los métodos para usar el mismo patrón de manejo de errores
  async getSalesOrders() {
    const cacheKey = `sales_orders_${this.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await this.callMethod('sale.order', 'search_read', [], {
            fields: ['name', 'partner_id', 'amount_total', 'state', 'date_order']
          });
          // Validar los datos recibidos
          return validateArray(result, saleOrderSchema);
        },
        2 * 60 * 1000 // 2 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getSalesOrders');
    }
  }

  async getCustomers() {
    const cacheKey = `customers_${this.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await this.callMethod('res.partner', 'search_read', [], {
            fields: ['name', 'email', 'phone', 'country_id']
          });
          return validateArray(result, partnerSchema);
        },
        5 * 60 * 1000 // 5 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getCustomers');
    }
  }

  // Métodos para Finanzas
  async getInvoices() {
    try {
      const result = await this.callMethod('account.move', 'search_read', 
        [['move_type', 'in', ['out_invoice', 'out_refund']]], {
        fields: ['name', 'partner_id', 'amount_total', 'state', 'invoice_date', 'payment_state']
      });
      return result;
    } catch (error) {
      throw handleOdooError(error, 'getInvoices');
    }
  }

  // Actualizar todos los métodos que no tienen manejo de errores
  async getCampaigns() {
    const cacheKey = `campaigns_${this.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.callMethod('mailing.mailing', 'search_read', [[]], {
            fields: ['name', 'state', 'campaign_type', 'sent_date', 'delivered', 'opened', 'clicked']
          });
        },
        4 * 60 * 1000 // 4 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getCampaigns');
    }
  }

  async getLeads() {
    const cacheKey = `leads_${this.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          return await this.callMethod('crm.lead', 'search_read', [[]], {
            fields: ['name', 'email_from', 'phone', 'stage_id', 'user_id', 'create_date']
          });
        },
        3 * 60 * 1000 // 3 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getLeads');
    }
  }

  // Website methods
  async getWebsites() {
    try {
      return await this.callMethod('website', 'search_read', [[]], {
        fields: ['name', 'domain', 'company_id', 'is_published', 'theme_id']
      });
    } catch (error) {
      throw handleOdooError(error, 'getWebsites');
    }
  }

  async getWebsiteProducts() {
    try {
      return await this.callMethod('product.template', 'search_read', [['website_published', '=', true]], {
        fields: ['name', 'list_price', 'is_published', 'website_published', 'categ_id', 'qty_available']
      });
    } catch (error) {
      throw handleOdooError(error, 'getWebsiteProducts');
    }
  }

  // Productivity methods
  async getCalendarEvents() {
    try {
      return await this.callMethod('calendar.event', 'search_read', [[]], {
        fields: ['name', 'start', 'stop', 'allday', 'user_id', 'partner_ids']
      });
    } catch (error) {
      throw handleOdooError(error, 'getCalendarEvents');
    }
  }

  async getDocuments() {
    try {
      return await this.callMethod('ir.attachment', 'search_read', [[]], {
        fields: ['name', 'mimetype', 'file_size', 'create_date', 'create_uid']
      });
    } catch (error) {
      throw handleOdooError(error, 'getDocuments');
    }
  }

  async getContacts() {
    try {
      return await this.callMethod('res.partner', 'search_read', [[]], {
        fields: ['name', 'email', 'phone', 'is_company', 'category_id']
      });
    } catch (error) {
      throw handleOdooError(error, 'getContacts');
    }
  }

  // Métodos para Finanzas - Contabilidad
  async getAccountingEntries() {
    try {
      return await this.callMethod('account.move.line', 'search_read', [[]], {
        fields: ['name', 'account_id', 'debit', 'credit', 'date', 'move_id']
      });
    } catch (error) {
      throw handleOdooError(error, 'getAccountingEntries');
    }
  }

  // Métodos para Finanzas - Facturación
  async getVendorBills() {
    try {
      return await this.callMethod('account.move', 'search_read', 
        [['move_type', 'in', ['in_invoice', 'in_refund']]], {
        fields: ['name', 'partner_id', 'amount_total', 'state', 'invoice_date', 'payment_state']
      });
    } catch (error) {
      throw handleOdooError(error, 'getVendorBills');
    }
  }

  // Métodos para Finanzas - Pagos
  async getPayments() {
    try {
      return await this.callMethod('account.payment', 'search_read', [[]], {
        fields: ['name', 'partner_id', 'amount', 'payment_type', 'payment_date', 'state']
    });
   } catch (error) {
     throw handleOdooError(error, 'getPayments');
   }
 }

  // Métodos para Finanzas - Gastos
  async getExpenses() {
    try {
      return await this.callMethod('hr.expense', 'search_read', [[]], {
        fields: ['name', 'employee_id', 'total_amount', 'state', 'date']
      });
    } catch (error) {
      throw handleOdooError(error, 'getExpenses');
    }
  }

  // Métodos para Finanzas - Banca
  async getBankAccounts() {
    try {
      return await this.callMethod('account.journal', 'search_read', 
        [['type', '=', 'bank']], {
        fields: ['name', 'bank_account_id', 'currency_id', 'company_id']
      });
    } catch (error) {
      throw handleOdooError(error, 'getBankAccounts');
    }
  }

  // Métodos para gestión de caché
  clearSessionCache(): void {
    if (this.session_id) {
      cacheService.invalidatePattern(this.session_id);
    }
  }

  clearSpecificCache(type: 'sales_orders' | 'customers' | 'campaigns' | 'leads'): void {
    if (this.session_id) {
      const cacheKey = `${type}_${this.session_id}`;
      cacheService.delete(cacheKey);
    }
  }

  refreshData(type: 'sales_orders' | 'customers' | 'campaigns' | 'leads'): Promise<any[]> {
    this.clearSpecificCache(type);
    
    switch (type) {
      case 'sales_orders':
        return this.getSalesOrders();
      case 'customers':
        return this.getCustomers();
      case 'campaigns':
        return this.getCampaigns();
      case 'leads':
        return this.getLeads();
      default:
        throw new Error(`Tipo de datos no válido: ${type}`);
    }
  }

  getCacheStats(): any {
    return cacheService.getStats();
  }

  // Método para probar la conexión con Odoo
  async testConnection(): Promise<boolean> {
    try {
      // Simular una prueba de conexión básica
      const response = await fetch('/web/database/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Error de conexión: ${response.status} ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error al probar conexión:', error);
      throw new Error('No se pudo conectar con el servidor Odoo. Verifique la configuración de red.');
    }
  }
}

// Asegúrate de exportar la clase correctamente
const odooService = new OdooService();
// Intentar restaurar la sesión al inicializar
odooService.restoreSession();

export default odooService;