import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { I18nProvider } from './i18n';

// Mock para el servicio de Odoo
export const mockOdooService = {
  authenticate: jest.fn(),
  logout: jest.fn(),
  getSessionInfo: jest.fn(() => ({
    isAuthenticated: false,
    uid: null,
    sessionId: null,
    expiryTime: null,
    timeUntilExpiry: 0,
    autoRefreshEnabled: false
  })),
  refreshSession: jest.fn(),
  call: jest.fn(),
  search: jest.fn(),
  read: jest.fn(),
  create: jest.fn(),
  write: jest.fn(),
  unlink: jest.fn()
};

// Mock para el hook useAuth
export const mockUseAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  sessionInfo: null,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
  refreshSession: jest.fn(),
  setAutoRefresh: jest.fn(),
  clearError: jest.fn(),
  checkSessionStatus: jest.fn()
};

// Wrapper personalizado para testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <HeroUIProvider>
        <I18nProvider>
          {children}
        </I18nProvider>
      </HeroUIProvider>
    </BrowserRouter>
  );
};

// Función de render personalizada
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Utilidades de testing comunes
export const testUtils = {
  // Simular delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Simular respuesta de API exitosa
  mockApiSuccess: (data: any) => Promise.resolve({ data, status: 200 }),
  
  // Simular error de API
  mockApiError: (message: string, status: number = 500) => 
    Promise.reject({ message, status }),
  
  // Llenar formulario
  fillForm: async (fields: Record<string, string>) => {
    const user = userEvent.setup();
    
    for (const [fieldName, value] of Object.entries(fields)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                   screen.getByPlaceholderText(new RegExp(fieldName, 'i')) ||
                   screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') });
      
      await user.clear(field);
      await user.type(field, value);
    }
  },
  
  // Hacer clic en botón
  clickButton: async (buttonText: string) => {
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') });
    await user.click(button);
  },
  
  // Esperar a que aparezca un elemento
  waitForElement: async (text: string) => {
    return await waitFor(() => screen.getByText(new RegExp(text, 'i')));
  },
  
  // Esperar a que desaparezca un elemento
  waitForElementToDisappear: async (text: string) => {
    return await waitFor(() => 
      expect(screen.queryByText(new RegExp(text, 'i'))).not.toBeInTheDocument()
    );
  },
  
  // Verificar que un elemento esté visible
  expectVisible: (text: string) => {
    expect(screen.getByText(new RegExp(text, 'i'))).toBeVisible();
  },
  
  // Verificar que un elemento no esté presente
  expectNotPresent: (text: string) => {
    expect(screen.queryByText(new RegExp(text, 'i'))).not.toBeInTheDocument();
  },
  
  // Verificar estado de loading
  expectLoading: () => {
    expect(screen.getByText(/cargando|loading/i)).toBeInTheDocument();
  },
  
  // Verificar mensaje de error
  expectError: (errorMessage?: string) => {
    if (errorMessage) {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    } else {
      expect(screen.getByText(/error|fallo/i)).toBeInTheDocument();
    }
  }
};

// Datos de prueba comunes
export const testData = {
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'Usuario de Prueba',
    sessionId: 'test-session-123'
  },
  
  loginForm: {
    database: 'test_db',
    email: 'test@example.com',
    password: 'password123',
    rememberMe: true
  },
  
  partner: {
    id: 1,
    name: 'Cliente de Prueba',
    email: 'cliente@example.com',
    phone: '+593987654321',
    is_company: false
  },
  
  invoice: {
    id: 1,
    name: 'INV/2024/0001',
    partner_id: [1, 'Cliente de Prueba'],
    amount_total: 1000.00,
    state: 'posted',
    invoice_date: '2024-01-15'
  }
};

// Matchers personalizados para Jest
expect.extend({
  toBeLoading(received) {
    const pass = received.textContent?.includes('Cargando') || 
                received.textContent?.includes('Loading') ||
                received.querySelector('[data-testid="loading"]') !== null;
    
    if (pass) {
      return {
        message: () => `expected element not to be in loading state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be in loading state`,
        pass: false,
      };
    }
  },
  
  toHaveError(received, errorMessage) {
    const hasError = received.textContent?.includes('Error') ||
                    received.textContent?.includes('error') ||
                    received.querySelector('[data-testid="error"]') !== null;
    
    const hasSpecificError = errorMessage ? 
      received.textContent?.includes(errorMessage) : true;
    
    const pass = hasError && hasSpecificError;
    
    if (pass) {
      return {
        message: () => `expected element not to have error${errorMessage ? ` "${errorMessage}"` : ''}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to have error${errorMessage ? ` "${errorMessage}"` : ''}`,
        pass: false,
      };
    }
  }
});

// Configuración de mocks globales
beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  jest.clearAllMocks();
  
  // Mock de localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
  
  // Mock de fetch
  global.fetch = jest.fn();
  
  // Mock de console.error para tests más limpios
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restaurar mocks después de cada test
  jest.restoreAllMocks();
});

// Exportar todo lo necesario
export * from '@testing-library/react';
export { userEvent };
export { customRender as render };

// Tipos para TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeLoading(): R;
      toHaveError(errorMessage?: string): R;
    }
  }
}

export default {
  testUtils,
  testData,
  mockOdooService,
  mockUseAuth
};