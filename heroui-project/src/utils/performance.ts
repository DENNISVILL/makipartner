import { lazy, ComponentType, LazyExoticComponent } from 'react';

// Utilidades para lazy loading de componentes
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return lazy(importFunc);
};

// Lazy loading de páginas principales
export const LazyPages = {
  Dashboard: createLazyComponent(() => import('../pages/dashboard')),
  Finance: createLazyComponent(() => import('../pages/finance')),
  Sales: createLazyComponent(() => import('../pages/sales')),
  CRM: createLazyComponent(() => import('../pages/crm')),
  Inventory: createLazyComponent(() => import('../pages/inventory')),
  HR: createLazyComponent(() => import('../pages/human-resources')),
  Projects: createLazyComponent(() => import('../pages/projects')),
  Marketing: createLazyComponent(() => import('../pages/marketing')),
  Settings: createLazyComponent(() => import('../pages/system-settings')),
  Profile: createLazyComponent(() => import('../pages/my-account'))
};

// Hook para memoización inteligente
export const useSmartMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (prev: T, next: T) => boolean
): T => {
  const [memoizedValue, setMemoizedValue] = React.useState<T>(factory);
  const prevDeps = React.useRef<React.DependencyList>(deps);
  const prevValue = React.useRef<T>(memoizedValue);

  React.useEffect(() => {
    const hasChanged = deps.some((dep, index) => {
      const prevDep = prevDeps.current[index];
      return isEqual ? !isEqual(prevDep as T, dep as T) : prevDep !== dep;
    });

    if (hasChanged) {
      const newValue = factory();
      setMemoizedValue(newValue);
      prevValue.current = newValue;
      prevDeps.current = deps;
    }
  }, deps);

  return memoizedValue;
};

// Debounce hook para optimizar búsquedas
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook para eventos frecuentes
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = React.useRef(Date.now());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
};

// Hook para intersección (lazy loading de imágenes/componentes)
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
};

// Componente para lazy loading de imágenes
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}> = ({ src, alt, className = '', placeholder = '/placeholder.svg' }) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const isInView = useIntersectionObserver(imgRef);

  React.useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src, isLoaded]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`}
    />
  );
};

// Cache en memoria para datos frecuentemente accedidos
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    // Si el cache está lleno, eliminar el elemento más antiguo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Instancia global del cache
export const memoryCache = new MemoryCache();

// Hook para usar el cache de memoria
export const useMemoryCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    // Verificar cache primero
    const cachedData = memoryCache.get(key);
    if (cachedData) {
      setData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      memoryCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = React.useCallback(() => {
    memoryCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return { data, isLoading, error, refetch: fetchData, invalidate };
};

// Utilidades para optimización de renders
export const preventUnnecessaryRenders = {
  // Wrapper para componentes que no necesitan re-renderizar frecuentemente
  memo: <P extends object>(Component: React.ComponentType<P>) => {
    return React.memo(Component, (prevProps, nextProps) => {
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    });
  },

  // Callback estable que no cambia entre renders
  stableCallback: <T extends (...args: any[]) => any>(callback: T): T => {
    const callbackRef = React.useRef(callback);
    callbackRef.current = callback;

    return React.useCallback(
      ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
      []
    );
  }
};

// Monitor de rendimiento
export const performanceMonitor = {
  // Medir tiempo de ejecución de funciones
  measureTime: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`❌ ${name} (error): ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  },

  // Medir métricas de rendimiento web
  measureWebVitals: () => {
    if ('performance' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('🎯 LCP:', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('⚡ FID:', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('📐 CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }
};

export default {
  LazyPages,
  useSmartMemo,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  LazyImage,
  memoryCache,
  useMemoryCache,
  preventUnnecessaryRenders,
  performanceMonitor
};