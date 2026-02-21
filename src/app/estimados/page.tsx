'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, FileText, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, DeleteConfirmModal } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function EstimadosPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    fetchEstimates();
  }, [statusFilter]);

  async function fetchEstimates() {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/estimates?${params}`);
      const data = await res.json();
      setEstimates(data);
    } catch {
      toast.error('Error al cargar estimados');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/estimates/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Estimado eliminado');
      setDeleteTarget(null);
      fetchEstimates();
    } catch {
      toast.error('Error al eliminar');
    }
  }

  const filtered = estimates.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.estimateNumber.toLowerCase().includes(q) ||
      e.customer.firstName.toLowerCase().includes(q) ||
      e.customer.lastName.toLowerCase().includes(q) ||
      `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}`
        .toLowerCase()
        .includes(q) ||
      (e.description && e.description.toLowerCase().includes(q))
    );
  });

  const stats = {
    total: estimates.length,
    draft: estimates.filter((e) => e.status === 'DRAFT').length,
    sent: estimates.filter((e) => e.status === 'SENT').length,
    approved: estimates.filter((e) => e.status === 'APPROVED' || e.status === 'IN_PROGRESS').length,
    completed: estimates.filter((e) => e.status === 'COMPLETED').length,
  };

  return (
    <div>
      <PageHeader
        title="Estimados"
        description={`${estimates.length} estimados en total`}
        action={
          <Link href="/estimados/nuevo" className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Estimado
          </Link>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Todos', value: stats.total, filter: '' },
          { label: 'Borrador', value: stats.draft, filter: 'DRAFT' },
          { label: 'Enviados', value: stats.sent, filter: 'SENT' },
          { label: 'Aprobados', value: stats.approved, filter: 'active' },
          { label: 'Completados', value: stats.completed, filter: 'COMPLETED' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => {
              setStatusFilter(stat.filter);
              setLoading(true);
            }}
            className={`card p-3 text-center transition-all ${
              statusFilter === stat.filter
                ? 'ring-2 ring-brand-500 bg-brand-50'
                : 'hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por número, cliente, vehículo o descripción..."
          className="input-field pl-10 max-w-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay estimados"
          description={search ? 'No se encontraron resultados' : 'Crea tu primer estimado'}
          action={
            !search && (
              <Link href="/estimados/nuevo" className="btn-primary">
                <Plus className="h-4 w-4" />
                Nuevo Estimado
              </Link>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3"># Estimado</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Vehículo</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((estimate) => (
                <tr key={estimate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/estimados/${estimate.id}`}
                      className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                    >
                      {estimate.estimateNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {estimate.customer.firstName} {estimate.customer.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {estimate.vehicle.year} {estimate.vehicle.make}{' '}
                    {estimate.vehicle.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                    {estimate.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(estimate.total)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={estimate.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(estimate.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/estimados/${estimate.id}`}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      {estimate.status === 'DRAFT' && (
                        <button
                          onClick={() => setDeleteTarget(estimate)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Estimado"
        message={`¿Eliminar estimado ${deleteTarget?.estimateNumber}?`}
      />
    </div>
  );
}
