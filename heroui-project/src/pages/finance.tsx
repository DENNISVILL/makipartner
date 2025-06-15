import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

export const Finance: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StandardError | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const invoiceData = await odooService.getInvoices();
      setInvoices(invoiceData);
    } catch (error: any) {
      console.error('Error loading finance data:', error);
      setError(error); // Guardamos el objeto StandardError completo
    } finally {
      setLoading(false);
    }
  };

  const financeCategories = [
    {
      icon: 'lucide:landmark',
      label: 'Contabilidad',
      to: '/app/accounting',
      description: 'Gestión contable y financiera'
    },
    {
      icon: 'lucide:file-text',
      label: 'Facturación',
      to: '/app/invoicing',
      description: 'Facturas de clientes y proveedores'
    },
    {
      icon: 'lucide:receipt',
      label: 'Gastos',
      to: '/app/expenses',
      description: 'Gestión de gastos y reembolsos'
    },
    {
      icon: 'lucide:credit-card',
      label: 'Pagos',
      to: '/app/finance/payments',
      description: 'Gestión de pagos y cobros'
    },
    {
      icon: 'lucide:building',
      label: 'Banca',
      to: '/app/finance/banking',
      description: 'Conciliación bancaria y extractos'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Finanzas</h1>
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
        <CategoryMenu title="Servicios Financieros" items={financeCategories} />
      )}
    </div>
  );
};