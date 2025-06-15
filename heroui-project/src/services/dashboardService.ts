import odooService from './odooService';
import { z } from 'zod';
import cacheService from './cacheService';
import { handleOdooError, ErrorType } from './errorHandler';

// Esquemas de validación para los datos del dashboard
const salesMetricSchema = z.object({
  total_orders: z.number(),
  confirmed_orders: z.number(),
  total_revenue: z.number(),
  average_order_value: z.number(),
  conversion_rate: z.number()
});

const financeMetricSchema = z.object({
  total_invoices: z.number(),
  paid_invoices: z.number(),
  total_invoice_amount: z.number(),
  paid_amount: z.number(),
  payment_rate: z.number()
});

const crmMetricSchema = z.object({
  total_leads: z.number(),
  qualified_leads: z.number(),
  conversion_rate: z.number(),
  average_deal_size: z.number(),
  lead_response_time: z.number().optional()
});

const inventoryMetricSchema = z.object({
  total_products: z.number(),
  low_stock_products: z.number(),
  out_of_stock_products: z.number(),
  average_stock_value: z.number()
});

const projectMetricSchema = z.object({
  total_projects: z.number(),
  active_projects: z.number(),
  completed_projects: z.number(),
  delayed_projects: z.number(),
  on_time_completion_rate: z.number()
});

const dashboardOverviewSchema = z.object({
  sales: salesMetricSchema,
  finance: financeMetricSchema,
  crm: crmMetricSchema,
  inventory: inventoryMetricSchema,
  project: projectMetricSchema
});

const salesTrendItemSchema = z.object({
  period: z.string(),
  label: z.string(),
  revenue: z.number(),
  orders: z.number()
});

const salesTrendSchema = z.array(salesTrendItemSchema);

class DashboardService {
  // Obtener resumen del dashboard
  async getDashboardOverview(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    const cacheKey = `dashboard_overview_${period}_${odooService.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await odooService.callMethod('maki.api.dashboard', 'dashboard_overview', [], { period });
          return dashboardOverviewSchema.parse(result);
        },
        5 * 60 * 1000 // 5 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getDashboardOverview');
    }
  }

  // Obtener datos para el gráfico de tendencia de ventas
  async getSalesTrend(period: 'month' | 'week' | 'day' = 'month') {
    const cacheKey = `sales_trend_${period}_${odooService.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          const result = await odooService.callMethod('maki.api.dashboard', 'sales_trend_chart', [], { period });
          return salesTrendSchema.parse(result.data);
        },
        10 * 60 * 1000 // 10 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getSalesTrend');
    }
  }

  // Limpiar caché específica
  clearDashboardCache() {
    if (odooService.session_id) {
      cacheService.invalidatePattern('dashboard_');
      cacheService.invalidatePattern('sales_trend_');
    }
  }

  // Refrescar datos del dashboard
  async refreshDashboardData(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    this.clearDashboardCache();
    return await this.getDashboardOverview(period);
  }

  // Refrescar datos de tendencia de ventas
  async refreshSalesTrend(period: 'month' | 'week' | 'day' = 'month') {
    if (odooService.session_id) {
      const cacheKey = `sales_trend_${period}_${odooService.session_id}`;
      cacheService.delete(cacheKey);
    }
    return await this.getSalesTrend(period);
  }
}

const dashboardService = new DashboardService();
export default dashboardService;