# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging
import json
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)

class APILog(models.Model):
    _name = 'maki_api.log'
    _description = 'API Call Logs'
    _order = 'create_date DESC'

    endpoint = fields.Char(string='API Endpoint', required=True, index=True,
                         help='The API endpoint that was called')
    method = fields.Selection([
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('DELETE', 'DELETE'),
        ('PATCH', 'PATCH')
    ], string='HTTP Method', required=True, index=True)
    status_code = fields.Integer(string='Status Code', index=True,
                               help='HTTP status code of the response')
    execution_time = fields.Float(string='Execution Time (ms)', 
                                help='Time taken to execute the API call in milliseconds')
    user_id = fields.Many2one('res.users', string='User', index=True,
                            help='User who made the API call')
    ip_address = fields.Char(string='IP Address', index=True,
                           help='IP address of the client')
    user_agent = fields.Char(string='User Agent',
                           help='User agent of the client')
    request_data = fields.Text(string='Request Data',
                             help='JSON data sent in the request')
    response_data = fields.Text(string='Response Data',
                              help='JSON data returned in the response')
    error = fields.Text(string='Error',
                       help='Error message if the call failed')
    cache_hit = fields.Boolean(string='Cache Hit', default=False,
                             help='Whether the response was served from cache')
    
    @api.model
    def log_api_call(self, endpoint, method, status_code, execution_time, user_id=None, 
                    ip_address=None, user_agent=None, request_data=None, response_data=None, 
                    error=None, cache_hit=False):
        """Log an API call
        
        Args:
            endpoint: API endpoint that was called
            method: HTTP method used
            status_code: HTTP status code of the response
            execution_time: Time taken to execute the API call in milliseconds
            user_id: User who made the API call
            ip_address: IP address of the client
            user_agent: User agent of the client
            request_data: JSON data sent in the request
            response_data: JSON data returned in the response
            error: Error message if the call failed
            cache_hit: Whether the response was served from cache
        """
        try:
            # Sanitize request and response data to prevent storing sensitive information
            safe_request_data = self._sanitize_data(request_data) if request_data else None
            safe_response_data = self._sanitize_data(response_data) if response_data else None
            
            # Create log entry
            self.create({
                'endpoint': endpoint,
                'method': method,
                'status_code': status_code,
                'execution_time': execution_time,
                'user_id': user_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'request_data': safe_request_data,
                'response_data': safe_response_data,
                'error': error,
                'cache_hit': cache_hit
            })
            
            # Log to console for debugging
            if status_code >= 400 or error:
                _logger.warning(f"API Error: {endpoint} - {status_code} - {error}")
            elif execution_time > 1000:  # More than 1 second
                _logger.info(f"Slow API: {endpoint} - {execution_time}ms")
                
        except Exception as e:
            _logger.error(f"Failed to log API call: {e}")
    
    def _sanitize_data(self, data):
        """Sanitize data to remove sensitive information"""
        if not data:
            return None
            
        try:
            # Parse JSON if it's a string
            if isinstance(data, str):
                data_dict = json.loads(data)
            else:
                data_dict = data.copy()
                
            # Remove sensitive fields
            sensitive_fields = ['password', 'token', 'secret', 'key', 'auth', 'credit_card']
            self._recursive_sanitize(data_dict, sensitive_fields)
            
            return json.dumps(data_dict)
        except Exception as e:
            _logger.warning(f"Failed to sanitize data: {e}")
            return None
    
    def _recursive_sanitize(self, data, sensitive_fields):
        """Recursively sanitize nested dictionaries"""
        if isinstance(data, dict):
            for key in list(data.keys()):
                if any(sensitive in key.lower() for sensitive in sensitive_fields):
                    data[key] = '***REDACTED***'
                elif isinstance(data[key], (dict, list)):
                    self._recursive_sanitize(data[key], sensitive_fields)
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, (dict, list)):
                    self._recursive_sanitize(item, sensitive_fields)
    
    @api.model
    def cleanup_old_logs(self, days=30):
        """Remove logs older than the specified number of days"""
        cutoff_date = fields.Datetime.now() - timedelta(days=days)
        old_logs = self.search([('create_date', '<', cutoff_date)])
        if old_logs:
            count = len(old_logs)
            old_logs.unlink()
            _logger.info(f"Cleaned up {count} API logs older than {days} days")
        return True
    
    @api.model
    def get_performance_metrics(self, days=7):
        """Get API performance metrics for the dashboard"""
        cutoff_date = fields.Datetime.now() - timedelta(days=days)
        
        # Get average execution time by endpoint
        self.env.cr.execute("""
            SELECT endpoint, AVG(execution_time) as avg_time, COUNT(*) as call_count
            FROM maki_api_log
            WHERE create_date >= %s
            GROUP BY endpoint
            ORDER BY avg_time DESC
            LIMIT 10
        """, (cutoff_date,))
        
        slow_endpoints = [{
            'endpoint': row[0],
            'avg_time': round(row[1], 2),
            'call_count': row[2]
        } for row in self.env.cr.fetchall()]
        
        # Get error rate by endpoint
        self.env.cr.execute("""
            SELECT endpoint, 
                   COUNT(*) as total_calls,
                   SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
            FROM maki_api_log
            WHERE create_date >= %s
            GROUP BY endpoint
            HAVING COUNT(*) > 10
            ORDER BY (SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
            LIMIT 10
        """, (cutoff_date,))
        
        error_endpoints = [{
            'endpoint': row[0],
            'total_calls': row[1],
            'error_count': row[2],
            'error_rate': round((row[2] / row[1]) * 100, 2) if row[1] > 0 else 0
        } for row in self.env.cr.fetchall()]
        
        # Get cache hit rate
        self.env.cr.execute("""
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
            FROM maki_api_log
            WHERE create_date >= %s
        """, (cutoff_date,))
        
        row = self.env.cr.fetchone()
        cache_metrics = {
            'total_calls': row[0] if row else 0,
            'cache_hits': row[1] if row else 0,
            'cache_hit_rate': round((row[1] / row[0]) * 100, 2) if row and row[0] > 0 else 0
        }
        
        return {
            'slow_endpoints': slow_endpoints,
            'error_endpoints': error_endpoints,
            'cache_metrics': cache_metrics
        }