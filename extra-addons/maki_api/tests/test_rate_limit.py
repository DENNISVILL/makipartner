# -*- coding: utf-8 -*-

import unittest
from unittest.mock import patch, MagicMock
import time

from odoo.tests.common import TransactionCase, tagged
from odoo.http import Response

@tagged('post_install', '-at_install')
class TestRateLimit(TransactionCase):
    
    def setUp(self):
        super(TestRateLimit, self).setUp()
        
        # Import controller and decorators
        from odoo.addons.maki_api.controllers.main import rate_limit
        self.rate_limit = rate_limit
        
        # Create a test controller method
        def test_endpoint():
            return {'status': 'success'}
        
        self.test_endpoint = test_endpoint
        
        # Mock request
        self.request_patcher = patch('odoo.http.request')
        self.mock_request = self.request_patcher.start()
        self.mock_request.httprequest = MagicMock()
        self.mock_request.httprequest.remote_addr = '127.0.0.1'
        
    def tearDown(self):
        self.request_patcher.stop()
        super(TestRateLimit, self).tearDown()
    
    @patch('odoo.addons.maki_api.controllers.main.redis.Redis')
    def test_rate_limit_not_exceeded(self, mock_redis):
        """Test rate limit not exceeded"""
        # Setup mock Redis
        mock_redis_instance = MagicMock()
        mock_redis.return_value = mock_redis_instance
        
        # Configure Redis mock to indicate rate limit not exceeded
        mock_redis_instance.incr.return_value = 5  # Below limit
        mock_redis_instance.expire.return_value = True
        
        # Apply rate limit decorator
        decorated_endpoint = self.rate_limit(limit=10, window=60)(self.test_endpoint)
        
        # Call the endpoint
        result = decorated_endpoint()
        
        # Verify result
        self.assertEqual(result, {'status': 'success'})
        
        # Verify Redis calls
        mock_redis_instance.incr.assert_called_once()
        mock_redis_instance.expire.assert_called_once()
    
    @patch('odoo.addons.maki_api.controllers.main.redis.Redis')
    def test_rate_limit_exceeded(self, mock_redis):
        """Test rate limit exceeded"""
        # Setup mock Redis
        mock_redis_instance = MagicMock()
        mock_redis.return_value = mock_redis_instance
        
        # Configure Redis mock to indicate rate limit exceeded
        mock_redis_instance.incr.return_value = 11  # Above limit
        mock_redis_instance.expire.return_value = True
        
        # Apply rate limit decorator
        decorated_endpoint = self.rate_limit(limit=10, window=60)(self.test_endpoint)
        
        # Call the endpoint
        result = decorated_endpoint()
        
        # Verify result is a Response object with 429 status code
        self.assertIsInstance(result, Response)
        self.assertEqual(result.status_code, 429)
    
    @patch('odoo.addons.maki_api.controllers.main.redis.Redis')
    def test_rate_limit_redis_error(self, mock_redis):
        """Test rate limit with Redis error"""
        # Setup mock Redis to raise an exception
        mock_redis.side_effect = Exception('Redis connection error')
        
        # Apply rate limit decorator
        decorated_endpoint = self.rate_limit(limit=10, window=60)(self.test_endpoint)
        
        # Call the endpoint
        result = decorated_endpoint()
        
        # Verify result - should still work even if Redis fails
        self.assertEqual(result, {'status': 'success'})
    
    @patch('odoo.addons.maki_api.controllers.main.redis.Redis')
    def test_rate_limit_different_ips(self, mock_redis):
        """Test rate limit with different IPs"""
        # Setup mock Redis
        mock_redis_instance = MagicMock()
        mock_redis.return_value = mock_redis_instance
        
        # Configure Redis mock
        mock_redis_instance.incr.return_value = 5  # Below limit
        mock_redis_instance.expire.return_value = True
        
        # Apply rate limit decorator
        decorated_endpoint = self.rate_limit(limit=10, window=60)(self.test_endpoint)
        
        # Call with first IP
        self.mock_request.httprequest.remote_addr = '192.168.1.1'
        result1 = decorated_endpoint()
        
        # Call with second IP
        self.mock_request.httprequest.remote_addr = '192.168.1.2'
        result2 = decorated_endpoint()
        
        # Verify results
        self.assertEqual(result1, {'status': 'success'})
        self.assertEqual(result2, {'status': 'success'})
        
        # Verify Redis was called with different keys
        self.assertEqual(mock_redis_instance.incr.call_count, 2)
        self.assertNotEqual(
            mock_redis_instance.incr.call_args_list[0][0][0],
            mock_redis_instance.incr.call_args_list[1][0][0]
        )