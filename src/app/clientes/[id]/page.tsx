'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  Plus,
  Edit,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer();
  }, [params.id]);

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${params.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomer(data);
    } catch {
      toast.error('Cliente no encontrado');
      router.push('/clientes');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!customer) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Cliente desde {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/estimados/nuevo?customerId=${customer.id}`}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Nuevo Estimado
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">
              Información de Contacto
            </h2>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{customer.phone}</span>
            </div>
            {customer.phone2 && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{customer.phone2}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="text-sm">
                  {customer.address && <p>{customer.address}</p>}
                  {customer.city && (
                    <p>
                      {customer.city}
                      {customer.state && `, ${customer.state}`}{' '}
                      {customer.zipCode}
                    </p>
                  )}
                </div>
              </div>
            )}
            {customer.notes && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">Notas</p>
                <p className="text-sm text-gray-600">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicles */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Vehículos ({customer.vehicles.length})
            </h2>
            <Link
              href={`/vehiculos/nuevo?customerId=${customer.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Agregar
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {customer.vehicles.map((vehicle: any) => (
              <Link
                key={vehicle.id}
                href={`/vehiculos/${vehicle.id}`}
                className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <Car className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    {vehicle.color && `${vehicle.color} • `}
                    {vehicle.licensePlate && `Placa: ${vehicle.licensePlate}`}
                  </p>
                </div>
              </Link>
            ))}
            {customer.vehicles.length === 0 && (
              <p className="px-6 py-4 text-sm text-gray-400">
                No hay vehículos registrados
              </p>
            )}
          </div>
        </div>

        {/* Estimates */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Estimados ({customer.estimates.length})
            </h2>
            <Link
              href={`/estimados/nuevo?customerId=${customer.id}`}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Nuevo
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {customer.estimates.map((estimate: any) => (
              <Link
                key={estimate.id}
                href={`/estimados/${estimate.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {estimate.estimateNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {estimate.vehicle.year} {estimate.vehicle.make}{' '}
                    {estimate.vehicle.model}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(estimate.total)}
                  </span>
                  <StatusBadge status={estimate.status} />
                </div>
              </Link>
            ))}
            {customer.estimates.length === 0 && (
              <p className="px-6 py-4 text-sm text-gray-400">
                No hay estimados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
