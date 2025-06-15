# -*- coding: utf-8 -*-
import json
import jwt
import hashlib
import logging
from datetime import datetime, timedelta

from odoo import http, fields
from odoo.http import request, Response
from odoo.exceptions import AccessError, ValidationError
from odoo.tools import config
from odoo.addons.auth_signup.models.res_users import SignupError

from .main import MakiAPIController, rate_limit, log_api_call

_logger = logging.getLogger(__name__)

class AuthController(MakiAPIController):
    """Controlador de autenticación con JWT"""
    
    def _generate_jwt_token(self, user, token_type='access'):
        """Generate a JWT token for the given user"""
        secret_key = request.env['ir.config_parameter'].sudo().get_param('maki_api.jwt_secret_key')
        
        # Set expiration based on token type
        if token_type == 'access':
            # Access tokens expire in 1 hour
            exp = datetime.now() + timedelta(hours=1)
        else:
            # Refresh tokens expire in 7 days
            exp = datetime.now() + timedelta(days=7)
        
        # Generate a unique token ID (jti)
        token_id = str(uuid.uuid4())
        
        payload = {
            'sub': str(user.id),  # subject (user id)
            'iat': datetime.now(),  # issued at
            'exp': exp,  # expiration time
            'type': token_type,  # token type (access or refresh)
            'jti': token_id  # JWT ID (unique identifier for this token)
        }
        
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    def _generate_refresh_token(self, user):
        """Generate a refresh token for the user"""
        return self._generate_jwt_token(user, token_type='refresh')
    
    @http.route('/api/v1/auth/login', type='http', auth='none', methods=['POST'], csrf=False)
    @rate_limit()
    @log_api_call()
    def login(self, **kw):
        """Login endpoint that returns JWT tokens"""
        try:
            # Get request data
            try:
                data = json.loads(request.httprequest.data.decode('utf-8'))
            except json.JSONDecodeError:
                return self._error_response('Invalid JSON data', 400)
            
            # Validate required data
            if not data:
                return self._error_response('Missing data', 400)
                
            login = data.get('login')
            password = data.get('password')
            
            if not login or not password:
                return self._error_response('Missing credentials', 400)
            
            # Authenticate user
            try:
                uid = request.session.authenticate(request.session.db, login, password)
            except Exception as e:
                _logger.error(f"Authentication error: {str(e)}")
                return self._error_response('Authentication failed', 401)
                
            if not uid:
                return self._error_response('Invalid credentials', 401)
                
            user = request.env['res.users'].sudo().browse(uid)
            
            # Check if account is disabled
            if not user.active:
                return self._error_response('Account is disabled', 403)
                
            # Generate tokens
            access_token = self._generate_jwt_token(user, 'access')
            refresh_token = self._generate_jwt_token(user, 'refresh')
            
            # Update last login
            user.write({'login_date': fields.Datetime.now()})
            
            # Prepare user data for response
            user_data = {
                'id': user.id,
                'name': user.name,
                'login': user.login,
                'email': user.email,
                'company': user.company_id.name if user.company_id else None,
                'groups': [group.name for group in user.groups_id],
                'is_admin': user.has_group('base.group_system'),
                'last_login': user.login_date.isoformat() if user.login_date else None,
                'tz': user.tz,
                'lang': user.lang
            }
            
            return self._success_response({
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 86400,
                'user': user_data
            })
            
        except Exception as e:
            _logger.exception(f"Login error: {str(e)}")
            return self._error_response(f'Server error: {str(e)}', 500)
    
    @http.route('/api/v1/auth/refresh', type='http', auth='none', methods=['POST'], csrf=False)
    @rate_limit()
    @log_api_call()
    def refresh(self, **kw):
        """Endpoint to refresh the access token using a refresh token"""
        try:
            # Get request data
            try:
                data = json.loads(request.httprequest.data.decode('utf-8'))
            except json.JSONDecodeError:
                return self._error_response('Invalid JSON data', 400)
            
            # Validate required data
            if not data:
                return self._error_response('Missing data', 400)
                
            refresh_token = data.get('refresh_token')
            
            if not refresh_token:
                return self._error_response('Missing refresh token', 400)
            
            # Decode and validate the refresh token
            try:
                # First decode without verification to get the JTI
                unverified_payload = jwt.decode(refresh_token, options={"verify_signature": False})
                jti = unverified_payload.get('jti')
                
                if not jti:
                    return self._error_response('Invalid token format', 400)
                
                # Check if token is blacklisted
                TokenBlacklist = request.env['maki_api.token_blacklist'].sudo()
                if TokenBlacklist.search([('jti', '=', jti)]):
                    return self._error_response('Token has been revoked', 401)
                
                # Now verify the token
                secret_key = config.get('jwt_refresh_secret_key', 'your-refresh-secret-key')
                payload = jwt.decode(refresh_token, secret_key, algorithms=['HS256'])
                
                # Verify it's a refresh token
                if payload.get('type') != 'refresh':
                    return self._error_response('Invalid token type', 400)
                
                user_id = payload.get('sub')
                if not user_id:
                    return self._error_response('Invalid token', 400)
                    
                # Find user
                user = request.env['res.users'].sudo().browse(int(user_id))
                if not user.exists():
                    return self._error_response('User not found', 404)
                    
                # Check if account is disabled
                if not user.active:
                    return self._error_response('Account is disabled', 403)
                    
                # Generate new access token
                access_token = self._generate_jwt_token(user, 'access')
                
                return self._success_response({
                    'access_token': access_token,
                    'token_type': 'Bearer',
                    'expires_in': 86400  # 24 hours in seconds
                })
                
            except jwt.ExpiredSignatureError:
                return self._error_response('Refresh token expired', 401)
                
            except jwt.InvalidTokenError:
                return self._error_response('Invalid refresh token', 401)
                
        except Exception as e:
            _logger.exception(f"Refresh error: {str(e)}")
            return self._error_response(f'Server error: {str(e)}', 500)
    
    @http.route('/api/v1/auth/logout', type='http', auth='none', methods=['POST'], csrf=False)
    @rate_limit()
    @log_api_call()
    def logout(self, **kw):
        try:
            # Get the token from the Authorization header
            auth_header = request.httprequest.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return self._error_response('Missing or invalid Authorization header', 401)
            
            token = auth_header.split(' ')[1]
            
            # Decode the token without verification to get the jti and other claims
            try:
                decoded_token = jwt.decode(token, options={"verify_signature": False})
            except jwt.PyJWTError:
                return self._error_response('Invalid token format', 401)
            
            # Check if token has jti claim
            if 'jti' not in decoded_token:
                return self._error_response('Token does not have a JTI claim', 400)
            
            # Get user ID from token
            user_id = decoded_token.get('sub')
            if not user_id:
                return self._error_response('Token does not have a subject claim', 400)
            
            # Get token type
            token_type = decoded_token.get('type', 'access')
            
            # Add token to blacklist
            env = request.env(user=SUPERUSER_ID)
            blacklist_model = env['maki_api.token_blacklist']
            
            # Check if token is already blacklisted
            if blacklist_model.is_blacklisted(decoded_token['jti']):
                return self._success_response({
                    'message': 'Token already invalidated'
                })
            
            # Add token to blacklist
            blacklist_model.add_to_blacklist(
                jti=decoded_token['jti'],
                user_id=int(user_id),
                token_type=token_type,
                expires_at=datetime.fromtimestamp(decoded_token.get('exp', 0)),
                revoked_by=int(user_id),
                reason='User logout'
            )
            
            # Clean up expired tokens periodically
            if random.random() < 0.1:  # 10% chance to run cleanup
                blacklist_model.cleanup_expired_tokens()
            
            return self._success_response({
                'message': 'Logged out successfully'
            })
            
        except Exception as e:
            _logger.exception('Error during logout: %s', str(e))
            return self._error_response(f'Server error: {str(e)}', 500)
    
    @http.route('/api/v1/auth/me', type='json', auth='user', methods=['GET'], csrf=False)
    @rate_limit(limit=50, window=300)
    @log_api_call
    def get_current_user(self):
        """Obtener información del usuario actual"""
        try:
            user = request.env.user
            
            return self._success_response({
                'id': user.id,
                'name': user.name,
                'login': user.login,
                'email': user.email,
                'company': {
                    'id': user.company_id.id,
                    'name': user.company_id.name
                } if user.company_id else None,
                'groups': [{
                    'id': group.id,
                    'name': group.name,
                    'category': group.category_id.name if group.category_id else None
                } for group in user.groups_id],
                'is_admin': user.has_group('base.group_system'),
                'last_login': user.login_date.isoformat() if user.login_date else None,
                'timezone': user.tz or 'UTC',
                'language': user.lang or 'en_US'
            })
            
        except Exception as e:
            _logger.error(f"Get current user error: {str(e)}")
            return self._error_response(
                "Internal server error", 
                "INTERNAL_ERROR"
            )
    
    @http.route('/api/v1/auth/change-password', type='json', auth='user', methods=['POST'], csrf=False)
    @rate_limit(limit=5, window=300)  # Muy restrictivo para cambio de contraseña
    @log_api_call
    def change_password(self):
        """Cambiar contraseña del usuario"""
        try:
            data = request.jsonrequest
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            
            if not current_password or not new_password:
                return self._error_response(
                    "Current and new passwords are required", 
                    "MISSING_PASSWORDS"
                )
            
            user = request.env.user
            
            # Verificar contraseña actual
            try:
                user._check_credentials(current_password, {'interactive': True})
            except AccessError:
                return self._error_response(
                    "Current password is incorrect", 
                    "INVALID_CURRENT_PASSWORD"
                )
            
            # Validar nueva contraseña
            if len(new_password) < 8:
                return self._error_response(
                    "New password must be at least 8 characters long", 
                    "PASSWORD_TOO_SHORT"
                )
            
            # Cambiar contraseña
            user.sudo().write({
                'password': new_password
            })
            
            _logger.info(f"Password changed for user {user.id}")
            
            return self._success_response(
                message="Password changed successfully"
            )
            
        except Exception as e:
            _logger.error(f"Change password error: {str(e)}")
            return self._error_response(
                "Internal server error", 
                "INTERNAL_ERROR"
            )