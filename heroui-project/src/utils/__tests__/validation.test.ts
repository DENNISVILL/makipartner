import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  validateForm,
  validateEmail,
  validatePassword,
  validateRequired
} from '../validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@company.org',
        'contact+info@website.net'
      ];

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });
  });

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyStr0ng@Pass',
        'C0mplex#Password',
        'Secure123$'
      ];

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('rejects weak passwords', () => {
      const invalidPasswords = [
        'short',
        'password',
        'PASSWORD',
        '12345678',
        'Password',
        'password123',
        'PASSWORD123'
      ];

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow();
      });
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'Password123!',
        database: 'makipartner'
      };

      expect(() => loginSchema.parse(validLogin)).not.toThrow();
    });

    it('rejects invalid login data', () => {
      const invalidLogins = [
        {
          email: 'invalid-email',
          password: 'Password123!',
          database: 'makipartner'
        },
        {
          email: 'user@example.com',
          password: 'weak',
          database: 'makipartner'
        },
        {
          email: 'user@example.com',
          password: 'Password123!',
          database: ''
        }
      ];

      invalidLogins.forEach(login => {
        expect(() => loginSchema.parse(login)).toThrow();
      });
    });
  });

  describe('signupSchema', () => {
    it('validates correct signup data', () => {
      const validSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        database: 'makipartner'
      };

      expect(() => signupSchema.parse(validSignup)).not.toThrow();
    });

    it('rejects mismatched passwords', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        database: 'makipartner'
      };

      expect(() => signupSchema.parse(invalidSignup)).toThrow();
    });

    it('rejects empty name', () => {
      const invalidSignup = {
        name: '',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        database: 'makipartner'
      };

      expect(() => signupSchema.parse(invalidSignup)).toThrow();
    });
  });
});

describe('Validation Functions', () => {
  describe('validateForm', () => {
    it('returns true for valid data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123!',
        database: 'makipartner'
      };

      const result = validateForm(loginSchema, validData);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns false and errors for invalid data', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        database: ''
      };

      const result = validateForm(loginSchema, invalidData);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('password');
      expect(result.errors).toHaveProperty('database');
    });
  });

  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      expect(validatePassword('Password123!')).toBe(true);
      expect(validatePassword('MyStr0ng@Pass')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('PASSWORD')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty strings', () => {
      expect(validateRequired('some text')).toBe(true);
      expect(validateRequired('a')).toBe(true);
    });

    it('rejects empty or whitespace strings', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired('\t\n')).toBe(false);
    });

    it('handles non-string values', () => {
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired(0)).toBe(false);
      expect(validateRequired(false)).toBe(false);
      expect(validateRequired([])).toBe(false);
      expect(validateRequired({})).toBe(false);
    });
  });
});

describe('Error Messages', () => {
  it('provides Spanish error messages', () => {
    try {
      emailSchema.parse('invalid-email');
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors[0].message).toContain('correo electrónico válido');
      }
    }
  });

  it('provides password strength error messages', () => {
    try {
      passwordSchema.parse('weak');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0].message;
        expect(message).toContain('8 caracteres');
      }
    }
  });

  it('provides required field error messages', () => {
    try {
      loginSchema.parse({ email: '', password: '', database: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => e.message);
        expect(messages.some(msg => msg.includes('requerido'))).toBe(true);
      }
    }
  });
});