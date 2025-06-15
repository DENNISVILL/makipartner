import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link as RouterLink, useHistory } from 'react-router-dom';

import { SessionStatus } from './SessionStatus';
import useAuth from '../hooks/useAuth';
import { odooService } from '../services/odooService';

export const NavbarComponent: React.FC = () => {
  const { isAuthenticated, logout, sessionInfo } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };
  return (
    <Navbar maxWidth="xl" className="border-b border-divider">
      <NavbarBrand>
        <RouterLink to="/" className="flex items-center gap-2">
          <div className="text-primary font-bold text-2xl">odoo</div>
        </RouterLink>
      </NavbarBrand>
      
      <NavbarContent className="flex gap-4" justify="center">
        <NavbarItem>
          <div className="relative group">
            <Button
              as="button"
              variant="light"
              className="text-foreground px-6 py-2 text-lg font-semibold flex items-center gap-2 group-hover:bg-default-100"
              disableRipple
            >
              <Icon icon="lucide:grid" className="mr-2" />
              Aplicaciones
            </Button>
            <div className="absolute left-1/2 top-full z-50 w-[90vw] max-w-[1200px] -translate-x-1/2 bg-content1 shadow-xl rounded-xl p-8 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-divider">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-4 text-foreground-500">CATEGORÍAS</h3>
                  <div className="space-y-2">
                    <Button
                      as={RouterLink}
                      to="/app/finance"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:dollar-sign" width={16} height={16} />}
                    >
                      FINANZAS
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/sales"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:shopping-bag" width={16} height={16} />}
                    >
                      VENTAS
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/websites"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:globe" width={16} height={16} />}
                    >
                      SITIOS WEB
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/inventory"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:truck" width={16} height={16} />}
                    >
                      CADENA DE SUMINISTRO
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4 text-foreground-500">MÁS CATEGORÍAS</h3>
                  <div className="space-y-2">
                    <Button
                      as={RouterLink}
                      to="/app/employees"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:users" width={16} height={16} />}
                    >
                      RECURSOS HUMANOS
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/marketing"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:megaphone" width={16} height={16} />}
                    >
                      MARKETING
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/project"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:briefcase" width={16} height={16} />}
                    >
                      SERVICIOS
                    </Button>
                    <Button
                      as={RouterLink}
                      to="/app/productivity"
                      variant="light"
                      color="default"
                      className="justify-start w-full"
                      startContent={<Icon icon="lucide:zap" width={16} height={16} />}
                    >
                      PRODUCTIVIDAD
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NavbarItem>
        {isAuthenticated && (
          <>
            <NavbarItem>
              <Link as={RouterLink} to="/app/finance" color="foreground">
                Finanzas
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link as={RouterLink} to="/app/accounting" color="foreground">
                Contabilidad
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link 
                as="a" 
                href="http://localhost:8069/web#action=220&model=account.move&view_type=list" 
                target="_blank"
                color="foreground"
              >
                Odoo Directo
              </Link>
            </NavbarItem>
          </>
        )}
        <NavbarItem>
          <Link as={RouterLink} to="/pricing" color="foreground">
            Precios
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link as={RouterLink} to="/help" color="foreground">
            Ayuda
          </Link>
        </NavbarItem>
      </NavbarContent>
      
      <NavbarContent justify="end">
        {/* Mostrar estado de sesión si está autenticado */}
        {isAuthenticated && sessionInfo && (
          <NavbarItem>
            <SessionStatus />
          </NavbarItem>
        )}
        
        {!isAuthenticated ? (
          <>
            <NavbarItem>
              <Link as={RouterLink} to="/login" color="foreground">
                Iniciar sesión
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button as={RouterLink} to="/signup" color="primary" variant="solid" radius="sm">
                Prueba gratis
              </Button>
            </NavbarItem>
          </>
        ) : (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="transition-transform"
                color="primary"
                name="Usuario"
                src="https://img.heroui.chat/image/avatar?w=200&h=200&u=1"
                size="sm"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Acciones de perfil">
              <DropdownItem key="profile" as={RouterLink} to="/my-account">Mi cuenta</DropdownItem>
              <DropdownItem key="dashboard" as={RouterLink} to="/dashboard">Dashboard</DropdownItem>
              <DropdownItem key="finance" as={RouterLink} to="/app/finance">Finanzas</DropdownItem>
              <DropdownItem key="accounting" as={RouterLink} to="/app/accounting">Contabilidad</DropdownItem>
              <DropdownItem key="odoo_direct" as="a" href="http://localhost:8069/web" target="_blank">Odoo Directo</DropdownItem>
              <DropdownItem key="settings" as={RouterLink} to="/edit-profile">Editar perfil</DropdownItem>
              <DropdownItem key="system-settings" as={RouterLink} to="/system/settings">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:settings" className="text-sm" />
                  Configuración del Sistema
                </div>
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onPress={handleLogout}>
                Cerrar sesión
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </Navbar>
  );
};