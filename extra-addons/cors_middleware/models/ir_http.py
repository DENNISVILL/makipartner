from odoo import models
from odoo.http import Response
import werkzeug

class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _post_dispatch(cls, response):
        response = super()._post_dispatch(response)
        
        # Añadir cabeceras CORS a todas las respuestas
        if isinstance(response, (Response, werkzeug.wrappers.Response)):
            origin = cls.env['ir.config_parameter'].sudo().get_param('cors_origin', '')
            if origin:
                allowed_origins = origin.split(',')
                request_origin = cls.env['ir.http'].request.httprequest.headers.get('Origin')
                
                if request_origin and any(request_origin == allowed for allowed in allowed_origins):
                    response.headers['Access-Control-Allow-Origin'] = request_origin
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, X-Openerp-Session-Id'
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
                    response.headers['Access-Control-Max-Age'] = '86400'  # 24 horas
        
        return response