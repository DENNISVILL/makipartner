# -*- coding: utf-8 -*-
{
    'name': 'MakiPartner API Extensions',
    'version': '1.0.0',
    'category': 'API',
    'summary': 'APIs personalizadas para el frontend de MakiPartner',
    'description': """
        Módulo que proporciona APIs REST personalizadas para el frontend de MakiPartner.
        
        Características:
        - Endpoints específicos para el frontend
        - Autenticación JWT
        - Rate limiting
        - Logging avanzado
        - Validación de datos
    """,
    'author': 'MakiPartner Team',
    'website': 'https://makipartner.com',
    'depends': [
        'base',
        'web',
        'auth_signup',
        'sale',
        'account',
        'crm',
        'hr',
        'project',
        'stock',
        'purchase'
    ],
    'data': [
        'security/ir.model.access.csv',
        'security/security.xml',
        'data/rate_limit_data.xml',
    ],
    'external_dependencies': {
        'python': ['PyJWT', 'redis', 'ratelimit']
    },
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'LGPL-3',
}