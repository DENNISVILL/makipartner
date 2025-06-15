# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from odoo import http, fields
from odoo.http import request
from odoo.exceptions import AccessError, ValidationError
from odoo.tools import float_round

from .main import MakiAPIController, jwt_required, rate_limit, log_api_call

_logger = logging.getLogger(__name__)

class DashboardController(MakiAPIController):
    """Controlador para el dashboard y métricas"""
    
    def _get_date_range(self, period='month'):
        """Obtener rango de fechas según el período"""
        today = datetime.now().date()
        
        if period == 'today':
            return today, today
        elif period == 'week':
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start, end
        elif period == 'month':
            start = today.replace(day=1)
            end = (start + relativedelta(months=1)) - timedelta(days=1)
            return start, end
        elif period == 'quarter':
            quarter = (today.month - 1) // 3 + 1
            start = today.replace(month=(quarter - 1) * 3 + 1, day=1)
            end = (start + relativedelta(months=3)) - timedelta(days=1)
            return start, end
        elif period == 'year':
            start = today.replace(month=1, day=1)
            end = today.replace(month=12, day=31)
            return start, end
        else:
            # Por defecto, último mes
            start = today.replace(day=1)
            end = (start + relativedelta(months=1)) - timedelta(days=1)
            return start, end
    
    @http.route('/api/v1/dashboard/overview', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=30, window=300)
    @log_api_call
    def dashboard_overview(self):
        """Resumen general del dashboard"""
        try:
            period = request.jsonrequest.get('period', 'month')
            start_date, end_date = self._get_date_range(period)
            
            # Métricas de ventas
            sales_data = self._get_sales_metrics(start_date, end_date)
            
            # Métricas financieras
            finance_data = self._get_finance_metrics(start_date, end_date)
            
            # Métricas de CRM
            crm_data = self._get_crm_metrics(start_date, end_date)
            
            # Métricas de inventario
            inventory_data = self._get_inventory_metrics()
            
            # Métricas de proyectos
            project_data = self._get_project_metrics(start_date, end_date)
            
            return self._success_response({
                'period': period,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'sales': sales_data,
                'finance': finance_data,
                'crm': crm_data,
                'inventory': inventory_data,
                'projects': project_data,
                'last_updated': datetime.now().isoformat()
            })
            
        except Exception as e:
            _logger.error(f"Dashboard overview error: {str(e)}")
            return self._error_response(
                "Error loading dashboard data", 
                "DASHBOARD_ERROR",
                str(e)
            )
    
    def _get_sales_metrics(self, start_date, end_date):
        """Obtener métricas de ventas"""
        try:
            SaleOrder = request.env['sale.order']
            
            # Órdenes en el período
            domain = [
                ('date_order', '>=', start_date),
                ('date_order', '<=', end_date)
            ]
            
            orders = SaleOrder.search(domain)
            confirmed_orders = orders.filtered(lambda o: o.state in ['sale', 'done'])
            
            # Calcular métricas
            total_orders = len(orders)
            confirmed_count = len(confirmed_orders)
            total_revenue = sum(confirmed_orders.mapped('amount_total'))
            average_order_value = total_revenue / confirmed_count if confirmed_count > 0 else 0
            
            # Comparación con período anterior
            prev_start = start_date - (end_date - start_date + timedelta(days=1))
            prev_end = start_date - timedelta(days=1)
            
            prev_orders = SaleOrder.search([
                ('date_order', '>=', prev_start),
                ('date_order', '<=', prev_end),
                ('state', 'in', ['sale', 'done'])
            ])
            
            prev_revenue = sum(prev_orders.mapped('amount_total'))
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            
            return {
                'total_orders': total_orders,
                'confirmed_orders': confirmed_count,
                'total_revenue': float_round(total_revenue, 2),
                'average_order_value': float_round(average_order_value, 2),
                'revenue_growth': float_round(revenue_growth, 2),
                'conversion_rate': float_round((confirmed_count / total_orders * 100) if total_orders > 0 else 0, 2)
            }
            
        except Exception as e:
            _logger.error(f"Sales metrics error: {str(e)}")
            return {}
    
    def _get_finance_metrics(self, start_date, end_date):
        """Obtener métricas financieras"""
        try:
            AccountMove = request.env['account.move']
            
            # Facturas del período
            invoice_domain = [
                ('invoice_date', '>=', start_date),
                ('invoice_date', '<=', end_date),
                ('move_type', 'in', ['out_invoice', 'out_refund']),
                ('state', '=', 'posted')
            ]
            
            invoices = AccountMove.search(invoice_domain)
            
            # Facturas de clientes
            customer_invoices = invoices.filtered(lambda i: i.move_type == 'out_invoice')
            refunds = invoices.filtered(lambda i: i.move_type == 'out_refund')
            
            total_invoiced = sum(customer_invoices.mapped('amount_total'))
            total_refunds = sum(refunds.mapped('amount_total'))
            net_revenue = total_invoiced - total_refunds
            
            # Facturas pendientes de pago
            pending_invoices = customer_invoices.filtered(lambda i: i.payment_state in ['not_paid', 'partial'])
            pending_amount = sum(pending_invoices.mapped('amount_residual'))
            
            # Gastos del período
            expense_domain = [
                ('invoice_date', '>=', start_date),
                ('invoice_date', '<=', end_date),
                ('move_type', 'in', ['in_invoice', 'in_refund']),
                ('state', '=', 'posted')
            ]
            
            expenses = AccountMove.search(expense_domain)
            total_expenses = sum(expenses.mapped('amount_total'))
            
            return {
                'total_invoiced': float_round(total_invoiced, 2),
                'total_refunds': float_round(total_refunds, 2),
                'net_revenue': float_round(net_revenue, 2),
                'pending_payments': float_round(pending_amount, 2),
                'total_expenses': float_round(total_expenses, 2),
                'profit_margin': float_round(((net_revenue - total_expenses) / net_revenue * 100) if net_revenue > 0 else 0, 2)
            }
            
        except Exception as e:
            _logger.error(f"Finance metrics error: {str(e)}")
            return {}
    
    def _get_crm_metrics(self, start_date, end_date):
        """Obtener métricas de CRM"""
        try:
            CrmLead = request.env['crm.lead']
            
            # Leads del período
            lead_domain = [
                ('create_date', '>=', start_date),
                ('create_date', '<=', end_date)
            ]
            
            leads = CrmLead.search(lead_domain)
            won_leads = leads.filtered(lambda l: l.stage_id.is_won)
            lost_leads = leads.filtered(lambda l: l.probability == 0 and not l.stage_id.is_won)
            
            total_leads = len(leads)
            won_count = len(won_leads)
            lost_count = len(lost_leads)
            
            conversion_rate = (won_count / total_leads * 100) if total_leads > 0 else 0
            expected_revenue = sum(leads.mapped('expected_revenue'))
            won_revenue = sum(won_leads.mapped('expected_revenue'))
            
            return {
                'total_leads': total_leads,
                'won_leads': won_count,
                'lost_leads': lost_count,
                'conversion_rate': float_round(conversion_rate, 2),
                'expected_revenue': float_round(expected_revenue, 2),
                'won_revenue': float_round(won_revenue, 2)
            }
            
        except Exception as e:
            _logger.error(f"CRM metrics error: {str(e)}")
            return {}
    
    def _get_inventory_metrics(self):
        """Obtener métricas de inventario"""
        try:
            ProductProduct = request.env['product.product']
            StockQuant = request.env['stock.quant']
            
            # Productos con stock
            products_with_stock = ProductProduct.search([
                ('type', '=', 'product'),
                ('active', '=', True)
            ])
            
            total_products = len(products_with_stock)
            
            # Productos con stock bajo
            low_stock_products = []
            out_of_stock_products = []
            
            for product in products_with_stock:
                qty_available = product.qty_available
                if qty_available <= 0:
                    out_of_stock_products.append(product)
                elif qty_available <= (product.reordering_min_qty or 5):
                    low_stock_products.append(product)
            
            # Valor total del inventario
            total_inventory_value = sum(
                product.qty_available * product.standard_price 
                for product in products_with_stock
            )
            
            return {
                'total_products': total_products,
                'low_stock_count': len(low_stock_products),
                'out_of_stock_count': len(out_of_stock_products),
                'inventory_value': float_round(total_inventory_value, 2),
                'stock_health': float_round(
                    ((total_products - len(low_stock_products) - len(out_of_stock_products)) / total_products * 100) 
                    if total_products > 0 else 0, 2
                )
            }
            
        except Exception as e:
            _logger.error(f"Inventory metrics error: {str(e)}")
            return {}
    
    def _get_project_metrics(self, start_date, end_date):
        """Obtener métricas de proyectos"""
        try:
            Project = request.env['project.project']
            Task = request.env['project.task']
            
            # Proyectos activos
            active_projects = Project.search([('active', '=', True)])
            
            # Tareas del período
            task_domain = [
                ('create_date', '>=', start_date),
                ('create_date', '<=', end_date)
            ]
            
            tasks = Task.search(task_domain)
            completed_tasks = tasks.filtered(lambda t: t.stage_id.fold)
            overdue_tasks = tasks.filtered(
                lambda t: t.date_deadline and t.date_deadline < datetime.now().date() and not t.stage_id.fold
            )
            
            total_tasks = len(tasks)
            completed_count = len(completed_tasks)
            overdue_count = len(overdue_tasks)
            
            completion_rate = (completed_count / total_tasks * 100) if total_tasks > 0 else 0
            
            return {
                'active_projects': len(active_projects),
                'total_tasks': total_tasks,
                'completed_tasks': completed_count,
                'overdue_tasks': overdue_count,
                'completion_rate': float_round(completion_rate, 2)
            }
            
        except Exception as e:
            _logger.error(f"Project metrics error: {str(e)}")
            return {}
    
    @http.route('/api/v1/dashboard/charts/sales-trend', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=20, window=300)
    @log_api_call
    def sales_trend_chart(self):
        """Datos para gráfico de tendencia de ventas"""
        try:
            period = request.jsonrequest.get('period', 'month')
            
            if period == 'month':
                # Últimos 12 meses
                data = self._get_monthly_sales_trend(12)
            elif period == 'week':
                # Últimas 12 semanas
                data = self._get_weekly_sales_trend(12)
            else:
                # Últimos 30 días
                data = self._get_daily_sales_trend(30)
            
            return self._success_response(data)
            
        except Exception as e:
            _logger.error(f"Sales trend chart error: {str(e)}")
            return self._error_response(
                "Error loading sales trend data", 
                "CHART_ERROR"
            )
    
    def _get_monthly_sales_trend(self, months):
        """Obtener tendencia de ventas por mes"""
        SaleOrder = request.env['sale.order']
        data = []
        
        for i in range(months):
            date = datetime.now().date() - relativedelta(months=i)
            start = date.replace(day=1)
            end = (start + relativedelta(months=1)) - timedelta(days=1)
            
            orders = SaleOrder.search([
                ('date_order', '>=', start),
                ('date_order', '<=', end),
                ('state', 'in', ['sale', 'done'])
            ])
            
            revenue = sum(orders.mapped('amount_total'))
            
            data.append({
                'period': start.strftime('%Y-%m'),
                'label': start.strftime('%b %Y'),
                'revenue': float_round(revenue, 2),
                'orders': len(orders)
            })
        
        return list(reversed(data))
    
    def _get_weekly_sales_trend(self, weeks):
        """Obtener tendencia de ventas por semana"""
        SaleOrder = request.env['sale.order']
        data = []
        
        for i in range(weeks):
            end_date = datetime.now().date() - timedelta(weeks=i)
            start_date = end_date - timedelta(days=6)
            
            orders = SaleOrder.search([
                ('date_order', '>=', start_date),
                ('date_order', '<=', end_date),
                ('state', 'in', ['sale', 'done'])
            ])
            
            revenue = sum(orders.mapped('amount_total'))
            
            data.append({
                'period': f"{start_date.strftime('%Y-%m-%d')}__{end_date.strftime('%Y-%m-%d')}",
                'label': f"Week of {start_date.strftime('%b %d')}",
                'revenue': float_round(revenue, 2),
                'orders': len(orders)
            })
        
        return list(reversed(data))
    
    def _get_daily_sales_trend(self, days):
        """Obtener tendencia de ventas por día"""
        SaleOrder = request.env['sale.order']
        data = []
        
        for i in range(days):
            date = datetime.now().date() - timedelta(days=i)
            
            orders = SaleOrder.search([
                ('date_order', '=', date),
                ('state', 'in', ['sale', 'done'])
            ])
            
            revenue = sum(orders.mapped('amount_total'))
            
            data.append({
                'period': date.strftime('%Y-%m-%d'),
                'label': date.strftime('%b %d'),
                'revenue': float_round(revenue, 2),
                'orders': len(orders)
            })
        
        return list(reversed(data))