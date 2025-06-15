import React from 'react';
import { Card, CardBody, CardHeader, Button, Tabs, Tab } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface AppCardProps {
  icon: string;
  title: string;
  description: string;
  to: string;
}

const AppCard: React.FC<AppCardProps> = ({ icon, title, description, to }) => {
  return (
    <Card 
      as={RouteLink} 
      to={to}
      isPressable
      disableRipple
      className="odoo-card border border-divider h-full"
    >
      <CardBody className="p-6">
        <div className="flex flex-col gap-2">
          <div className="text-primary mb-2">
            <Icon icon={icon} width={32} height={32} />
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-foreground-500">{description}</p>
        </div>
      </CardBody>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Plataforma de Contabilidad</h1>
        <p className="text-xl text-foreground-500 max-w-3xl mx-auto">
          Una solución completa para gestionar la contabilidad de tu empresa de manera eficiente y sencilla
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button 
            as={RouteLink}
            to="/signup"
            color="primary" 
            size="lg"
            radius="sm"
          >
            Comenzar prueba gratis
          </Button>
          <Button 
            as={RouteLink}
            to="/demo"
            variant="bordered" 
            size="lg"
            radius="sm"
          >
            Ver demostración
          </Button>
        </div>
      </div>
      
      <div className="mb-16">
        <Tabs aria-label="Categorías" color="primary" variant="underlined" classNames={{
          tab: "data-[selected=true]:text-primary data-[selected=true]:font-medium"
        }}>
          <Tab key="all" title="Todas las aplicaciones">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <AppCard
                icon="lucide:calculator"
                title="Contabilidad"
                description="Gestiona tus finanzas con facilidad y precisión"
                to="/app/accounting"
              />
              <AppCard
                icon="lucide:receipt"
                title="Facturación"
                description="Crea y envía facturas profesionales a tus clientes"
                to="/app/invoicing"
              />
              <AppCard
                icon="lucide:banknote"
                title="Gastos"
                description="Controla y aprueba los gastos de tu empresa"
                to="/app/expenses"
              />
              <AppCard
                icon="lucide:bar-chart-2"
                title="Informes financieros"
                description="Visualiza el rendimiento financiero de tu empresa"
                to="/app/reports"
              />
              <AppCard
                icon="lucide:users"
                title="Clientes y proveedores"
                description="Gestiona tus relaciones comerciales"
                to="/app/contacts"
              />
              <AppCard
                icon="lucide:landmark"
                title="Impuestos"
                description="Calcula y presenta tus impuestos correctamente"
                to="/app/taxes"
              />
            </div>
          </Tab>
          <Tab key="accounting" title="Contabilidad">
            {/* Contenido de la pestaña de contabilidad */}
          </Tab>
          <Tab key="invoicing" title="Facturación">
            {/* Contenido de la pestaña de facturación */}
          </Tab>
          <Tab key="reports" title="Informes">
            {/* Contenido de la pestaña de informes */}
          </Tab>
        </Tabs>
      </div>
      
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">¿Por qué elegir nuestra plataforma?</h2>
          <p className="text-lg text-foreground-500 max-w-3xl mx-auto">
            Una solución completa que se adapta a las necesidades de tu empresa
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border border-divider">
            <CardBody className="p-6 flex flex-col items-center text-center">
              <div className="text-primary mb-4">
                <Icon icon="lucide:zap" width={40} height={40} />
              </div>
              <h3 className="text-xl font-medium mb-2">Fácil de usar</h3>
              <p className="text-foreground-500">
                Interfaz intuitiva que permite gestionar tu contabilidad sin complicaciones
              </p>
            </CardBody>
          </Card>
          
          <Card className="border border-divider">
            <CardBody className="p-6 flex flex-col items-center text-center">
              <div className="text-primary mb-4">
                <Icon icon="lucide:layers" width={40} height={40} />
              </div>
              <h3 className="text-xl font-medium mb-2">Todo integrado</h3>
              <p className="text-foreground-500">
                Todas las herramientas que necesitas en una sola plataforma
              </p>
            </CardBody>
          </Card>
          
          <Card className="border border-divider">
            <CardBody className="p-6 flex flex-col items-center text-center">
              <div className="text-primary mb-4">
                <Icon icon="lucide:shield" width={40} height={40} />
              </div>
              <h3 className="text-xl font-medium mb-2">Seguro y confiable</h3>
              <p className="text-foreground-500">
                Tus datos financieros protegidos con los más altos estándares de seguridad
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
      
      <div className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">¿Listo para empezar?</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Prueba nuestra plataforma de contabilidad durante 15 días sin compromiso
        </p>
        <Button 
          as={RouteLink}
          to="/signup"
          color="primary" 
          size="lg"
          radius="sm"
        >
          Comenzar prueba gratis
        </Button>
      </div>
    </div>
  );
};