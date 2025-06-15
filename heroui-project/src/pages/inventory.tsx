import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner, Chip, Input, Tabs, Tab } from '@heroui/react';
import { Icon } from '@iconify/react';
import odooService from '../services/odooService';
import { getErrorMessage, ErrorType, StandardError } from '../services/errorHandler';

interface Product {
  id: number;
  name: string;
  default_code: string;
  list_price: number;
  qty_available: number;
  categ_id: [number, string];
}

interface StockMove {
  id: number;
  name: string;
  product_id: [number, string];
  product_uom_qty: number;
  state: string;
  date: string;
}

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [error, setError] = useState<StandardError | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'products') {
        const productData = await odooService.getProducts();
        setProducts(productData);
      } else {
        const moveData = await odooService.getStockMoves();
        setStockMoves(moveData);
      }
    } catch (error: any) {
      console.error('Error loading inventory data:', error);
      setError(error); // Guardamos el objeto StandardError completo
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.default_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockColor = (qty: number) => {
    if (qty <= 0) return 'danger';
    if (qty <= 10) return 'warning';
    return 'success';
  };

  const getStockMoveStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'default';
      case 'waiting': return 'warning';
      case 'confirmed': return 'primary';
      case 'assigned': return 'secondary';
      case 'done': return 'success';
      case 'cancel': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario</h1>
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
        <Tab key="products" title="Productos">
          <Card>
            <CardHeader className="flex justify-between">
              <h2 className="text-xl font-semibold">Productos</h2>
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
                <Table aria-label="Tabla de productos">
                  <TableHeader>
                    <TableColumn>CÓDIGO</TableColumn>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn>CATEGORÍA</TableColumn>
                    <TableColumn>PRECIO</TableColumn>
                    <TableColumn>STOCK</TableColumn>
                    <TableColumn>ESTADO STOCK</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay productos">
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.default_code || 'N/A'}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.categ_id[1]}</TableCell>
                        <TableCell>${product.list_price.toFixed(2)}</TableCell>
                        <TableCell>{product.qty_available}</TableCell>
                        <TableCell>
                          <Chip color={getStockColor(product.qty_available)} size="sm">
                            {product.qty_available <= 0 ? 'Sin Stock' : 
                             product.qty_available <= 10 ? 'Stock Bajo' : 'En Stock'}
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
        
        <Tab key="moves" title="Movimientos">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Movimientos de Stock</h2>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table aria-label="Tabla de movimientos">
                  <TableHeader>
                    <TableColumn>REFERENCIA</TableColumn>
                    <TableColumn>PRODUCTO</TableColumn>
                    <TableColumn>CANTIDAD</TableColumn>
                    <TableColumn>FECHA</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No hay movimientos">
                    {stockMoves.map((move) => (
                      <TableRow key={move.id}>
                        <TableCell>{move.name}</TableCell>
                        <TableCell>{move.product_id[1]}</TableCell>
                        <TableCell>{move.product_uom_qty}</TableCell>
                        <TableCell>{new Date(move.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip color={getStockMoveStateColor(move.state)} size="sm">
                            {move.state === 'draft' ? 'Borrador' : 
                             move.state === 'waiting' ? 'Esperando' : 
                             move.state === 'confirmed' ? 'Confirmado' : 
                             move.state === 'assigned' ? 'Asignado' : 
                             move.state === 'done' ? 'Completado' : 
                             move.state === 'cancel' ? 'Cancelado' : move.state}
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
    </div>
  );
};