import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Tabs, Tab, Switch, Input, Select, SelectItem } from '@heroui/react';
import { Icon } from '@iconify/react';
import CacheManager from '../components/CacheManager';
import odooService from '../services/odooService';
import cacheService from '../services/cacheService';

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cache');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [defaultTTL, setDefaultTTL] = useState('300'); // 5 minutos en segundos
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('30'); // 30 segundos

  const handleClearAllCache = () => {
    cacheService.clear();
  };

  const handleTestConnection = async () => {
    try {
      // Probar conexión con Odoo
      await odooService.testConnection();
      alert('Conexión exitosa con Odoo');
    } catch (error) {
      alert('Error de conexión: ' + (error as Error).message);
    }
  };

  const cacheStats = cacheService.getStats();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
          <p className="text-foreground-500 mt-1">
            Gestiona la configuración y rendimiento de la aplicación
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          startContent={<Icon icon="lucide:settings" />}
        >
          Configuración Avanzada
        </Button>
      </div>

      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
      >
        <Tab key="cache" title="Gestión de Caché">
          <div className="space-y-6">
            {/* Configuración de Caché */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:settings" className="text-xl" />
                  <h2 className="text-xl font-semibold">Configuración de Caché</h2>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Habilitar Caché</p>
                      <p className="text-sm text-foreground-500">
                        Mejora el rendimiento almacenando datos temporalmente
                      </p>
                    </div>
                    <Switch 
                      isSelected={cacheEnabled}
                      onValueChange={setCacheEnabled}
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-actualización</p>
                      <p className="text-sm text-foreground-500">
                        Actualiza automáticamente los datos en segundo plano
                      </p>
                    </div>
                    <Switch 
                      isSelected={autoRefresh}
                      onValueChange={setAutoRefresh}
                      color="primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="TTL por Defecto (segundos)"
                    value={defaultTTL}
                    onValueChange={setDefaultTTL}
                    type="number"
                    min="60"
                    max="3600"
                    description="Tiempo de vida de los datos en caché"
                  />

                  <Input
                    label="Intervalo de Actualización (segundos)"
                    value={refreshInterval}
                    onValueChange={setRefreshInterval}
                    type="number"
                    min="10"
                    max="300"
                    description="Frecuencia de auto-actualización"
                    isDisabled={!autoRefresh}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    color="danger"
                    variant="flat"
                    startContent={<Icon icon="lucide:trash-2" />}
                    onPress={handleClearAllCache}
                  >
                    Limpiar Todo el Caché
                  </Button>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="lucide:save" />}
                  >
                    Guardar Configuración
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Estadísticas de Caché */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:bar-chart" className="text-xl" />
                  <h2 className="text-xl font-semibold">Estadísticas de Rendimiento</h2>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{cacheStats.size}</p>
                    <p className="text-sm text-foreground-500">Entradas Activas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">95%</p>
                    <p className="text-sm text-foreground-500">Tasa de Aciertos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">2.3s</p>
                    <p className="text-sm text-foreground-500">Tiempo Promedio</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">1.2MB</p>
                    <p className="text-sm text-foreground-500">Memoria Usada</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Administrador de Caché */}
            <CacheManager />
          </div>
        </Tab>

        <Tab key="connection" title="Conexión">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon="lucide:link" className="text-xl" />
                <h2 className="text-xl font-semibold">Configuración de Conexión</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="URL del Servidor Odoo"
                  placeholder="https://tu-servidor.odoo.com"
                  description="URL base de tu instancia de Odoo"
                />
                <Input
                  label="Base de Datos"
                  placeholder="nombre_base_datos"
                  description="Nombre de la base de datos de Odoo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Timeout de Conexión (ms)"
                  type="number"
                  defaultValue="5000"
                  description="Tiempo límite para las peticiones"
                />
                <Select
                  label="Nivel de Log"
                  defaultSelectedKeys={['info']}
                  description="Nivel de detalle en los logs"
                >
                  <SelectItem key="error">Error</SelectItem>
                  <SelectItem key="warn">Warning</SelectItem>
                  <SelectItem key="info">Info</SelectItem>
                  <SelectItem key="debug">Debug</SelectItem>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  color="primary"
                  startContent={<Icon icon="lucide:zap" />}
                  onPress={handleTestConnection}
                >
                  Probar Conexión
                </Button>
                <Button
                  color="success"
                  variant="flat"
                  startContent={<Icon icon="lucide:save" />}
                >
                  Guardar Configuración
                </Button>
              </div>
            </CardBody>
          </Card>
        </Tab>

        <Tab key="performance" title="Rendimiento">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon="lucide:activity" className="text-xl" />
                <h2 className="text-xl font-semibold">Optimización de Rendimiento</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compresión de Datos</p>
                    <p className="text-sm text-foreground-500">
                      Reduce el tamaño de las transferencias de datos
                    </p>
                  </div>
                  <Switch defaultSelected color="primary" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Carga Lazy de Componentes</p>
                    <p className="text-sm text-foreground-500">
                      Carga componentes solo cuando son necesarios
                    </p>
                  </div>
                  <Switch defaultSelected color="primary" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Prefetch de Datos</p>
                    <p className="text-sm text-foreground-500">
                      Precarga datos que probablemente se necesiten
                    </p>
                  </div>
                  <Switch color="primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Límite de Registros por Página"
                  type="number"
                  defaultValue="50"
                  min="10"
                  max="200"
                  description="Número máximo de registros a mostrar"
                />
                <Input
                  label="Timeout de Caché (minutos)"
                  type="number"
                  defaultValue="5"
                  min="1"
                  max="60"
                  description="Tiempo antes de que expire el caché"
                />
              </div>

              <Button
                color="primary"
                startContent={<Icon icon="lucide:save" />}
              >
                Aplicar Optimizaciones
              </Button>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default SystemSettings;