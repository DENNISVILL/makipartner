import { z } from 'zod';

// Esquemas básicos
export const partnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  country_id: z.tuple([z.number(), z.string()]).nullable().optional(),
});

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  login: z.string(),
  partner_id: z.tuple([z.number(), z.string()]),
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const datetimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

// Esquemas para modelos específicos
export const saleOrderSchema = z.object({
  id: z.number(),
  name: z.string(),
  partner_id: z.tuple([z.number(), z.string()]),
  amount_total: z.number(),
  state: z.string(),
  date_order: datetimeSchema,
});

export const invoiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  partner_id: z.tuple([z.number(), z.string()]),
  amount_total: z.number(),
  state: z.string(),
  invoice_date: dateSchema.nullable().optional(),
  payment_state: z.string().nullable().optional(),
});

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  default_code: z.string().nullable().optional(),
  list_price: z.number(),
  qty_available: z.number().nullable().optional(),
  categ_id: z.tuple([z.number(), z.string()]).nullable().optional(),
});

export const employeeSchema = z.object({
  id: z.number(),
  name: z.string(),
  job_title: z.string().nullable().optional(),
  department_id: z.tuple([z.number(), z.string()]).nullable().optional(),
  work_email: z.string().email().nullable().optional(),
  work_phone: z.string().nullable().optional(),
});

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.tuple([z.number(), z.string()]).nullable().optional(),
  partner_id: z.tuple([z.number(), z.string()]).nullable().optional(),
  task_count: z.number().nullable().optional(),
  date_start: dateSchema.nullable().optional(),
});

// Esquemas para respuestas de API
export const loginResponseSchema = z.object({
  uid: z.number(),
  name: z.string(),
  username: z.string(),
  partner_id: z.number(),
  company_id: z.number(),
  session_id: z.string(),
});

// Función para validar datos
export function validateData<T>(data: unknown, schema: z.ZodType<T>): T {
  return schema.parse(data);
}

// Función para validar arrays de datos
export function validateArray<T>(data: unknown, schema: z.ZodType<T>): T[] {
  return z.array(schema).parse(data);
}