import React from 'react';
import { CategoryMenu } from '../components/CategoryMenu';

export const HumanResources: React.FC = () => {
  const hrCategories = [
    {
      icon: 'lucide:users',
      label: 'Empleados',
      to: '/dashboard/hr/employees',
      description: 'Gestión de información de empleados'
    },
    {
      icon: 'lucide:clipboard-list',
      label: 'Reclutamiento',
      to: '/dashboard/hr/recruitment',
      description: 'Proceso de selección y contratación'
    },
    {
      icon: 'lucide:award',
      label: 'Contratos',
      to: '/dashboard/hr/contracts',
      description: 'Gestión de contratos laborales'
    },
    {
      icon: 'lucide:star',
      label: 'Evaluaciones',
      to: '/dashboard/hr/appraisals',
      description: 'Evaluaciones de desempeño'
    },
    {
      icon: 'lucide:calendar',
      label: 'Ausencias',
      to: '/dashboard/hr/time-off',
      description: 'Control de vacaciones y ausencias'
    },
    {
      icon: 'lucide:file-text',
      label: 'Nómina',
      to: '/dashboard/hr/payroll',
      description: 'Gestión de nóminas y pagos'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recursos Humanos</h1>
      </div>
      
      <CategoryMenu title="Gestión de Recursos Humanos" items={hrCategories} />
    </div>
  );
};