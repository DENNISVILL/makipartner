import React from 'react';
import { Card, CardBody, CardHeader, Button, Tabs, Tab, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';

interface PricingPlanProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

const PricingPlan: React.FC<PricingPlanProps> = ({
  title,
  price,
  period,
  description,
  features,
  isPopular = false,
  buttonText
}) => {
  return (
    <Card className={`border ${isPopular ? 'border-primary' : 'border-divider'}`}>
      {isPopular && (
        <div className="absolute top-0 right-0">
          <Chip color="primary" variant="solid" className="m-2">
            Popular
          </Chip>
        </div>
      )}
      <CardBody className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-foreground-500 ml-1">{period}</span>
        </div>
        <p className="text-foreground-500 mb-6">{description}</p>
        
        <Button 
          color={isPopular ? "primary" : "default"}
          variant={isPopular ? "solid" : "bordered"}
          className="w-full mb-6"
          radius="sm"
        >
          {buttonText}
        </Button>
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Icon icon="lucide:check" className="text-success mt-1 mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};

export const Pricing: React.FC = () => {
  const [selectedBillingCycle, setSelectedBillingCycle] = React.useState("annual");
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Precios simples y transparentes</h1>
        <p className="text-xl text-foreground-500 max-w-3xl mx-auto">
          Elija el plan que mejor se adapte a las necesidades de su empresa
        </p>
        
        <div className="flex justify-center mt-8">
          <Tabs 
            selectedKey={selectedBillingCycle} 
            onSelectionChange={(key) => setSelectedBillingCycle(key as string)}
            aria-label="Ciclo de facturación"
            color="primary"
            variant="bordered"
            classNames={{
              tabList: "bg-content2 p-1 rounded-lg",
              tab: "px-6 py-2 data-[selected=true]:bg-content1 data-[selected=true]:shadow-sm rounded-md"
            }}
          >
            <Tab key="monthly" title="Mensual" />
            <Tab key="annual" title="Anual (20% de descuento)" />
          </Tabs>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <PricingPlan
          title="Básico"
          price={selectedBillingCycle === "annual" ? "$15" : "$19"}
          period="/usuario/mes"
          description="Para pequeñas empresas que están comenzando"
          features={[
            "Hasta 3 usuarios",
            "Contabilidad básica",
            "Facturación simple",
            "Soporte por email",
            "1 GB de almacenamiento"
          ]}
          buttonText="Comenzar gratis"
        />
        
        <PricingPlan
          title="Estándar"
          price={selectedBillingCycle === "annual" ? "$25" : "$32"}
          period="/usuario/mes"
          description="Para empresas en crecimiento"
          features={[
            "Usuarios ilimitados",
            "Contabilidad avanzada",
            "Facturación completa",
            "Gestión de gastos",
            "Soporte prioritario",
            "5 GB de almacenamiento"
          ]}
          isPopular={true}
          buttonText="Comenzar prueba gratis"
        />
        
        <PricingPlan
          title="Premium"
          price={selectedBillingCycle === "annual" ? "$45" : "$55"}
          period="/usuario/mes"
          description="Para empresas establecidas con necesidades complejas"
          features={[
            "Usuarios ilimitados",
            "Todas las características estándar",
            "Informes avanzados",
            "Integraciones personalizadas",
            "Soporte 24/7",
            "20 GB de almacenamiento",
            "Consultor dedicado"
          ]}
          buttonText="Contactar ventas"
        />
      </div>
      
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Preguntas frecuentes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
            <p className="text-foreground-500">
              Sí, puede actualizar o degradar su plan en cualquier momento. Los cambios se aplicarán al inicio del siguiente ciclo de facturación.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">¿Qué métodos de pago aceptan?</h3>
            <p className="text-foreground-500">
              Aceptamos tarjetas de crédito/débito principales (Visa, Mastercard, American Express) y transferencias bancarias para planes anuales.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">¿Ofrecen descuentos para organizaciones sin fines de lucro?</h3>
            <p className="text-foreground-500">
              Sí, ofrecemos descuentos especiales para organizaciones sin fines de lucro y educativas. Contacte con nuestro equipo de ventas para más información.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">¿Cómo funciona la prueba gratuita?</h3>
            <p className="text-foreground-500">
              La prueba gratuita dura 15 días y le da acceso a todas las funciones del plan Estándar. No se requiere tarjeta de crédito para comenzar.
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-lg mb-4">¿Tiene más preguntas?</p>
          <Button 
            color="primary" 
            variant="bordered"
            radius="sm"
            size="lg"
            startContent={<Icon icon="lucide:message-circle" />}
          >
            Contactar con ventas
          </Button>
        </div>
      </div>
    </div>
  );
};