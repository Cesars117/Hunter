import { cn, estimateStatusConfig, workOrderStatusConfig, priorityConfig } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type?: 'estimate' | 'workOrder' | 'priority';
}

export function StatusBadge({ status, type = 'estimate' }: StatusBadgeProps) {
  const config =
    type === 'workOrder'
      ? workOrderStatusConfig
      : type === 'priority'
        ? priorityConfig
        : estimateStatusConfig;

  const statusInfo = config[status] || {
    label: status,
    color: 'text-gray-700',
    bg: 'bg-gray-100',
  };

  return (
    <span className={cn('status-badge', statusInfo.bg, statusInfo.color)}>
      {statusInfo.label}
    </span>
  );
}
