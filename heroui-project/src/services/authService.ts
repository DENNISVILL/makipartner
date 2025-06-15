import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import cacheService from './cacheService';
import tabSyncService from './tabSyncService';
import logger from './logger';
import { handleApiError } from '../utils/errorHandler';

interface TokenPayload {
  exp: number;
  iat: number;
  jti: string;
  type: string;
  user_id: number;
  [key: string]: any;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  last_login?: string;
  [key: string]: any;
}

interface LoginCredentials {
  username: string;
  password: string;
  database?: string;
  remember_me?: boolean;
}

interface SessionInfo {
  isAuthenticated: boolean;
  user: UserData | null;
  expiresAt: number | null;
  isRefreshing: boolean;
  autoRefresh: boolean;
}

class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';
  private readonly AUTO_REFRESH_KEY = 'auto_refresh';
  private readonly TOKEN_TYPE_KEY = 'token_type';
  
  private readonly API_URL: string;
  private refreshPromise: Promise<AuthTokens> | null = null;
  private refreshTimeoutId: number | null = null;
  private csrfRenewIntervalId: number | null = null;
  private sessionListeners: Array<(session: SessionInfo) => void> = [];
  private sessionInfo: SessionInfo = {
    isAuthenticated: false,
    user: null,
    expiresAt: null,
    isRefreshing: false,
    autoRefresh: true
  };

  constructor(apiUrl: string) {
    this.API_URL = apiUrl;
    this.initializeFromStorage();
    this.setupAxiosInterceptors();
  }

  /**
   * Inicializa el servicio con datos almacenados en localStorage
   */
  private initializeFromStorage(): void {
    try {
      // Recuperar tokens
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const tokenType = localStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
      const autoRefreshStr = localStorage.getItem(this.AUTO_REFRESH_KEY);
      
      // Configurar auto-refresh
      this.sessionInfo.autoRefresh = autoRefreshStr ? autoRefreshStr === 'true' : true;
      
      // Si no hay token de acceso, no hay sesión activa
      if (!accessToken) {
        logger.info('No se encontró token de acceso al inicializar');
        return;
      }
      
      // Verificar integridad de los datos de autenticación
      if (!this.verifyAuthDataIntegrity()) {
        logger.warn('Posible manipulación de datos de autenticación detectada');
        this.clearSession(false);
        return;
      }
      
      // Decodificar token para obtener información
      const payload = this.decodeToken(accessToken);
      if (!payload) {
        logger.warn('No se pudo decodificar el token al inicializar');
        this.clearSession(false);
        return;
      }
      
      // Verificar si el token ha expirado
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        logger.info('Token expirado al inicializar, intentando renovar');
        // Si hay token de refresco, intentar renovar la sesión
        if (refreshToken) {
          this.refreshSession(true).catch(error => {
            logger.error('Error al renovar sesión durante inicialización:', error);
          });
        } else {
          logger.warn('Token expirado y no hay token de refresco disponible');
          this.clearSession(false);
        }
        return;
      }
      
      // Recuperar datos del usuario
      const userDataStr = localStorage.getItem(this.USER_DATA_KEY);
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      if (!userData) {
        logger.warn('No se encontraron datos de usuario al inicializar');
        this.clearSession(false);
        return;
      }
      
      // Actualizar estado de la sesión
      this.sessionInfo = {
        isAuthenticated: true,
        user: userData,
        expiresAt: payload.exp * 1000, // Convertir a milisegundos
        isRefreshing: false,
        autoRefresh: this.sessionInfo.autoRefresh
      };
      
      // Programar renovación automática si está habilitada
      if (this.sessionInfo.autoRefresh && !isExpired) {
        this.scheduleTokenRefresh();
        
        // Iniciar renovación automática de token CSRF
        this.startCsrfAutoRenewal();
      }
      
      // Notificar a los listeners
      this.notifySessionListeners();
      logger.info('Servicio de autenticación inicializado correctamente');
      
      // Configurar listener para eventos de sincronización entre pestañas
      this.setupTabSyncListeners();
    } catch (error) {
      logger.error('Error al inicializar servicio de autenticación:', error);
      this.clearSession(false);
    }
  }
  
  /**
   * Configura listeners para eventos de sincronización entre pestañas
   */
  private setupTabSyncListeners(): void {
    // Escuchar cambios de estado de autenticación desde otras pestañas
    tabSyncService.subscribe('AUTH_STATE_CHANGE', (data) => {
      if (data && typeof data.isAuthenticated === 'boolean') {
        if (!data.isAuthenticated && this.sessionInfo.isAuthenticated) {
          // Si otra pestaña cerró sesión, cerrar sesión en esta también
          this.clearSession();
        } else if (data.isAuthenticated && !this.sessionInfo.isAuthenticated) {
          // Si otra pestaña inició sesión, actualizar estado
          this.restoreSession();
        }
      }
    });
    
    // Escuchar solicitudes de cierre de sesión global
    tabSyncService.subscribe('LOGOUT_ALL', () => {
      if (this.sessionInfo.isAuthenticated) {
        this.clearSession();
      }
    });
    
    // Escuchar notificaciones de sesión expirada
    tabSyncService.subscribe('SESSION_EXPIRED', () => {
      if (this.sessionInfo.isAuthenticated) {
        this.clearSession();
      }
    });
    
    // Escuchar eventos de almacenamiento para detectar cambios en el token CSRF
    window.addEventListener('storage', (event) => {
      if (event.key === 'csrf_token' && event.newValue && this.isAuthenticated()) {
        logger.debug('Token CSRF actualizado en otra pestaña');
        // No es necesario hacer nada más, ya que el token se lee de localStorage en cada solicitud
      }
    });
  }

  /**
   * Configura interceptores de Axios para manejar tokens y errores
   */
  private setupAxiosInterceptors(): void {
    // Interceptor de solicitud para añadir token de autenticación y CSRF
    axios.interceptors.request.use(
      (config) => {
        // Verificar integridad de los datos de autenticación antes de cada solicitud
        if (!this.verifyAuthDataIntegrity() && this.isAuthenticated()) {
          logger.warn('Posible manipulación de datos de autenticación detectada durante solicitud');
          this.clearSession();
          return Promise.reject(new Error('Sesión inválida'));
        }
        
        const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        const tokenType = localStorage.getItem(this.TOKEN_TYPE_KEY) || 'Bearer';
        
        if (accessToken && config.headers) {
          // Añadir token de autenticación
          config.headers['Authorization'] = `${tokenType} ${accessToken}`;
          
          // Añadir encabezados para protección CSRF
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          
          // Añadir token CSRF si existe
          const csrfToken = localStorage.getItem('csrf_token');
          if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
          }
        }
        
        return config;
      },
      (error) => {
        logger.error('Error en interceptor de solicitud:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor de respuesta para manejar errores de autenticación
    axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Si no hay configuración original o ya se intentó renovar, rechazar
        if (!originalRequest || originalRequest._retry) {
          return Promise.reject(error);
        }
        
        // Manejar diferentes tipos de errores de autenticación
        if (error.response) {
          switch (error.response.status) {
            // Error 401: No autorizado
            case 401:
              if (localStorage.getItem(this.REFRESH_TOKEN_KEY)) {
                originalRequest._retry = true;
                
                try {
                  logger.info('Renovando token tras error 401...');
                  // Intentar renovar el token
                  const tokens = await this.refreshSession(true);
                  
                  // Actualizar el token en la solicitud original y reintentarla
                  if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = `${tokens.token_type} ${tokens.access_token}`;
                  }
                  
                  return axios(originalRequest);
                } catch (refreshError) {
                  // Si falla la renovación, cerrar sesión
                  logger.error('Error al renovar token tras 401:', refreshError);
                  this.logout();
                  tabSyncService.notifySessionExpired();
                  return Promise.reject(refreshError);
                }
              } else {
                // No hay token de refresco, cerrar sesión
                logger.warn('Error 401 sin token de refresco disponible');
                this.clearSession();
                tabSyncService.notifySessionExpired();
              }
              break;
              
            // Error 403: Prohibido (posible token inválido o manipulado)
            case 403:
              logger.warn('Error 403: Posible token inválido o permisos insuficientes');
              break;
              
            // Error 419: Token expirado (específico de algunos frameworks)
            case 419:
              logger.warn('Error 419: Token expirado');
              if (localStorage.getItem(this.REFRESH_TOKEN_KEY)) {
                try {
                  await this.refreshSession(true);
                } catch (error) {
                  this.clearSession();
                  tabSyncService.notifySessionExpired();
                }
              }
              break;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Decodifica un token JWT
   * @param token Token JWT a decodificar
   * @returns Payload del token o null si es inválido
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Programa la renovación automática del token antes de que expire
   */
  private scheduleTokenRefresh(): void {
    // Cancelar cualquier temporizador existente
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Si no hay información de expiración, no programar
    if (!this.sessionInfo.expiresAt) return;
    
    const now = Date.now();
    const expiresAt = this.sessionInfo.expiresAt;
    
    // Calcular tiempo hasta la expiración (en ms)
    const timeUntilExpiry = expiresAt - now;
    
    // Programar renovación al 80% del tiempo de vida del token
    const refreshTime = Math.max(timeUntilExpiry * 0.8, 0);
    
    // Programar renovación
    this.refreshTimeoutId = window.setTimeout(() => {
      this.refreshSession().catch(error => {
        console.error('Error refreshing token:', error);
      });
    }, refreshTime);
  }

  /**
   * Notifica a todos los listeners sobre cambios en la sesión
   */
  private notifySessionListeners(): void {
    for (const listener of this.sessionListeners) {
      listener({ ...this.sessionInfo });
    }
  }

  /**
   * Inicia sesión con credenciales
   * @param credentials Credenciales de inicio de sesión
   * @returns Información del usuario autenticado
   */
  async login(credentials: LoginCredentials): Promise<UserData> {
    try {
      this.sessionInfo.isRefreshing = true;
      this.notifySessionListeners();
      
      logger.info('Iniciando sesión...', { username: credentials.username, database: credentials.database });
      
      const response = await axios.post<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        user: UserData;
      }>(`${this.API_URL}/auth/login`, credentials);
      
      const { access_token, refresh_token, token_type, user } = response.data;
      
      // Guardar tokens y datos de usuario con seguridad mejorada
      this.storeAuthData(access_token, refresh_token, token_type, user);
      
      // Si se solicitó recordar credenciales
      if (credentials.remember_me) {
        localStorage.setItem('remember_username', credentials.username);
        localStorage.setItem('remember_database', credentials.database || '');
      } else {
        localStorage.removeItem('remember_username');
        localStorage.removeItem('remember_database');
      }
      
      // Actualizar estado de la sesión
      const payload = this.decodeToken(access_token);
      this.sessionInfo = {
        isAuthenticated: true,
        user,
        expiresAt: payload ? payload.exp * 1000 : null,
        isRefreshing: false,
        autoRefresh: this.sessionInfo.autoRefresh
      };
      
      // Programar renovación automática si está habilitada
      if (this.sessionInfo.autoRefresh) {
        this.scheduleTokenRefresh();
      }
      
      // Iniciar renovación automática de token CSRF
      this.startCsrfAutoRenewal();
      
      // Notificar a los listeners y sincronizar con otras pestañas
      this.notifySessionListeners();
      tabSyncService.notifyAuthStateChange(true);
      
      logger.info('Sesión iniciada correctamente', { userId: user.id, role: user.role });
      
      return user;
    } catch (error) {
      this.sessionInfo.isRefreshing = false;
      this.notifySessionListeners();
      logger.error('Error al iniciar sesión', error);
      throw handleApiError(error as AxiosError);
    }
  }
  
  /**
   * Almacena los datos de autenticación de forma segura
   */
  private storeAuthData(accessToken: string, refreshToken: string, tokenType: string, userData: UserData): void {
    try {
      // Almacenar tokens
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(this.TOKEN_TYPE_KEY, tokenType);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      
      // Registrar timestamp para detección de manipulación
      const timestamp = Date.now().toString();
      localStorage.setItem('auth_timestamp', timestamp);
      
      // Generar token CSRF para protección adicional
      const csrfToken = this.generateCsrfToken();
      localStorage.setItem('csrf_token', csrfToken);
      
      // Calcular y almacenar hash simple para verificación de integridad
      // Nota: Esto no es criptográficamente seguro, pero ayuda contra manipulaciones simples
      const integrityCheck = `${accessToken.substr(0, 10)}:${refreshToken.substr(0, 10)}:${timestamp}:${csrfToken.substr(0, 10)}`;
      localStorage.setItem('auth_integrity', btoa(integrityCheck));
      
      logger.debug('Datos de autenticación almacenados correctamente');
    } catch (error) {
      logger.error('Error al almacenar datos de autenticación', error);
      throw new Error('No se pudieron almacenar los datos de autenticación');
    }
  }
  
  /**
   * Genera un token CSRF aleatorio
   */
  private generateCsrfToken(): string {
    // Generar un token aleatorio de 32 caracteres
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Renueva la sesión usando el token de refresco
   * @param forceRefresh Forzar renovación incluso si hay una en curso
   * @returns Nuevos tokens de autenticación
   */
  async refreshSession(forceRefresh: boolean = false): Promise<AuthTokens> {
    // Si ya hay una renovación en curso y no se fuerza, devolver la promesa existente
    if (this.refreshPromise && !forceRefresh) {
      return this.refreshPromise;
    }
    
    // Obtener token de refresco
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      logger.warn('Intento de renovación de sesión sin token de refresco');
      return Promise.reject(new Error('No hay token de refresco disponible'));
    }
    
    try {
      // Actualizar estado
      this.sessionInfo.isRefreshing = true;
      this.notifySessionListeners();
      logger.info('Renovando sesión...');
      
      // Crear promesa de renovación
      this.refreshPromise = axios.post<AuthTokens>(
        `${this.API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      ).then(response => {
        const { access_token, refresh_token, token_type } = response.data;
        
        // Guardar nuevos tokens con seguridad mejorada
        this.storeAuthData(
          access_token, 
          refresh_token, 
          token_type, 
          this.sessionInfo.user || { id: 0, name: '', email: '', role: '' }
        );
        
        // Actualizar estado de la sesión
        const payload = this.decodeToken(access_token);
        this.sessionInfo = {
          ...this.sessionInfo,
          isAuthenticated: true,
          expiresAt: payload ? payload.exp * 1000 : null,
          isRefreshing: false
        };
        
        // Programar próxima renovación si está habilitada
        if (this.sessionInfo.autoRefresh) {
          this.scheduleTokenRefresh();
        }
        
        // Renovar también el token CSRF para mayor seguridad
        this.renewCsrfToken();
        
        // Notificar a los listeners y sincronizar con otras pestañas
        this.notifySessionListeners();
        tabSyncService.notifyAuthStateChange(true);
        
        logger.info('Sesión y token CSRF renovados correctamente');
        return response.data;
      }).catch(error => {
        // Si falla la renovación, cerrar sesión
        logger.error('Error al renovar sesión:', error);
        this.clearSession();
        
        // Notificar a otras pestañas que la sesión ha expirado
        tabSyncService.notifySessionExpired();
        
        throw handleApiError(error as AxiosError);
      }).finally(() => {
        this.refreshPromise = null;
      });
      
      return this.refreshPromise;
    } catch (error) {
      this.refreshPromise = null;
      this.sessionInfo.isRefreshing = false;
      this.notifySessionListeners();
      logger.error('Error inesperado al renovar sesión:', error);
      throw handleApiError(error as AxiosError);
    }
  }

  /**
   * Cierra la sesión actual
   * @param notifyOtherTabs Si debe notificar a otras pestañas para que también cierren sesión
   */
  async logout(notifyOtherTabs: boolean = false): Promise<void> {
    try {
      logger.info('Cerrando sesión...');
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      // Si hay token de refresco, invalidarlo en el servidor
      if (refreshToken) {
        await axios.post(`${this.API_URL}/auth/logout`, { refresh_token: refreshToken })
          .catch(error => logger.error('Error al cerrar sesión en el servidor:', error));
      }
      
      // Si se solicita, notificar a otras pestañas para que cierren sesión
      if (notifyOtherTabs) {
        tabSyncService.notifyLogoutAll();
      }
    } finally {
      // Limpiar sesión independientemente del resultado
      this.clearSession();
      logger.info('Sesión cerrada correctamente');
    }
  }
  
  /**
   * Cierra la sesión en todas las pestañas
   */
  async logoutAll(): Promise<void> {
    return this.logout(true);
  }

  /**
   * Limpia todos los datos de sesión
   * @param notifyListeners Si debe notificar a los listeners sobre el cambio
   */
  clearSession(notifyListeners: boolean = true): void {
    logger.info('Limpiando datos de sesión...');
    
    // Cancelar renovación de token programada
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    // Detener renovación automática de CSRF
    this.stopCsrfAutoRenewal();
    
    // Eliminar tokens y datos de usuario
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.TOKEN_TYPE_KEY);
    
    // Eliminar datos de seguridad
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth_integrity');
    localStorage.removeItem('csrf_token');
    
    // Eliminar cualquier otro dato relacionado con la autenticación
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('auth_') || key.startsWith('session_'))) {
        keysToRemove.push(key);
      }
    }
    
    // Eliminar en un bucle separado para evitar problemas con el índice
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Mantener configuración de auto-refresh
    const autoRefresh = this.sessionInfo.autoRefresh;
    
    // Actualizar estado de la sesión
    this.sessionInfo = {
      isAuthenticated: false,
      user: null,
      expiresAt: null,
      isRefreshing: false,
      autoRefresh
    };
    
    // Limpiar caché relacionada con el usuario
    cacheService.clear();
    
    // Notificar a los listeners si se solicita
    if (notifyListeners) {
      this.notifySessionListeners();
      tabSyncService.notifyAuthStateChange(false);
    }
    
    logger.info('Datos de sesión eliminados completamente');
  }
  
  /**
   * Verifica la integridad de los datos de autenticación almacenados
   * @returns true si los datos parecen íntegros, false si hay signos de manipulación
   */
  private verifyAuthDataIntegrity(): boolean {
    try {
      logger.debug('Verificando integridad de datos de autenticación...');
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      const timestamp = localStorage.getItem('auth_timestamp');
      const storedIntegrity = localStorage.getItem('auth_integrity');
      const csrfToken = localStorage.getItem('csrf_token');
      
      // Si falta algún dato esencial, la verificación falla
      if (!accessToken || !refreshToken || !timestamp || !storedIntegrity) {
        logger.warn('Verificación de integridad fallida: faltan datos esenciales');
        return false;
      }
      
      // Verificar si el token CSRF existe (para compatibilidad con sesiones antiguas)
      if (csrfToken) {
        // Recalcular hash de integridad con CSRF
        const expectedIntegrity = btoa(`${accessToken.substr(0, 10)}:${refreshToken.substr(0, 10)}:${timestamp}:${csrfToken.substr(0, 10)}`);
        return expectedIntegrity === storedIntegrity;
      } else {
        // Compatibilidad con sesiones anteriores (sin CSRF)
        const expectedIntegrity = btoa(`${accessToken.substr(0, 10)}:${refreshToken.substr(0, 10)}:${timestamp}`);
        const isValid = expectedIntegrity === storedIntegrity;
        
        // Si es válido pero no tiene CSRF, generar uno para futuras verificaciones
        if (isValid) {
          const newCsrfToken = this.generateCsrfToken();
          localStorage.setItem('csrf_token', newCsrfToken);
          // Actualizar el hash de integridad
          const newIntegrity = btoa(`${accessToken.substr(0, 10)}:${refreshToken.substr(0, 10)}:${timestamp}:${newCsrfToken.substr(0, 10)}`);
          localStorage.setItem('auth_integrity', newIntegrity);
          logger.info('Generado nuevo token CSRF para sesión existente');
        }
        
        return isValid;
      }
    } catch (error) {
      logger.error('Error al verificar integridad de datos de autenticación', error);
      return false;
    }
  }

  /**
   * Activa o desactiva la renovación automática de tokens
   * @param enable Si debe habilitarse la renovación automática
   */
  setAutoRefresh(enable: boolean): void {
    this.sessionInfo.autoRefresh = enable;
    localStorage.setItem(this.AUTO_REFRESH_KEY, enable.toString());
    
    // Si se habilita y hay sesión activa, programar renovación
    if (enable && this.sessionInfo.isAuthenticated) {
      this.scheduleTokenRefresh();
    } else if (!enable && this.refreshTimeoutId !== null) {
      // Si se deshabilita, cancelar renovación programada
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
    
    this.notifySessionListeners();
  }

  /**
   * Obtiene el estado actual de la sesión
   * @returns Información de la sesión
   */
  getSessionInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  /**
   * Suscribe un listener para recibir actualizaciones de la sesión
   * @param listener Función a llamar cuando cambie la sesión
   * @returns Función para cancelar la suscripción
   */
  subscribeToSession(listener: (session: SessionInfo) => void): () => void {
    this.sessionListeners.push(listener);
    
    // Notificar estado actual inmediatamente
    listener({ ...this.sessionInfo });
    
    // Devolver función para cancelar suscripción
    return () => {
      this.sessionListeners = this.sessionListeners.filter(l => l !== listener);
    };
  }

  /**
   * Verifica si hay una sesión activa
   * @returns true si hay una sesión autenticada
   */
  isAuthenticated(): boolean {
    return this.sessionInfo.isAuthenticated;
  }

  /**
   * Obtiene el usuario actual
   * @returns Datos del usuario o null si no hay sesión
   */
  getCurrentUser(): UserData | null {
    return this.sessionInfo.user;
  }

  /**
   * Obtiene el tiempo de expiración de la sesión
   * @returns Timestamp de expiración en milisegundos o null
   */
  getSessionExpiry(): number | null {
    return this.sessionInfo.expiresAt;
  }

  /**
   * Verifica si la sesión está por expirar
   * @param thresholdMinutes Umbral en minutos para considerar próxima a expirar
   * @returns true si la sesión expira dentro del umbral
   */
  isSessionExpiringSoon(thresholdMinutes: number = 5): boolean {
    if (!this.sessionInfo.expiresAt) return false;
    
    const now = Date.now();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    
    return this.sessionInfo.expiresAt - now < thresholdMs;
  }

  /**
   * Obtiene el token de acceso actual
   * @returns Token de acceso o null si no hay sesión
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }
  
  /**
   * Obtiene el token CSRF actual
   * @returns Token CSRF o null si no existe
   */
  getCsrfToken(): string | null {
    return localStorage.getItem('csrf_token');
  }
  
  /**
   * Renueva el token CSRF y actualiza el hash de integridad
   * Útil para operaciones críticas o después de un período de tiempo
   * @returns Nuevo token CSRF generado
   */
  renewCsrfToken(): string {
    logger.info('Renovando token CSRF...');
    
    // Generar nuevo token CSRF
    const newCsrfToken = this.generateCsrfToken();
    localStorage.setItem('csrf_token', newCsrfToken);
    
    // Actualizar hash de integridad
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const timestamp = localStorage.getItem('auth_timestamp');
    
    if (accessToken && refreshToken && timestamp) {
      const newIntegrity = btoa(`${accessToken.substr(0, 10)}:${refreshToken.substr(0, 10)}:${timestamp}:${newCsrfToken.substr(0, 10)}`);
      localStorage.setItem('auth_integrity', newIntegrity);
    }
    
    return newCsrfToken;
  }
  
  /**
   * Inicia la renovación automática del token CSRF
   * @param intervalMinutes Intervalo en minutos entre renovaciones (por defecto 30 minutos)
   */
  startCsrfAutoRenewal(intervalMinutes: number = 30): void {
    // Detener intervalo existente si hay uno
    this.stopCsrfAutoRenewal();
    
    // Convertir minutos a milisegundos
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Iniciar intervalo de renovación
    this.csrfRenewIntervalId = window.setInterval(() => {
      // Solo renovar si hay una sesión activa
      if (this.isAuthenticated()) {
        logger.debug(`Renovación automática de token CSRF (intervalo: ${intervalMinutes} minutos)`);
        this.renewCsrfToken();
      } else {
        // Si no hay sesión activa, detener la renovación
        this.stopCsrfAutoRenewal();
      }
    }, intervalMs);
    
    logger.info(`Renovación automática de token CSRF iniciada (cada ${intervalMinutes} minutos)`);
  }
  
  /**
   * Detiene la renovación automática del token CSRF
   */
  stopCsrfAutoRenewal(): void {
    if (this.csrfRenewIntervalId !== null) {
      window.clearInterval(this.csrfRenewIntervalId);
      this.csrfRenewIntervalId = null;
      logger.info('Renovación automática de token CSRF detenida');
    }
  }
}

// Exportar una instancia única
const authService = new AuthService(process.env.REACT_APP_API_URL || '/api');
export default authService;
export type { LoginCredentials, UserData, SessionInfo };