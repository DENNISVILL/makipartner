import React, { useState, useEffect } from 'react';
import { CategoryMenu } from '../components/CategoryMenu';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Chip, Input, Tabs, Tab } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

interface Website {
  id: number;
  name: string;
  domain: string;
  company_id: [number, string];
  is_published: boolean;
  theme_id: [number, string] | false;
}

interface WebsiteProduct {
  id: number;
  name: string;
  list_price: number;
  is_published: boolean;
  website_published: boolean;
  categ_id: [number, string];
  qty_available: number;
}

export const Websites: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('websites');
  const [error, setError] = useState<StandardError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'websites') {
        const websiteData = await odooService.getWebsites();
        setWebsites(websiteData);
      } else {
        const productData = await odooService.getWebsiteProducts();
        setProducts(productData);
      }
    } catch (error: any) {
      console.error(`Error loading ${activeTab === 'websites' ? 'website' : 'product'} data:`, error);
      setError(error); // Guardamos el objeto StandardError completo
    } finally {
      setLoading(false);
    }
  };

  const filteredWebsites = websites.filter(website => 
    website.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const websitesCategories = [
    {
      icon: 'lucide:layout',
      label: 'Constructor',
      to: '/app/websites/builder',
      description: 'Constructor de sitios web'
    },
    {
      icon: 'lucide:shopping-bag',
      label: 'eCommerce',
      to: '/app/ecommerce',
      description: 'Tienda online y comercio electrónico'
    },
    {
      icon: 'lucide:globe',
      label: 'Blogs',
      to: '/app/websites/blogs',
      description: 'Gestión de blogs y contenidos'
    },
    {
      icon: 'lucide:message-square',
      label: 'Live Chat',
      to: '/app/websites/livechat',
      description: 'Chat en vivo para atención al cliente'
    },
    {
      icon: 'lucide:bar-chart',
      label: 'Analytics',
      to: '/app/websites/analytics',
      description: 'Análisis de tráfico y conversiones'
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sitios Web</h1>
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadData}
          isLoading={loading}
        >
          Actualizar
        </Button>
      </div>
      
      {error && (
        <Card className={`mb-6 ${error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? 'bg-danger-50 border-danger-200' : 'bg-warning-50 border-warning-200'}`}>
          <CardBody className="flex flex-row items-center gap-3">
            <Icon icon={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "lucide:alert-circle" : "lucide:alert-triangle"} 
                  className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger" : "text-warning"} />
            <div>
              <p className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger font-medium" : "text-warning font-medium"}>
                {getErrorMessage(error)}
              </p>
              {error.suggestion && (
                <p className="text-sm text-foreground-500">{error.suggestion}</p>
              )}
              {error.type === ErrorType.AUTHENTICATION && (
                <Button 
                  color="primary" 
                  size="sm" 
                  className="mt-2"
                  onPress={() => window.location.href = '/login'}
                >
                  Iniciar sesión
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="mb-6"
      >
        <Tab key="websites" title="Sitios Web">
          <Card>
            <CardHeader className="flex justify-between">
              <h2 className="text-xl font-semibold">Sitios Web</h2>
              <Input
                placeholder="Buscar sitios..."
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
                <Table aria-label="Tabla de sitios web">
                  <TableHeader>
                    <TableColumn>NOMBRE</TableColumn>
                    <TableColumn>DOMINIO</TableColumn>
                    <TableColumn>COMPAÑÍA</TableColumn>
                    <TableColumn>TEMA</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay sitios web configurados">
                    {filteredWebsites.map((website) => (
                      <TableRow key={website.id}>
                        <TableCell>{website.name}</TableCell>
                        <TableCell>{website.domain}</TableCell>
                        <TableCell>{website.company_id[1]}</TableCell>
                        <TableCell>{website.theme_id ? website.theme_id[1] : 'Sin tema'}</TableCell>
                        <TableCell>
                          <Chip color={website.is_published ? 'success' : 'default'} size="sm">
                            {website.is_published ? 'Publicado' : 'Borrador'}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="products" title="Productos Web">
          <Card>
            <CardHeader className="flex justify-between">
              <h2 className="text-xl font-semibold">Productos Publicados</h2>
              <Input
                placeholder="Buscar productos..."
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
                <Table aria-label="Tabla de productos web">
                  <TableHeader>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn>CATEGORÍA</TableColumn>
                    <TableColumn>PRECIO</TableColumn>
                    <TableColumn>STOCK</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay productos publicados en el sitio web">
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.categ_id[1]}</TableCell>
                        <TableCell>${product.list_price.toFixed(2)}</TableCell>
                        <TableCell>{product.qty_available}</TableCell>
                        <TableCell>
                          <Chip color={product.website_published ? 'success' : 'default'} size="sm">
                            {product.website_published ? 'Publicado' : 'No publicado'}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      <CategoryMenu title="Gestión de Sitios Web" items={websitesCategories} />
    </div>
  );
};

export default Websites;