import React, { useState, useEffect } from 'react';
import { Modal, Button, Text } from '@heroui/react';
import useAuth from '../hooks/useAuth';
import { useHistory } from 'react-router-dom';

interface SessionExpiredModalProps {
  redirectPath?: string;
}

/**
 * Modal que se muestra cuando la sesión del usuario ha expirado
 * Permite al usuario renovar la sesión o cerrar sesión
 */
export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  redirectPath = '/login'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isSessionExpiringSoon, refreshSession, logout } = useAuth();
  const history = useHistory();

  // Verificar si la sesión está por expirar
  useEffect(() => {
    if (isAuthenticated && isSessionExpiringSoon()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated, isSessionExpiringSoon]);

  // Manejar renovación de sesión
  const handleRenewSession = async () => {
    try {
      await refreshSession();
      setIsOpen(false);
    } catch (error) {
      console.error('Error al renovar sesión:', error);
      handleLogout();
    }
  };

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      history.push(redirectPath);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Forzar redirección incluso si falla el logout
      history.push(redirectPath);
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      isDismissable={false}
      className="max-w-md mx-auto"
    >
      <Modal.Header>
        <Text size="lg" weight="semibold">Sesión a punto de expirar</Text>
      </Modal.Header>
      <Modal.Body>
        <Text>
          Tu sesión está a punto de expirar. ¿Deseas mantener la sesión activa?
        </Text>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" color="danger" onPress={handleLogout}>
          Cerrar sesión
        </Button>
        <Button color="primary" onPress={handleRenewSession} autoFocus>
          Mantener sesión
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionExpiredModal;