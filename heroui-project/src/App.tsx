import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { I18nProvider } from './utils/i18n';
import { NavbarComponent } from './components/navbar';
import { FooterComponent } from './components/footer';
import { Dashboard } from './pages/dashboard';
import { Login } from './pages/login';
import { Signup } from './pages/signup';
import { MyAccount } from './pages/my-account';
import { EditProfile } from './pages/edit-profile';
import { Pricing } from './pages/pricing';
import { UserDashboard } from './pages/user-dashboard';
import { UserDropdown } from './components/user-dropdown';
import { DashboardStatistics } from './pages/dashboard-statistics';
// Importar todas las nuevas páginas
import { Sales } from './pages/sales';
import { CRM } from './pages/crm';
import { Finance } from './pages/finance';
import { Inventory } from './pages/inventory';
import { HR } from './pages/hr';
import { Projects } from './pages/projects';
import Marketing from './pages/marketing';
import Websites from './pages/websites';
import Productivity from './pages/productivity';
import SystemSettings from './pages/system-settings';
import useAuth from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SessionExpiredModal } from './components/SessionExpiredModal';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <NavbarComponent />
        <main className="flex-grow">
          <Switch>
            {/* Rutas públicas */}
            <Route exact path="/" render={() => (
              isAuthenticated ? <Redirect to="/dashboard" /> : <Dashboard />
            )} />
            <Route path="/login" render={(props) => (
              isAuthenticated ? <Redirect to="/dashboard" /> : <Login {...props} />
            )} />
            <Route path="/signup" render={(props) => (
              isAuthenticated ? <Redirect to="/dashboard" /> : <Signup {...props} />
            )} />
            <Route path="/pricing" component={Pricing} />
            
            {/* Rutas protegidas - Perfil de usuario */}
            <ProtectedRoute path="/dashboard" component={UserDashboard} />
            <ProtectedRoute path="/dashboard/statistics" component={DashboardStatistics} />
            <ProtectedRoute path="/my-account" component={MyAccount} />
            <ProtectedRoute path="/edit-profile" component={EditProfile} />
            
            {/* Rutas protegidas - VENTAS */}
            <ProtectedRoute path="/app/sales" component={Sales} />
            <ProtectedRoute path="/app/crm" component={CRM} />
            
            {/* Rutas protegidas - FINANZAS */}
            <ProtectedRoute path="/app/finance" component={Finance} />
            <ProtectedRoute path="/app/accounting" component={Finance} />
            <ProtectedRoute path="/app/invoicing" component={Finance} />
            <ProtectedRoute path="/app/expenses" component={Finance} />
            
            {/* Rutas protegidas - MARKETING */}
            <ProtectedRoute path="/app/marketing" component={Marketing} />
            <ProtectedRoute path="/app/email-marketing" component={Marketing} />
            <ProtectedRoute path="/app/events" component={Marketing} />
            
            {/* Rutas protegidas - WEBSITES */}
            <ProtectedRoute path="/app/websites" component={Websites} />
            <ProtectedRoute path="/app/ecommerce" component={Websites} />
            
            {/* Rutas protegidas - PRODUCTIVITY */}
            <ProtectedRoute path="/app/productivity" component={Productivity} />
            <ProtectedRoute path="/app/calendar" component={Productivity} />
            <ProtectedRoute path="/app/documents" component={Productivity} />
            <ProtectedRoute path="/app/contacts" component={Productivity} />
            <ProtectedRoute path="/app/inventory" component={Inventory} />
            <ProtectedRoute path="/app/manufacturing" component={Inventory} />
            <ProtectedRoute path="/app/purchase" component={Inventory} />
            
            {/* Rutas protegidas - RECURSOS HUMANOS */}
            <ProtectedRoute path="/app/employees" component={HR} />
            <ProtectedRoute path="/app/recruitment" component={HR} />
            
            {/* Rutas protegidas - PROYECTOS */}
            <ProtectedRoute path="/app/project" component={Projects} />
            <ProtectedRoute path="/app/timesheet" component={Projects} />
            
            {/* Rutas protegidas - CONFIGURACIÓN */}
            <ProtectedRoute path="/system/settings" component={SystemSettings} />
            
            {/* Ruta de fallback para rutas no encontradas */}
            <Route path="*" render={() => (
              <Redirect to={isAuthenticated ? "/dashboard" : "/"} />
            )} />
          </Switch>
        </main>
        <FooterComponent />
        {/* Modal de sesión expirada */}
        <SessionExpiredModal />
      </div>
    </I18nProvider>
  );
};

export default App;