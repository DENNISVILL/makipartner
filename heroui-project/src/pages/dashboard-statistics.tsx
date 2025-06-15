import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import RegionalSalesChart from '../components/charts/RegionalSalesChart';
import CustomerDistributionChart from '../components/charts/CustomerDistributionChart';
import dashboardService from '../services/dashboardService';

export const DashboardStatistics: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getDashboardOverview(period);
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del dashboard');
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
    setPeriod(newPeriod);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estadísticas de ventas</h1>
        <div className="flex space-x-2">
          <Button
            size="sm"
            color={period === 'today' ? 'primary' : 'default'}
            variant={period === 'today' ? 'solid' : 'flat'}
            onClick={() => handlePeriodChange('today')}
          >
            Hoy
          </Button>
          <Button
            size="sm"
            color={period === 'week' ? 'primary' : 'default'}
            variant={period === 'week' ? 'solid' : 'flat'}
            onClick={() => handlePeriodChange('week')}
          >
            Semana
          </Button>
          <Button
            size="sm"
            color={period === 'month' ? 'primary' : 'default'}
            variant={period === 'month' ? 'solid' : 'flat'}
            onClick={() => handlePeriodChange('month')}
          >
            Mes
          </Button>
          <Button
            size="sm"
            color={period === 'quarter' ? 'primary' : 'default'}
            variant={period === 'quarter' ? 'solid' : 'flat'}
            onClick={() => handlePeriodChange('quarter')}
          >
            Trimestre
          </Button>
          <Button
            size="sm"
            color={period === 'year' ? 'primary' : 'default'}
            variant={period === 'year' ? 'solid' : 'flat'}
            onClick={() => handlePeriodChange('year')}
          >
            Año
          </Button>
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
      </div>
      
      {loading && !dashboardData ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-danger">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <Card className="border border-divider mb-8">
            <CardBody className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {dashboardData?.crm?.total_leads ? formatNumber(dashboardData.crm.total_leads) : '0'}
                  </div>
                  <div className="text-sm text-foreground-500">Leads</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {dashboardData?.crm?.total_opportunities ? formatNumber(dashboardData.crm.total_opportunities) : '0'}
                  </div>
                  <div className="text-sm text-foreground-500">Oportunidades</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {dashboardData?.sales?.total_orders ? formatNumber(dashboardData.sales.total_orders) : '0'}
                  </div>
                  <div className="text-sm text-foreground-500">Pedidos</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RegionalSalesChart height={350} />
                <CustomerDistributionChart height={350} />
              </div>
            </CardBody>
          </Card>
          
          <SalesTrendChart height={400} />
        </>
      )}
    </div>
  );
};