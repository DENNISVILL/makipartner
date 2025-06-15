# MakiPartner Frontend - HeroUI Project

## 🚀 Descripción

Frontend moderno para MakiPartner construido con React, TypeScript, HeroUI y Vite. Este proyecto implementa una interfaz de usuario completa para el sistema ERP con características avanzadas de validación, internacionalización, testing y optimización de rendimiento.

## ✨ Características Principales

### 🔐 Autenticación y Seguridad
- Sistema de autenticación completo con Odoo backend
- Validación robusta de formularios con Zod
- Manejo seguro de tokens y sesiones
- Protección de rutas privadas

### 🌍 Internacionalización (i18n)
- Soporte completo para español e inglés
- Cambio dinámico de idioma
- Persistencia de preferencias de idioma
- Traducciones organizadas por contexto

### 🎨 Interfaz de Usuario
- Diseño moderno con HeroUI components
- Tema responsive y accesible
- Estados de carga y error consistentes
- Componentes reutilizables y modulares

### ⚡ Rendimiento y Optimización
- Lazy loading de componentes
- Code splitting automático
- Optimización de bundle con Vite
- Memoización inteligente de componentes
- Debouncing y throttling de eventos

### 🧪 Testing
- Suite completa de tests con Jest y Testing Library
- Tests unitarios y de integración
- Mocks y utilities para testing
- Cobertura de código configurada

### 📝 Calidad de Código
- ESLint configurado con reglas estrictas
- Prettier para formateo automático
- TypeScript para type safety
- Hooks personalizados para lógica reutilizable

## 🛠️ Tecnologías

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **HeroUI** - Biblioteca de componentes
- **React Router** - Enrutamiento
- **Zod** - Validación de esquemas
- **Jest** - Framework de testing
- **Testing Library** - Utilities de testing
- **ESLint** - Linting
- **Prettier** - Formateo de código

## 📦 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd heroui-project

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor de desarrollo
npm run dev
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run build:analyze    # Build con análisis de bundle
npm run preview          # Preview del build

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con cobertura
npm run test:ci          # Tests para CI/CD

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato
npm run type-check       # Verificar tipos TypeScript
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── LoadingStates.tsx   # Estados de carga
│   ├── Navbar.tsx          # Barra de navegación
│   └── __tests__/          # Tests de componentes
├── hooks/               # Custom hooks
│   └── useAuth.ts          # Hook de autenticación
├── pages/               # Páginas de la aplicación
│   ├── login.tsx           # Página de login
│   ├── dashboard.tsx       # Dashboard principal
│   └── ...
├── services/            # Servicios y APIs
│   ├── odooService.ts      # Servicio de Odoo
│   └── errorHandler.ts     # Manejo de errores
├── utils/               # Utilidades
│   ├── validation.ts       # Esquemas de validación
│   ├── i18n.ts            # Sistema de internacionalización
│   ├── performance.ts      # Optimizaciones de rendimiento
│   ├── testUtils.tsx      # Utilidades de testing
│   └── __tests__/         # Tests de utilidades
├── types/               # Definiciones de tipos
└── config/              # Configuraciones
```

## 🔧 Configuración

### Variables de Entorno

```env
VITE_API_URL=http://localhost:8069
VITE_APP_NAME=MakiPartner
VITE_DEFAULT_LANGUAGE=es
```

### Configuración de Testing

El proyecto incluye configuración completa para testing:

- **Jest** configurado con soporte para TypeScript
- **Testing Library** para tests de componentes React
- **Mocks** para servicios externos
- **Coverage** configurado con umbrales mínimos

### Configuración de ESLint

Reglas configuradas para:
- React y React Hooks
- TypeScript
- Mejores prácticas de JavaScript
- Consistencia de código

## 🌍 Internacionalización

El sistema de i18n soporta:

```typescript
// Uso básico
const { t } = useI18n();
const title = t('auth.login'); // "Iniciar Sesión" o "Login"

// Cambio de idioma
const { setLanguage } = useI18n();
setLanguage('en'); // Cambiar a inglés
```

### Agregar Nuevas Traducciones

1. Editar `src/utils/i18n.ts`
2. Agregar las claves en ambos idiomas (es/en)
3. Usar las claves en los componentes

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests básicos
npm run test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Escribir Tests

```typescript
import { renderWithProviders } from '../utils/testUtils';
import { MyComponent } from './MyComponent';

test('renders correctly', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## 📈 Optimización de Rendimiento

El proyecto incluye varias optimizaciones:

- **Lazy Loading**: Componentes cargados bajo demanda
- **Code Splitting**: División automática del código
- **Memoización**: Componentes y valores memoizados
- **Debouncing**: Para inputs y búsquedas
- **Image Optimization**: Componente LazyImage

## 🔍 Validación de Formularios

Sistema robusto con Zod:

```typescript
import { useFormValidation, loginSchema } from '../utils/validation';

const { errors, validateField, validateForm } = useFormValidation(loginSchema);

// Validar campo individual
validateField('email', 'user@example.com');

// Validar formulario completo
const isValid = validateForm(formData);
```

## 🚀 Deployment

### Build de Producción

```bash
npm run build
```

### Docker

```bash
docker build -t makipartner-frontend .
docker run -p 3000:3000 makipartner-frontend
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Estándares de Código

- Seguir las reglas de ESLint
- Escribir tests para nuevas funcionalidades
- Documentar componentes complejos
- Usar TypeScript correctamente
- Seguir patrones de naming consistentes

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte y preguntas:

- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación de HeroUI

## 📚 Recursos Adicionales

- [Documentación de HeroUI](https://heroui.com)
- [Guía de React](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Testing Library](https://testing-library.com/docs)
- [Vite Guide](https://vitejs.dev/guide)

---

**Desarrollado con ❤️ para MakiPartner**
