import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardBody, CardHeader, Spinner, Button } from '@heroui/react';
import odooService from '../../services/odooService';
import { handleOdooError } from '../../services/errorHandler';

interface CustomerDistributionChartProps {
  title?: string;
  height?: number;
  showControls?: boolean;
}

interface CustomerCategoryData {
  name: string;
  value: number;
  color: string;
}

// Colores para las diferentes categorías
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const CustomerDistributionChart: React.FC<CustomerDistributionChartProps> = ({
  title = 'Distribución de Clientes',
  height = 400,
  showControls = true,
}) => {
  const [data, setData] = useState<CustomerCategoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamada al método del servidor para obtener distribución de clientes
      const result = await odooService.callMethod('res.partner', 'get_customer_distribution', [], {});
      
      // Transformar los datos para el gráfico
      const formattedData = result.map((item: any, index: number) => ({
        name: item.category_name || 'Sin categoría',
        value: item.customer_count || 0,
        color: COLORS[index % COLORS.length]
      }));
      
      setData(formattedData);
    } catch (err: any) {
      const error = handleOdooError(err, 'fetchCustomerDistribution');
      setError(error.message || 'Error al cargar los datos');
      console.error('Error al cargar datos de distribución de clientes:', error);
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

  // Si no hay datos reales, mostrar datos de ejemplo
  const getChartData = () => {
    if (data.length > 0) return data;
    
    // Datos de ejemplo para mostrar cuando no hay datos reales
    return [
      { name: 'Empresas', value: 400, color: COLORS[0] },
      { name: 'Particulares', value: 300, color: COLORS[1] },
      { name: 'Instituciones', value: 200, color: COLORS[2] },
      { name: 'Educación', value: 150, color: COLORS[3] },
      { name: 'Gobierno', value: 100, color: COLORS[4] },
    ];
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
            <PieChart>
              <Pie
                data={getChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={height / 4}
                fill="#8884d8"
                dataKey="value"
              >
                {getChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${value} clientes`,
                  name,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
};

export default CustomerDistributionChart;