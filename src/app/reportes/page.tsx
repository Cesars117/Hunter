import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Wrench,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getReportData() {
  const session = requireAuth();
  const companyId = session.companyId;

  const [estimates, workOrders, customers, vehicles] = await Promise.all([
    prisma.estimate.findMany({
      where: { companyId },
      include: { items: true },
    }),
    prisma.workOrder.findMany({ where: { companyId } }),
    prisma.customer.count({ where: { companyId } }),
    prisma.vehicle.count({ where: { companyId } }),
  ]);

  const totalEstimates = estimates.length;
  const approved = estimates.filter(
    (e) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(e.status)
  );
  const rejected = estimates.filter((e) => e.status === 'REJECTED');
  const pending = estimates.filter(
    (e) => ['DRAFT', 'SENT'].includes(e.status)
  );

  const approvalRate =
    totalEstimates > 0
      ? ((approved.length / (approved.length + rejected.length || 1)) * 100).toFixed(1)
      : '0';

  const totalQuoted = estimates.reduce((s, e) => s + e.total, 0);
  const totalApproved = approved.reduce((s, e) => s + e.total, 0);
  const totalCompleted = estimates
    .filter((e) => e.status === 'COMPLETED')
    .reduce((s, e) => s + e.total, 0);

  const totalCost = estimates
    .filter((e) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(e.status))
    .reduce(
      (s, e) =>
        s + e.items.reduce((is, i) => is + (i.cost || 0) * (i.quantity || 1), 0),
      0
    );

  const totalMargin = totalApproved - totalCost;
  const marginPct =
    totalApproved > 0 ? ((totalMargin / totalApproved) * 100).toFixed(1) : '0';

  const avgEstimate =
    totalEstimates > 0 ? totalQuoted / totalEstimates : 0;

  return {
    totalEstimates,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    pendingCount: pending.length,
    approvalRate,
    totalQuoted,
    totalApproved,
    totalCompleted,
    avgEstimate,
    totalCost,
    totalMargin,
    marginPct,
    activeWorkOrders: workOrders.filter(
      (w) => !['COMPLETED', 'DELIVERED'].includes(w.status)
    ).length,
    completedWorkOrders: workOrders.filter(
      (w) => w.status === 'COMPLETED' || w.status === 'DELIVERED'
    ).length,
    customers,
    vehicles,
  };
}

export default async function ReportesPage() {
  const data = await getReportData();

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Métricas y estadísticas del taller"
      />

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Cotizado"
          value={formatCurrency(data.totalQuoted)}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Total Aprobado"
          value={formatCurrency(data.totalApproved)}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Margen Total"
          value={`${formatCurrency(data.totalMargin)} (${data.marginPct}%)`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <MetricCard
          title="Promedio por Estimado"
          value={formatCurrency(data.avgEstimate)}
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Estimates & Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">
              Estimados
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <StatRow
                label="Total Estimados"
                value={data.totalEstimates}
                icon={<FileText className="h-4 w-4 text-gray-400" />}
              />
              <StatRow
                label="Aprobados"
                value={data.approvedCount}
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
              />
              <StatRow
                label="Pendientes"
                value={data.pendingCount}
                icon={<Clock className="h-4 w-4 text-yellow-500" />}
              />
              <StatRow
                label="Rechazados"
                value={data.rejectedCount}
                icon={<XCircle className="h-4 w-4 text-red-500" />}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Tasa de Aprobación
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {data.approvalRate}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${data.approvalRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-base font-semibold text-gray-900">
              Órdenes de Trabajo
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <StatRow
                label="Activas"
                value={data.activeWorkOrders}
                icon={<Wrench className="h-4 w-4 text-blue-500" />}
              />
              <StatRow
                label="Completadas"
                value={data.completedWorkOrders}
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
              />
              <StatRow
                label="Clientes"
                value={data.customers}
                icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
              />
              <StatRow
                label="Vehículos"
                value={data.vehicles}
                icon={<BarChart3 className="h-4 w-4 text-orange-500" />}
              />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Costo Total de Partes
                </span>
                <span className="text-lg font-bold text-gray-700">
                  {formatCurrency(data.totalCost)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500">
                  Ingresos Completados
                </span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(data.totalCompleted)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
