# -*- coding: utf-8 -*-

import json
import unittest
from unittest.mock import patch, MagicMock
import jwt
from datetime import datetime, timedelta
import uuid

from odoo.tests.common import TransactionCase, tagged
from odoo.http import Response
from odoo.tools import config

@tagged('post_install', '-at_install')
class TestAuth(TransactionCase):
    
    def setUp(self):
        super(TestAuth, self).setUp()
        
        # Mock request environment
        self.request_patcher = patch('odoo.http.request')
        self.mock_request = self.request_patcher.start()
        
        # Create test user
        self.test_user = self.env['res.users'].create({
            'name': 'Test User',
            'login': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword',
        })
        
        # Import controller
        from odoo.addons.maki_api.controllers.auth import AuthController
        self.auth_controller = AuthController()
        
        # Setup mock request
        self.mock_request.env = self.env
        self.mock_request.httprequest = MagicMock()
        self.mock_request.session = MagicMock()
        self.mock_request.session.db = self.env.cr.dbname
        
    def tearDown(self):
        self.request_patcher.stop()
        super(TestAuth, self).tearDown()
    
    def test_generate_jwt_token(self):
        """Test JWT token generation"""
        # Test access token generation
        access_token = self.auth_controller._generate_jwt_token(self.test_user, 'access')
        self.assertTrue(access_token)
        
        # Decode and verify token
        secret_key = config.get('jwt_secret_key', 'your-secret-key')
        payload = jwt.decode(access_token, secret_key, algorithms=['HS256'])
        
        self.assertEqual(payload['sub'], str(self.test_user.id))
        self.assertEqual(payload['type'], 'access')
        self.assertTrue('jti' in payload)
        self.assertTrue('exp' in payload)
        self.assertTrue('iat' in payload)
        
        # Test refresh token generation
        refresh_token = self.auth_controller._generate_jwt_token(self.test_user, 'refresh')
        self.assertTrue(refresh_token)
        
        # Decode and verify refresh token
        refresh_secret_key = config.get('jwt_refresh_secret_key', 'your-refresh-secret-key')
        refresh_payload = jwt.decode(refresh_token, refresh_secret_key, algorithms=['HS256'])
        
        self.assertEqual(refresh_payload['sub'], str(self.test_user.id))
        self.assertEqual(refresh_payload['type'], 'refresh')
        self.assertTrue('jti' in refresh_payload)
        self.assertTrue('exp' in refresh_payload)
        self.assertTrue('iat' in refresh_payload)
    
    @patch('odoo.http.request.session.authenticate')
    def test_login_success(self, mock_authenticate):
        """Test successful login"""
        # Setup mock
        mock_authenticate.return_value = self.test_user.id
        
        # Setup request data
        login_data = json.dumps({
            'login': 'testuser',
            'password': 'testpassword'
        })
        self.mock_request.httprequest.data = login_data.encode('utf-8')
        
        # Call login endpoint
        response = self.auth_controller.login()
        
        # Parse response
        response_data = json.loads(response.data.decode('utf-8'))
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertTrue('access_token' in response_data)
        self.assertTrue('refresh_token' in response_data)
        self.assertTrue('user' in response_data)
        self.assertEqual(response_data['user']['id'], self.test_user.id)
    
    @patch('odoo.http.request.session.authenticate')
    def test_login_invalid_credentials(self, mock_authenticate):
        """Test login with invalid credentials"""
        # Setup mock
        mock_authenticate.return_value = False
        
        # Setup request data
        login_data = json.dumps({
            'login': 'testuser',
            'password': 'wrongpassword'
        })
        self.mock_request.httprequest.data = login_data.encode('utf-8')
        
        # Call login endpoint
        response = self.auth_controller.login()
        
        # Verify response
        self.assertEqual(response.status_code, 401)
    
    def test_refresh_token(self):
        """Test refresh token endpoint"""
        # Generate a valid refresh token
        refresh_token = self.auth_controller._generate_jwt_token(self.test_user, 'refresh')
        
        # Setup request data
        refresh_data = json.dumps({
            'refresh_token': refresh_token
        })
        self.mock_request.httprequest.data = refresh_data.encode('utf-8')
        
        # Call refresh endpoint
        response = self.auth_controller.refresh()
        
        # Parse response
        response_data = json.loads(response.data.decode('utf-8'))
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        self.assertTrue('access_token' in response_data)
    
    def test_logout(self):
        """Test logout endpoint"""
        # Generate a valid access token
        access_token = self.auth_controller._generate_jwt_token(self.test_user, 'access')
        
        # Setup request headers
        self.mock_request.httprequest.headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        # Call logout endpoint
        response = self.auth_controller.logout()
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        
        # Verify token is blacklisted
        token_blacklist = self.env['maki_api.token_blacklist'].search([
            ('user_id', '=', self.test_user.id)
        ])
        self.assertTrue(token_blacklist.exists())
    
    def test_blacklisted_token(self):
        """Test using a blacklisted token"""
        # Generate a token
        access_token = self.auth_controller._generate_jwt_token(self.test_user, 'access')
        
        # Decode to get jti
        payload = jwt.decode(access_token, options={"verify_signature": False})
        jti = payload['jti']
        
        # Blacklist the token
        self.env['maki_api.token_blacklist'].create({
            'jti': jti,
            'user_id': self.test_user.id,
            'token_type': 'access',
            'expiration_date': datetime.now() + timedelta(days=1),
            'revocation_date': datetime.now(),
            'revoked_by_id': self.env.user.id,
            'reason': 'Test revocation'
        })
        
        # Setup request for refresh
        refresh_data = json.dumps({
            'refresh_token': access_token  # Using access token as refresh for testing
        })
        self.mock_request.httprequest.data = refresh_data.encode('utf-8')
        
        # Call refresh endpoint
        response = self.auth_controller.refresh()
        
        # Verify response indicates token is revoked
        self.assertEqual(response.status_code, 401)