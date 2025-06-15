import React from 'react';
import { Card, CardBody, CardHeader, Button, Tabs, Tab, Divider } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link as RouteLink } from 'react-router-dom';
import { StatsCard } from '../components/stats-card';
import { DashboardStatistics } from './dashboard-statistics';

export const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  
  const renderContent = () => {
    switch (activeTab) {
      case "statistics":
        return <DashboardStatistics />;
      default:
        return (
          <div className="p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            
            {/* Alerta informativa */}
            <Card className="bg-blue-50 border-blue-200 mb-8">
              <CardBody className="p-4 flex items-start gap-3">
                <div className="text-blue-500 mt-1">
                  <Icon icon="lucide:info" width={20} height={20} />
                </div>
                <div>
                  <h3 className="font-medium text-blue-700">¿Tienes un proyecto en este momento?</h3>
                  <p className="text-sm text-blue-600">
                    Si quieres ayuda, contacta a nuestro equipo o utiliza nuestros recursos.
                    Obtén más información en nuestra <a href="#" className="text-blue-700 underline">documentación de implementación</a>.
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  className="text-blue-500 ml-auto"
                  onPress={() => console.log("Cerrar alerta")}
                >
                  <Icon icon="lucide:x" width={16} height={16} />
                </Button>
              </CardBody>
            </Card>
            
            {/* Accesos directos a Finanzas - NUEVO */}
            <Card className="mb-8 border border-divider">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Accesos directos a Finanzas</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    as={RouteLink} 
                    to="/app/finance" 
                    color="primary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:calculator" width={20} height={20} />}
                  >
                    Finanzas (General)
                  </Button>
                  <Button 
                    as={RouteLink} 
                    to="/app/accounting" 
                    color="primary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:file-text" width={20} height={20} />}
                  >
                    Contabilidad
                  </Button>
                  <Button 
                    as={RouteLink} 
                    to="/app/invoicing" 
                    color="primary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:credit-card" width={20} height={20} />}
                  >
                    Facturación
                  </Button>
                  <Button 
                    as={RouteLink} 
                    to="/app/expenses" 
                    color="primary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:dollar-sign" width={20} height={20} />}
                  >
                    Gastos
                  </Button>
                  <Button 
                    as="a" 
                    href="http://localhost:8069/web#action=220&model=account.move&view_type=list" 
                    target="_blank"
                    color="secondary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:external-link" width={20} height={20} />}
                  >
                    Odoo Contabilidad (Directo)
                  </Button>
                  <Button 
                    as="a" 
                    href="http://localhost:8069/web#action=196&model=account.account&view_type=list" 
                    target="_blank"
                    color="secondary" 
                    className="h-auto py-3"
                    startContent={<Icon icon="lucide:external-link" width={20} height={20} />}
                  >
                    Odoo Plan Contable (Directo)
                  </Button>
                </div>
              </CardBody>
            </Card>
            
            {/* Resumen de ventas */}
            <Card className="mb-8 border border-divider">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Resumen de ventas</h2>
              </CardHeader>
              <CardBody>
                <div className="h-64 flex items-center justify-center bg-content2 rounded-lg">
                  <div className="text-center text-foreground-400">
                    <Icon icon="lucide:bar-chart-2" width={48} height={48} className="mx-auto mb-4" />
                    <p>Gráfico de ventas - Sin datos disponibles</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Aplicaciones más vendidas */}
            <Card className="mb-8 border border-divider">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Las aplicaciones más vendidas de los últimos 30 días</h2>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  radius="sm"
                >
                  Ver todo
                </Button>
              </CardHeader>
              <CardBody>
                <div className="h-64 flex items-center justify-center bg-content2 rounded-lg">
                  <div className="text-center text-foreground-400">
                    <Icon icon="lucide:bar-chart-2" width={48} height={48} className="mx-auto mb-4" />
                    <p>Gráfico de aplicaciones - Sin datos disponibles</p>
                  </div>
                </div>
                <p className="text-xs text-foreground-400 mt-4">
                  Todas las fechas se consideran en horario de verano de Europa Central (CEST)
                </p>
              </CardBody>
            </Card>
            
            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Comisión de Empresa"
                value="US$ 0.00"
                subtitle="Comisión pendiente"
                buttonText="Actualizar"
              />
              
              <StatsCard
                title="Oportunidades"
                value="0"
                subtitle="Oportunidades registradas"
                buttonText="Actualizar"
              />
              
              <StatsCard
                title="Usuarios de Empresa"
                value="0"
                subtitle="Usuarios activos de su empresa"
                buttonText="Actualizar"
              />
            </div>
            
            {/* Más estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Plataforma de e-learning"
                value="0%"
                subtitle="Progreso en cursos obligatorios de certificación"
                buttonText="Iniciar ahora"
              />
              
              <Card className="border border-divider h-full">
                <CardBody className="p-5">
                  <h3 className="text-sm font-medium text-foreground-500 mb-3">Información de partner</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon icon="lucide:check-circle" className="text-success" />
                    <span className="text-sm">Descarga todas tus certificaciones</span>
                  </div>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    radius="sm"
                  >
                    Editar datos
                  </Button>
                </CardBody>
              </Card>
              
              <StatsCard
                title="Certificación de producto"
                value="0"
                subtitle="Certificaciones registradas"
                buttonText="Actualizar"
              />
            </div>
            
            {/* Sección de aprendizaje */}
            <Card className="mb-8 border border-divider">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Oportunidades de aprendizaje</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-divider">
                    <CardBody className="p-4">
                      <div className="flex gap-4">
                        <div className="bg-primary-100 p-3 rounded-md">
                          <Icon icon="lucide:book-open" className="text-primary" width={24} height={24} />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Certificación de Learning Partner</h3>
                          <p className="text-sm text-foreground-500 mb-3">
                            Accede a la plataforma de desarrollo, código fuente y mucho más.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" color="primary" radius="sm">Comprar</Button>
                            <Button size="sm" variant="bordered" radius="sm">Conocer más</Button>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  <Card className="border border-divider">
                    <CardBody className="p-4">
                      <div className="flex gap-4">
                        <div className="bg-primary-100 p-3 rounded-md">
                          <Icon icon="lucide:headphones" className="text-primary" width={24} height={24} />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Soporte de partner</h3>
                          <p className="text-sm text-foreground-500 mb-3">
                            Paga mensualmente, recibe soporte de Odoo para resolver tus problemas.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" color="primary" radius="sm">Más información</Button>
                            <Button size="sm" variant="bordered" radius="sm">Contactarnos</Button>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </CardBody>
            </Card>
            
            {/* Estadísticas de ventas */}
            <Card className="mb-8 border border-divider">
              <CardHeader>
                <h2 className="text-lg font-semibold">Estadísticas de ventas</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">34,196</div>
                    <div className="text-sm text-foreground-500">Leads</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">71</div>
                    <div className="text-sm text-foreground-500">Partners</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">4,288</div>
                    <div className="text-sm text-foreground-500">Clientes</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="h-48 flex items-center justify-center bg-content2 rounded-lg">
                      <div className="text-center text-foreground-400">
                        <Icon icon="lucide:bar-chart-2" width={32} height={32} className="mx-auto mb-2" />
                        <p className="text-sm">Gráfico de ventas por región</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <Button size="sm" color="primary" variant="flat" radius="sm">
                        Descargar CSV
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="h-48 flex items-center justify-center bg-content2 rounded-lg">
                      <div className="text-center text-foreground-400">
                        <Icon icon="lucide:play" width={32} height={32} className="mx-auto mb-2 p-1 border-2 border-foreground-400 rounded-full" />
                        <p className="text-sm">Programa de partners de Odoo</p>
                        <p className="text-xs text-foreground-500">Descubre en un minuto el plan de Odoo (beneficios y oportunidades)</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <Button size="sm" color="primary" variant="flat" radius="sm">
                        Ver todos los videos
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Documentación */}
            <Card className="mb-8 border border-divider">
              <CardHeader>
                <h2 className="text-lg font-semibold">Documentación y ayuda</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 border border-divider rounded-md">
                    <Icon icon="lucide:file-text" width={20} height={20} />
                    <span>Acuerdo de Aplicación con Odoo</span>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:download" width={16} height={16} />
                      </Button>
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:external-link" width={16} height={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-divider rounded-md">
                    <Icon icon="lucide:file-text" width={20} height={20} />
                    <span>Contrato de Odoo Enterprise</span>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:download" width={16} height={16} />
                      </Button>
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:external-link" width={16} height={16} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border border-divider rounded-md">
                    <Icon icon="lucide:file-text" width={20} height={20} />
                    <span>Términos de venta</span>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:download" width={16} height={16} />
                      </Button>
                      <Button size="sm" variant="light" isIconOnly>
                        <Icon icon="lucide:external-link" width={16} height={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button
                  color="primary"
                  variant="flat"
                  className="mt-4"
                  radius="sm"
                >
                  Bajar los documentos
                </Button>
              </CardBody>
            </Card>
            
            {/* Soporte */}
            <Card className="border border-divider">
              <CardHeader>
                <h2 className="text-lg font-semibold">Punto de contacto</h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-sm mb-2">
                      <Icon icon="lucide:phone" className="inline mr-2" />
                      <span className="font-medium">+1 (650) 555-0123</span>
                    </p>
                    <p className="text-sm">
                      <Icon icon="lucide:mail" className="inline mr-2" />
                      <span className="font-medium">help@odoo.com</span>
                    </p>
                  </div>
                  
                  <div className="flex-1 flex items-center gap-4">
                    <img 
                      src="https://img.heroui.chat/image/avatar?w=80&h=80&u=25" 
                      alt="Representante de soporte" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">Ana García</p>
                      <p className="text-sm text-foreground-500">Representante de Ventas</p>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        radius="sm"
                        className="mt-2"
                        endContent={<Icon icon="lucide:message-circle" width={16} height={16} />}
                      >
                        Contactar ahora
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-[calc(100vh-64px)] bg-content2">
      {renderContent()}
    </div>
  );
};