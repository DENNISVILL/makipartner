# -*- coding: utf-8 -*-
from odoo import models, fields, api
import datetime
import logging

_logger = logging.getLogger(__name__)

class TokenBlacklist(models.Model):
    _name = 'maki_api.token_blacklist'
    _description = 'JWT Token Blacklist'
    _order = 'create_date DESC'

    jti = fields.Char(string='Token ID (JTI)', required=True, index=True, 
                      help='Unique identifier for the JWT token')
    user_id = fields.Many2one('res.users', string='User', required=True, index=True,
                             help='User who owned this token')
    token_type = fields.Selection([
        ('access', 'Access Token'),
        ('refresh', 'Refresh Token')
    ], string='Token Type', required=True, default='access')
    expires_at = fields.Datetime(string='Expiration Date', required=True, index=True,
                                help='When this token expires')
    revoked_at = fields.Datetime(string='Revocation Date', default=fields.Datetime.now, 
                                required=True, index=True,
                                help='When this token was revoked')
    revoked_by_id = fields.Many2one('res.users', string='Revoked By',
                                  help='User who revoked this token')
    reason = fields.Selection([
        ('logout', 'User Logout'),
        ('password_change', 'Password Changed'),
        ('security', 'Security Concern'),
        ('admin', 'Administrator Action'),
        ('other', 'Other Reason')
    ], string='Revocation Reason', required=True, default='logout')
    notes = fields.Text(string='Notes')
    
    _sql_constraints = [
        ('jti_unique', 'UNIQUE(jti)', 'Token ID must be unique!')
    ]
    
    @api.model
    def is_token_blacklisted(self, jti):
        """Check if a token is blacklisted"""
        return bool(self.search_count([('jti', '=', jti)]))
    
    @api.model
    def add_token_to_blacklist(self, jti, user_id, token_type, expires_at, reason='logout', revoked_by_id=None, notes=None):
        """Add a token to the blacklist"""
        try:
            # Convert expires_at to datetime if it's a string
            if isinstance(expires_at, str):
                expires_at = datetime.datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                
            values = {
                'jti': jti,
                'user_id': user_id,
                'token_type': token_type,
                'expires_at': expires_at,
                'reason': reason,
                'revoked_by_id': revoked_by_id or user_id,
                'notes': notes,
            }
            return self.create(values)
        except Exception as e:
            _logger.error(f"Failed to blacklist token: {e}")
            return False
    
    @api.model
    def cleanup_expired_tokens(self):
        """Remove expired tokens from the blacklist"""
        expired_tokens = self.search([('expires_at', '<', fields.Datetime.now())])
        if expired_tokens:
            count = len(expired_tokens)
            expired_tokens.unlink()
            _logger.info(f"Cleaned up {count} expired tokens from blacklist")
        return True