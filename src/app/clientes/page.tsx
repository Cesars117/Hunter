'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, Car, FileText, Edit, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, DeleteConfirmModal } from '@/components/ui';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  phone2: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  _count: { vehicles: number; estimates: number };
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/customers/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Cliente eliminado');
      setDeleteTarget(null);
      fetchCustomers();
    } catch {
      toast.error('Error al eliminar');
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes registrados`}
        action={
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        }
      />

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          className="input-field pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          description={search ? 'No se encontraron resultados' : 'Agrega tu primer cliente'}
          action={
            !search && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </button>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3">Ubicación</th>
                <th className="px-6 py-3">Vehículos</th>
                <th className="px-6 py-3">Estimados</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/clientes/${customer.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-brand-600"
                    >
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.city && customer.state
                      ? `${customer.city}, ${customer.state}`
                      : customer.city || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Car className="h-3.5 w-3.5" />
                      {customer._count.vehicles}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <FileText className="h-3.5 w-3.5" />
                      {customer._count.estimates}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setShowForm(true);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(customer)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingCustomer(null);
            fetchCustomers();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar a ${deleteTarget?.firstName} ${deleteTarget?.lastName}? Se eliminarán también sus vehículos y datos asociados.`}
      />
    </div>
  );
}

function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    phone2: customer?.phone2 || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zipCode: customer?.zipCode || '',
    notes: customer?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error('Nombre, apellido y teléfono son requeridos');
      return;
    }

    setSaving(true);
    try {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success(customer ? 'Cliente actualizado' : 'Cliente creado');
      onSaved();
    } catch {
      toast.error('Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombre *</label>
              <input
                className="input-field"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Nombre"
                required
              />
            </div>
            <div>
              <label className="label-field">Apellido *</label>
              <input
                className="input-field"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Apellido"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Teléfono *</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(787) 555-0000"
                required
              />
            </div>
            <div>
              <label className="label-field">Teléfono 2</label>
              <input
                className="input-field"
                value={form.phone2}
                onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                placeholder="(787) 555-0000"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Email</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@ejemplo.com"
            />
          </div>

          <div>
            <label className="label-field">Dirección</label>
            <input
              className="input-field"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Dirección"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Ciudad</label>
              <input
                className="input-field"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ciudad"
              />
            </div>
            <div>
              <label className="label-field">Estado</label>
              <input
                className="input-field"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="PR"
              />
            </div>
            <div>
              <label className="label-field">Código Postal</label>
              <input
                className="input-field"
                value={form.zipCode}
                onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                placeholder="00901"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Notas</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : customer ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
