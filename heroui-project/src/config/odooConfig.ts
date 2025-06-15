import { z } from 'zod';

// Esquema de validación para la configuración
const configSchema = z.object({
  apiUrl: z.string().url(),
  publicApiUrl: z.string().url(),
  defaultDatabase: z.string().min(1),
  environment: z.enum(['development', 'production', 'test']).default('development'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  apiTimeout: z.number().positive().default(30000),
});

// Tipo inferido del esquema
type OdooConfig = z.infer<typeof configSchema>;

// Configuración por defecto
const defaultConfig: OdooConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8069',
  publicApiUrl: import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:8069',
  defaultDatabase: import.meta.env.VITE_ODOO_DATABASE || 'postgres',
  environment: (import.meta.env.VITE_ENVIRONMENT || 'development') as 'development' | 'production' | 'test',
  logLevel: (import.meta.env.VITE_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 30000),
};

// Validar la configuración
const config = configSchema.parse(defaultConfig);

export default config;