# -*- coding: utf-8 -*-
import json
import jwt
import time
import logging
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict

from odoo import http, fields
from odoo.http import request, Response
from odoo.exceptions import AccessError, ValidationError
from odoo.tools import config

_logger = logging.getLogger(__name__)

# Rate limiting storage (en producción usar Redis)
rate_limit_storage = defaultdict(list)

class RateLimiter:
    """Implementación simple de rate limiting"""
    
    @staticmethod
    def is_allowed(key, limit=100, window=3600):
        """Verifica si una request está permitida
        
        Args:
            key: Identificador único (IP, user_id, etc.)
            limit: Número máximo de requests
            window: Ventana de tiempo en segundos
        """
        now = time.time()
        # Limpiar requests antiguas
        rate_limit_storage[key] = [
            timestamp for timestamp in rate_limit_storage[key]
            if now - timestamp < window
        ]
        
        if len(rate_limit_storage[key]) >= limit:
            return False
            
        rate_limit_storage[key].append(now)
        return True

def rate_limit(limit=100, window=3600):
    """Decorador para rate limiting"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Usar IP como clave por defecto
            key = request.httprequest.remote_addr
            
            # Si hay usuario autenticado, usar su ID
            if hasattr(request, 'env') and request.env.user:
                key = f"user_{request.env.user.id}"
            
            if not RateLimiter.is_allowed(key, limit, window):
                _logger.warning(f"Rate limit exceeded for {key}")
                return Response(
                    json.dumps({
                        'error': 'Rate limit exceeded',
                        'message': f'Too many requests. Limit: {limit} per {window} seconds'
                    }),
                    status=429,
                    headers={'Content-Type': 'application/json'}
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

def jwt_required(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        auth_header = request.httprequest.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return self._error_response('Missing or invalid Authorization header', 401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # First decode without verification to get the jti
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            
            # Check if token is blacklisted
            if 'jti' in unverified_payload:
                blacklist_model = request.env['maki_api.token_blacklist'].sudo()
                if blacklist_model.is_blacklisted(unverified_payload['jti']):
                    return self._error_response('Token has been revoked', 401)
            
            # Decode and verify the token
            secret_key = request.env['ir.config_parameter'].sudo().get_param('maki_api.jwt_secret_key')
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            
            # Check if user exists
            user_id = payload.get('sub')
            user = request.env['res.users'].sudo().browse(int(user_id))
            if not user.exists():
                return self._error_response('User not found', 401)
            
            # Set the user for this request
            request.uid = user.id
            
            return func(self, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return self._error_response('Token has expired', 401)
        except jwt.InvalidTokenError:
            return self._error_response('Invalid token', 401)
        except Exception as e:
            _logger.exception('Error validating JWT token: %s', str(e))
            return self._error_response(f'Server error: {str(e)}', 500)
    
    return wrapper

def log_api_call(func):
    """Decorador para logging estructurado"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        # Log de inicio
        _logger.info({
            'event': 'api_call_start',
            'endpoint': request.httprequest.endpoint,
            'method': request.httprequest.method,
            'path': request.httprequest.path,
            'user_id': getattr(request.env.user, 'id', None),
            'ip': request.httprequest.remote_addr,
            'timestamp': datetime.now().isoformat()
        })
        
        try:
            result = func(*args, **kwargs)
            
            # Log de éxito
            _logger.info({
                'event': 'api_call_success',
                'endpoint': request.httprequest.endpoint,
                'duration': time.time() - start_time,
                'status': 'success',
                'timestamp': datetime.now().isoformat()
            })
            
            return result
            
        except Exception as e:
            # Log de error
            _logger.error({
                'event': 'api_call_error',
                'endpoint': request.httprequest.endpoint,
                'duration': time.time() - start_time,
                'error': str(e),
                'error_type': type(e).__name__,
                'timestamp': datetime.now().isoformat()
            })
            raise
            
    return wrapper

class MakiAPIController(http.Controller):
    """Controlador principal para APIs de MakiPartner"""
    
    def _success_response(self, data=None, message="Success"):
        """Respuesta estándar de éxito"""
        return {
            'success': True,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
    
    def _error_response(self, message="Error", code="GENERIC_ERROR", details=None):
        """Respuesta estándar de error"""
        return {
            'success': False,
            'error': {
                'code': code,
                'message': message,
                'details': details
            },
            'timestamp': datetime.now().isoformat()
        }
    
    @http.route('/api/v1/health', type='json', auth='none', methods=['GET'], csrf=False)
    @rate_limit(limit=50, window=60)
    @log_api_call
    def health_check(self):
        """Endpoint de health check"""
        return self._success_response({
            'status': 'healthy',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat()
        })
    
    @http.route('/api/v1/info', type='json', auth='none', methods=['GET'], csrf=False)
    @rate_limit(limit=20, window=60)
    @log_api_call
    def api_info(self):
        """Información de la API"""
        return self._success_response({
            'name': 'MakiPartner API',
            'version': '1.0.0',
            'description': 'APIs personalizadas para MakiPartner',
            'endpoints': {
                'auth': '/api/v1/auth/*',
                'dashboard': '/api/v1/dashboard/*',
                'finance': '/api/v1/finance/*',
                'sales': '/api/v1/sales/*',
                'crm': '/api/v1/crm/*',
                'hr': '/api/v1/hr/*',
                'inventory': '/api/v1/inventory/*',
                'projects': '/api/v1/projects/*'
            }
        })