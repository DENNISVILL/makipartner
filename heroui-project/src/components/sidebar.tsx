import React from 'react';
import { Link as RouteLink, useLocation } from 'react-router-dom';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Avatar } from '@heroui/react';

interface SidebarItemProps {
  icon: string;
  label: string;
  to: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, to, isActive = false }) => {
  return (
    <Button
      as={RouteLink}
      to={to}
      variant={isActive ? "flat" : "light"}
      color={isActive ? "primary" : "default"}
      className="justify-start w-full mb-1"
      startContent={<Icon icon={icon} width={18} height={18} />}
      size="sm"
    >
      {label}
    </Button>
  );
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div className={`fixed top-0 left-0 h-full bg-content1 border-r border-divider transition-all duration-300 z-40 pt-16 ${isOpen ? 'w-0' : 'w-0'} md:w-0`}>
      {/* Sidebar completamente oculto - todas las categorías están ahora en el menú Aplicaciones del navbar */}
    </div>
  );
};