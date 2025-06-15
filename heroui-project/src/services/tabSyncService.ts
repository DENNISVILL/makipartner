/**
 * Servicio para sincronizar el estado de autenticación entre pestañas
 * Utiliza localStorage y eventos de almacenamiento para comunicarse entre pestañas
 */

interface SyncMessage {
  type: 'AUTH_STATE_CHANGE' | 'LOGOUT_ALL' | 'SESSION_EXPIRED';
  timestamp: number;
  data?: any;
}

class TabSyncService {
  private readonly SYNC_KEY = 'auth_sync_message';
  private readonly listeners: Map<string, Array<(data?: any) => void>> = new Map();

  constructor() {
    // Escuchar eventos de almacenamiento (cambios en localStorage desde otras pestañas)
    window.addEventListener('storage', this.handleStorageEvent);
  }

  /**
   * Maneja eventos de almacenamiento (cambios en localStorage desde otras pestañas)
   */
  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== this.SYNC_KEY || !event.newValue) return;

    try {
      const message: SyncMessage = JSON.parse(event.newValue);
      this.notifyListeners(message.type, message.data);
    } catch (error) {
      console.error('Error parsing sync message:', error);
    }
  };

  /**
   * Notifica a los listeners registrados para un tipo de mensaje específico
   */
  private notifyListeners(type: string, data?: any) {
    const typeListeners = this.listeners.get(type) || [];
    typeListeners.forEach(listener => listener(data));
  }

  /**
   * Envía un mensaje a todas las pestañas (incluida la actual)
   */
  public sendMessage(type: SyncMessage['type'], data?: any) {
    const message: SyncMessage = {
      type,
      timestamp: Date.now(),
      data
    };

    // Guardar en localStorage para que otras pestañas reciban el evento
    localStorage.setItem(this.SYNC_KEY, JSON.stringify(message));
    
    // Notificar a los listeners en la pestaña actual
    this.notifyListeners(type, data);
  }

  /**
   * Registra un listener para un tipo de mensaje específico
   * @returns Función para cancelar la suscripción
   */
  public subscribe(type: SyncMessage['type'], callback: (data?: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }

    const typeListeners = this.listeners.get(type)!;
    typeListeners.push(callback);

    return () => {
      const index = typeListeners.indexOf(callback);
      if (index !== -1) {
        typeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifica a todas las pestañas sobre un cambio en el estado de autenticación
   */
  public notifyAuthStateChange(isAuthenticated: boolean) {
    this.sendMessage('AUTH_STATE_CHANGE', { isAuthenticated });
  }

  /**
   * Notifica a todas las pestañas que deben cerrar sesión
   */
  public notifyLogoutAll() {
    this.sendMessage('LOGOUT_ALL');
  }

  /**
   * Notifica a todas las pestañas que la sesión ha expirado
   */
  public notifySessionExpired() {
    this.sendMessage('SESSION_EXPIRED');
  }

  /**
   * Limpia los recursos utilizados por el servicio
   */
  public destroy() {
    window.removeEventListener('storage', this.handleStorageEvent);
    this.listeners.clear();
  }
}

// Exportar una instancia única
const tabSyncService = new TabSyncService();
export default tabSyncService;