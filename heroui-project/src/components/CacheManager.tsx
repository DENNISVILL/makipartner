import React from 'react';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useCacheStats } from '../hooks/useCache';
import cacheService from '../services/cacheService';

interface CacheManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ isOpen = true }) => {
  const { size, keys, oldestEntry, newestEntry, refresh, clearAll } = useCacheStats();

  const handleClearSpecific = (key: string) => {
    cacheService.delete(key);
    refresh();
  };

  const handleClearAll = () => {
    clearAll();
  };

  const formatKey = (key: string) => {
    // Extraer información útil de la clave
    const parts = key.split('_');
    if (parts.length >= 2) {
      return {
        type: parts[0],
        session: parts[1]?.substring(0, 8) + '...',
        full: key
      };
    }
    return {
      type: key,
      session: 'N/A',
      full: key
    };
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
      'sales': 'primary',
      'customers': 'success',
      'campaigns': 'warning',
      'leads': 'secondary',
      'employees': 'danger',
      'hr': 'danger'
    };
    return colors[type] || 'default';
  };

  if (!isOpen) return null;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Administrador de Caché</h2>
            <p className="text-sm text-foreground-500">
              Monitorea y gestiona el caché de la aplicación
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              variant="flat"
              startContent={<Icon icon="lucide:refresh-cw" />}
              onPress={refresh}
              size="sm"
            >
              Actualizar
            </Button>
            <Button
              color="danger"
              variant="flat"
              startContent={<Icon icon="lucide:trash-2" />}
              onPress={handleClearAll}
              size="sm"
            >
              Limpiar Todo
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-primary-50 border-primary-200">
              <CardBody className="text-center">
                <Icon icon="lucide:database" className="text-2xl text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">{size}</p>
                <p className="text-sm text-foreground-500">Entradas en Caché</p>
              </CardBody>
            </Card>
            
            <Card className="bg-success-50 border-success-200">
              <CardBody className="text-center">
                <Icon icon="lucide:clock" className="text-2xl text-success mx-auto mb-2" />
                <p className="text-sm font-medium text-success">
                  {oldestEntry ? formatKey(oldestEntry).type : 'N/A'}
                </p>
                <p className="text-sm text-foreground-500">Entrada más Antigua</p>
              </CardBody>
            </Card>
            
            <Card className="bg-warning-50 border-warning-200">
              <CardBody className="text-center">
                <Icon icon="lucide:zap" className="text-2xl text-warning mx-auto mb-2" />
                <p className="text-sm font-medium text-warning">
                  {newestEntry ? formatKey(newestEntry).type : 'N/A'}
                </p>
                <p className="text-sm text-foreground-500">Entrada más Reciente</p>
              </CardBody>
            </Card>
            
            <Card className="bg-secondary-50 border-secondary-200">
              <CardBody className="text-center">
                <Icon icon="lucide:activity" className="text-2xl text-secondary mx-auto mb-2" />
                <p className="text-2xl font-bold text-secondary">
                  {size > 0 ? '✓' : '✗'}
                </p>
                <p className="text-sm text-foreground-500">Estado del Caché</p>
              </CardBody>
            </Card>
          </div>

          {/* Tabla de entradas de caché */}
          {size > 0 ? (
            <Table aria-label="Entradas de caché">
              <TableHeader>
                <TableColumn>TIPO</TableColumn>
                <TableColumn>SESIÓN</TableColumn>
                <TableColumn>CLAVE COMPLETA</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const keyInfo = formatKey(key);
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Chip 
                          color={getTypeColor(keyInfo.type)}
                          variant="flat"
                          size="sm"
                        >
                          {keyInfo.type}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {keyInfo.session}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-foreground-500">
                          {keyInfo.full}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Button
                          color="danger"
                          variant="light"
                          size="sm"
                          startContent={<Icon icon="lucide:x" />}
                          onPress={() => handleClearSpecific(key)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Icon icon="lucide:database" className="text-4xl text-foreground-300 mx-auto mb-4" />
              <p className="text-foreground-500">No hay entradas en caché</p>
              <p className="text-sm text-foreground-400">
                Las entradas aparecerán aquí cuando se carguen datos
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default CacheManager;