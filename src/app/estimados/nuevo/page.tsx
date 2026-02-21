'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { formatCurrency, itemTypeConfig } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LineItem {
  type: string;
  description: string;
  partNumber: string;
  brand: string;
  supplier: string;
  quantity: string;
  unitPrice: string;
  cost: string;
  taxable: boolean;
  hours: string;
  laborRate: string;
  notes: string;
}

const emptyItem: LineItem = {
  type: 'PART',
  description: '',
  partNumber: '',
  brand: '',
  supplier: '',
  quantity: '1',
  unitPrice: '0',
  cost: '0',
  taxable: true,
  hours: '',
  laborRate: '',
  notes: '',
};

export default function NuevoEstimadoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" /></div>}>
      <NuevoEstimadoContent />
    </Suspense>
  );
}

function NuevoEstimadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    vehicleId: searchParams.get('vehicleId') || '',
    description: '',
    diagnosticNotes: '',
    taxRate: '11.5',
    discount: '0',
    customerNotes: '',
    internalNotes: '',
  });

  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);

  useEffect(() => {
    Promise.all([
      fetch('/api/customers').then((r) => r.json()),
      fetch('/api/vehicles').then((r) => r.json()),
    ]).then(([custs, vehs]) => {
      setCustomers(custs);
      setAllVehicles(vehs);
      if (form.customerId) {
        setVehicles(vehs.filter((v: any) => v.customerId === form.customerId));
      }
    });
  }, []);

  useEffect(() => {
    if (form.customerId) {
      const filtered = allVehicles.filter(
        (v) => v.customerId === form.customerId
      );
      setVehicles(filtered);
      if (filtered.length === 1) {
        setForm((prev) => ({ ...prev, vehicleId: filtered[0].id }));
      } else if (!filtered.find((v) => v.id === form.vehicleId)) {
        setForm((prev) => ({ ...prev, vehicleId: '' }));
      }
    } else {
      setVehicles([]);
    }
  }, [form.customerId, allVehicles]);

  function addItem() {
    setItems([...items, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: any) {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // Auto-calculate amount for labor items
    if (field === 'hours' || field === 'laborRate') {
      const hours = parseFloat(updated[index].hours) || 0;
      const rate = parseFloat(updated[index].laborRate) || 0;
      if (hours && rate) {
        updated[index].unitPrice = (hours * rate).toString();
      }
    }

    setItems(updated);
  }

  function calculateTotals() {
    const taxRate = parseFloat(form.taxRate) || 0;
    const discount = parseFloat(form.discount) || 0;

    let subtotal = 0;
    let taxableAmount = 0;

    items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const amount = qty * price;
      subtotal += amount;
      if (item.taxable) taxableAmount += amount;
    });

    const tax = (taxableAmount * taxRate) / 100;
    const total = subtotal + tax - discount;

    return { subtotal, tax, discount, total };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.customerId || !form.vehicleId) {
      toast.error('Selecciona un cliente y vehículo');
      return;
    }

    if (items.length === 0 || !items.some((i) => i.description)) {
      toast.error('Agrega al menos una línea al estimado');
      return;
    }

    setSaving(true);
    try {
      // Create estimate
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId,
          vehicleId: form.vehicleId,
          description: form.description,
          diagnosticNotes: form.diagnosticNotes,
          taxRate: parseFloat(form.taxRate),
          customerNotes: form.customerNotes,
          internalNotes: form.internalNotes,
        }),
      });

      if (!res.ok) throw new Error();
      const estimate = await res.json();

      // Update with items and totals
      const validItems = items.filter((i) => i.description.trim());
      const updateRes = await fetch(`/api/estimates/${estimate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          status: 'DRAFT',
          items: validItems,
          taxRate: parseFloat(form.taxRate),
          discount: parseFloat(form.discount),
        }),
      });

      if (!updateRes.ok) throw new Error();

      toast.success('Estimado creado exitosamente');
      router.push(`/estimados/${estimate.id}`);
    } catch {
      toast.error('Error al crear estimado');
    } finally {
      setSaving(false);
    }
  }

  const totals = calculateTotals();

  return (
    <div>
      <Link
        href="/estimados"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Estimados
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nuevo Estimado
      </h1>

      <form onSubmit={handleSubmit}>
        {/* Customer & Vehicle Selection */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">
              Cliente y Vehículo
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Cliente *</label>
                <select
                  className="input-field"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({ ...form, customerId: e.target.value })
                  }
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
              <div>
                <label className="label-field">Vehículo *</label>
                <select
                  className="input-field"
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm({ ...form, vehicleId: e.target.value })
                  }
                  required
                  disabled={!form.customerId}
                >
                  <option value="">
                    {form.customerId
                      ? 'Seleccionar vehículo...'
                      : 'Primero selecciona un cliente'}
                  </option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model}{' '}
                      {v.licensePlate ? `(${v.licensePlate})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="label-field">Descripción del Trabajo</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Ej: Servicio de frenos delanteros completo..."
              />
            </div>

            <div className="mt-4">
              <label className="label-field">Notas de Diagnóstico</label>
              <textarea
                className="input-field"
                rows={2}
                value={form.diagnosticNotes}
                onChange={(e) =>
                  setForm({ ...form, diagnosticNotes: e.target.value })
                }
                placeholder="Hallazgos del diagnóstico..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card mb-6">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Líneas del Estimado
            </h2>
            <button type="button" onClick={addItem} className="btn-secondary text-sm">
              <Plus className="h-4 w-4" />
              Agregar Línea
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-2 w-24">Tipo</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2 w-24"># Parte</th>
                  <th className="px-4 py-2 w-24">Marca</th>
                  <th className="px-4 py-2 w-20">Cant</th>
                  <th className="px-4 py-2 w-28">Precio</th>
                  <th className="px-4 py-2 w-24">Costo</th>
                  <th className="px-4 py-2 w-28">Monto</th>
                  <th className="px-4 py-2 w-16">Tax</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const amount =
                    (parseFloat(item.quantity) || 0) *
                    (parseFloat(item.unitPrice) || 0);

                  return (
                    <tr key={index} className="group">
                      <td className="px-4 py-2">
                        <select
                          className="input-field text-xs py-1.5"
                          value={item.type}
                          onChange={(e) =>
                            updateItem(index, 'type', e.target.value)
                          }
                        >
                          {Object.entries(itemTypeConfig).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input-field text-xs py-1.5"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, 'description', e.target.value)
                          }
                          placeholder="Descripción..."
                        />
                        {item.type === 'LABOR' && (
                          <div className="flex gap-2 mt-1">
                            <input
                              className="input-field text-xs py-1 w-20"
                              type="number"
                              step="0.5"
                              value={item.hours}
                              onChange={(e) =>
                                updateItem(index, 'hours', e.target.value)
                              }
                              placeholder="Horas"
                            />
                            <input
                              className="input-field text-xs py-1 w-24"
                              type="number"
                              step="0.01"
                              value={item.laborRate}
                              onChange={(e) =>
                                updateItem(index, 'laborRate', e.target.value)
                              }
                              placeholder="$/hora"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.type === 'PART' && (
                          <input
                            className="input-field text-xs py-1.5"
                            value={item.partNumber}
                            onChange={(e) =>
                              updateItem(index, 'partNumber', e.target.value)
                            }
                            placeholder="#"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {item.type === 'PART' && (
                          <input
                            className="input-field text-xs py-1.5"
                            value={item.brand}
                            onChange={(e) =>
                              updateItem(index, 'brand', e.target.value)
                            }
                            placeholder="Marca"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input-field text-xs py-1.5 text-right"
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, 'quantity', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input-field text-xs py-1.5 text-right"
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, 'unitPrice', e.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input-field text-xs py-1.5 text-right"
                          type="number"
                          step="0.01"
                          value={item.cost}
                          onChange={(e) =>
                            updateItem(index, 'cost', e.target.value)
                          }
                          placeholder="Costo"
                        />
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.taxable}
                          onChange={(e) =>
                            updateItem(index, 'taxable', e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Impuesto</span>
                    <input
                      className="input-field text-xs py-0.5 w-16 text-right"
                      type="number"
                      step="0.1"
                      value={form.taxRate}
                      onChange={(e) =>
                        setForm({ ...form, taxRate: e.target.value })
                      }
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(totals.tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Descuento</span>
                    <span className="text-gray-400">$</span>
                    <input
                      className="input-field text-xs py-0.5 w-20 text-right"
                      type="number"
                      step="0.01"
                      value={form.discount}
                      onChange={(e) =>
                        setForm({ ...form, discount: e.target.value })
                      }
                    />
                  </div>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(totals.discount)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">Notas</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Notas para el Cliente</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.customerNotes}
                onChange={(e) =>
                  setForm({ ...form, customerNotes: e.target.value })
                }
                placeholder="Notas visibles para el cliente..."
              />
            </div>
            <div>
              <label className="label-field">Notas Internas</label>
              <textarea
                className="input-field"
                rows={3}
                value={form.internalNotes}
                onChange={(e) =>
                  setForm({ ...form, internalNotes: e.target.value })
                }
                placeholder="Notas internas del taller..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/estimados" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Crear Estimado'}
          </button>
        </div>
      </form>
    </div>
  );
}
