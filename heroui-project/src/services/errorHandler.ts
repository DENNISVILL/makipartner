import axios, { AxiosError } from 'axios';

// Tipos de errores personalizados con más detalle
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  ODOO_SPECIFIC = 'ODOO_SPECIFIC',
  UNKNOWN = 'UNKNOWN'
}

// Estructura estandarizada de error con más detalles
export interface StandardError {
  type: ErrorType;
  message: string;
  originalError?: any;
  details?: Record<string, any>;
  code?: string;
  suggestion?: string;
  userMessage?: string; // Mensaje amigable para mostrar al usuario
  recoverable?: boolean; // Indica si el error permite continuar o requiere acción del usuario
}

// Función para manejar errores de manera consistente con mensajes más específicos
export function handleApiError(error: any, context: string = ''): StandardError {
  console.error(`Error en ${context}:`, error);
  
  // Si ya es un StandardError, lo devolvemos
  if (error.type && Object.values(ErrorType).includes(error.type)) {
    return error as StandardError;
  }
  
  // Error de Axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Error de autenticación
    if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'La sesión ha expirado o no tiene permisos suficientes.',
        originalError: error,
        details: {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        },
        code: `AUTH_${axiosError.response?.status}`,
        suggestion: 'Intente iniciar sesión nuevamente o contacte al administrador si el problema persiste.',
        userMessage: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
        recoverable: false
      };
    }
    
    // Error de validación
    if (axiosError.response?.status === 400) {
      return {
        type: ErrorType.VALIDATION,
        message: 'Los datos proporcionados no son válidos.',
        originalError: error,
        details: {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        },
        code: 'VALIDATION_400',
        suggestion: 'Verifique los datos ingresados e intente nuevamente.',
        userMessage: 'La información proporcionada no es válida. Por favor, revise los datos e intente nuevamente.',
        recoverable: true
      };
    }
    
    // Recurso no encontrado
    if (axiosError.response?.status === 404) {
      return {
        type: ErrorType.RESOURCE_NOT_FOUND,
        message: 'El recurso solicitado no existe o ha sido eliminado.',
        originalError: error,
        details: {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          url: axiosError.config?.url
        },
        code: 'NOT_FOUND_404',
        suggestion: 'Verifique la URL o los parámetros de la solicitud.',
        userMessage: 'No se pudo encontrar la información solicitada. Es posible que haya sido eliminada o movida.',
        recoverable: true
      };
    }
    
    // Error del servidor
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'Error en el servidor. Por favor intente más tarde.',
        originalError: error,
        details: {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        },
        code: `SERVER_${axiosError.response?.status}`,
        suggestion: 'Contacte al administrador del sistema si el problema persiste.',
        userMessage: 'Estamos experimentando problemas técnicos. Por favor, intente nuevamente más tarde.',
        recoverable: false
      };
    }
    
    // Timeout
    if (axiosError.code === 'ECONNABORTED') {
      return {
        type: ErrorType.TIMEOUT,
        message: 'La solicitud ha excedido el tiempo máximo de espera.',
        originalError: error,
        code: 'TIMEOUT',
        suggestion: 'Verifique su conexión a internet o intente más tarde cuando el servidor esté menos ocupado.',
        userMessage: 'La operación está tardando demasiado. Por favor, verifique su conexión e intente nuevamente.',
        recoverable: true
      };
    }
    
    // Error de red
    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: 'Error de conexión. Verifique su conexión a internet.',
        originalError: error,
        code: axiosError.code || 'NETWORK_ERROR',
        suggestion: 'Compruebe que el servidor Odoo esté en funcionamiento y accesible desde su red.',
        userMessage: 'No se pudo conectar con el servidor. Por favor, verifique su conexión a internet.',
        recoverable: true
      };
    }
  }
  
  // Errores específicos de Odoo (pueden venir en la respuesta)
  if (error.data && error.data.error) {
    const odooError = error.data.error;
    
    // Intentar identificar errores específicos de Odoo
    if (odooError.data && odooError.data.name) {
      // Errores comunes de Odoo
      if (odooError.data.name.includes('AccessDenied') || odooError.data.name.includes('AccessError')) {
        return {
          type: ErrorType.PERMISSION,
          message: 'No tiene permisos suficientes para realizar esta acción.',
          originalError: error,
          details: odooError.data,
          code: 'ODOO_ACCESS_DENIED',
          suggestion: 'Contacte al administrador para solicitar los permisos necesarios.',
          userMessage: 'No tiene permisos para realizar esta acción. Contacte al administrador del sistema.',
          recoverable: false
        };
      }
      
      if (odooError.data.name.includes('ValidationError')) {
        return {
          type: ErrorType.VALIDATION,
          message: odooError.data.message || 'Error de validación en Odoo.',
          originalError: error,
          details: odooError.data,
          code: 'ODOO_VALIDATION',
          suggestion: 'Verifique los datos ingresados según las reglas de negocio de Odoo.',
          userMessage: odooError.data.message || 'La información proporcionada no cumple con las reglas del sistema.',
          recoverable: true
        };
      }
      
      // Otros errores específicos de Odoo
      return {
        type: ErrorType.ODOO_SPECIFIC,
        message: odooError.data.message || 'Error específico de Odoo.',
        originalError: error,
        details: odooError.data,
        code: `ODOO_${odooError.data.name.replace(/\./g, '_')}`,
        suggestion: 'Consulte la documentación de Odoo o contacte al soporte técnico.',
        userMessage: odooError.data.message || 'Ha ocurrido un error en el sistema. Por favor, contacte al soporte técnico.',
        recoverable: false
      };
    }
  }
  
  // Error desconocido
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Ha ocurrido un error inesperado.',
    originalError: error,
    code: 'UNKNOWN_ERROR',
    suggestion: 'Intente nuevamente o contacte al soporte técnico si el problema persiste.',
    userMessage: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente más tarde.',
    recoverable: true
  };
}

// Función para manejar errores específicos de Odoo
export function handleOdooError(error: any, context: string = ''): StandardError {
  const standardError = handleApiError(error, context);
  
  // Si es un error de autenticación, podemos limpiar la sesión
  if (standardError.type === ErrorType.AUTHENTICATION) {
    // Aquí podríamos añadir lógica adicional específica para errores de Odoo
    localStorage.removeItem('odoo_session_id');
    localStorage.removeItem('odoo_uid');
  }
  
  return standardError;
}

// Función auxiliar para mostrar mensajes de error al usuario
export function getErrorMessage(error: StandardError): string {
  return error.userMessage || error.message || 'Ha ocurrido un error inesperado.';
}

// Función para determinar si se debe mostrar un mensaje de error específico
export function shouldShowErrorDetails(error: StandardError): boolean {
  // No mostrar detalles técnicos para errores de servidor o desconocidos en producción
  if (process.env.NODE_ENV === 'production') {
    return error.type !== ErrorType.SERVER && error.type !== ErrorType.UNKNOWN;
  }
  return true;
}