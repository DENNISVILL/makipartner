import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardBody, CardHeader, Spinner, Button } from '@heroui/react';
import odooService from '../../services/odooService';
import { handleOdooError } from '../../services/errorHandler';

interface RegionalSalesChartProps {
  title?: string;
  height?: number;
  showControls?: boolean;
}

interface RegionalSalesData {
  region: string;
  revenue: number;
  orders: number;
}

const RegionalSalesChart: React.FC<RegionalSalesChartProps> = ({
  title = 'Ventas por Región',
  height = 400,
  showControls = true,
}) => {
  const [data, setData] = useState<RegionalSalesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada al método del servidor para obtener ventas por región
      const result = await odooService.callMethod('sale.order', 'get_sales_by_region', [], {});
      
      // Transformar los datos para el gráfico
      const formattedData = result.map((item: any) => ({
        region: item.region_name || 'Sin región',
        revenue: item.total_revenue || 0,
        orders: item.order_count || 0
      }));
      
      setData(formattedData);
    } catch (err: any) {
      const error = handleOdooError(err, 'fetchRegionalSales');
      setError(error.message || 'Error al cargar los datos');
      console.error('Error al cargar datos de ventas por región:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Si no hay datos reales, mostrar datos de ejemplo
  const getChartData = () => {
    if (data.length > 0) return data;
    
    // Datos de ejemplo para mostrar cuando no hay datos reales
    return [
      { region: 'Europa', revenue: 120000, orders: 450 },
      { region: 'América', revenue: 98000, orders: 320 },
      { region: 'Asia', revenue: 86000, orders: 280 },
      { region: 'África', revenue: 56000, orders: 190 },
      { region: 'Oceanía', revenue: 38000, orders: 120 },
    ];
  };

  return (
    <Card className="border border-divider">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        {showControls && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              isIconOnly
              variant="light"
              onClick={handleRefresh}
              disabled={loading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
            <Button size="sm" color="primary" variant="flat">
              Descargar CSV
            </Button>
          </div>
        )}
      </CardHeader>
      <CardBody className="p-6">
        {loading ? (
          <div
            className="flex justify-center items-center"
            style={{ height: `${height - 100}px` }}
          >
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div
            className="flex justify-center items-center text-danger"
            style={{ height: `${height - 100}px` }}
          >
            <p>{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height - 100}>
            <BarChart
              data={getChartData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={formatCurrency}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [formatCurrency(value as number), 'Ingresos'];
                  }
                  return [value, name === 'orders' ? 'Pedidos' : name];
                }}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'revenue') return 'Ingresos';
                  if (value === 'orders') return 'Pedidos';
                  return value;
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="#8884d8"
                name="revenue"
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                fill="#82ca9d"
                name="orders"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
};

export default RegionalSalesChart;