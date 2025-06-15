import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Button, Spinner, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../utils/errorHandling';

export const SupplyChain: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StandardError | string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de datos de cadena de suministro
      const [inventoryData, purchasesData] = await Promise.all([
        // Placeholder para inventario
        Promise.resolve([]),
        // Placeholder para compras
        Promise.resolve([])
      ]);
      
      setInventory(inventoryData);
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading supply chain data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const supplyChainCategories = [
    {
      icon: 'lucide:truck',
      label: 'Inventario',
      to: '/dashboard/supply-chain/inventory',
      description: 'Gestión de inventario y control de stock'
    },
    {
      icon: 'lucide:factory',
      label: 'Manufactura',
      to: '/dashboard/supply-chain/manufacturing',
      description: 'Planificación y ejecución de procesos de fabricación'
    },
    {
      icon: 'lucide:package',
      label: 'PLM',
      to: '/dashboard/supply-chain/plm',
      description: 'Gestión del ciclo de vida del producto'
    },
    {
      icon: 'lucide:shopping-cart',
      label: 'Compras',
      to: '/dashboard/supply-chain/purchase',
      description: 'Gestión de compras y proveedores'
    },
    {
      icon: 'lucide:settings',
      label: 'Mantenimiento',
      to: '/dashboard/supply-chain/maintenance',
      description: 'Planificación y seguimiento de mantenimiento de equipos'
    },
    {
      icon: 'lucide:check-square',
      label: 'Calidad',
      to: '/dashboard/supply-chain/quality',
      description: 'Control de calidad y gestión de inspecciones'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cadena de Suministro</h1>
        <Button 
          color="primary" 
          variant="flat"
          onPress={loadData}
          isLoading={loading}
          startContent={!loading && <Icon icon="lucide:refresh-cw" />}
        >
          Actualizar
        </Button>
      </div>
      
      {/* Error handling */}
      {error && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center gap-3">
              <Icon 
                icon={typeof error === 'object' && error.type === ErrorType.SERVER ? "lucide:server-x" : "lucide:alert-circle"} 
                className={`text-xl ${
                  typeof error === 'object' && error.type === ErrorType.SERVER 
                    ? 'text-warning' 
                    : 'text-danger'
                }`} 
              />
              <div className="flex-1">
                <p className="font-medium">
                  {typeof error === 'string' ? error : error.message}
                </p>
                {typeof error === 'object' && error.suggestion && (
                  <p className="text-sm text-foreground-500 mt-1">
                    {error.suggestion}
                  </p>
                )}
              </div>
              {typeof error === 'object' && (error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION) && (
                <Button 
                  as="a" 
                  href="/login" 
                  color="primary" 
                  size="sm"
                  variant="flat"
                >
                  Iniciar sesión
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}
      
      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}
      
      {/* Data summary */}
      {!error && !loading && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center gap-4">
              <Icon icon="lucide:info" className="text-primary text-xl" />
              <div>
                <p className="font-medium">Estado de Cadena de Suministro</p>
                <p className="text-sm text-foreground-500">
                  Inventario: {inventory.length} productos | Compras: {purchases.length} órdenes
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      <CategoryMenu title="Gestión de Cadena de Suministro" items={supplyChainCategories} />
    </div>
  );
};