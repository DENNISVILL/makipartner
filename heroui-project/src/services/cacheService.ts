interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
  etag?: string;
  lastModified?: string;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
  private maxCacheSize = 100; // Número máximo de elementos en caché
  private persistentKeys: Set<string> = new Set(); // Claves que deben persistir entre sesiones
  private storagePrefix = 'maki_cache_';
  private isStorageAvailable: boolean;

  constructor() {
    this.isStorageAvailable = this.checkStorageAvailability();
    this.loadPersistedCache();
    this.setupStorageListener();
  }

  /**
   * Verifica si el almacenamiento local está disponible
   */
  private checkStorageAvailability(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Configura un listener para sincronizar caché entre pestañas
   */
  private setupStorageListener(): void {
    if (!this.isStorageAvailable) return;

    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.storagePrefix)) {
        const cacheKey = event.key.substring(this.storagePrefix.length);
        if (event.newValue === null) {
          // Elemento eliminado en otra pestaña
          this.cache.delete(cacheKey);
        } else if (event.newValue) {
          // Elemento actualizado en otra pestaña
          try {
            const item = JSON.parse(event.newValue);
            this.cache.set(cacheKey, item);
          } catch (e) {
            console.error('Error parsing cache item from storage', e);
          }
        }
      }
    });
  }

  /**
   * Carga el caché persistente desde localStorage
   */
  private loadPersistedCache(): void {
    if (!this.isStorageAvailable) return;

    try {
      // Cargar claves persistentes
      const persistentKeysStr = localStorage.getItem(`${this.storagePrefix}persistent_keys`);
      if (persistentKeysStr) {
        const keys = JSON.parse(persistentKeysStr);
        this.persistentKeys = new Set(keys);
      }

      // Cargar elementos de caché persistentes
      for (const key of this.persistentKeys) {
        const itemStr = localStorage.getItem(`${this.storagePrefix}${key}`);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          // Verificar si el elemento ha expirado
          const now = Date.now();
          if (now - item.timestamp <= item.expiry) {
            this.cache.set(key, item);
          } else {
            // Eliminar elementos expirados
            localStorage.removeItem(`${this.storagePrefix}${key}`);
          }
        }
      }
    } catch (e) {
      console.error('Error loading persisted cache', e);
    }
  }

  /**
   * Persiste un elemento de caché en localStorage
   */
  private persistCacheItem(key: string, item: CacheItem<any>): void {
    if (!this.isStorageAvailable || !this.persistentKeys.has(key)) return;

    try {
      localStorage.setItem(`${this.storagePrefix}${key}`, JSON.stringify(item));
    } catch (e) {
      console.error('Error persisting cache item', e);
    }
  }

  /**
   * Actualiza la lista de claves persistentes en localStorage
   */
  private updatePersistentKeys(): void {
    if (!this.isStorageAvailable) return;

    try {
      localStorage.setItem(
        `${this.storagePrefix}persistent_keys`,
        JSON.stringify(Array.from(this.persistentKeys))
      );
    } catch (e) {
      console.error('Error updating persistent keys', e);
    }
  }

  /**
   * Limpia elementos antiguos cuando se alcanza el tamaño máximo
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    // Ordenar por timestamp (más antiguos primero)
    const entries = Array.from(this.cache.entries())
      .filter(([key]) => !this.persistentKeys.has(key)) // No eliminar elementos persistentes
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Eliminar los más antiguos hasta estar por debajo del límite
    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    for (const [key] of toRemove) {
      this.delete(key);
    }
  }

  /**
   * Almacena datos en caché con un tiempo de vida específico
   * @param key Clave única para identificar los datos
   * @param data Datos a almacenar
   * @param ttl Tiempo de vida en milisegundos (opcional)
   * @param options Opciones adicionales (etag, lastModified, persistent)
   */
  set<T>(
    key: string,
    data: T,
    ttl?: number,
    options?: { etag?: string; lastModified?: string; persistent?: boolean }
  ): void {
    const expiry = ttl || this.defaultTTL;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry,
      etag: options?.etag,
      lastModified: options?.lastModified
    };

    this.cache.set(key, item);

    // Manejar persistencia
    if (options?.persistent) {
      this.persistentKeys.add(key);
      this.updatePersistentKeys();
      this.persistCacheItem(key, item);
    }

    // Limpiar caché si es necesario
    this.enforceMaxSize();

    // Programar limpieza automática
    setTimeout(() => {
      this.delete(key);
    }, expiry);
  }

  /**
   * Obtiene datos del caché si están disponibles y no han expirado
   * @param key Clave de los datos a obtener
   * @returns Los datos almacenados o null si no existen o han expirado
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiry;

    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Obtiene el elemento completo de caché incluyendo metadatos
   * @param key Clave de los datos a obtener
   */
  getWithMetadata<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiry;

    if (isExpired) {
      this.delete(key);
      return null;
    }

    return item as CacheItem<T>;
  }

  /**
   * Verifica si una clave existe en el caché y no ha expirado
   * @param key Clave a verificar
   * @returns true si existe y es válida, false en caso contrario
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Elimina una entrada específica del caché
   * @param key Clave a eliminar
   */
  delete(key: string): void {
    this.cache.delete(key);

    // Eliminar de persistencia si es necesario
    if (this.persistentKeys.has(key)) {
      this.persistentKeys.delete(key);
      this.updatePersistentKeys();

      if (this.isStorageAvailable) {
        localStorage.removeItem(`${this.storagePrefix}${key}`);
      }
    }
  }

  /**
   * Limpia todo el caché
   * @param includePersistent Si se deben eliminar también los elementos persistentes
   */
  clear(includePersistent: boolean = false): void {
    if (includePersistent) {
      // Eliminar todo, incluidos elementos persistentes
      this.cache.clear();

      if (this.isStorageAvailable) {
        for (const key of this.persistentKeys) {
          localStorage.removeItem(`${this.storagePrefix}${key}`);
        }
        localStorage.removeItem(`${this.storagePrefix}persistent_keys`);
      }

      this.persistentKeys.clear();
    } else {
      // Eliminar solo elementos no persistentes
      for (const key of this.cache.keys()) {
        if (!this.persistentKeys.has(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Obtiene el tamaño actual del caché
   * @returns Número de elementos en caché
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Obtiene todas las claves en el caché
   * @returns Array de claves
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Obtiene o establece datos usando una función de carga
   * @param key Clave única
   * @param loader Función que carga los datos si no están en caché
   * @param ttl Tiempo de vida opcional
   * @param options Opciones adicionales
   * @returns Promise con los datos
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number,
    options?: { etag?: string; lastModified?: string; persistent?: boolean }
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await loader();
      this.set(key, data, ttl, options);
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Configura el tiempo de vida predeterminado para nuevos elementos
   * @param ttl Tiempo de vida en milisegundos
   */
  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  /**
   * Configura el tamaño máximo del caché
   * @param size Número máximo de elementos
   */
  setMaxSize(size: number): void {
    this.maxCacheSize = size;
    this.enforceMaxSize();
  }

  /**
   * Marca una clave como persistente entre sesiones
   * @param key Clave a persistir
   * @param persistent Si debe ser persistente o no
   */
  setPersistent(key: string, persistent: boolean = true): void {
    if (persistent) {
      this.persistentKeys.add(key);
      const item = this.cache.get(key);
      if (item) {
        this.persistCacheItem(key, item);
      }
    } else {
      this.persistentKeys.delete(key);
      if (this.isStorageAvailable) {
        localStorage.removeItem(`${this.storagePrefix}${key}`);
      }
    }

    this.updatePersistentKeys();
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let persistentCount = 0;
    let totalSize = 0;

    // Calcular estadísticas
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.expiry) {
        expiredCount++;
      }
      if (this.persistentKeys.has(key)) {
        persistentCount++;
      }
      // Estimación aproximada del tamaño
      try {
        totalSize += JSON.stringify(item).length;
      } catch (e) {
        // Ignorar errores
      }
    }

    return {
      totalItems: this.cache.size,
      expiredItems: expiredCount,
      persistentItems: persistentCount,
      maxSize: this.maxCacheSize,
      defaultTTL: this.defaultTTL,
      estimatedSizeBytes: totalSize,
      storageAvailable: this.isStorageAvailable
    };
  }
}

// Exportar una instancia única
const cacheService = new CacheService();
export default cacheService;