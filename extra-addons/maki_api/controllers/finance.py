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

class FinanceController(MakiAPIController):
    """Controlador para APIs financieras"""
    
    @http.route('/api/v1/finance/invoices', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=50, window=300)
    @log_api_call
    def get_invoices(self):
        """Obtener lista de facturas"""
        try:
            params = request.jsonrequest or {}
            
            # Parámetros de filtrado
            limit = min(params.get('limit', 20), 100)  # Máximo 100
            offset = params.get('offset', 0)
            state = params.get('state')  # draft, posted, cancel
            partner_id = params.get('partner_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            invoice_type = params.get('type', 'out_invoice')  # out_invoice, in_invoice, out_refund, in_refund
            
            # Construir dominio
            domain = [('move_type', '=', invoice_type)]
            
            if state:
                domain.append(('state', '=', state))
            
            if partner_id:
                domain.append(('partner_id', '=', partner_id))
            
            if date_from:
                domain.append(('invoice_date', '>=', date_from))
            
            if date_to:
                domain.append(('invoice_date', '<=', date_to))
            
            # Buscar facturas
            AccountMove = request.env['account.move']
            invoices = AccountMove.search(domain, limit=limit, offset=offset, order='invoice_date desc')
            total_count = AccountMove.search_count(domain)
            
            # Formatear datos
            invoice_data = []
            for invoice in invoices:
                invoice_data.append({
                    'id': invoice.id,
                    'name': invoice.name,
                    'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                    'due_date': invoice.invoice_date_due.isoformat() if invoice.invoice_date_due else None,
                    'partner': {
                        'id': invoice.partner_id.id,
                        'name': invoice.partner_id.name,
                        'vat': invoice.partner_id.vat
                    } if invoice.partner_id else None,
                    'amount_untaxed': float_round(invoice.amount_untaxed, 2),
                    'amount_tax': float_round(invoice.amount_tax, 2),
                    'amount_total': float_round(invoice.amount_total, 2),
                    'amount_residual': float_round(invoice.amount_residual, 2),
                    'state': invoice.state,
                    'payment_state': invoice.payment_state,
                    'currency': {
                        'id': invoice.currency_id.id,
                        'name': invoice.currency_id.name,
                        'symbol': invoice.currency_id.symbol
                    } if invoice.currency_id else None,
                    'ref': invoice.ref,
                    'invoice_origin': invoice.invoice_origin
                })
            
            return self._success_response({
                'invoices': invoice_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            _logger.error(f"Get invoices error: {str(e)}")
            return self._error_response(
                "Error retrieving invoices", 
                "INVOICES_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/finance/invoices/<int:invoice_id>', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=100, window=300)
    @log_api_call
    def get_invoice_detail(self, invoice_id):
        """Obtener detalle de una factura específica"""
        try:
            AccountMove = request.env['account.move']
            invoice = AccountMove.browse(invoice_id)
            
            if not invoice.exists():
                return self._error_response(
                    "Invoice not found", 
                    "INVOICE_NOT_FOUND"
                )
            
            # Líneas de la factura
            lines_data = []
            for line in invoice.invoice_line_ids:
                lines_data.append({
                    'id': line.id,
                    'product': {
                        'id': line.product_id.id,
                        'name': line.product_id.name,
                        'default_code': line.product_id.default_code
                    } if line.product_id else None,
                    'name': line.name,
                    'quantity': float_round(line.quantity, 2),
                    'price_unit': float_round(line.price_unit, 2),
                    'discount': float_round(line.discount, 2),
                    'price_subtotal': float_round(line.price_subtotal, 2),
                    'price_total': float_round(line.price_total, 2),
                    'account': {
                        'id': line.account_id.id,
                        'code': line.account_id.code,
                        'name': line.account_id.name
                    } if line.account_id else None,
                    'tax_ids': [{
                        'id': tax.id,
                        'name': tax.name,
                        'amount': tax.amount
                    } for tax in line.tax_ids]
                })
            
            # Pagos relacionados
            payments_data = []
            for payment in invoice._get_reconciled_payments():
                payments_data.append({
                    'id': payment.id,
                    'name': payment.name,
                    'date': payment.date.isoformat() if payment.date else None,
                    'amount': float_round(payment.amount, 2),
                    'payment_method': payment.payment_method_line_id.name if payment.payment_method_line_id else None,
                    'journal': {
                        'id': payment.journal_id.id,
                        'name': payment.journal_id.name
                    } if payment.journal_id else None
                })
            
            invoice_detail = {
                'id': invoice.id,
                'name': invoice.name,
                'invoice_date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                'due_date': invoice.invoice_date_due.isoformat() if invoice.invoice_date_due else None,
                'partner': {
                    'id': invoice.partner_id.id,
                    'name': invoice.partner_id.name,
                    'vat': invoice.partner_id.vat,
                    'email': invoice.partner_id.email,
                    'phone': invoice.partner_id.phone,
                    'street': invoice.partner_id.street,
                    'city': invoice.partner_id.city,
                    'country': invoice.partner_id.country_id.name if invoice.partner_id.country_id else None
                } if invoice.partner_id else None,
                'amount_untaxed': float_round(invoice.amount_untaxed, 2),
                'amount_tax': float_round(invoice.amount_tax, 2),
                'amount_total': float_round(invoice.amount_total, 2),
                'amount_residual': float_round(invoice.amount_residual, 2),
                'state': invoice.state,
                'payment_state': invoice.payment_state,
                'currency': {
                    'id': invoice.currency_id.id,
                    'name': invoice.currency_id.name,
                    'symbol': invoice.currency_id.symbol
                } if invoice.currency_id else None,
                'ref': invoice.ref,
                'invoice_origin': invoice.invoice_origin,
                'narration': invoice.narration,
                'lines': lines_data,
                'payments': payments_data,
                'company': {
                    'id': invoice.company_id.id,
                    'name': invoice.company_id.name,
                    'vat': invoice.company_id.vat
                } if invoice.company_id else None
            }
            
            return self._success_response(invoice_detail)
            
        except Exception as e:
            _logger.error(f"Get invoice detail error: {str(e)}")
            return self._error_response(
                "Error retrieving invoice detail", 
                "INVOICE_DETAIL_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/finance/payments', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=50, window=300)
    @log_api_call
    def get_payments(self):
        """Obtener lista de pagos"""
        try:
            params = request.jsonrequest or {}
            
            # Parámetros de filtrado
            limit = min(params.get('limit', 20), 100)
            offset = params.get('offset', 0)
            state = params.get('state')  # draft, posted, sent, reconciled, cancelled
            partner_id = params.get('partner_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            payment_type = params.get('payment_type')  # inbound, outbound
            
            # Construir dominio
            domain = []
            
            if state:
                domain.append(('state', '=', state))
            
            if partner_id:
                domain.append(('partner_id', '=', partner_id))
            
            if date_from:
                domain.append(('date', '>=', date_from))
            
            if date_to:
                domain.append(('date', '<=', date_to))
            
            if payment_type:
                domain.append(('payment_type', '=', payment_type))
            
            # Buscar pagos
            AccountPayment = request.env['account.payment']
            payments = AccountPayment.search(domain, limit=limit, offset=offset, order='date desc')
            total_count = AccountPayment.search_count(domain)
            
            # Formatear datos
            payment_data = []
            for payment in payments:
                payment_data.append({
                    'id': payment.id,
                    'name': payment.name,
                    'date': payment.date.isoformat() if payment.date else None,
                    'amount': float_round(payment.amount, 2),
                    'payment_type': payment.payment_type,
                    'partner': {
                        'id': payment.partner_id.id,
                        'name': payment.partner_id.name
                    } if payment.partner_id else None,
                    'journal': {
                        'id': payment.journal_id.id,
                        'name': payment.journal_id.name,
                        'type': payment.journal_id.type
                    } if payment.journal_id else None,
                    'payment_method': payment.payment_method_line_id.name if payment.payment_method_line_id else None,
                    'state': payment.state,
                    'ref': payment.ref,
                    'currency': {
                        'id': payment.currency_id.id,
                        'name': payment.currency_id.name,
                        'symbol': payment.currency_id.symbol
                    } if payment.currency_id else None
                })
            
            return self._success_response({
                'payments': payment_data,
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            })
            
        except Exception as e:
            _logger.error(f"Get payments error: {str(e)}")
            return self._error_response(
                "Error retrieving payments", 
                "PAYMENTS_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/finance/accounts', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=30, window=300)
    @log_api_call
    def get_chart_of_accounts(self):
        """Obtener plan de cuentas"""
        try:
            params = request.jsonrequest or {}
            account_type = params.get('account_type')  # asset_receivable, liability_payable, etc.
            
            # Construir dominio
            domain = [('deprecated', '=', False)]
            
            if account_type:
                domain.append(('account_type', '=', account_type))
            
            # Buscar cuentas
            AccountAccount = request.env['account.account']
            accounts = AccountAccount.search(domain, order='code')
            
            # Formatear datos
            account_data = []
            for account in accounts:
                # Calcular balance
                balance = account.balance
                
                account_data.append({
                    'id': account.id,
                    'code': account.code,
                    'name': account.name,
                    'account_type': account.account_type,
                    'balance': float_round(balance, 2),
                    'currency': {
                        'id': account.currency_id.id,
                        'name': account.currency_id.name,
                        'symbol': account.currency_id.symbol
                    } if account.currency_id else None,
                    'reconcile': account.reconcile,
                    'deprecated': account.deprecated,
                    'company': {
                        'id': account.company_id.id,
                        'name': account.company_id.name
                    } if account.company_id else None
                })
            
            return self._success_response({
                'accounts': account_data,
                'total_count': len(account_data)
            })
            
        except Exception as e:
            _logger.error(f"Get chart of accounts error: {str(e)}")
            return self._error_response(
                "Error retrieving chart of accounts", 
                "ACCOUNTS_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/finance/reports/profit-loss', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=10, window=300)
    @log_api_call
    def profit_loss_report(self):
        """Reporte de pérdidas y ganancias"""
        try:
            params = request.jsonrequest or {}
            date_from = params.get('date_from', (datetime.now() - relativedelta(months=1)).strftime('%Y-%m-%d'))
            date_to = params.get('date_to', datetime.now().strftime('%Y-%m-%d'))
            
            AccountAccount = request.env['account.account']
            
            # Cuentas de ingresos
            income_accounts = AccountAccount.search([
                ('account_type', 'in', ['income', 'income_other'])
            ])
            
            # Cuentas de gastos
            expense_accounts = AccountAccount.search([
                ('account_type', '=', 'expense')
            ])
            
            # Calcular totales
            total_income = 0
            income_details = []
            
            for account in income_accounts:
                # Obtener movimientos del período
                moves = request.env['account.move.line'].search([
                    ('account_id', '=', account.id),
                    ('date', '>=', date_from),
                    ('date', '<=', date_to),
                    ('move_id.state', '=', 'posted')
                ])
                
                account_total = sum(moves.mapped('credit')) - sum(moves.mapped('debit'))
                
                if account_total != 0:
                    income_details.append({
                        'account_code': account.code,
                        'account_name': account.name,
                        'amount': float_round(account_total, 2)
                    })
                    total_income += account_total
            
            total_expenses = 0
            expense_details = []
            
            for account in expense_accounts:
                moves = request.env['account.move.line'].search([
                    ('account_id', '=', account.id),
                    ('date', '>=', date_from),
                    ('date', '<=', date_to),
                    ('move_id.state', '=', 'posted')
                ])
                
                account_total = sum(moves.mapped('debit')) - sum(moves.mapped('credit'))
                
                if account_total != 0:
                    expense_details.append({
                        'account_code': account.code,
                        'account_name': account.name,
                        'amount': float_round(account_total, 2)
                    })
                    total_expenses += account_total
            
            net_profit = total_income - total_expenses
            profit_margin = (net_profit / total_income * 100) if total_income > 0 else 0
            
            return self._success_response({
                'period': {
                    'date_from': date_from,
                    'date_to': date_to
                },
                'income': {
                    'total': float_round(total_income, 2),
                    'details': income_details
                },
                'expenses': {
                    'total': float_round(total_expenses, 2),
                    'details': expense_details
                },
                'net_profit': float_round(net_profit, 2),
                'profit_margin': float_round(profit_margin, 2)
            })
            
        except Exception as e:
            _logger.error(f"Profit loss report error: {str(e)}")
            return self._error_response(
                "Error generating profit & loss report", 
                "REPORT_ERROR",
                str(e)
            )
    
    @http.route('/api/v1/finance/reports/balance-sheet', type='json', auth='user', methods=['GET'], csrf=False)
    @jwt_required
    @rate_limit(limit=10, window=300)
    @log_api_call
    def balance_sheet_report(self):
        """Reporte de balance general"""
        try:
            params = request.jsonrequest or {}
            date_to = params.get('date_to', datetime.now().strftime('%Y-%m-%d'))
            
            AccountAccount = request.env['account.account']
            
            # Activos
            asset_accounts = AccountAccount.search([
                ('account_type', 'in', ['asset_receivable', 'asset_cash', 'asset_current', 'asset_non_current', 'asset_prepayments', 'asset_fixed'])
            ])
            
            # Pasivos
            liability_accounts = AccountAccount.search([
                ('account_type', 'in', ['liability_payable', 'liability_credit_card', 'liability_current', 'liability_non_current'])
            ])
            
            # Patrimonio
            equity_accounts = AccountAccount.search([
                ('account_type', '=', 'equity')
            ])
            
            def get_account_balance(accounts, date_to):
                total = 0
                details = []
                
                for account in accounts:
                    moves = request.env['account.move.line'].search([
                        ('account_id', '=', account.id),
                        ('date', '<=', date_to),
                        ('move_id.state', '=', 'posted')
                    ])
                    
                    if account.account_type in ['asset_receivable', 'asset_cash', 'asset_current', 'asset_non_current', 'asset_prepayments', 'asset_fixed']:
                        balance = sum(moves.mapped('debit')) - sum(moves.mapped('credit'))
                    else:
                        balance = sum(moves.mapped('credit')) - sum(moves.mapped('debit'))
                    
                    if balance != 0:
                        details.append({
                            'account_code': account.code,
                            'account_name': account.name,
                            'balance': float_round(balance, 2)
                        })
                        total += balance
                
                return total, details
            
            total_assets, asset_details = get_account_balance(asset_accounts, date_to)
            total_liabilities, liability_details = get_account_balance(liability_accounts, date_to)
            total_equity, equity_details = get_account_balance(equity_accounts, date_to)
            
            return self._success_response({
                'date': date_to,
                'assets': {
                    'total': float_round(total_assets, 2),
                    'details': asset_details
                },
                'liabilities': {
                    'total': float_round(total_liabilities, 2),
                    'details': liability_details
                },
                'equity': {
                    'total': float_round(total_equity, 2),
                    'details': equity_details
                },
                'total_liabilities_equity': float_round(total_liabilities + total_equity, 2),
                'balance_check': float_round(total_assets - (total_liabilities + total_equity), 2)
            })
            
        except Exception as e:
            _logger.error(f"Balance sheet report error: {str(e)}")
            return self._error_response(
                "Error generating balance sheet report", 
                "REPORT_ERROR",
                str(e)
            )