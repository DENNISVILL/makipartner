import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Link } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ApplicationMenu } from './application-menu';

interface ApplicationsDropdownProps {
  variant?: "navbar" | "button";
}

// Este componente ha sido reemplazado por el mega menú horizontal en el Navbar,
// pero se mantiene para compatibilidad con código existente.
export const ApplicationsDropdown: React.FC<ApplicationsDropdownProps> = ({ variant = "button" }) => {
  return (
    <Dropdown placement="bottom-start" showArrow>
      <DropdownTrigger>
        {variant === "navbar" ? (
          <Button
            as="button"
            variant="light"
            className="text-foreground"
            disableRipple
          >
            Aplicaciones
          </Button>
        ) : (
          <Button
            variant="light"
            color="default"
            startContent={<Icon icon="lucide:grid" />}
            disableRipple
          >
            Aplicaciones
          </Button>
        )}
      </DropdownTrigger>
      <DropdownMenu 
        aria-label="Menú de aplicaciones" 
        className="w-[90vw] max-w-[1200px] p-6"
      >
        <ApplicationMenu />
        
        <div className="mt-6 pt-6 border-t border-divider grid grid-cols-1 md:grid-cols-3 gap-4">
          <DropdownItem 
            as={RouteLink} 
            to="/external-apps"
            startContent={<Icon icon="lucide:external-link" />}
            description="Conecta con aplicaciones de terceros"
            className="h-auto py-2"
          >
            Aplicaciones externas
          </DropdownItem>
          
          <DropdownItem 
            as={RouteLink} 
            to="/odoo-studio"
            startContent={<Icon icon="lucide:palette" />}
            description="Personaliza Odoo sin programar"
            className="h-auto py-2"
          >
            Studio de Odoo
          </DropdownItem>
          
          <DropdownItem 
            as={RouteLink} 
            to="/odoo-cloud"
            startContent={<Icon icon="lucide:cloud" />}
            description="Accede a tus datos desde cualquier lugar"
            className="h-auto py-2"
          >
            Plataforma de Odoo en la nube
          </DropdownItem>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};