'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Printer,
  Wrench,
  Edit,
  FileText,
  User,
  Car,
  Phone,
  Clock,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/ui';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  itemTypeConfig,
} from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstimate();
  }, [params.id]);

  async function fetchEstimate() {
    try {
      const res = await fetch(`/api/estimates/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEstimate(data);
    } catch {
      toast.error('Estimado no encontrado');
      router.push('/estimados');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/estimates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      const statusLabels: Record<string, string> = {
        SENT: 'enviado al cliente',
        APPROVED: 'aprobado',
        REJECTED: 'rechazado',
        IN_PROGRESS: 'en progreso',
        COMPLETED: 'completado',
        CANCELLED: 'cancelado',
      };

      toast.success(`Estimado ${statusLabels[newStatus] || newStatus}`);
      fetchEstimate();
    } catch {
      toast.error('Error al actualizar estado');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!estimate) return null;

  const partsItems = estimate.items.filter((i: any) => i.type === 'PART');
  const laborItems = estimate.items.filter((i: any) => i.type === 'LABOR');
  const otherItems = estimate.items.filter(
    (i: any) => !['PART', 'LABOR'].includes(i.type)
  );
  const totalParts = partsItems.reduce((s: number, i: any) => s + i.amount, 0);
  const totalLabor = laborItems.reduce((s: number, i: any) => s + i.amount, 0);

  return (
    <div>
      <Link
        href="/estimados"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Estimados
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {estimate.estimateNumber}
            </h1>
            <StatusBadge status={estimate.status} />
          </div>
          <p className="text-sm text-gray-500">
            Creado {formatDateTime(estimate.createdAt)}
            {estimate.approvedDate &&
              ` • Aprobado ${formatDate(estimate.approvedDate)}`}
          </p>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {estimate.status === 'DRAFT' && (
            <>
              <Link
                href={`/estimados/${estimate.id}/editar`}
                className="btn-secondary"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
              <button
                onClick={() => updateStatus('SENT')}
                className="btn-primary"
              >
                <Send className="h-4 w-4" />
                Enviar al Cliente
              </button>
            </>
          )}

          {estimate.status === 'SENT' && (
            <>
              <button
                onClick={() => updateStatus('APPROVED')}
                className="btn-success"
              >
                <CheckCircle className="h-4 w-4" />
                Aprobar
              </button>
              <button
                onClick={() => updateStatus('REJECTED')}
                className="btn-danger"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </>
          )}

          {estimate.status === 'APPROVED' && estimate.workOrder && (
            <Link
              href={`/ordenes/${estimate.workOrder.id}`}
              className="btn-primary"
            >
              <Wrench className="h-4 w-4" />
              Ver Orden de Trabajo
            </Link>
          )}

          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {(estimate.description || estimate.diagnosticNotes) && (
            <div className="card">
              <div className="card-body">
                {estimate.description && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-900">
                      {estimate.description}
                    </p>
                  </div>
                )}
                {estimate.diagnosticNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Diagnóstico
                    </p>
                    <p className="text-sm text-gray-700">
                      {estimate.diagnosticNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parts Section */}
          {partsItems.length > 0 && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Partes y Materiales
                </h2>
                <span className="text-sm font-semibold text-gray-600">
                  {formatCurrency(totalParts)}
                </span>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-2">Descripción</th>
                    <th className="px-4 py-2"># Parte</th>
                    <th className="px-4 py-2">Marca</th>
                    <th className="px-4 py-2 text-right">Cant</th>
                    <th className="px-4 py-2 text-right">Precio</th>
                    <th className="px-6 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {partsItems.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {item.partNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.brand || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Labor Section */}
          {laborItems.length > 0 && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Mano de Obra
                </h2>
                <span className="text-sm font-semibold text-gray-600">
                  {formatCurrency(totalLabor)}
                </span>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-2">Descripción</th>
                    <th className="px-4 py-2 text-right">Horas</th>
                    <th className="px-4 py-2 text-right">Tarifa</th>
                    <th className="px-6 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {laborItems.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {item.hours ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {item.laborRate
                          ? `${formatCurrency(item.laborRate)}/hr`
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Other Items */}
          {otherItems.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold text-gray-900">
                  Otros Cargos
                </h2>
              </div>
              <table className="min-w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-2">Tipo</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-6 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {otherItems.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-3">
                        <span
                          className={`text-xs font-medium ${itemTypeConfig[item.type]?.color || ''}`}
                        >
                          {itemTypeConfig[item.type]?.label || item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals Card */}
          <div className="card">
            <div className="card-body">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(estimate.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      Impuesto ({estimate.taxRate}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(estimate.taxAmount)}
                    </span>
                  </div>
                  {estimate.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Descuento</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(estimate.discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(estimate.customerNotes || estimate.internalNotes) && (
            <div className="card">
              <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                {estimate.customerNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Notas para el Cliente
                    </p>
                    <p className="text-sm text-gray-700">
                      {estimate.customerNotes}
                    </p>
                  </div>
                )}
                {estimate.internalNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Notas Internas
                    </p>
                    <p className="text-sm text-gray-700">
                      {estimate.internalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
            </div>
            <div className="card-body space-y-2">
              <Link
                href={`/clientes/${estimate.customer.id}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                {estimate.customer.firstName} {estimate.customer.lastName}
              </Link>
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5" />
                {estimate.customer.phone}
              </p>
              {estimate.customer.email && (
                <p className="text-sm text-gray-500">{estimate.customer.email}</p>
              )}
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículo
              </h3>
            </div>
            <div className="card-body space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {estimate.vehicle.year} {estimate.vehicle.make}{' '}
                {estimate.vehicle.model}
              </p>
              {estimate.vehicle.trim && (
                <p className="text-sm text-gray-500">
                  Trim: {estimate.vehicle.trim}
                </p>
              )}
              {estimate.vehicle.color && (
                <p className="text-sm text-gray-500">
                  Color: {estimate.vehicle.color}
                </p>
              )}
              {estimate.vehicle.vin && (
                <p className="text-xs text-gray-400 font-mono">
                  VIN: {estimate.vehicle.vin}
                </p>
              )}
              {estimate.vehicle.mileage && (
                <p className="text-sm text-gray-500">
                  Millaje: {estimate.vehicle.mileage.toLocaleString()} mi
                </p>
              )}
            </div>
          </div>

          {/* Work Order Link */}
          {estimate.workOrder && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Orden de Trabajo
                </h3>
              </div>
              <div className="card-body">
                <Link
                  href={`/ordenes/${estimate.workOrder.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                >
                  <span className="text-sm font-medium text-brand-600">
                    {estimate.workOrder.workOrderNumber}
                  </span>
                  <StatusBadge
                    status={estimate.workOrder.status}
                    type="workOrder"
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="card bg-gray-50">
            <div className="card-body space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Resumen</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Partes</span>
                <span className="font-medium">{formatCurrency(totalParts)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mano de Obra</span>
                <span className="font-medium">{formatCurrency(totalLabor)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Impuesto</span>
                <span className="font-medium">
                  {formatCurrency(estimate.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(estimate.total)}</span>
              </div>
            </div>
          </div>

          {/* Profit Margin (internal) */}
          <div className="card border-orange-200 bg-orange-50">
            <div className="card-body">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                Margen (Interno)
              </h3>
              {(() => {
                const totalCost = estimate.items.reduce(
                  (s: number, i: any) => s + (i.cost || 0) * (i.quantity || 1),
                  0
                );
                const margin = estimate.subtotal - totalCost;
                const marginPct =
                  estimate.subtotal > 0
                    ? ((margin / estimate.subtotal) * 100).toFixed(1)
                    : '0';
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Costo Total</span>
                      <span className="font-medium">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-700">Margen</span>
                      <span className="font-bold text-green-700">
                        {formatCurrency(margin)} ({marginPct}%)
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
