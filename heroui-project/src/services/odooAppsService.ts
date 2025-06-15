import odooService from './odooService';
import { z } from 'zod';
import cacheService from './cacheService';
import { handleOdooError } from './errorHandler';

// Esquema para validar las aplicaciones de Odoo
const odooAppSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string().optional(),
  web_icon: z.string().optional(),
  web_icon_data: z.string().optional(),
  sequence: z.number().optional(),
  category_id: z.array(z.tuple([z.number(), z.string()])).optional(),
  url: z.string().optional(),
  xmlid: z.string().optional(),
  action: z.number().optional(),
  parent_id: z.number().optional().nullable(),
  is_odoo_app: z.boolean().default(true)
});

const odooAppsResponseSchema = z.array(odooAppSchema);

// Definir las categorías que usaremos para clasificar las aplicaciones
const appCategories = {
  FINANZAS: ['account', 'accounting', 'invoicing', 'payment', 'expenses', 'documents', 'sign', 'spreadsheet'],
  VENTAS: ['crm', 'sales', 'sale', 'point_of_sale', 'pos_', 'subscription', 'rental'],
  SITIOS_WEB: ['website', 'ecommerce', 'blog', 'forum', 'livechat', 'live_chat', 'elearning'],
  CADENA_DE_SUMINISTRO: ['inventory', 'stock', 'purchase', 'manufacturing', 'mrp', 'quality', 'maintenance', 'plm'],
  RECURSOS_HUMANOS: ['hr', 'employee', 'recruitment', 'timeoff', 'appraisal', 'referral', 'fleet'],
  MARKETING: ['marketing', 'social', 'email_marketing', 'sms', 'event', 'survey'],
  SERVICIOS: ['project', 'timesheet', 'helpdesk', 'field_service', 'planning', 'appointment'],
  PRODUCTIVIDAD: ['discuss', 'mail', 'approval', 'knowledge', 'iot', 'voip', 'whatsapp']
};

class OdooAppsService {
  // Obtener todas las aplicaciones de Odoo
  async getOdooApps() {
    const cacheKey = `odoo_apps_${odooService.session_id}`;
    
    try {
      return await cacheService.getOrSet(
        cacheKey,
        async () => {
          // Llamar al método de Odoo para obtener el menú de aplicaciones
          const result = await odooService.callMethod('ir.ui.menu', 'search_read', 
            [['parent_id', '=', false]], {
              fields: ['name', 'web_icon', 'web_icon_data', 'action', 'parent_id', 'sequence', 'child_id', 'xmlid']
            });
          
          // Transformar los datos para que coincidan con nuestro esquema
          const apps = result.map((app: any) => ({
            ...app,
            is_odoo_app: true,
            url: app.action ? `/web#action=${app.action}` : `/web#menu_id=${app.id}`
          }));
          
          return odooAppsResponseSchema.parse(apps);
        },
        10 * 60 * 1000 // 10 minutos de caché
      );
    } catch (error) {
      throw handleOdooError(error, 'getOdooApps');
    }
  }

  // Categorizar las aplicaciones según su nombre o xmlid
  categorizeApps(apps: any[]) {
    const categorizedApps: Record<string, any[]> = {
      FINANZAS: [],
      VENTAS: [],
      SITIOS_WEB: [],
      CADENA_DE_SUMINISTRO: [],
      RECURSOS_HUMANOS: [],
      MARKETING: [],
      SERVICIOS: [],
      PRODUCTIVIDAD: []
    };

    // Función para determinar la categoría de una aplicación
    const getCategoryForApp = (app: any) => {
      const appName = app.name.toLowerCase();
      const appXmlId = app.xmlid ? app.xmlid.toLowerCase() : '';
      
      for (const [category, keywords] of Object.entries(appCategories)) {
        for (const keyword of keywords) {
          if (appName.includes(keyword) || appXmlId.includes(keyword)) {
            return category;
          }
        }
      }
      
      // Si no coincide con ninguna categoría, ponerla en PRODUCTIVIDAD por defecto
      return 'PRODUCTIVIDAD';
    };

    // Categorizar cada aplicación
    apps.forEach(app => {
      const category = getCategoryForApp(app);
      categorizedApps[category].push({
        name: app.name,
        icon: this.getIconForApp(app),
        to: `${import.meta.env.VITE_API_URL || 'http://localhost:8069'}${app.url}`,
        odoo_id: app.id
      });
    });

    return categorizedApps;
  }

  // Obtener un icono adecuado para la aplicación
  getIconForApp(app: any) {
    // Si la aplicación tiene un icono web, usarlo
    if (app.web_icon) {
      const iconParts = app.web_icon.split(',');
      if (iconParts.length >= 2) {
        // El formato es "icon_name,color_name"
        return `mdi:${iconParts[0]}`;
      }
    }
    
    // Si tiene datos de icono web (base64), podríamos usarlo, pero por ahora usamos iconos genéricos
    
    // Mapeo de nombres comunes de aplicaciones a iconos
    const iconMap: Record<string, string> = {
      'contabilidad': 'lucide:calculator',
      'facturación': 'lucide:file-text',
      'ventas': 'lucide:shopping-cart',
      'crm': 'lucide:users',
      'inventario': 'lucide:package',
      'compras': 'lucide:shopping-bag',
      'proyecto': 'lucide:briefcase',
      'sitio web': 'lucide:globe',
      'comercio': 'lucide:shopping-bag',
      'punto de venta': 'lucide:credit-card',
      'recursos humanos': 'lucide:users',
      'empleados': 'lucide:user',
      'marketing': 'lucide:megaphone',
      'discusión': 'lucide:message-square',
      'correo': 'lucide:mail',
      'calendario': 'lucide:calendar',
      'contactos': 'lucide:book',
      'documentos': 'lucide:folder',
      'gastos': 'lucide:credit-card'
    };
    
    const appName = app.name.toLowerCase();
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (appName.includes(keyword)) {
        return icon;
      }
    }
    
    // Icono por defecto
    return 'lucide:app-window';
  }

  // Limpiar caché
  clearAppsCache() {
    if (odooService.session_id) {
      cacheService.invalidatePattern('odoo_apps_');
    }
  }

  // Refrescar datos de aplicaciones
  async refreshAppsData() {
    this.clearAppsCache();
    return await this.getOdooApps();
  }
}

const odooAppsService = new OdooAppsService();
export default odooAppsService;