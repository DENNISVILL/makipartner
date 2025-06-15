import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  redirectPath?: string;
}

/**
 * Componente que protege rutas y redirige a usuarios no autenticados
 * 
 * @param component - El componente a renderizar si el usuario está autenticado
 * @param redirectPath - Ruta a la que redirigir si el usuario no está autenticado (por defecto: /login)
 * @param rest - Resto de propiedades de Route
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  redirectPath = '/login',
  ...rest
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: redirectPath,
              state: { from: props.location, message: 'Debes iniciar sesión para acceder a esta página' }
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;