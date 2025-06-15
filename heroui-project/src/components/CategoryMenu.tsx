import React from 'react';
import { Link as RouteLink } from 'react-router-dom';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

interface CategoryItemProps {
  icon: string;
  label: string;
  to: string;
  description?: string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ icon, label, to, description }) => {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardBody className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-md bg-primary-50 text-primary">
            <Icon icon={icon} width={24} height={24} />
          </div>
          <h3 className="font-medium">{label}</h3>
        </div>
        {description && <p className="text-sm text-foreground-500 mb-3">{description}</p>}
        <Button
          as={RouteLink}
          to={to}
          color="primary"
          variant="light"
          size="sm"
          className="w-full justify-center mt-2"
        >
          Acceder
        </Button>
      </CardBody>
    </Card>
  );
};

interface CategoryMenuProps {
  title: string;
  items: {
    icon: string;
    label: string;
    to: string;
    description?: string;
  }[];
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ title, items }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <CategoryItem
            key={index}
            icon={item.icon}
            label={item.label}
            to={item.to}
            description={item.description}
          />
        ))}
      </div>
    </div>
  );
};

// Ejemplo de uso correcto:
<CategoryMenu 
  title="Aplicaciones" 
  items={[
    { icon: "lucide:calculator", label: "Contabilidad", to: "/app/accounting", description: "Gestiona tus finanzas" },
    { icon: "lucide:users", label: "CRM", to: "/app/crm", description: "Gestiona tus clientes" },
    // ... más items
  ]} 
/>