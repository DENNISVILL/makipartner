import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Button, Spinner, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

export const Productivity: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StandardError | string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de datos de productividad
      const [documentsData, meetingsData] = await Promise.all([
        // Placeholder para documentos
        Promise.resolve([]),
        // Placeholder para reuniones
        Promise.resolve([])
      ]);
      
      setDocuments(documentsData);
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error loading productivity data:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const productivityCategories = [
    {
      icon: 'lucide:message-circle',
      label: 'Conversaciones',
      to: '/app/productivity/discuss',
      description: 'Mensajería interna y comunicación en equipo'
    },
    {
      icon: 'lucide:calendar',
      label: 'Calendario',
      to: '/app/calendar',
      description: 'Gestión de eventos y reuniones'
    },
    {
      icon: 'lucide:file',
      label: 'Documentos',
      to: '/app/documents',
      description: 'Almacenamiento y gestión de documentos'
    },
    {
      icon: 'lucide:mail',
      label: 'Email',
      to: '/app/productivity/mail',
      description: 'Cliente de correo electrónico integrado'
    },
    {
      icon: 'lucide:phone',
      label: 'VoIP',
      to: '/app/productivity/voip',
      description: 'Telefonía IP integrada'
    },
    {
      icon: 'lucide:smartphone',
      label: 'WhatsApp',
      to: '/app/productivity/whatsapp',
      description: 'Integración con WhatsApp Business'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Productividad</h1>
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
                <p className="font-medium">Estado de Productividad</p>
                <p className="text-sm text-foreground-500">
                  Documentos: {documents.length} | Reuniones: {meetings.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      
      <CategoryMenu title="Herramientas de Productividad" items={productivityCategories} />
    </div>
  );
};
export default Productivity;