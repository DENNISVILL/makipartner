{
    'name': 'CORS Middleware',
    'version': '1.0',
    'category': 'Technical',
    'summary': 'Add CORS headers to Odoo responses',
    'description': """
This module adds CORS headers to all Odoo responses to allow cross-origin requests from the frontend.
""",
    'author': 'MakiPartner',
    'depends': ['base', 'web'],
    'data': [],
    'installable': True,
    'application': False,
    'auto_install': True,
}