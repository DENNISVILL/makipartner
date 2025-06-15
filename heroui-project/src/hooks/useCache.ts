import { useState, useEffect, useCallback } from 'react';
import cacheService from '../services/cacheService';

interface UseCacheOptions {
  ttl?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
  isFromCache: boolean;
}

/**
 * Hook personalizado para gestionar datos con caché
 * @param key Clave única para el caché
 * @param fetcher Función que obtiene los datos
 * @param options Opciones de configuración
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheReturn<T> {
  const { ttl = 5 * 60 * 1000, autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar obtener datos del caché primero
      if (!forceRefresh) {
        const cachedData = cacheService.get<T>(key);
        if (cachedData !== null) {
          setData(cachedData);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }
      
      // Si no hay datos en caché o se fuerza la actualización, obtener datos frescos
      setIsFromCache(false);
      const freshData = await fetcher();
      
      // Guardar en caché
      cacheService.set(key, freshData, ttl);
      setData(freshData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  const refresh = useCallback(() => loadData(true), [loadData]);
  
  const clearCache = useCallback(() => {
    cacheService.delete(key);
  }, [key]);

  // Cargar datos inicialmente
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData(true);
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    isFromCache
  };
}

/**
 * Hook para gestionar múltiples fuentes de datos con caché
 */
export function useMultiCache<T extends Record<string, any>>(
  sources: Record<keyof T, { key: string; fetcher: () => Promise<T[keyof T]>; ttl?: number }>
): {
  data: Partial<T>;
  loading: boolean;
  errors: Record<keyof T, Error | null>;
  refresh: (sourceKey?: keyof T) => Promise<void>;
  clearCache: (sourceKey?: keyof T) => void;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<keyof T, Error | null>>({} as Record<keyof T, Error | null>);

  const loadData = useCallback(async (sourceKey?: keyof T) => {
    const sourcesToLoad = sourceKey ? [sourceKey] : Object.keys(sources) as (keyof T)[];
    
    setLoading(true);
    
    const promises = sourcesToLoad.map(async (key) => {
      try {
        const source = sources[key];
        const result = await cacheService.getOrSet(
          source.key,
          source.fetcher,
          source.ttl
        );
        
        setData(prev => ({ ...prev, [key]: result }));
        setErrors(prev => ({ ...prev, [key]: null }));
      } catch (error) {
        setErrors(prev => ({ 
          ...prev, 
          [key]: error instanceof Error ? error : new Error('Error desconocido')
        }));
      }
    });
    
    await Promise.allSettled(promises);
    setLoading(false);
  }, [sources]);

  const refresh = useCallback((sourceKey?: keyof T) => {
    if (sourceKey) {
      cacheService.delete(sources[sourceKey].key);
    } else {
      Object.values(sources).forEach(source => {
        cacheService.delete(source.key);
      });
    }
    return loadData(sourceKey);
  }, [sources, loadData]);

  const clearCache = useCallback((sourceKey?: keyof T) => {
    if (sourceKey) {
      cacheService.delete(sources[sourceKey].key);
    } else {
      Object.values(sources).forEach(source => {
        cacheService.delete(source.key);
      });
    }
  }, [sources]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    errors,
    refresh,
    clearCache
  };
}

/**
 * Hook para obtener estadísticas del caché
 */
export function useCacheStats() {
  const [stats, setStats] = useState(cacheService.getStats());
  
  const refreshStats = useCallback(() => {
    setStats(cacheService.getStats());
  }, []);
  
  useEffect(() => {
    const interval = setInterval(refreshStats, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, [refreshStats]);
  
  return {
    ...stats,
    refresh: refreshStats,
    clearAll: () => {
      cacheService.clear();
      refreshStats();
    }
  };
}