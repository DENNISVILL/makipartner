import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardBody, CardHeader, Spinner, Button } from '@heroui/react';
import dashboardService from '../../services/dashboardService';

type PeriodType = 'month' | 'week' | 'day';

interface SalesTrendChartProps {
  title?: string;
  height?: number;
  showControls?: boolean;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ 
  title = 'Tendencia de Ventas', 
  height = 400,
  showControls = true
}) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getSalesTrend(period);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
      console.error('Error al cargar datos de tendencia de ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const handleRefresh = () => {
    fetchData();
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderPeriodButtons = () => {
    if (!showControls) return null;
    
    return (
      <div className="flex space-x-2 mb-4">
        <Button 
          size="sm" 
          color={period === 'day' ? 'primary' : 'default'}
          variant={period === 'day' ? 'solid' : 'flat'}
          onClick={() => handlePeriodChange('day')}
        >
          Diario
        </Button>
        <Button 
          size="sm" 
          color={period === 'week' ? 'primary' : 'default'}
          variant={period === 'week' ? 'solid' : 'flat'}
          onClick={() => handlePeriodChange('week')}
        >
          Semanal
        </Button>
        <Button 
          size="sm" 
          color={period === 'month' ? 'primary' : 'default'}
          variant={period === 'month' ? 'solid' : 'flat'}
          onClick={() => handlePeriodChange('month')}
        >
          Mensual
        </Button>
      </div>
    );
  };

  return (
    <Card className="border border-divider">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        {showControls && (
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
        )}
      </CardHeader>
      <CardBody className="p-6">
        {renderPeriodButtons()}
        
        {loading ? (
          <div className="flex justify-center items-center" style={{ height: `${height - 100}px` }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center text-danger" style={{ height: `${height - 100}px` }}>
            <p>{error}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center text-foreground-400" style={{ height: `${height - 100}px` }}>
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height - 100}>
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
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
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend 
                formatter={(value) => {
                  if (value === 'revenue') return 'Ingresos';
                  if (value === 'orders') return 'Pedidos';
                  return value;
                }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="revenue" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="orders" 
                stroke="#82ca9d" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        <p className="text-xs text-foreground-400 mt-4">
          Todas las fechas se consideran en horario local
        </p>
      </CardBody>
    </Card>
  );
};

export default SalesTrendChart;