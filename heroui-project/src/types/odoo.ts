// Tipos básicos para Odoo
export type OdooId = number;
export type OdooRelation = [OdooId, string];

// Tipos para fechas
export type OdooDate = string; // formato: YYYY-MM-DD
export type OdooDateTime = string; // formato: YYYY-MM-DD HH:MM:SS

// Tipos para modelos comunes
export interface Partner {
  id: OdooId;
  name: string;
  email?: string | null;
  phone?: string | null;
  country_id?: OdooRelation | null;
}

export interface User {
  id: OdooId;
  name: string;
  login: string;
  partner_id: OdooRelation;
}

export interface SaleOrder {
  id: OdooId;
  name: string;
  partner_id: OdooRelation;
  amount_total: number;
  state: string;
  date_order: OdooDateTime;
}

export interface Invoice {
  id: OdooId;
  name: string;
  partner_id: OdooRelation;
  amount_total: number;
  state: string;
  invoice_date?: OdooDate | null;
  payment_state?: string | null;
}

export interface Product {
  id: OdooId;
  name: string;
  default_code?: string | null;
  list_price: number;
  qty_available?: number | null;
  categ_id?: OdooRelation | null;
}

export interface Employee {
  id: OdooId;
  name: string;
  job_title?: string | null;
  department_id?: OdooRelation | null;
  work_email?: string | null;
  work_phone?: string | null;
}

export interface Project {
  id: OdooId;
  name: string;
  user_id?: OdooRelation | null;
  partner_id?: OdooRelation | null;
  task_count?: number | null;
  date_start?: OdooDate | null;
}

// Tipos para respuestas de API
export interface LoginResponse {
  uid: OdooId;
  name: string;
  username: string;
  partner_id: OdooId;
  company_id: OdooId;
  session_id: string;
}