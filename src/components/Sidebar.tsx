'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Wrench,
  Settings,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Vehículos', href: '/vehiculos', icon: Car },
  { name: 'Estimados', href: '/estimados', icon: FileText },
  { name: 'Órdenes de Trabajo', href: '/ordenes', icon: Wrench },
  { name: 'Reportes', href: '/reportes', icon: TrendingUp },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="no-print flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Hunter</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Taller Mecánico
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">Hunter v1.0</p>
            <p className="text-[10px] text-gray-400">CDSRSolutions.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
