import React, { useEffect, useState } from 'react';
import { Card, CardBody, Link, Spinner } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { CategorySubmenu } from './category-submenu';
import odooAppsService from '../services/odooAppsService';

interface AppCategory {
  title: string;
  color: string;
  apps: {
    name: string;
    icon: string;
    to: string;
  }[];
}

export const ApplicationMenu: React.FC = () => {
  const [categories, setCategories] = useState<AppCategory[]>([
    {
      title: "FINANZAS",
      color: "blue-600",
      apps: []
    },
    {
      title: "VENTAS",
      color: "red-500",
      apps: []
    },
    {
      title: "SITIOS WEB",
      color: "teal-600",
      apps: []
    },
    {
      title: "CADENA DE SUMINISTRO",
      color: "purple-600",
      apps: []
    },
    {
      title: "RECURSOS HUMANOS",
      color: "indigo-600",
      apps: []
    },
    {
      title: "MARKETING",
      color: "orange-500",
      apps: []
    },
    {
      title: "SERVICIOS",
      color: "amber-600",
      apps: []
    },
    {
      title: "PRODUCTIVIDAD",
      color: "green-600",
      apps: []
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOdooApps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener las aplicaciones de Odoo
        const apps = await odooAppsService.getOdooApps();
        
        // Categorizar las aplicaciones
        const categorizedApps = odooAppsService.categorizeApps(apps);
        
        // Actualizar las categorías con las aplicaciones de Odoo
        setCategories(prevCategories => {
          return prevCategories.map(category => {
            // Aseguramos que FINANZAS siempre use la clave exacta
            const categoryKey = category.title === 'FINANZAS' ? 'FINANZAS' : (category.title.replace(' ', '_') as keyof typeof categorizedApps);
            return {
              ...category,
              apps: categorizedApps[categoryKey] || []
            };
          });
        });
      } catch (err) {
        console.error('Error al obtener las aplicaciones de Odoo:', err);
        setError('No se pudieron cargar las aplicaciones de Odoo. Por favor, verifica la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchOdooApps();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" color="primary" label="Cargando aplicaciones..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <Icon icon="lucide:alert-circle" className="text-danger mx-auto mb-4" width={48} height={48} />
        <p className="text-danger">{error}</p>
        <p className="mt-4">Mostrando aplicaciones predeterminadas...</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {getFallbackCategories().map((category, index) => (
            <CategorySubmenu key={index} category={category} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map((category, index) => (
        <CategorySubmenu key={index} category={category} />
      ))}
    </div>
  );
};

// Función para obtener categorías predeterminadas en caso de error
function getFallbackCategories(): AppCategory[] {
  return [
    {
      title: "FINANZAS",
      color: "blue-600",
      apps: [
        { name: "Contabilidad", icon: "lucide:calculator", to: "/app/accounting" },
        { name: "Facturación", icon: "lucide:file-text", to: "/app/invoicing" },
        { name: "Gastos", icon: "lucide:credit-card", to: "/app/expenses" }
      ]
    },
    {
      title: "VENTAS",
      color: "red-500",
      apps: [
        { name: "CRM", icon: "lucide:users", to: "/app/crm" },
        { name: "Ventas", icon: "lucide:shopping-cart", to: "/app/sales" },
        { name: "POS", icon: "lucide:shopping-bag", to: "/app/pos" }
      ]
    },
    {
      title: "SITIOS WEB",
      color: "teal-600",
      apps: [
        { name: "Sitio web", icon: "lucide:globe", to: "/app/website" },
        { name: "Comercio electrónico", icon: "lucide:shopping-bag", to: "/app/ecommerce" },
        { name: "Blog", icon: "lucide:edit-3", to: "/app/blog" }
      ]
    },
    {
      title: "PRODUCTIVIDAD",
      color: "green-600",
      apps: [
        { name: "Conversaciones", icon: "lucide:message-square", to: "/app/discuss" },
        { name: "Calendario", icon: "lucide:calendar", to: "/app/calendar" },
        { name: "Contactos", icon: "lucide:book", to: "/app/contacts" }
      ]
    }
  ];
}