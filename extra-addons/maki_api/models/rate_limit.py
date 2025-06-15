# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging
import json
import redis
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)

class RateLimit(models.Model):
    _name = 'maki_api.rate_limit'
    _description = 'API Rate Limiting'
    _order = 'create_date DESC'

    key = fields.Char(string='Rate Limit Key', required=True, index=True,
                     help='Unique identifier for rate limiting (IP, user_id, etc.)')
    hits = fields.Integer(string='Request Count', default=1,
                         help='Number of requests within the window')
    window_start = fields.Datetime(string='Window Start Time', required=True, default=fields.Datetime.now,
                                 help='Start time of the current rate limit window')
    window_size = fields.Integer(string='Window Size (seconds)', default=3600,
                               help='Duration of the rate limit window in seconds')
    limit = fields.Integer(string='Request Limit', default=100,
                         help='Maximum number of requests allowed in the window')
    endpoint = fields.Char(string='API Endpoint', index=True,
                         help='The API endpoint being accessed')
    user_id = fields.Many2one('res.users', string='User',
                            help='User making the requests, if authenticated')
    ip_address = fields.Char(string='IP Address', index=True,
                           help='IP address of the client')
    
    _sql_constraints = [
        ('key_unique', 'UNIQUE(key)', 'Rate limit key must be unique!')
    ]
    
    @api.model
    def check_rate_limit(self, key, endpoint=None, limit=100, window=3600, user_id=None, ip_address=None):
        """Check if a request is allowed based on rate limits
        
        Args:
            key: Unique identifier for rate limiting
            endpoint: API endpoint being accessed
            limit: Maximum number of requests allowed
            window: Time window in seconds
            user_id: User ID if authenticated
            ip_address: Client IP address
            
        Returns:
            tuple: (allowed, current_hits, limit)
        """
        # Try to use Redis if available for better performance
        try:
            return self._check_rate_limit_redis(key, endpoint, limit, window, user_id, ip_address)
        except Exception as e:
            _logger.warning(f"Redis rate limiting failed, falling back to database: {e}")
            return self._check_rate_limit_db(key, endpoint, limit, window, user_id, ip_address)
    
    def _check_rate_limit_redis(self, key, endpoint=None, limit=100, window=3600, user_id=None, ip_address=None):
        """Check rate limit using Redis"""
        redis_url = self.env['ir.config_parameter'].sudo().get_param('maki_api.redis_url')
        if not redis_url:
            raise Exception("Redis URL not configured")
            
        r = redis.from_url(redis_url)
        pipe = r.pipeline()
        
        # Current timestamp
        now = datetime.now().timestamp()
        window_start = now - window
        
        # Remove old entries
        pipe.zremrangebyscore(f"ratelimit:{key}", 0, window_start)
        
        # Add current request
        pipe.zadd(f"ratelimit:{key}", {now: now})
        
        # Count requests in window
        pipe.zcard(f"ratelimit:{key}")
        
        # Set expiry on the set
        pipe.expire(f"ratelimit:{key}", window)
        
        # Execute pipeline
        _, _, hits, _ = pipe.execute()
        
        # Log rate limit data if needed
        if endpoint and (hits % 10 == 0 or hits >= limit):
            self._log_rate_limit(key, endpoint, hits, limit, window, user_id, ip_address)
            
        return (hits <= limit, hits, limit)
    
    def _check_rate_limit_db(self, key, endpoint=None, limit=100, window=3600, user_id=None, ip_address=None):
        """Check rate limit using database"""
        now = fields.Datetime.now()
        window_start = now - timedelta(seconds=window)
        
        # Find existing rate limit record
        rate_limit = self.search([('key', '=', key)], limit=1)
        
        if not rate_limit:
            # Create new record
            rate_limit = self.create({
                'key': key,
                'hits': 1,
                'window_start': now,
                'window_size': window,
                'limit': limit,
                'endpoint': endpoint,
                'user_id': user_id,
                'ip_address': ip_address
            })
            return (True, 1, limit)
        
        # Check if window has expired
        if rate_limit.window_start < window_start:
            # Reset window
            rate_limit.write({
                'hits': 1,
                'window_start': now
            })
            return (True, 1, limit)
        
        # Increment hits
        rate_limit.hits += 1
        
        # Log rate limit data if needed
        if endpoint and (rate_limit.hits % 10 == 0 or rate_limit.hits >= limit):
            self._log_rate_limit(key, endpoint, rate_limit.hits, limit, window, user_id, ip_address)
            
        return (rate_limit.hits <= limit, rate_limit.hits, limit)
    
    def _log_rate_limit(self, key, endpoint, hits, limit, window, user_id, ip_address):
        """Log rate limit information"""
        log_data = {
            'key': key,
            'endpoint': endpoint,
            'hits': hits,
            'limit': limit,
            'window': window,
            'user_id': user_id,
            'ip_address': ip_address,
            'timestamp': fields.Datetime.now()
        }
        _logger.info(f"Rate limit: {json.dumps(log_data)}")