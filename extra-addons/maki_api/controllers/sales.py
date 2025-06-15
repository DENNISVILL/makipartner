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

class SalesController(MakiAPIController):
    """Controlador para APIs de ventas"""
    
    @http.route('/api/v1/sales/orders', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=50, window=300)
    @log_api_call
    def get_sale_orders(self):
        """Obtener lista de pedidos de venta"""
        try:
            params = request.jsonrequest or {}
            
            # Parámetros de filtrado
            limit = min(params.get('limit', 20), 100)
            offset = params.get('offset', 0)
            state = params.get('state')  # draft, sent, sale, done, cancel
            partner_id = params.get('partner_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            
            # Construir dominio
            domain = []
            
            if state:
                domain.append(('state', '=', state))
            
            if partner_id:
                domain.append(('partner_id', '=', partner_id))
            
            if date_from:
                domain.append(('date_order', '>=', date_from))
            
            if date_to:
                domain.append(('date_order', '<=', date_to))
            
            # Buscar pedidos
            SaleOrder = request.env['sale.order']
            orders = SaleOrder.search(domain, limit=limit, offset=offset, order='date_order desc')
            total_count = SaleOrder.search_count(domain)
            
            # Formatear datos
            order_data = []
            for order in orders:
                order_data.append({
                    'id': order.id,
                    'name': order.name,
                    'date_order': order.date_order.isoformat() if order.date_order else None,
                    'partner': {
                        'id': order.partner_id.id,
                        'name': order.partner_id.name
                    } if order.partner_id else None,
                    'amount_untaxed': float_round(order.amount_untaxed, 2),
                    'amount_tax': float_round(order.amount_tax, 2),
                    'amount_total': float_round(order.amount_total, 2),
                    'state': order.state,
                    'invoice_status': order.invoice_status,
                    'currency': {
                        'id': order.currency_id.id,
                        'name': order.currency_id.name,
                        'symbol': order.currency_id.symbol
                    } if order.currency_id else None,
                    'client_order_ref': order.client_order_ref,
                    'user': {
                        'id': order.user_id.id,
                        'name': order.user_id.name
                    } if order.user_id else None
                })
            
            return self._success_response({
                'orders': order_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            _logger.error(f"Get sale orders error: {str(e)}")
            return self._error_response(
                "Error retrieving sale orders", 
                "ORDERS_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/sales/orders/<int:order_id>', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=100, window=300)
    @log_api_call
    def get_sale_order_detail(self, order_id):
        """Obtener detalle de un pedido de venta específico"""
        try:
            SaleOrder = request.env['sale.order']
            order = SaleOrder.browse(order_id)
            
            if not order.exists():
                return self._error_response(
                    "Sale order not found", 
                    "ORDER_NOT_FOUND"
                )
            
            # Líneas del pedido
            lines_data = []
            for line in order.order_line:
                lines_data.append({
                    'id': line.id,
                    'product': {
                        'id': line.product_id.id,
                        'name': line.product_id.name,
                        'default_code': line.product_id.default_code,
                        'image_url': f"/web/image/product.product/{line.product_id.id}/image_128"
                    } if line.product_id else None,
                    'name': line.name,
                    'quantity': float_round(line.product_uom_qty, 2),
                    'delivered_qty': float_round(line.qty_delivered, 2),
                    'invoiced_qty': float_round(line.qty_invoiced, 2),
                    'price_unit': float_round(line.price_unit, 2),
                    'discount': float_round(line.discount, 2),
                    'price_subtotal': float_round(line.price_subtotal, 2),
                    'price_total': float_round(line.price_total, 2),
                    'tax_ids': [{
                        'id': tax.id,
                        'name': tax.name,
                        'amount': tax.amount
                    } for tax in line.tax_id]
                })
            
            # Facturas relacionadas
            invoices_data = []
            for invoice in order.invoice_ids:
                invoices_data.append({
                    'id': invoice.id,
                    'name': invoice.name,
                    'date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                    'amount_total': float_round(invoice.amount_total, 2),
                    'state': invoice.state,
                    'payment_state': invoice.payment_state
                })
            
            # Entregas relacionadas
            deliveries_data = []
            for picking in order.picking_ids:
                deliveries_data.append({
                    'id': picking.id,
                    'name': picking.name,
                    'date': picking.date_done.isoformat() if picking.date_done else None,
                    'state': picking.state,
                    'scheduled_date': picking.scheduled_date.isoformat() if picking.scheduled_date else None
                })
            
            order_detail = {
                'id': order.id,
                'name': order.name,
                'date_order': order.date_order.isoformat() if order.date_order else None,
                'partner': {
                    'id': order.partner_id.id,
                    'name': order.partner_id.name,
                    'vat': order.partner_id.vat,
                    'email': order.partner_id.email,
                    'phone': order.partner_id.phone,
                    'street': order.partner_id.street,
                    'city': order.partner_id.city,
                    'country': order.partner_id.country_id.name if order.partner_id.country_id else None
                } if order.partner_id else None,
                'amount_untaxed': float_round(order.amount_untaxed, 2),
                'amount_tax': float_round(order.amount_tax, 2),
                'amount_total': float_round(order.amount_total, 2),
                'state': order.state,
                'invoice_status': order.invoice_status,
                'delivery_status': order.delivery_status if hasattr(order, 'delivery_status') else None,
                'currency': {
                    'id': order.currency_id.id,
                    'name': order.currency_id.name,
                    'symbol': order.currency_id.symbol
                } if order.currency_id else None,
                'client_order_ref': order.client_order_ref,
                'user': {
                    'id': order.user_id.id,
                    'name': order.user_id.name
                } if order.user_id else None,
                'payment_term': order.payment_term_id.name if order.payment_term_id else None,
                'note': order.note,
                'lines': lines_data,
                'invoices': invoices_data,
                'deliveries': deliveries_data,
                'company': {
                    'id': order.company_id.id,
                    'name': order.company_id.name
                } if order.company_id else None
            }
            
            return self._success_response(order_detail)
            
        except Exception as e:
            _logger.error(f"Get sale order detail error: {str(e)}")
            return self._error_response(
                "Error retrieving sale order detail", 
                "ORDER_DETAIL_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/sales/customers', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=30, window=300)
    @log_api_call
    def get_customers(self):
        """Obtener lista de clientes"""
        try:
            params = request.jsonrequest or {}
            
            # Parámetros de filtrado
            limit = min(params.get('limit', 20), 100)
            offset = params.get('offset', 0)
            search = params.get('search', '')
            country_id = params.get('country_id')
            
            # Construir dominio
            domain = [('customer_rank', '>', 0)]
            
            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('vat', 'ilike', search))
            
            if country_id:
                domain.append(('country_id', '=', country_id))
            
            # Buscar clientes
            Partner = request.env['res.partner']
            customers = Partner.search(domain, limit=limit, offset=offset, order='name')
            total_count = Partner.search_count(domain)
            
            # Formatear datos
            customer_data = []
            for customer in customers:
                customer_data.append({
                    'id': customer.id,
                    'name': customer.name,
                    'vat': customer.vat,
                    'email': customer.email,
                    'phone': customer.phone,
                    'mobile': customer.mobile,
                    'street': customer.street,
                    'city': customer.city,
                    'zip': customer.zip,
                    'country': {
                        'id': customer.country_id.id,
                        'name': customer.country_id.name,
                        'code': customer.country_id.code
                    } if customer.country_id else None,
                    'state': {
                        'id': customer.state_id.id,
                        'name': customer.state_id.name
                    } if customer.state_id else None,
                    'website': customer.website,
                    'customer_rank': customer.customer_rank,
                    'supplier_rank': customer.supplier_rank,
                    'company': {
                        'id': customer.company_id.id,
                        'name': customer.company_id.name
                    } if customer.company_id else None,
                    'is_company': customer.is_company,
                    'parent': {
                        'id': customer.parent_id.id,
                        'name': customer.parent_id.name
                    } if customer.parent_id else None
                })
            
            return self._success_response({
                'customers': customer_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            _logger.error(f"Get customers error: {str(e)}")
            return self._error_response(
                "Error retrieving customers", 
                "CUSTOMERS_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/sales/customers/<int:customer_id>', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=100, window=300)
    @log_api_call
    def get_customer_detail(self, customer_id):
        """Obtener detalle de un cliente específico"""
        try:
            Partner = request.env['res.partner']
            customer = Partner.browse(customer_id)
            
            if not customer.exists():
                return self._error_response(
                    "Customer not found", 
                    "CUSTOMER_NOT_FOUND"
                )
            
            # Pedidos del cliente
            SaleOrder = request.env['sale.order']
            orders = SaleOrder.search([
                ('partner_id', '=', customer.id)
            ], limit=10, order='date_order desc')
            
            orders_data = []
            for order in orders:
                orders_data.append({
                    'id': order.id,
                    'name': order.name,
                    'date_order': order.date_order.isoformat() if order.date_order else None,
                    'amount_total': float_round(order.amount_total, 2),
                    'state': order.state
                })
            
            # Facturas del cliente
            AccountMove = request.env['account.move']
            invoices = AccountMove.search([
                ('partner_id', '=', customer.id),
                ('move_type', 'in', ['out_invoice', 'out_refund'])
            ], limit=10, order='invoice_date desc')
            
            invoices_data = []
            for invoice in invoices:
                invoices_data.append({
                    'id': invoice.id,
                    'name': invoice.name,
                    'date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                    'amount_total': float_round(invoice.amount_total, 2),
                    'state': invoice.state,
                    'payment_state': invoice.payment_state
                })
            
            # Contactos relacionados (si es una empresa)
            contacts_data = []
            if customer.is_company:
                contacts = Partner.search([
                    ('parent_id', '=', customer.id)
                ])
                
                for contact in contacts:
                    contacts_data.append({
                        'id': contact.id,
                        'name': contact.name,
                        'function': contact.function,
                        'email': contact.email,
                        'phone': contact.phone,
                        'mobile': contact.mobile
                    })
            
            customer_detail = {
                'id': customer.id,
                'name': customer.name,
                'vat': customer.vat,
                'email': customer.email,
                'phone': customer.phone,
                'mobile': customer.mobile,
                'street': customer.street,
                'street2': customer.street2,
                'city': customer.city,
                'zip': customer.zip,
                'country': {
                    'id': customer.country_id.id,
                    'name': customer.country_id.name,
                    'code': customer.country_id.code
                } if customer.country_id else None,
                'state': {
                    'id': customer.state_id.id,
                    'name': customer.state_id.name
                } if customer.state_id else None,
                'website': customer.website,
                'customer_rank': customer.customer_rank,
                'supplier_rank': customer.supplier_rank,
                'company': {
                    'id': customer.company_id.id,
                    'name': customer.company_id.name
                } if customer.company_id else None,
                'is_company': customer.is_company,
                'parent': {
                    'id': customer.parent_id.id,
                    'name': customer.parent_id.name
                } if customer.parent_id else None,
                'category_id': [{
                    'id': category.id,
                    'name': category.name
                } for category in customer.category_id],
                'comment': customer.comment,
                'orders': orders_data,
                'invoices': invoices_data,
                'contacts': contacts_data,
                'total_orders': SaleOrder.search_count([('partner_id', '=', customer.id)]),
                'total_invoices': AccountMove.search_count([
                    ('partner_id', '=', customer.id),
                    ('move_type', 'in', ['out_invoice', 'out_refund'])
                ])
            }
            
            return self._success_response(customer_detail)
            
        except Exception as e:
            _logger.error(f"Get customer detail error: {str(e)}")
            return self._error_response(
                "Error retrieving customer detail", 
                "CUSTOMER_DETAIL_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/sales/products', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=50, window=300)
    @log_api_call
    def get_products(self):
        """Obtener lista de productos"""
        try:
            params = request.jsonrequest or {}
            
            # Parámetros de filtrado
            limit = min(params.get('limit', 20), 100)
            offset = params.get('offset', 0)
            search = params.get('search', '')
            category_id = params.get('category_id')
            type = params.get('type')  # consu, service, product
            
            # Construir dominio
            domain = [('sale_ok', '=', True)]
            
            if search:
                domain.append('|')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('default_code', 'ilike', search))
                domain.append(('barcode', 'ilike', search))
            
            if category_id:
                domain.append(('categ_id', '=', category_id))
            
            if type:
                domain.append(('type', '=', type))
            
            # Buscar productos
            Product = request.env['product.product']
            products = Product.search(domain, limit=limit, offset=offset, order='name')
            total_count = Product.search_count(domain)
            
            # Formatear datos
            product_data = []
            for product in products:
                product_data.append({
                    'id': product.id,
                    'name': product.name,
                    'default_code': product.default_code,
                    'barcode': product.barcode,
                    'list_price': float_round(product.list_price, 2),
                    'standard_price': float_round(product.standard_price, 2),
                    'type': product.type,
                    'category': {
                        'id': product.categ_id.id,
                        'name': product.categ_id.name
                    } if product.categ_id else None,
                    'uom': product.uom_id.name if product.uom_id else None,
                    'weight': float_round(product.weight, 2),
                    'volume': float_round(product.volume, 2),
                    'sale_ok': product.sale_ok,
                    'purchase_ok': product.purchase_ok,
                    'active': product.active,
                    'image_url': f"/web/image/product.product/{product.id}/image_128",
                    'qty_available': float_round(product.qty_available, 2) if product.type == 'product' else None,
                    'virtual_available': float_round(product.virtual_available, 2) if product.type == 'product' else None
                })
            
            return self._success_response({
                'products': product_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            _logger.error(f"Get products error: {str(e)}")
            return self._error_response(
                "Error retrieving products", 
                "PRODUCTS_ERROR",
                str(e)
            )