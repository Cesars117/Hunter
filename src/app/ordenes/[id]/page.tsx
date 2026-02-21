'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Car,
  Phone,
  Save,
  Play,
  Pause,
  Package,
  Truck,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/ui';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  workOrderStatusConfig,
} from '@/lib/utils';
import toast from 'react-hot-toast';

interface Task {
  id?: string;
  description: string;
  status: string;
  assignedTo: string;
  timeSpent: string;
  notes: string;
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: '',
    assignedTo: '',
    bay: '',
    priority: 'NORMAL',
    techNotes: '',
    estimatedCompletion: '',
  });

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/work-orders/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data);
      setForm({
        status: data.status,
        assignedTo: data.assignedTo || '',
        bay: data.bay || '',
        priority: data.priority,
        techNotes: data.techNotes || '',
        estimatedCompletion: data.estimatedCompletion
          ? new Date(data.estimatedCompletion).toISOString().split('T')[0]
          : '',
      });
      setTasks(
        data.tasks.map((t: any) => ({
          id: t.id,
          description: t.description,
          status: t.status,
          assignedTo: t.assignedTo || '',
          timeSpent: t.timeSpent?.toString() || '',
          notes: t.notes || '',
        }))
      );
    } catch {
      toast.error('Orden no encontrada');
      router.push('/ordenes');
    } finally {
      setLoading(false);
    }
  }

  function addTask() {
    setTasks([
      ...tasks,
      {
        description: '',
        status: 'PENDING',
        assignedTo: '',
        timeSpent: '',
        notes: '',
      },
    ]);
  }

  function removeTask(index: number) {
    setTasks(tasks.filter((_, i) => i !== index));
  }

  function toggleTaskStatus(index: number) {
    const updated = [...tasks];
    updated[index].status =
      updated[index].status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setTasks(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tasks: tasks.filter((t) => t.description.trim()),
        }),
      });

      if (!res.ok) throw new Error();

      toast.success('Orden actualizada');
      setEditing(false);
      fetchOrder();
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  async function quickStatusChange(newStatus: string) {
    try {
      const res = await fetch(`/api/work-orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      const label = workOrderStatusConfig[newStatus]?.label || newStatus;
      toast.success(`Estado: ${label}`);
      fetchOrder();
    } catch {
      toast.error('Error al cambiar estado');
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!order) return null;

  const completedTasks = order.tasks.filter(
    (t: any) => t.status === 'COMPLETED'
  ).length;
  const totalTasks = order.tasks.length;
  const progressPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div>
      <Link
        href="/ordenes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Órdenes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {order.workOrderNumber}
            </h1>
            <StatusBadge status={order.status} type="workOrder" />
            <StatusBadge status={order.priority} type="priority" />
          </div>
          <p className="text-sm text-gray-500">
            Creada {formatDateTime(order.createdAt)}
            {order.startDate && ` • Iniciada ${formatDate(order.startDate)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'PENDING' && (
            <button
              onClick={() => quickStatusChange('IN_PROGRESS')}
              className="btn-primary"
            >
              <Play className="h-4 w-4" />
              Iniciar
            </button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => quickStatusChange('WAITING_PARTS')}
                className="btn-secondary"
              >
                <Package className="h-4 w-4" />
                Esperando Partes
              </button>
              <button
                onClick={() => quickStatusChange('COMPLETED')}
                className="btn-success"
              >
                <CheckCircle className="h-4 w-4" />
                Completar
              </button>
            </>
          )}
          {order.status === 'WAITING_PARTS' && (
            <button
              onClick={() => quickStatusChange('IN_PROGRESS')}
              className="btn-primary"
            >
              <Play className="h-4 w-4" />
              Reanudar
            </button>
          )}
          {order.status === 'COMPLETED' && (
            <button
              onClick={() => quickStatusChange('DELIVERED')}
              className="btn-success"
            >
              <Truck className="h-4 w-4" />
              Marcar Entregado
            </button>
          )}

          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary"
          >
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details (editable) */}
          {editing ? (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold">Detalles de la Orden</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">Estado</label>
                    <select
                      className="input-field"
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      {Object.entries(workOrderStatusConfig).map(
                        ([key, cfg]) => (
                          <option key={key} value={key}>
                            {cfg.label}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="label-field">Prioridad</label>
                    <select
                      className="input-field"
                      value={form.priority}
                      onChange={(e) =>
                        setForm({ ...form, priority: e.target.value })
                      }
                    >
                      <option value="LOW">Baja</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Alta</option>
                      <option value="URGENT">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-field">Mecánico Asignado</label>
                    <input
                      className="input-field"
                      value={form.assignedTo}
                      onChange={(e) =>
                        setForm({ ...form, assignedTo: e.target.value })
                      }
                      placeholder="Nombre del mecánico"
                    />
                  </div>
                  <div>
                    <label className="label-field">Bahía / Estación</label>
                    <input
                      className="input-field"
                      value={form.bay}
                      onChange={(e) =>
                        setForm({ ...form, bay: e.target.value })
                      }
                      placeholder="Ej: Bahía 1"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-field">Fecha Estimada de Completado</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.estimatedCompletion}
                    onChange={(e) =>
                      setForm({ ...form, estimatedCompletion: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="label-field">Notas del Técnico</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={form.techNotes}
                    onChange={(e) =>
                      setForm({ ...form, techNotes: e.target.value })
                    }
                    placeholder="Observaciones del trabajo..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Mecánico</p>
                    <p className="text-sm font-medium">
                      {order.assignedTo || 'Sin asignar'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bahía</p>
                    <p className="text-sm font-medium">
                      {order.bay || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha Estimada</p>
                    <p className="text-sm font-medium">
                      {order.estimatedCompletion
                        ? formatDate(order.estimatedCompletion)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold">
                      {formatCurrency(order.estimate.total)}
                    </p>
                  </div>
                </div>
                {order.techNotes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">
                      Notas del Técnico
                    </p>
                    <p className="text-sm text-gray-700">{order.techNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Tareas
                </h2>
                {totalTasks > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {completedTasks} de {totalTasks} completadas
                  </p>
                )}
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={addTask}
                  className="btn-secondary text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Tarea
                </button>
              )}
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="px-6 py-2 border-b border-gray-100">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {editing ? (
              <div className="divide-y divide-gray-100">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="px-6 py-3 flex items-start gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(index)}
                      className={`mt-1 flex-shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'text-green-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <div className="flex-1 space-y-2">
                      <input
                        className="input-field"
                        value={task.description}
                        onChange={(e) => {
                          const updated = [...tasks];
                          updated[index].description = e.target.value;
                          setTasks(updated);
                        }}
                        placeholder="Descripción de la tarea..."
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          className="input-field text-xs"
                          value={task.assignedTo}
                          onChange={(e) => {
                            const updated = [...tasks];
                            updated[index].assignedTo = e.target.value;
                            setTasks(updated);
                          }}
                          placeholder="Asignado a..."
                        />
                        <input
                          className="input-field text-xs"
                          type="number"
                          step="0.5"
                          value={task.timeSpent}
                          onChange={(e) => {
                            const updated = [...tasks];
                            updated[index].timeSpent = e.target.value;
                            setTasks(updated);
                          }}
                          placeholder="Horas"
                        />
                        <input
                          className="input-field text-xs"
                          value={task.notes}
                          onChange={(e) => {
                            const updated = [...tasks];
                            updated[index].notes = e.target.value;
                            setTasks(updated);
                          }}
                          placeholder="Notas"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="mt-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="px-6 py-4 text-sm text-gray-400">
                    No hay tareas. Agrega una para hacer seguimiento del
                    progreso.
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {order.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="px-6 py-3 flex items-start gap-3"
                  >
                    <div
                      className={`mt-0.5 flex-shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'text-green-500'
                          : 'text-gray-300'
                      }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          task.status === 'COMPLETED'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.description}
                      </p>
                      <div className="flex gap-3 mt-0.5">
                        {task.assignedTo && (
                          <span className="text-xs text-gray-400">
                            {task.assignedTo}
                          </span>
                        )}
                        {task.timeSpent && (
                          <span className="text-xs text-gray-400">
                            {task.timeSpent}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {order.tasks.length === 0 && (
                  <p className="px-6 py-4 text-sm text-gray-400">
                    No hay tareas definidas
                  </p>
                )}
              </div>
            )}

            {editing && (
              <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>

          {/* Estimate Items (read-only) */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Detalle del Estimado
              </h2>
              <Link
                href={`/estimados/${order.estimateId}`}
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Ver Estimado Completo
              </Link>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-2">Tipo</th>
                  <th className="px-4 py-2">Descripción</th>
                  <th className="px-4 py-2 text-right">Cant</th>
                  <th className="px-6 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.estimate.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-6 py-2">
                      <StatusBadge status={item.type === 'PART' ? 'DRAFT' : item.type === 'LABOR' ? 'APPROVED' : 'SENT'} />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-2 text-sm text-right font-medium">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="px-6 py-3 text-sm font-bold text-right">
                    Total
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-right">
                    {formatCurrency(order.estimate.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
            </div>
            <div className="card-body space-y-2">
              <Link
                href={`/clientes/${order.estimate.customer.id}`}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                {order.estimate.customer.firstName}{' '}
                {order.estimate.customer.lastName}
              </Link>
              <p className="flex items-center gap-1.5 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5" />
                {order.estimate.customer.phone}
              </p>
            </div>
          </div>

          {/* Vehicle */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehículo
              </h3>
            </div>
            <div className="card-body space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {order.estimate.vehicle.year}{' '}
                {order.estimate.vehicle.make}{' '}
                {order.estimate.vehicle.model}
              </p>
              {order.estimate.vehicle.color && (
                <p className="text-sm text-gray-500">
                  Color: {order.estimate.vehicle.color}
                </p>
              )}
              {order.estimate.vehicle.licensePlate && (
                <p className="text-sm text-gray-500">
                  Placa: {order.estimate.vehicle.licensePlate}
                </p>
              )}
              {order.estimate.vehicle.vin && (
                <p className="text-xs text-gray-400 font-mono">
                  VIN: {order.estimate.vehicle.vin}
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Línea de Tiempo
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <TimelineItem
                  label="Creada"
                  date={order.createdAt}
                  active
                />
                <TimelineItem
                  label="Iniciada"
                  date={order.startDate}
                  active={!!order.startDate}
                />
                <TimelineItem
                  label="Completada"
                  date={order.completedDate}
                  active={!!order.completedDate}
                />
                <TimelineItem
                  label="Entregada"
                  date={order.deliveredDate}
                  active={!!order.deliveredDate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
}: {
  label: string;
  date: string | null;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          active ? 'bg-brand-600' : 'bg-gray-200'
        }`}
      />
      <div className="flex-1">
        <p
          className={`text-sm ${
            active ? 'text-gray-900 font-medium' : 'text-gray-400'
          }`}
        >
          {label}
        </p>
      </div>
      <span className="text-xs text-gray-400">
        {date ? formatDate(date) : '—'}
      </span>
    </div>
  );
}
