import React, { useState } from 'react';
import { Card, CardBody, CardHeader, Button, Switch, Progress, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useAuth } from '../hooks/useAuth';
import { SessionInfo } from '../services/authService';

interface SessionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const SessionStatus: React.FC<SessionStatusProps> = ({ 
  showDetails = true, 
  compact = false 
}) => {
  const { 
    isAuthenticated, 
    user, 
    expiresAt, 
    isRefreshing: isSessionRefreshing, 
    autoRefresh,
    refreshSession, 
    setAutoRefresh, 
    logout,
    isSessionExpiringSoon
  } = useAuth();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatTimeRemaining = (expiryTime: number | null): string => {
    if (!expiryTime) return 'No disponible';
    
    const milliseconds = expiryTime - Date.now();
    if (milliseconds <= 0) return 'Expirada';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSessionStatusColor = () => {
    if (!isAuthenticated) return 'danger';
    if (!expiresAt) return 'warning';
    
    const hoursRemaining = (expiresAt - Date.now()) / (1000 * 60 * 60);
    if (hoursRemaining < 1) return 'warning';
    if (hoursRemaining < 2) return 'primary';
    return 'success';
  };

  const getProgressValue = () => {
    if (!expiresAt) return 0;
    
    const totalDuration = 60 * 60 * 1000; // 1 hora en ms (duración típica del token JWT)
    const remaining = Math.max(0, expiresAt - Date.now());
    return Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Chip
          color={getSessionStatusColor()}
          variant="flat"
          size="sm"
          startContent={
            <Icon 
              icon={isAuthenticated ? "lucide:shield-check" : "lucide:shield-x"} 
              className="text-sm" 
            />
          }
        >
          {isAuthenticated ? 'Activa' : 'Inactiva'}
        </Chip>
        
        {isAuthenticated && expiresAt && (
          <span className="text-xs text-foreground-500">
            {formatTimeRemaining(expiresAt)}
          </span>
        )}
        
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onOpen}
        >
          <Icon icon="lucide:settings" className="text-sm" />
        </Button>
        
        <SessionConfigModal 
          isOpen={isOpen} 
          onClose={onClose}
          expiresAt={expiresAt}
          isAuthenticated={isAuthenticated}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          onRefresh={handleRefreshSession}
          isRefreshing={isRefreshing || isSessionRefreshing}
          onLogout={logout}
        />
      </div>
    );
  }

  if (!showDetails) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:shield" className="text-xl" />
            <h3 className="text-lg font-semibold">Estado de la Sesión</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Chip
              color={getSessionStatusColor()}
              variant="flat"
              startContent={
                <Icon 
                  icon={isAuthenticated ? "lucide:shield-check" : "lucide:shield-x"} 
                  className="text-sm" 
                />
              }
            >
              {isAuthenticated ? 'Sesión Activa' : 'Sin Sesión'}
            </Chip>
            
            <Button
              size="sm"
              variant="flat"
              onPress={handleRefreshSession}
              startContent={<Icon icon="lucide:refresh-cw" />}
              isLoading={isRefreshing || isSessionRefreshing}
            >
              Verificar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardBody className="space-y-4">
        {isAuthenticated && user ? (
          <>
            {/* Progreso de tiempo restante */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tiempo Restante</span>
                <span className="text-sm text-foreground-500">
                  {formatTimeRemaining(expiresAt)}
                </span>
              </div>
              <Progress 
                value={getProgressValue()}
                color={getSessionStatusColor()}
                size="sm"
                className="w-full"
              />
            </div>
            
            {/* Configuraciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Renovación Automática</p>
                  <p className="text-sm text-foreground-500">
                    Renueva la sesión automáticamente
                  </p>
                </div>
                <Switch 
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                  color="primary"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Expiración</p>
                  <p className="text-sm text-foreground-500">
                    {expiresAt ? 
                      new Date(expiresAt).toLocaleString() : 
                      'No definida'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex gap-2">
              <Button
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:refresh-cw" />}
                onPress={handleRefreshSession}
                isLoading={isRefreshing}
              >
                Renovar Sesión
              </Button>
              
              <Button
                color="danger"
                variant="flat"
                startContent={<Icon icon="lucide:log-out" />}
                onPress={logout}
              >
                Cerrar Sesión
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Icon icon="lucide:shield-x" className="text-4xl text-danger mb-2" />
            <p className="text-foreground-500">No hay una sesión activa</p>
            <p className="text-sm text-foreground-400">Inicie sesión para ver el estado</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Modal de configuración de sesión
interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  expiresAt: number | null;
  isAuthenticated: boolean;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onLogout: () => void;
}

const SessionConfigModal: React.FC<SessionConfigModalProps> = ({
  isOpen,
  onClose,
  expiresAt,
  isAuthenticated,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  isRefreshing,
  onLogout
}) => {
  const formatTimeRemaining = (expiryTime: number | null): string => {
    if (!expiryTime) return 'No disponible';
    
    const milliseconds = expiryTime - Date.now();
    if (milliseconds <= 0) return 'Expirada';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:shield" />
            Configuración de Sesión
          </div>
        </ModalHeader>
        
        <ModalBody>
          {isAuthenticated && expiresAt ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Estado:</p>
                  <p className="text-success">Activa</p>
                </div>
                <div>
                  <p className="font-medium">Tiempo Restante:</p>
                  <p>{formatTimeRemaining(expiresAt)}</p>
                </div>
                <div>
                  <p className="font-medium">Expira:</p>
                  <p>{expiresAt ? 
                    new Date(expiresAt).toLocaleString() : 
                    'No definida'
                  }</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Renovación Automática</p>
                  <p className="text-sm text-foreground-500">
                    Renueva la sesión cada 30 minutos
                  </p>
                </div>
                <Switch 
                  isSelected={autoRefresh}
                  onValueChange={setAutoRefresh}
                  color="primary"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Icon icon="lucide:shield-x" className="text-4xl text-danger mb-2" />
              <p>No hay una sesión activa</p>
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <div className="flex gap-2 w-full">
            {isAuthenticated && (
              <>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={onRefresh}
                  isLoading={isRefreshing}
                  startContent={<Icon icon="lucide:refresh-cw" />}
                >
                  Renovar
                </Button>
                
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    onLogout();
                    onClose();
                  }}
                  startContent={<Icon icon="lucide:log-out" />}
                >
                  Cerrar Sesión
                </Button>
              </>
            )}
            
            <Button
              variant="light"
              onPress={onClose}
            >
              Cerrar
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SessionStatus;