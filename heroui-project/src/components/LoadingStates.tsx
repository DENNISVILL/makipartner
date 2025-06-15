import React from 'react';
import { Spinner, Card, CardBody, Skeleton, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

// Componente de loading básico
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}> = ({ size = 'md', label, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Spinner size={size} color="primary" />
      {label && <p className="text-sm text-foreground-500">{label}</p>}
    </div>
  );
};

// Componente de loading para páginas completas
export const PageLoader: React.FC<{
  message?: string;
}> = ({ message = 'Cargando...' }) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" color="primary" className="mb-4" />
        <h3 className="text-lg font-medium text-foreground-700 mb-2">{message}</h3>
        <p className="text-sm text-foreground-500">Por favor espera un momento</p>
      </div>
    </div>
  );
};

// Componente de skeleton para cards
export const CardSkeleton: React.FC<{
  lines?: number;
  showAvatar?: boolean;
}> = ({ lines = 3, showAvatar = false }) => {
  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          {showAvatar && (
            <Skeleton className="rounded-full w-12 h-12" />
          )}
          <div className="flex-1 space-y-2">
            {Array.from({ length: lines }).map((_, index) => (
              <Skeleton
                key={index}
                className={`h-4 rounded ${
                  index === lines - 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Componente de skeleton para tablas
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
}> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex gap-4 p-4 bg-content2 rounded-lg">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full rounded" />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b border-divider">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-4 rounded ${
                colIndex === 0 ? 'w-1/4' : colIndex === columns - 1 ? 'w-1/6' : 'w-full'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Componente de estado vacío
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ icon = 'lucide:inbox', title, description, action }) => {
  return (
    <div className="text-center py-12">
      <Icon icon={icon} className="mx-auto h-12 w-12 text-foreground-400 mb-4" />
      <h3 className="text-lg font-medium text-foreground-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-foreground-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <Button color="primary" onPress={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

// Componente de estado de error
export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ 
  title = 'Algo salió mal', 
  description = 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.', 
  onRetry,
  retryLabel = 'Reintentar'
}) => {
  return (
    <div className="text-center py-12">
      <Icon icon="lucide:alert-circle" className="mx-auto h-12 w-12 text-danger mb-4" />
      <h3 className="text-lg font-medium text-foreground-700 mb-2">{title}</h3>
      <p className="text-sm text-foreground-500 mb-6 max-w-sm mx-auto">{description}</p>
      {onRetry && (
        <Button color="danger" variant="flat" onPress={onRetry}>
          <Icon icon="lucide:refresh-cw" className="mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

// Hook para manejo de estados de carga
export const useLoadingState = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);

  const execute = React.useCallback(async (asyncFunction: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset
  };
};

// Componente wrapper para manejo automático de estados
export const AsyncWrapper: React.FC<{
  isLoading: boolean;
  error: string | null;
  data: any;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
}> = ({ 
  isLoading, 
  error, 
  data, 
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  children 
}) => {
  if (isLoading) {
    return loadingComponent || <PageLoader />;
  }

  if (error) {
    return errorComponent || <ErrorState description={error} onRetry={onRetry} />;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return emptyComponent || (
      <EmptyState 
        title="No hay datos disponibles" 
        description="No se encontraron elementos para mostrar."
      />
    );
  }

  return <>{children}</>;
};

// Componente de progreso para operaciones largas
export const ProgressLoader: React.FC<{
  progress: number;
  label?: string;
  description?: string;
}> = ({ progress, label, description }) => {
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-content3"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${progress}, 100`}
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
      {label && <h3 className="text-lg font-medium text-foreground-700 mb-2">{label}</h3>}
      {description && <p className="text-sm text-foreground-500">{description}</p>}
    </div>
  );
};

export default {
  LoadingSpinner,
  PageLoader,
  CardSkeleton,
  TableSkeleton,
  EmptyState,
  ErrorState,
  AsyncWrapper,
  ProgressLoader,
  useLoadingState
};