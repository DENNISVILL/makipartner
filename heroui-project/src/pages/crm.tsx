import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Chip, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';

interface Lead {
  id: number;
  name: string;
  partner_name: string;
  email_from: string;
  phone: string;
  stage_id: [number, string];
  user_id: [number, string] | false;
  expected_revenue: number;
  probability: number;
}

export const CRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooService.callMethod('crm.lead', 'search_read', [], {
        fields: ['name', 'partner_name', 'email_from', 'phone', 'stage_id', 'user_id', 'expected_revenue', 'probability']
      });
      setLeads(result);
    } catch (error) {
      console.error('Error loading leads:', error);
      setError('Error al cargar los leads. Verifica la conexión con Odoo.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.partner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'success';
    if (probability >= 50) return 'warning';
    if (probability >= 25) return 'primary';
    return 'default';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CRM - Gestión de Leads</h1>
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadLeads}
          isLoading={loading}
        >
          Actualizar
        </Button>
      </div>

      {error && (
        <Card className="mb-6 bg-danger-50 border-danger-200">
          <CardBody className="flex flex-row items-center gap-3">
            <Icon icon="lucide:alert-circle" className="text-danger" />
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-semibold">Leads y Oportunidades</h2>
          <Input
            placeholder="Buscar leads..."
            startContent={<Icon icon="lucide:search" />}
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="w-64"
          />
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <Table aria-label="Tabla de leads">
              <TableHeader>
                <TableColumn>OPORTUNIDAD</TableColumn>
                <TableColumn>CLIENTE</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>TELÉFONO</TableColumn>
                <TableColumn>ETAPA</TableColumn>
                <TableColumn>VENDEDOR</TableColumn>
                <TableColumn>INGRESOS ESPERADOS</TableColumn>
                <TableColumn>PROBABILIDAD</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No hay leads">
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.partner_name || 'N/A'}</TableCell>
                    <TableCell>{lead.email_from || 'N/A'}</TableCell>
                    <TableCell>{lead.phone || 'N/A'}</TableCell>
                    <TableCell>{lead.stage_id[1]}</TableCell>
                    <TableCell>{lead.user_id ? lead.user_id[1] : 'Sin asignar'}</TableCell>
                    <TableCell>${lead.expected_revenue.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip color={getProbabilityColor(lead.probability)} size="sm">
                        {lead.probability}%
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};