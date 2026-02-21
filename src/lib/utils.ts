// Utility helpers for Hunter

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-PR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-PR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateEstimateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');
  return `EST-${year}-${random}`;
}

export function generateWorkOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');
  return `WO-${year}-${random}`;
}

// Status labels and colors for estimates
export const estimateStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Borrador', color: 'text-gray-700', bg: 'bg-gray-100' },
  SENT: { label: 'Enviado', color: 'text-blue-700', bg: 'bg-blue-100' },
  APPROVED: { label: 'Aprobado', color: 'text-green-700', bg: 'bg-green-100' },
  REJECTED: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100' },
  IN_PROGRESS: { label: 'En Progreso', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  COMPLETED: { label: 'Completado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CANCELLED: { label: 'Cancelado', color: 'text-gray-500', bg: 'bg-gray-50' },
};

// Status labels and colors for work orders
export const workOrderStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-gray-700', bg: 'bg-gray-100' },
  IN_PROGRESS: { label: 'En Progreso', color: 'text-blue-700', bg: 'bg-blue-100' },
  WAITING_PARTS: { label: 'Esperando Partes', color: 'text-orange-700', bg: 'bg-orange-100' },
  ON_HOLD: { label: 'En Espera', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  COMPLETED: { label: 'Completado', color: 'text-green-700', bg: 'bg-green-100' },
  DELIVERED: { label: 'Entregado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

export const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Baja', color: 'text-gray-600', bg: 'bg-gray-100' },
  NORMAL: { label: 'Normal', color: 'text-blue-600', bg: 'bg-blue-100' },
  HIGH: { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-100' },
  URGENT: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
};

export const itemTypeConfig: Record<string, { label: string; color: string }> = {
  PART: { label: 'Parte', color: 'text-blue-600' },
  LABOR: { label: 'Mano de Obra', color: 'text-green-600' },
  SUBLET: { label: 'Subcontratado', color: 'text-purple-600' },
  FEE: { label: 'Cargo', color: 'text-orange-600' },
  DISCOUNT: { label: 'Descuento', color: 'text-red-600' },
};
