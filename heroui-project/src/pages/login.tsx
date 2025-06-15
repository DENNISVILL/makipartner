import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Input, Button, Link, Checkbox, Divider, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ErrorType } from '../services/errorHandler';
import { useFormValidation } from '../utils/validation';
import { loginSchema } from '../utils/validation';
import { useI18n } from '../utils/i18n';
import { LoadingSpinner } from '../components/LoadingStates';

export const Login: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    database: 'odoo_db',
    email: '',
    password: '',
    rememberMe: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  
  const { 
    login, 
    isLoading, 
    error, 
    clearError, 
    isAuthenticated,
    sessionInfo
  } = useAuth();
  
  const { errors, validateField, validateForm, clearErrors } = useFormValidation(loginSchema);
  const { t } = useI18n();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      onLoginSuccess?.();
      history.push('/dashboard');
    }
  }, [isAuthenticated, onLoginSuccess, history]);

  // Cargar credenciales recordadas al montar el componente
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedDatabase = localStorage.getItem('rememberedDatabase');
    
    if (rememberedEmail && rememberedDatabase) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        database: rememberedDatabase
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validar formulario completo antes de enviar
    const isValid = validateForm(formData);
    if (!isValid) {
      return;
    }

    try {
      const success = await login(
        formData.database,
        formData.email,
        formData.password,
        formData.rememberMe
      );
      
      // Guardar credenciales si "recordarme" está activado
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedDatabase', formData.database);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedDatabase');
      }

      if (success) {
        onLoginSuccess?.();
        history.push('/dashboard');
      }
    } catch (err) {
      // El error se maneja en el hook useAuth
      console.error('Error en login:', err);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
    // Limpiar errores del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      clearErrors([field]);
    }
    // Validar el campo en tiempo real
    if (typeof value === 'string') {
      validateField(field, value);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-content2">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-primary text-4xl font-bold mb-2">odoo</div>
          <h2 className="text-2xl font-bold">{t('auth.login')}</h2>
          <p className="text-foreground-500">Accede a tu cuenta</p>
        </div>

        <Card className="border border-divider">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mostrar información de sesión si está disponible */}
              {sessionInfo && sessionInfo.timeUntilExpiry > 0 && (
                <div className="p-4 rounded-lg bg-warning-50 border border-warning-200">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:clock" className="text-warning" />
                    <span className="text-sm text-warning-700">
                      Sesión activa - Expira en {Math.floor(sessionInfo.timeUntilExpiry / (1000 * 60))} minutos
                    </span>
                  </div>
                </div>
              )}
              
              <Input
                type="text"
                label={t('forms.database')}
                placeholder="Nombre de la base de datos"
                value={formData.database}
                onValueChange={(value) => handleInputChange('database', value)}
                variant="bordered"
                radius="sm"
                isRequired
                isInvalid={!!errors.database}
                errorMessage={errors.database}
                startContent={<Icon icon="lucide:database" className="text-default-400" />}
              />
              
              <Input
                type="email"
                label={t('forms.email')}
                placeholder="nombre@empresa.com"
                value={formData.email}
                onValueChange={(value) => handleInputChange('email', value)}
                variant="bordered"
                radius="sm"
                isRequired
                isInvalid={!!errors.email}
                errorMessage={errors.email}
                startContent={<Icon icon="lucide:mail" className="text-default-400" />}
              />
              
              <Input
                type={showPassword ? "text" : "password"}
                label={t('forms.password')}
                placeholder={t('forms.passwordPlaceholder')}
                value={formData.password}
                onValueChange={(value) => handleInputChange('password', value)}
                variant="bordered"
                radius="sm"
                isRequired
                isInvalid={!!errors.password}
                errorMessage={errors.password}
                startContent={<Icon icon="lucide:lock" className="text-default-400" />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                    aria-label={showPassword ? t('forms.hidePassword') : t('forms.showPassword')}
                  >
                    <Icon
                      icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
                      className="text-foreground-400 hover:text-foreground-600"
                    />
                  </button>
                }
              />
              
              <div className="flex justify-between items-center">
                <Checkbox
                  isSelected={formData.rememberMe}
                  onValueChange={(checked) => handleInputChange('rememberMe', checked)}
                  color="primary"
                >
                  <span className="text-sm">{t('auth.rememberMe')}</span>
                </Checkbox>
                
                <Link as={RouterLink} to="/reset-password" size="sm" color="primary">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              
              <Button 
                type="submit" 
                color="primary" 
                className="w-full" 
                radius="sm"
                isLoading={isLoading}
                isDisabled={!formData.email || !formData.password || !formData.database || isLoading || Object.keys(errors).length > 0}
                spinner={<LoadingSpinner size="sm" />}
              >
                {isLoading ? t('auth.loggingIn') : t('auth.login')}
              </Button>
              
              {error && (
                <div className="mt-2">
                  {typeof error === 'string' ? (
                    <div className="text-danger text-sm">{error}</div>
                  ) : (
                    <div className={`p-3 rounded ${error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? 'bg-danger-50 border border-danger-200' : 'bg-warning-50 border border-warning-200'}`}>
                      <div className="flex items-start gap-2">
                        <Icon 
                          icon={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "lucide:alert-circle" : "lucide:alert-triangle"} 
                          className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger mt-0.5" : "text-warning mt-0.5"} 
                        />
                        <div>
                          <p className={error.type === ErrorType.SERVER || error.type === ErrorType.AUTHENTICATION ? "text-danger font-medium" : "text-warning font-medium"}>
                            {getErrorMessage(error)}
                          </p>
                          {error.suggestion && (
                            <p className="text-sm text-foreground-500 mt-1">{error.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <Divider className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-content1 px-2 text-sm text-foreground-500">
                    o continúa con
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button 
                  variant="bordered" 
                  radius="sm"
                  startContent={<Icon icon="logos:google-icon" width={18} height={18} />}
                >
                  Google
                </Button>
                <Button 
                  variant="bordered" 
                  radius="sm"
                  startContent={<Icon icon="logos:microsoft-icon" width={18} height={18} />}
                >
                  Microsoft
                </Button>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-foreground-500">
                ¿No tienes una cuenta?{' '}
                <Link as={RouterLink} to="/signup" color="primary">
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;