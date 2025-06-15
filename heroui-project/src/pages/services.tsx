import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Button, Spinner, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../utils/errorHandling';

export const Services: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StandardError | string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de datos de servicios
      const [projectsData, ticketsData] = await Promise.all([
        // Placeholder para proyectos
        Promise.resolve([]),
        // Placeholder para tickets
        Promise.resolve([])
      ]);
      
      setProjects(projectsData);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading services data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const servicesCategories = [
    {
      icon: 'lucide:briefcase',
      label: 'Proyectos',
      to: '/dashboard/services/projects',
      description: 'Gestión de proyectos y tareas'
    },
    {
      icon: 'lucide:clock',
      label: 'Hojas de horas',
      to: '/dashboard/services/timesheet',
      description: 'Registro y seguimiento de horas trabajadas'
    },
    {
      icon: 'lucide:headphones',
      label: 'Soporte al cliente',
      to: '/dashboard/services/helpdesk',
      description: 'Gestión de tickets y solicitudes de soporte'
    },
    {
      icon: 'lucide:calendar',
      label: 'Citas',
      to: '/dashboard/services/appointments',
      description: 'Programación y gestión de citas'
    },
    {
      icon: 'lucide:message-square',
      label: 'Chat en vivo',
      to: '/dashboard/services/livechat',
      description: 'Comunicación en tiempo real con clientes'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios</h1>
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
                <p className="font-medium">Estado de Servicios</p>
                <p className="text-sm text-foreground-500">
                  Proyectos: {projects.length} | Tickets: {tickets.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      <CategoryMenu title="Gestión de Servicios" items={servicesCategories} />
    </div>
  );
};