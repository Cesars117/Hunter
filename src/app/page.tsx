import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { requireAuth, isSuperAdmin } from '@/lib/auth';
import {
  Users,
  Car,
  FileText,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const session = requireAuth();
  const superAdmin = isSuperAdmin(session.role);
  // Super admin sees all companies; regular users see only theirs
  const companyFilter = superAdmin ? {} : { companyId: session.companyId };

  const [
    customerCount,
    vehicleCount,
    estimates,
    workOrders,
    recentEstimates,
    activeWorkOrders,
  ] = await Promise.all([
    prisma.customer.count({ where: companyFilter }),
    prisma.vehicle.count({ where: companyFilter }),
    prisma.estimate.findMany({
      where: companyFilter,
      select: { status: true, total: true },
    }),
    prisma.workOrder.findMany({
      where: companyFilter,
      select: { status: true },
    }),
    prisma.estimate.findMany({
      where: companyFilter,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        vehicle: { select: { year: true, make: true, model: true } },
        ...(superAdmin ? { company: { select: { name: true } } } : {}),
      },
    }),
    prisma.workOrder.findMany({
      where: {
        ...companyFilter,
        status: { in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        estimate: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
            vehicle: { select: { year: true, make: true, model: true } },
          },
        },
      },
    }),
  ]);

  const pendingEstimates = estimates.filter(
    (e) => e.status === 'SENT' || e.status === 'DRAFT'
  ).length;
  const approvedEstimates = estimates.filter(
    (e) => e.status === 'APPROVED' || e.status === 'IN_PROGRESS'
  ).length;
  const totalRevenue = estimates
    .filter((e) => e.status === 'COMPLETED' || e.status === 'APPROVED' || e.status === 'IN_PROGRESS')
    .reduce((sum, e) => sum + e.total, 0);

  return {
    customerCount,
    vehicleCount,
    estimateCount: estimates.length,
    pendingEstimates,
    approvedEstimates,
    totalRevenue,
    activeWorkOrders: workOrders.filter(
      (w) => w.status !== 'COMPLETED' && w.status !== 'DELIVERED'
    ).length,
    recentEstimates,
    activeOrders: activeWorkOrders,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del taller
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Clientes"
          value={data.customerCount}
          icon={<Users className="h-6 w-6" />}
          color="blue"
          href="/clientes"
        />
        <StatCard
          title="Vehículos"
          value={data.vehicleCount}
          icon={<Car className="h-6 w-6" />}
          color="purple"
          href="/vehiculos"
        />
        <StatCard
          title="Estimados Pendientes"
          value={data.pendingEstimates}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
          href="/estimados?status=pending"
        />
        <StatCard
          title="Ingresos Aprobados"
          value={formatCurrency(data.totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <StatCardSmall
          title="Total Estimados"
          value={data.estimateCount}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
        />
        <StatCardSmall
          title="Aprobados / En Progreso"
          value={data.approvedEstimates}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatCardSmall
          title="Órdenes Activas"
          value={data.activeWorkOrders}
          icon={<Wrench className="h-5 w-5 text-orange-600" />}
        />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Estimates */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Estimados Recientes
            </h2>
            <Link
              href="/estimados"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentEstimates.map((estimate) => (
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
                    {estimate.customer.firstName} {estimate.customer.lastName} —{' '}
                    {estimate.vehicle.year} {estimate.vehicle.make}{' '}
                    {estimate.vehicle.model}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(estimate.total)}
                  </span>
                  <StatusBadge status={estimate.status} type="estimate" />
                </div>
              </Link>
            ))}
            {data.recentEstimates.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-400">
                No hay estimados aún
              </p>
            )}
          </div>
        </div>

        {/* Active Work Orders */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Órdenes Activas
            </h2>
            <Link
              href="/ordenes"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.activeOrders.map((order) => (
              <Link
                key={order.id}
                href={`/ordenes/${order.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {order.workOrderNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.estimate.customer.firstName}{' '}
                    {order.estimate.customer.lastName} —{' '}
                    {order.estimate.vehicle.year} {order.estimate.vehicle.make}{' '}
                    {order.estimate.vehicle.model}
                  </p>
                  {order.assignedTo && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Asignado: {order.assignedTo}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.priority} type="priority" />
                  <StatusBadge status={order.status} type="workOrder" />
                </div>
              </Link>
            ))}
            {data.activeOrders.length === 0 && (
              <p className="px-6 py-8 text-center text-sm text-gray-400">
                No hay órdenes activas
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'yellow' | 'green';
  href?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
  };

  const CardContent = (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }
  return CardContent;
}

function StatCardSmall({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
