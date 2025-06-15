import { z } from 'zod';

// Esquemas de validación comunes
export const emailSchema = z.string()
  .email('Ingresa un correo electrónico válido')
  .min(1, 'El correo electrónico es requerido');

export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número');

export const databaseSchema = z.string()
  .min(1, 'El nombre de la base de datos es requerido')
  .regex(/^[a-zA-Z0-9_-]+$/, 'El nombre de la base de datos solo puede contener letras, números, guiones y guiones bajos');

export const nameSchema = z.string()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(50, 'El nombre no puede exceder 50 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios');

export const phoneSchema = z.string()
  .regex(/^[+]?[0-9\s\-()]+$/, 'Ingresa un número de teléfono válido')
  .min(10, 'El número de teléfono debe tener al menos 10 dígitos');

export const taxIdSchema = z.string()
  .regex(/^[0-9]{10}$|^[0-9]{13}$/, 'El RUC/Cédula debe tener 10 o 13 dígitos');

// Esquemas de formularios específicos
export const loginFormSchema = z.object({
  database: databaseSchema,
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional()
});

export const signupFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema.optional(),
  company: z.string().min(1, 'El nombre de la empresa es requerido'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export const profileFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  company: z.string().min(1, 'El nombre de la empresa es requerido'),
  position: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional()
});

export const partnerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  taxId: taxIdSchema.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  isCompany: z.boolean().optional(),
  category: z.string().optional()
});

// Tipos derivados de los esquemas
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PartnerFormData = z.infer<typeof partnerFormSchema>;

// Función de validación genérica
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Error de validación desconocido' } };
  }
}

// Hook personalizado para validación de formularios
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  const validate = useCallback((data: unknown) => {
    const result = validateForm(schema, data);
    setErrors(result.errors || {});
    setIsValid(result.success);
    return result;
  }, [schema]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    isValid,
    validate,
    clearErrors,
    clearFieldError
  };
}

// Validadores específicos para campos individuales
export const fieldValidators = {
  email: (value: string) => {
    try {
      emailSchema.parse(value);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Email inválido';
      }
      return 'Email inválido';
    }
  },
  
  password: (value: string) => {
    try {
      passwordSchema.parse(value);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Contraseña inválida';
      }
      return 'Contraseña inválida';
    }
  },
  
  required: (value: string, fieldName: string = 'Este campo') => {
    if (!value || value.trim().length === 0) {
      return `${fieldName} es requerido`;
    }
    return null;
  }
};