import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos para el sistema de i18n
export type Language = 'es' | 'en';
export type TranslationKey = string;
export type Translations = Record<string, string | Record<string, string>>;

// Traducciones por defecto
const translations: Record<Language, Translations> = {
  es: {
    // Navegación
    nav: {
      dashboard: 'Panel de Control',
      finance: 'Finanzas',
      accounting: 'Contabilidad',
      sales: 'Ventas',
      crm: 'CRM',
      inventory: 'Inventario',
      hr: 'Recursos Humanos',
      projects: 'Proyectos',
      marketing: 'Marketing',
      settings: 'Configuración',
      logout: 'Cerrar Sesión',
      profile: 'Mi Perfil'
    },
    // Autenticación
    auth: {
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      signup: 'Registrarse',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      rememberMe: 'Recordar Sesión',
      forgotPassword: 'Olvidé mi Contraseña',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      database: 'Base de Datos',
      loginSuccess: 'Sesión iniciada correctamente',
      loginError: 'Error al iniciar sesión',
      logoutSuccess: 'Sesión cerrada correctamente'
    },
    // Formularios
    forms: {
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      create: 'Crear',
      update: 'Actualizar',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpiar',
      submit: 'Enviar',
      reset: 'Restablecer',
      required: 'Este campo es requerido',
      invalid: 'Valor inválido',
      loading: 'Cargando...',
      saving: 'Guardando...',
      deleting: 'Eliminando...',
      processing: 'Procesando...'
    },
    // Mensajes comunes
    common: {
      yes: 'Sí',
      no: 'No',
      ok: 'Aceptar',
      close: 'Cerrar',
      back: 'Volver',
      next: 'Siguiente',
      previous: 'Anterior',
      home: 'Inicio',
      welcome: 'Bienvenido',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      info: 'Información',
      loading: 'Cargando...',
      noData: 'No hay datos disponibles',
      retry: 'Reintentar',
      refresh: 'Actualizar'
    },
    // Estados y mensajes
    states: {
      empty: 'No hay elementos para mostrar',
      error: 'Ha ocurrido un error',
      loading: 'Cargando contenido...',
      saving: 'Guardando cambios...',
      deleting: 'Eliminando elemento...',
      processing: 'Procesando solicitud...',
      success: 'Operación completada exitosamente',
      networkError: 'Error de conexión',
      serverError: 'Error del servidor',
      unauthorized: 'No autorizado',
      forbidden: 'Acceso denegado',
      notFound: 'No encontrado'
    },
    // Validaciones
    validation: {
      required: 'Este campo es requerido',
      email: 'Ingresa un correo electrónico válido',
      password: 'La contraseña debe tener al menos 8 caracteres',
      passwordMatch: 'Las contraseñas no coinciden',
      minLength: 'Debe tener al menos {min} caracteres',
      maxLength: 'No puede exceder {max} caracteres',
      numeric: 'Solo se permiten números',
      alphanumeric: 'Solo se permiten letras y números',
      phone: 'Ingresa un número de teléfono válido',
      url: 'Ingresa una URL válida'
    }
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      finance: 'Finance',
      accounting: 'Accounting',
      sales: 'Sales',
      crm: 'CRM',
      inventory: 'Inventory',
      hr: 'Human Resources',
      projects: 'Projects',
      marketing: 'Marketing',
      settings: 'Settings',
      logout: 'Logout',
      profile: 'My Profile'
    },
    // Authentication
    auth: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      database: 'Database',
      loginSuccess: 'Login successful',
      loginError: 'Login error',
      logoutSuccess: 'Logout successful'
    },
    // Forms
    forms: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      update: 'Update',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear',
      submit: 'Submit',
      reset: 'Reset',
      required: 'This field is required',
      invalid: 'Invalid value',
      loading: 'Loading...',
      saving: 'Saving...',
      deleting: 'Deleting...',
      processing: 'Processing...'
    },
    // Common messages
    common: {
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      home: 'Home',
      welcome: 'Welcome',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      loading: 'Loading...',
      noData: 'No data available',
      retry: 'Retry',
      refresh: 'Refresh'
    },
    // States and messages
    states: {
      empty: 'No items to display',
      error: 'An error occurred',
      loading: 'Loading content...',
      saving: 'Saving changes...',
      deleting: 'Deleting item...',
      processing: 'Processing request...',
      success: 'Operation completed successfully',
      networkError: 'Network error',
      serverError: 'Server error',
      unauthorized: 'Unauthorized',
      forbidden: 'Access denied',
      notFound: 'Not found'
    },
    // Validations
    validation: {
      required: 'This field is required',
      email: 'Enter a valid email address',
      password: 'Password must be at least 8 characters',
      passwordMatch: 'Passwords do not match',
      minLength: 'Must be at least {min} characters',
      maxLength: 'Cannot exceed {max} characters',
      numeric: 'Only numbers allowed',
      alphanumeric: 'Only letters and numbers allowed',
      phone: 'Enter a valid phone number',
      url: 'Enter a valid URL'
    }
  }
};

// Contexto de i18n
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Provider de i18n
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Intentar obtener el idioma del localStorage
    const saved = localStorage.getItem('language') as Language;
    if (saved && ['es', 'en'].includes(saved)) {
      return saved;
    }
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0] as Language;
    return ['es', 'en'].includes(browserLang) ? browserLang : 'es';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback al español si no se encuentra la traducción
        value = translations.es;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Retornar la clave si no se encuentra
          }
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Reemplazar parámetros
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  };

  const contextValue: I18nContextType = {
    language,
    setLanguage,
    t,
    languages: ['es', 'en']
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook para usar i18n
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Hook simplificado para solo obtener la función de traducción
export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};

// Función de traducción standalone (para uso fuera de componentes)
export const translate = (key: string, lang: Language = 'es', params?: Record<string, string | number>): string => {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
};

// Componente para selector de idioma
export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage, languages } = useI18n();
  
  return (
    <select 
      value={language} 
      onChange={(e) => setLanguage(e.target.value as Language)}
      className={`px-3 py-1 rounded border border-divider bg-content1 text-foreground ${className}`}
    >
      {languages.map(lang => (
        <option key={lang} value={lang}>
          {lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}
        </option>
      ))}
    </select>
  );
};

export default {
  I18nProvider,
  useI18n,
  useTranslation,
  translate,
  LanguageSelector
};