'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Car, User, Gauge, Trash2, Edit } from 'lucide-react';
import { PageHeader, EmptyState, LoadingSpinner, DeleteConfirmModal } from '@/components/ui';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  customerId: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  vin: string | null;
  licensePlate: string | null;
  mileage: number | null;
  engineType: string | null;
  transmission: string | null;
  notes: string | null;
  customer: { firstName: string; lastName: string };
  _count: { estimates: number };
}

export default function VehiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
    } catch {
      toast.error('Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/vehicles/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success('Vehículo eliminado');
      setDeleteTarget(null);
      fetchVehicles();
    } catch {
      toast.error('Error al eliminar');
    }
  }

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.year.toString().includes(q) ||
      (v.vin && v.vin.toLowerCase().includes(q)) ||
      (v.licensePlate && v.licensePlate.toLowerCase().includes(q)) ||
      v.customer.firstName.toLowerCase().includes(q) ||
      v.customer.lastName.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Vehículos"
        description={`${vehicles.length} vehículos registrados`}
        action={
          <button
            onClick={() => {
              setEditingVehicle(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nuevo Vehículo
          </button>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo, placa, VIN o dueño..."
          className="input-field pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No hay vehículos"
          description={search ? 'No se encontraron resultados' : 'Agrega tu primer vehículo'}
          action={
            !search && (
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" />
                Nuevo Vehículo
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vehicle) => (
            <div key={vehicle.id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <Link
                        href={`/vehiculos/${vehicle.id}`}
                        className="text-sm font-bold text-gray-900 hover:text-brand-600"
                      >
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Link>
                      {vehicle.trim && (
                        <span className="text-xs text-gray-400 ml-1">
                          {vehicle.trim}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setShowForm(true);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(vehicle)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <Link
                      href={`/clientes/${vehicle.customerId}`}
                      className="hover:text-brand-600"
                    >
                      {vehicle.customer.firstName} {vehicle.customer.lastName}
                    </Link>
                  </div>
                  {vehicle.licensePlate && (
                    <p>Placa: <span className="font-medium text-gray-700">{vehicle.licensePlate}</span></p>
                  )}
                  {vehicle.color && <p>Color: {vehicle.color}</p>}
                  {vehicle.mileage && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-3.5 w-3.5" />
                      {vehicle.mileage.toLocaleString()} mi
                    </div>
                  )}
                  {vehicle.engineType && <p>Motor: {vehicle.engineType}</p>}
                </div>

                {vehicle.vin && (
                  <p className="mt-2 text-xs text-gray-400 font-mono">
                    VIN: {vehicle.vin}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <VehicleFormModal
          vehicle={editingVehicle}
          onClose={() => {
            setShowForm(false);
            setEditingVehicle(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingVehicle(null);
            fetchVehicles();
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        message={`¿Eliminar ${deleteTarget?.year} ${deleteTarget?.make} ${deleteTarget?.model}?`}
      />
    </div>
  );
}

function VehicleFormModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    customerId: vehicle?.customerId || '',
    year: vehicle?.year?.toString() || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    trim: vehicle?.trim || '',
    color: vehicle?.color || '',
    vin: vehicle?.vin || '',
    licensePlate: vehicle?.licensePlate || '',
    mileage: vehicle?.mileage?.toString() || '',
    engineType: vehicle?.engineType || '',
    transmission: vehicle?.transmission || '',
    notes: vehicle?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/customers')
      .then((r) => r.json())
      .then(setCustomers)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.year || !form.make || !form.model) {
      toast.error('Cliente, año, marca y modelo son requeridos');
      return;
    }

    setSaving(true);
    try {
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles';
      const method = vehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();
      toast.success(vehicle ? 'Vehículo actualizado' : 'Vehículo creado');
      onSaved();
    } catch {
      toast.error('Error al guardar vehículo');
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
            {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label-field">Cliente *</label>
            <select
              className="input-field"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {c.phone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Año *</label>
              <input
                className="input-field"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2024"
                required
              />
            </div>
            <div>
              <label className="label-field">Marca *</label>
              <input
                className="input-field"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <label className="label-field">Modelo *</label>
              <input
                className="input-field"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Corolla"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-field">Trim</label>
              <input
                className="input-field"
                value={form.trim}
                onChange={(e) => setForm({ ...form, trim: e.target.value })}
                placeholder="LE, SE, XLE..."
              />
            </div>
            <div>
              <label className="label-field">Color</label>
              <input
                className="input-field"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="Blanco"
              />
            </div>
            <div>
              <label className="label-field">Millaje</label>
              <input
                className="input-field"
                type="number"
                value={form.mileage}
                onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                placeholder="45000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">VIN</label>
              <input
                className="input-field font-mono text-xs"
                value={form.vin}
                onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                placeholder="1HGBH41JXMN109186"
                maxLength={17}
              />
            </div>
            <div>
              <label className="label-field">Placa</label>
              <input
                className="input-field"
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                placeholder="ABC-123"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Motor</label>
              <input
                className="input-field"
                value={form.engineType}
                onChange={(e) => setForm({ ...form, engineType: e.target.value })}
                placeholder="1.8L 4-Cyl"
              />
            </div>
            <div>
              <label className="label-field">Transmisión</label>
              <select
                className="input-field"
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              >
                <option value="">Seleccionar...</option>
                <option value="Automática">Automática</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT (Doble Embrague)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Notas</label>
            <textarea
              className="input-field"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas del vehículo..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : vehicle ? 'Actualizar' : 'Crear Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
