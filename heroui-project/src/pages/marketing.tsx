import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Card, CardBody, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

export const Marketing: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StandardError | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargamos datos de campañas y leads en paralelo
      const [campaignData, leadData] = await Promise.all([
        odooService.getCampaigns(),
        odooService.getLeads()
      ]);
      
      setCampaigns(campaignData);
      setLeads(leadData);
    } catch (error: any) {
      console.error('Error loading marketing data:', error);
      setError(error); // Guardamos el objeto StandardError completo
    } finally {
      setLoading(false);
    }
  };

  const marketingCategories = [
    {
      icon: 'lucide:mail',
      label: 'Email Marketing',
      to: '/app/email-marketing',
      description: 'Campañas de email marketing'
    },
    {
      icon: 'lucide:share-2',
      label: 'Social Media',
      to: '/app/marketing/social',
      description: 'Gestión de redes sociales'
    },
    {
      icon: 'lucide:calendar',
      label: 'Eventos',
      to: '/app/events',
      description: 'Organización y gestión de eventos'
    },
    {
      icon: 'lucide:target',
      label: 'Campañas',
      to: '/app/marketing/campaigns',
      description: 'Campañas de marketing multicanal'
    },
    {
      icon: 'lucide:bar-chart-2',
      label: 'Encuestas',
      to: '/app/marketing/surveys',
      description: 'Creación y análisis de encuestas'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketing</h1>
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
              {campaigns.length} campañas y {leads.length} leads cargados
            </p>
          </div>
          <CategoryMenu title="Herramientas de Marketing" items={marketingCategories} />
        </>
      )}
    </div>
  );
};
export default Marketing;