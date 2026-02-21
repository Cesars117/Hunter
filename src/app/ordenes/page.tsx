'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Wrench, Clock, CheckCircle, AlertTriangle, Truck } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrdenesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/work-orders?${params}`);
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error('Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  }

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-5 w-5 text-gray-400" />,
    IN_PROGRESS: <Wrench className="h-5 w-5 text-blue-500" />,
    WAITING_PARTS: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    ON_HOLD: <Clock className="h-5 w-5 text-yellow-500" />,
    COMPLETED: <CheckCircle className="h-5 w-5 text-green-500" />,
    DELIVERED: <Truck className="h-5 w-5 text-emerald-500" />,
  };

  return (
    <div>
      <PageHeader
        title="Órdenes de Trabajo"
        description="Gestiona las órdenes de trabajo activas"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
        {[
          { label: 'Activas', value: 'active' },
          { label: 'Pendientes', value: 'PENDING' },
          { label: 'En Progreso', value: 'IN_PROGRESS' },
          { label: 'Esperando Partes', value: 'WAITING_PARTS' },
          { label: 'Completadas', value: 'COMPLETED' },
          { label: 'Todas', value: '' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.value
                ? 'bg-brand-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No hay órdenes de trabajo"
          description="Las órdenes se crean automáticamente al aprobar un estimado"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/ordenes/${order.id}`}
              className="card hover:shadow-md transition-all group"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {statusIcons[order.status]}
                    <span className="text-sm font-bold text-gray-900">
                      {order.workOrderNumber}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusBadge status={order.priority} type="priority" />
                    <StatusBadge status={order.status} type="workOrder" />
                  </div>
                </div>

                {/* Vehicle & Customer */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    {order.estimate.vehicle.year}{' '}
                    {order.estimate.vehicle.make}{' '}
                    {order.estimate.vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.estimate.customer.firstName}{' '}
                    {order.estimate.customer.lastName}
                    {order.estimate.customer.phone &&
                      ` — ${order.estimate.customer.phone}`}
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-gray-500">
                  {order.assignedTo && (
                    <p>
                      Mecánico:{' '}
                      <span className="font-medium text-gray-700">
                        {order.assignedTo}
                      </span>
                    </p>
                  )}
                  {order.bay && (
                    <p>
                      Ubicación:{' '}
                      <span className="font-medium text-gray-700">
                        {order.bay}
                      </span>
                    </p>
                  )}
                  {order.estimatedCompletion && (
                    <p>
                      Fecha estimada:{' '}
                      <span className="font-medium text-gray-700">
                        {formatDate(order.estimatedCompletion)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Tasks Progress */}
                {order.tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Tareas</span>
                      <span className="font-medium text-gray-700">
                        {order.tasks.filter((t: any) => t.status === 'COMPLETED').length}
                        /{order.tasks.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-brand-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${
                            (order.tasks.filter(
                              (t: any) => t.status === 'COMPLETED'
                            ).length /
                              order.tasks.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Estimate total */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {order.estimate.vehicle.licensePlate || order.estimate.vehicle.color || ''}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(order.estimate.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
