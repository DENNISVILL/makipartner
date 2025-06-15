import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Avatar, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { useCache } from '../hooks/useCache';
import { getErrorMessage, ErrorType, StandardError } from '../utils/errorHandling';

interface Employee {
  id: number;
  name: string;
  job_title: string;
  department_id: [number, string] | false;
  work_email: string;
  work_phone: string;
}

export const HR: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    data: employees,
    loading,
    error,
    refresh: loadEmployees,
    isFromCache
  } = useCache<Employee[]>(
    'hr_employees',
    () => odooService.getEmployees(),
    { ttl: 3 * 60 * 1000 } // 3 minutos de caché
  );

  const filteredEmployees = (employees || []).filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.department_id && employee.department_id[1].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recursos Humanos</h1>
        <div className="flex gap-2 items-center">
          {isFromCache && (
            <div className="flex items-center gap-1 text-sm text-success">
              <Icon icon="lucide:database" />
              <span>Caché</span>
            </div>
          )}
          <Button 
            color="primary" 
            startContent={!loading && <Icon icon="lucide:refresh-cw" />}
            onPress={loadEmployees}
            isLoading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center gap-3">
              <Icon 
                icon="lucide:alert-circle" 
                className="text-xl text-danger" 
              />
              <div className="flex-1">
                <p className="font-medium text-danger">
                  {error.message || 'Error al cargar empleados'}
                </p>
                <p className="text-sm text-foreground-500 mt-1">
                  Verifica la conexión con Odoo e intenta nuevamente.
                </p>
              </div>
              <Button 
                as="a" 
                href="/login" 
                color="primary" 
                size="sm"
                variant="flat"
              >
                Iniciar sesión
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-semibold">Empleados</h2>
          <Input
            placeholder="Buscar empleados..."
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
            <Table aria-label="Tabla de empleados">
              <TableHeader>
                <TableColumn>EMPLEADO</TableColumn>
                <TableColumn>PUESTO</TableColumn>
                <TableColumn>DEPARTAMENTO</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>TELÉFONO</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No hay empleados">
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar 
                          name={employee.name}
                          size="sm"
                          className="bg-primary text-white"
                        />
                        <span>{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.job_title || 'N/A'}</TableCell>
                    <TableCell>{employee.department_id ? employee.department_id[1] : 'N/A'}</TableCell>
                    <TableCell>{employee.work_email || 'N/A'}</TableCell>
                    <TableCell>{employee.work_phone || 'N/A'}</TableCell>
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