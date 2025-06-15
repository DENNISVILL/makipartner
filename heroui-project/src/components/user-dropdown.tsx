import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@heroui/react';
import { Link as RouteLink } from 'react-router-dom';

interface UserDropdownProps {
  userName: string;
  userImage?: string;
  onLogout: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ 
  userName, 
  userImage = "https://img.heroui.chat/image/avatar?w=200&h=200&u=1",
  onLogout
}) => {
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          as="button"
          className="transition-transform"
          color="primary"
          name={userName}
          src={userImage}
          size="sm"
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="Acciones de perfil">
        <DropdownItem key="profile" as={RouteLink} to="/my-account">
          Mi cuenta
        </DropdownItem>
        <DropdownItem key="dashboard" as={RouteLink} to="/dashboard">
          Dashboard
        </DropdownItem>
        <DropdownItem key="settings" as={RouteLink} to="/edit-profile">
          Editar perfil
        </DropdownItem>
        <DropdownItem key="logout" color="danger" onPress={onLogout}>
          Cerrar sesión
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};