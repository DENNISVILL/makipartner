import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  I18nProvider,
  useI18n,
  useTranslation,
  translate,
  LanguageSelector,
  translations
} from '../i18n';

// Componente de prueba para el hook useI18n
const TestComponent: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translated-text">{t('auth.login')}</div>
      <button onClick={() => setLanguage('en')}>Switch to English</button>
      <button onClick={() => setLanguage('es')}>Switch to Spanish</button>
    </div>
  );
};

// Componente de prueba para el hook useTranslation
const TranslationTestComponent: React.FC = () => {
  const t = useTranslation();
  
  return (
    <div>
      <div data-testid="auth-login">{t('auth.login')}</div>
      <div data-testid="forms-email">{t('forms.email')}</div>
      <div data-testid="common-save">{t('common.save')}</div>
    </div>
  );
};

describe('I18n System', () => {
  describe('translations object', () => {
    it('contains Spanish translations', () => {
      expect(translations.es.auth.login).toBe('Iniciar Sesión');
      expect(translations.es.forms.email).toBe('Correo Electrónico');
      expect(translations.es.common.save).toBe('Guardar');
    });

    it('contains English translations', () => {
      expect(translations.en.auth.login).toBe('Login');
      expect(translations.en.forms.email).toBe('Email');
      expect(translations.en.common.save).toBe('Save');
    });

    it('has consistent structure between languages', () => {
      const spanishKeys = Object.keys(translations.es);
      const englishKeys = Object.keys(translations.en);
      
      expect(spanishKeys).toEqual(englishKeys);
      
      // Verificar que las secciones principales existen
      expect(spanishKeys).toContain('auth');
      expect(spanishKeys).toContain('forms');
      expect(spanishKeys).toContain('common');
      expect(spanishKeys).toContain('navigation');
      expect(spanishKeys).toContain('states');
      expect(spanishKeys).toContain('validation');
    });
  });

  describe('translate function', () => {
    it('translates keys correctly in Spanish', () => {
      expect(translate('auth.login', 'es')).toBe('Iniciar Sesión');
      expect(translate('forms.password', 'es')).toBe('Contraseña');
      expect(translate('common.cancel', 'es')).toBe('Cancelar');
    });

    it('translates keys correctly in English', () => {
      expect(translate('auth.login', 'en')).toBe('Login');
      expect(translate('forms.password', 'en')).toBe('Password');
      expect(translate('common.cancel', 'en')).toBe('Cancel');
    });

    it('returns key when translation not found', () => {
      expect(translate('nonexistent.key', 'es')).toBe('nonexistent.key');
      expect(translate('another.missing.key', 'en')).toBe('another.missing.key');
    });

    it('handles nested keys correctly', () => {
      expect(translate('validation.required', 'es')).toBe('Este campo es requerido');
      expect(translate('states.loading', 'en')).toBe('Loading...');
    });
  });

  describe('I18nProvider and useI18n', () => {
    it('provides default Spanish language', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Iniciar Sesión');
    });

    it('allows language switching', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );
      
      // Estado inicial en español
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Iniciar Sesión');
      
      // Cambiar a inglés
      await user.click(screen.getByText('Switch to English'));
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Login');
      
      // Cambiar de vuelta a español
      await user.click(screen.getByText('Switch to Spanish'));
      expect(screen.getByTestId('current-language')).toHaveTextContent('es');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Iniciar Sesión');
    });

    it('can be initialized with custom language', () => {
      render(
        <I18nProvider initialLanguage="en">
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Login');
    });
  });

  describe('useTranslation hook', () => {
    it('provides translation function', () => {
      render(
        <I18nProvider>
          <TranslationTestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('auth-login')).toHaveTextContent('Iniciar Sesión');
      expect(screen.getByTestId('forms-email')).toHaveTextContent('Correo Electrónico');
      expect(screen.getByTestId('common-save')).toHaveTextContent('Guardar');
    });

    it('updates when language changes', async () => {
      const user = userEvent.setup();
      
      const CombinedTestComponent = () => {
        const { setLanguage } = useI18n();
        const t = useTranslation();
        
        return (
          <div>
            <div data-testid="login-text">{t('auth.login')}</div>
            <button onClick={() => setLanguage('en')}>English</button>
            <button onClick={() => setLanguage('es')}>Spanish</button>
          </div>
        );
      };
      
      render(
        <I18nProvider>
          <CombinedTestComponent />
        </I18nProvider>
      );
      
      // Estado inicial en español
      expect(screen.getByTestId('login-text')).toHaveTextContent('Iniciar Sesión');
      
      // Cambiar a inglés
      await user.click(screen.getByText('English'));
      expect(screen.getByTestId('login-text')).toHaveTextContent('Login');
    });
  });

  describe('LanguageSelector component', () => {
    it('renders language selector with current language', () => {
      render(
        <I18nProvider>
          <LanguageSelector />
        </I18nProvider>
      );
      
      // Verificar que el selector está presente
      const selector = screen.getByRole('button');
      expect(selector).toBeInTheDocument();
    });

    it('allows language selection', async () => {
      const user = userEvent.setup();
      
      const TestWithSelector = () => {
        const { language } = useI18n();
        return (
          <div>
            <div data-testid="current-lang">{language}</div>
            <LanguageSelector />
          </div>
        );
      };
      
      render(
        <I18nProvider>
          <TestWithSelector />
        </I18nProvider>
      );
      
      // Estado inicial
      expect(screen.getByTestId('current-lang')).toHaveTextContent('es');
      
      // Abrir selector y cambiar idioma
      const selector = screen.getByRole('button');
      await user.click(selector);
      
      // Buscar opción de inglés y hacer clic
      const englishOption = screen.getByText('English');
      await user.click(englishOption);
      
      // Verificar cambio
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    });
  });

  describe('Error handling', () => {
    it('throws error when useI18n is used outside provider', () => {
      // Suprimir error de consola para esta prueba
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useI18n must be used within an I18nProvider');
      
      consoleSpy.mockRestore();
    });

    it('throws error when useTranslation is used outside provider', () => {
      // Suprimir error de consola para esta prueba
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TranslationTestComponent />);
      }).toThrow('useTranslation must be used within an I18nProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('saves language preference to localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );
      
      await user.click(screen.getByText('Switch to English'));
      
      expect(localStorage.getItem('language')).toBe('en');
    });

    it('loads language preference from localStorage', () => {
      localStorage.setItem('language', 'en');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );
      
      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('translated-text')).toHaveTextContent('Login');
    });
  });
});