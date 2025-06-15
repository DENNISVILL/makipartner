# -*- coding: utf-8 -*-

import unittest
from unittest.mock import patch, MagicMock
import jwt
from datetime import datetime, timedelta
import uuid

from odoo.tests.common import TransactionCase, tagged
from odoo.http import Response
from odoo.tools import config

@tagged('post_install', '-at_install')
class TestTokenBlacklist(TransactionCase):
    
    def setUp(self):
        super(TestTokenBlacklist, self).setUp()
        
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
        
        # Create a token blacklist model
        self.TokenBlacklist = self.env['maki_api.token_blacklist']
        
    def test_add_token_to_blacklist(self):
        """Test adding a token to the blacklist"""
        # Generate a token
        token = self.auth_controller._generate_jwt_token(self.test_user, 'access')
        
        # Decode to get jti
        payload = jwt.decode(token, options={"verify_signature": False})
        jti = payload['jti']
        
        # Add token to blacklist
        blacklist_entry = self.TokenBlacklist.create({
            'jti': jti,
            'user_id': self.test_user.id,
            'token_type': 'access',
            'expiration_date': datetime.now() + timedelta(days=1),
            'revocation_date': datetime.now(),
            'revoked_by_id': self.env.user.id,
            'reason': 'Test revocation'
        })
        
        # Verify token is in blacklist
        self.assertTrue(blacklist_entry.exists())
        self.assertEqual(blacklist_entry.jti, jti)
        self.assertEqual(blacklist_entry.user_id.id, self.test_user.id)
        
    def test_is_token_blacklisted(self):
        """Test checking if a token is blacklisted"""
        # Generate a token
        token = self.auth_controller._generate_jwt_token(self.test_user, 'access')
        
        # Decode to get jti
        payload = jwt.decode(token, options={"verify_signature": False})
        jti = payload['jti']
        
        # Verify token is not blacklisted
        blacklisted = self.TokenBlacklist.search([('jti', '=', jti)])
        self.assertFalse(blacklisted.exists())
        
        # Add token to blacklist
        self.TokenBlacklist.create({
            'jti': jti,
            'user_id': self.test_user.id,
            'token_type': 'access',
            'expiration_date': datetime.now() + timedelta(days=1),
            'revocation_date': datetime.now(),
            'revoked_by_id': self.env.user.id,
            'reason': 'Test revocation'
        })
        
        # Verify token is now blacklisted
        blacklisted = self.TokenBlacklist.search([('jti', '=', jti)])
        self.assertTrue(blacklisted.exists())
    
    def test_cleanup_expired_tokens(self):
        """Test cleaning up expired tokens"""
        # Create expired token
        expired_jti = str(uuid.uuid4())
        expired_token = self.TokenBlacklist.create({
            'jti': expired_jti,
            'user_id': self.test_user.id,
            'token_type': 'access',
            'expiration_date': datetime.now() - timedelta(days=1),  # Expired
            'revocation_date': datetime.now() - timedelta(days=2),
            'revoked_by_id': self.env.user.id,
            'reason': 'Test expired token'
        })
        
        # Create valid token
        valid_jti = str(uuid.uuid4())
        valid_token = self.TokenBlacklist.create({
            'jti': valid_jti,
            'user_id': self.test_user.id,
            'token_type': 'access',
            'expiration_date': datetime.now() + timedelta(days=1),  # Not expired
            'revocation_date': datetime.now(),
            'revoked_by_id': self.env.user.id,
            'reason': 'Test valid token'
        })
        
        # Run cleanup
        self.TokenBlacklist.cleanup_expired_tokens()
        
        # Verify expired token is removed
        self.assertFalse(self.TokenBlacklist.search([('jti', '=', expired_jti)]).exists())
        
        # Verify valid token still exists
        self.assertTrue(self.TokenBlacklist.search([('jti', '=', valid_jti)]).exists())