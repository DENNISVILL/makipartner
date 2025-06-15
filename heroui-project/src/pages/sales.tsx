import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

export const Sales: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StandardError | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargamos datos de ventas y clientes en paralelo
      const [orderData, customerData] = await Promise.all([
        odooService.getSalesOrders(),
        odooService.getCustomers()
      ]);
      
      setOrders(orderData);
      setCustomers(customerData);
    } catch (error: any) {
      console.error('Error loading sales data:', error);
      setError(error); // Guardamos el objeto StandardError completo
    } finally {
      setLoading(false);
    }
  };

  const salesCategories = [
    {
      icon: 'lucide:shopping-cart',
      label: 'Pedidos',
      to: '/app/sales/orders',
      description: 'Gestión de pedidos de venta'
    },
    {
      icon: 'lucide:users',
      label: 'Clientes',
      to: '/app/sales/customers',
      description: 'Gestión de clientes y contactos'
    },
    {
      icon: 'lucide:tag',
      label: 'Productos',
      to: '/app/sales/products',
      description: 'Catálogo de productos y servicios'
    },
    {
      icon: 'lucide:shopping-bag',
      label: 'Punto de Venta',
      to: '/app/sales/pos-retail',
      description: 'Terminal punto de venta para retail'
    },
    {
      icon: 'lucide:truck',
      label: 'Entregas',
      to: '/app/sales/deliveries',
      description: 'Gestión de entregas y envíos'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ventas</h1>
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadData}
          isLoading={loading}
        >
          Actualizar
        </Button>
      </div>
      
      {error && (
        <Card className={`mb-6 ${error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'}`}>
          <CardBody className="flex flex-row items-center gap-3">
            <Icon icon={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "lucide:alert-circle" : "lucide:alert-triangle"} 
                  className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger" : "text-warning"} />
            <div>
              <p className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger font-medium" : "text-warning font-medium"}>
                {getErrorMessage(error)}
              </p>
              {error.suggestion && (
                <p className="text-sm text-foreground-500">{error.suggestion}</p>
              )}
              {error.type === ErrorType.AUTHENTICATION && (
                <Button 
                  color="primary" 
                  size="sm" 
                  className="mt-2"
                  onPress={() => window.location.href = '/login'}
                >
                  Iniciar sesión
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}
      
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}
      
      {!loading && !error && (
        <>
          <div className="mb-4">
            <p className="text-sm text-foreground-500">
              {orders.length} pedidos y {customers.length} clientes cargados
            </p>
          </div>
          <CategoryMenu title="Gestión de Ventas" items={salesCategories} />
        </>
      )}
    </div>
  );
};