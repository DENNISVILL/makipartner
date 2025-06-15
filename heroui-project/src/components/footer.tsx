import React from 'react';
import { Link } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';
import { Icon } from '@iconify/react';

export const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-[#1e2124] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Comunidad</h3>
            <ul className="space-y-2">
              <li><Link as={RouteLink} to="/tutorials" className="text-gray-300 hover:text-white">Tutoriales</Link></li>
              <li><Link as={RouteLink} to="/documentation" className="text-gray-300 hover:text-white">Documentación</Link></li>
              <li><Link as={RouteLink} to="/faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
              <li><Link as={RouteLink} to="/github" className="text-gray-300 hover:text-white">GitHub</Link></li>
              <li><Link as={RouteLink} to="/translations" className="text-gray-300 hover:text-white">Traducciones</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Servicios</h3>
            <ul className="space-y-2">
              <li><Link as={RouteLink} to="/odoo-sh" className="text-gray-300 hover:text-white">Alojamiento en Odoo.sh</Link></li>
              <li><Link as={RouteLink} to="/support" className="text-gray-300 hover:text-white">Soporte</Link></li>
              <li><Link as={RouteLink} to="/education" className="text-gray-300 hover:text-white">Educación</Link></li>
              <li><Link as={RouteLink} to="/find-partner" className="text-gray-300 hover:text-white">Encuentra un consultor</Link></li>
              <li><Link as={RouteLink} to="/become-partner" className="text-gray-300 hover:text-white">Conviértete en partner</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Sobre nosotros</h3>
            <ul className="space-y-2">
              <li><Link as={RouteLink} to="/about" className="text-gray-300 hover:text-white">Nuestra historia</Link></li>
              <li><Link as={RouteLink} to="/brand" className="text-gray-300 hover:text-white">Acerca de marca</Link></li>
              <li><Link as={RouteLink} to="/careers" className="text-gray-300 hover:text-white">Carreras</Link></li>
              <li><Link as={RouteLink} to="/contact" className="text-gray-300 hover:text-white">Contacto</Link></li>
              <li><Link as={RouteLink} to="/legal" className="text-gray-300 hover:text-white">Legal</Link></li>
            </ul>
          </div>
          
          <div>
            <div className="mb-6">
              <div className="text-2xl font-bold text-white mb-2">odoo</div>
              <p className="text-sm text-gray-300">
                La plataforma única de valor de Odoo es muy fácil de usar y totalmente integrada.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook">
                <Icon icon="lucide:facebook" className="text-gray-300 hover:text-white w-5 h-5" />
              </Link>
              <Link href="#" aria-label="Twitter">
                <Icon icon="lucide:twitter" className="text-gray-300 hover:text-white w-5 h-5" />
              </Link>
              <Link href="#" aria-label="LinkedIn">
                <Icon icon="lucide:linkedin" className="text-gray-300 hover:text-white w-5 h-5" />
              </Link>
              <Link href="#" aria-label="Instagram">
                <Icon icon="lucide:instagram" className="text-gray-300 hover:text-white w-5 h-5" />
              </Link>
              <Link href="#" aria-label="YouTube">
                <Icon icon="lucide:youtube" className="text-gray-300 hover:text-white w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>Website made with <span className="text-white">odoo</span></p>
        </div>
      </div>
    </footer>
  );
};