import { useState, useEffect, useCallback } from 'react';
import authService, { SessionInfo, User } from '../services/authService';
import logger from '../utils/logger';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  user: User | null;
  expiresAt: number | null;
  autoRefresh: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  clearError: () => void;
  isSessionExpiringSoon: () => boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isRefreshing: false,
    error: null,
    user: null,
    expiresAt: null,
    autoRefresh: false
  });

  // Actualizar estado de autenticación
  const updateAuthState = useCallback(async () => {
    const sessionInfo = await authService.getSessionInfo();
    setAuthState({
      isAuthenticated: authService.isAuthenticated(),
      isLoading: false,
      isRefreshing: false,
      error: null,
      user: sessionInfo?.user || null,
      expiresAt: sessionInfo?.expiresAt || null,
      autoRefresh: authService.isAutoRefreshEnabled()
    });
  }, []);

  // Función de login
  const login = async (username: string, password: string, rememberMe = false) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.login(username, password, rememberMe);
      await updateAuthState();
      logger.info('Login exitoso');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de autenticación'
      }));
      logger.error('Error en login:', error);
    }
  };

  // Función de logout
  const logout = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        error: null,
        user: null,
        expiresAt: null,
        autoRefresh: false
      });
      logger.info('Logout exitoso');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cerrar sesión'
      }));
      logger.error('Error en logout:', error);
    }
  };

  // Función para refrescar sesión manualmente
  const refreshSession = async () => {
    setAuthState(prev => ({ ...prev, isRefreshing: true }));
    try {
      await authService.refreshToken();
      await updateAuthState();
      logger.info('Sesión refrescada exitosamente');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : 'Error al renovar la sesión'
      }));
      logger.error('Error al refrescar sesión:', error);
    }
  };

  // Configurar renovación automática
  const setAutoRefresh = (enabled: boolean) => {
    authService.setAutoRefresh(enabled);
    updateAuthState();
  };

  // Limpiar error
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const isSessionExpiringSoon = () => {
    if (!authState.expiresAt) return false;
    const timeUntilExpiry = authState.expiresAt - Date.now();
    return timeUntilExpiry < 60000; // Menos de 1 minuto
  };

  // Efecto para inicializar y monitorear la sesión
  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.restoreSession();
      } catch (error) {
        logger.error('Error al inicializar autenticación:', error);
      } finally {
        await updateAuthState();
      }
    };
    
    initAuth();

    // Suscribirse a cambios en la sesión
    const unsubscribe = authService.subscribeToSessionChanges(() => {
      updateAuthState();
    });

    return () => {
      unsubscribe();
    };
  }, [updateAuthState]);

  // Efecto para monitorear cambios en la sesión
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (authState.isAuthenticated) {
        // Actualizar el estado si cambia la autenticación o si está por expirar
        const isStillAuthenticated = authService.isAuthenticated();
        
        if (isStillAuthenticated !== authState.isAuthenticated || isSessionExpiringSoon()) {
          updateAuthState();
        }
      }
    }, 30000); // Verificar cada 30 segundos
    
    return () => clearInterval(checkInterval);
  }, [authState.isAuthenticated, updateAuthState]);

  return {
    ...authState,
    login,
    logout,
    refreshSession,
    setAutoRefresh,
    clearError,
    isSessionExpiringSoon
  };
};

export default useAuth;