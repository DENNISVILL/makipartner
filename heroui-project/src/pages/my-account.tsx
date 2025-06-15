import React from 'react';
import { Card, CardBody, Avatar, Button, Link } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { AccountCard } from '../components/account-card';

export const MyAccount: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mi cuenta</h1>
        
        <div className="hidden md:block">
          <Button
            as={RouteLink}
            to="/dashboard"
            color="primary"
            variant="flat"
            radius="sm"
            startContent={<Icon icon="lucide:arrow-left" />}
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
      
      {/* User profile card - Desktop */}
      <div className="hidden md:block mb-8">
        <Card className="border border-divider">
          <CardBody className="p-6">
            <div className="flex items-center gap-6">
              <Avatar
                src="https://img.heroui.chat/image/avatar?w=200&h=200&u=1"
                className="w-24 h-24"
              />
              <div>
                <h2 className="text-2xl font-semibold mb-2">Dennis</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:map-pin" className="text-foreground-500" />
                    <span>Riobamba, Ecuador</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:mail" className="text-foreground-500" />
                    <span>dennisvega9876@outlook.com</span>
                  </div>
                </div>
                <Button
                  as={RouteLink}
                  to="/edit-profile"
                  color="primary"
                  variant="flat"
                  radius="sm"
                  startContent={<Icon icon="lucide:edit" />}
                  className="mt-4"
                >
                  Editar información
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* User profile card - Mobile */}
      <div className="block md:hidden mb-8">
        <Card className="border border-divider">
          <CardBody className="p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar
                src="https://img.heroui.chat/image/avatar?w=200&h=200&u=1"
                className="w-20 h-20 mb-4"
              />
              <h2 className="text-xl font-semibold">Dennis</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:map-pin" className="text-foreground-500 mt-1" />
                <div>
                  <p className="font-medium">Riobamba</p>
                  <p className="text-foreground-500">Ecuador</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Icon icon="lucide:mail" className="text-foreground-500 mt-1" />
                <p className="text-foreground-500">dennisvega9876@outlook.com</p>
              </div>
              
              <Button
                as={RouteLink}
                to="/edit-profile"
                color="primary"
                variant="flat"
                radius="sm"
                startContent={<Icon icon="lucide:edit" />}
                className="w-full"
              >
                Editar información
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccountCard
          icon="lucide:shopping-bag"
          title="Sus órdenes"
          description="Siga, vea o pague sus órdenes"
          to="/orders"
        />
        
        <AccountCard
          icon="lucide:file-text"
          title="Sus facturas"
          description="Siga, descargue o pague sus facturas"
          to="/invoices"
        />
        
        <AccountCard
          icon="lucide:clock"
          title="Hojas de horas"
          description="Revisar todas las hojas de horas relacionadas con sus proyectos"
          to="/timesheets"
        />
        
        <AccountCard
          icon="lucide:map-pin"
          title="Direcciones"
          description="Agregar, eliminar o modificar sus direcciones"
          to="/addresses"
        />
        
        <AccountCard
          icon="lucide:shield"
          title="Conexión y seguridad"
          description="Configure sus parámetros de conexión"
          to="/security"
        />
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Enlaces útiles</h3>
        <div className="grid grid-cols-1 gap-4">
          <Card className="border border-divider">
            <CardBody className="p-4">
              <Link as={RouteLink} to="/apps-dashboard" color="primary" className="flex items-center gap-2">
                <Icon icon="lucide:grid" />
                <span>Tablero de aplicaciones</span>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};