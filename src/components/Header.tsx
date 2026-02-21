'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, Building2, ChevronDown } from 'lucide-react';

interface UserSession {
  name: string;
  companyName: string;
  role: string;
  companyId: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function Header() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setSession(data.user);
          setActiveCompanyId(data.user.companyId);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch companies list for super admin
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch('/api/admin/companies')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCompanies([
            { id: '__all__', name: 'Todas las Empresas' },
            ...data.map((c: any) => ({ id: c.id, name: c.name })),
          ]);
        }
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleCompanySwitch = (companyId: string) => {
    setActiveCompanyId(companyId);
    setShowCompanyPicker(false);
    // Store in sessionStorage so pages can read it
    if (companyId === '__all__') {
      sessionStorage.removeItem('hunter-admin-companyId');
    } else {
      sessionStorage.setItem('hunter-admin-companyId', companyId);
    }
    // Reload to apply filter
    window.location.reload();
  };

  const activeCompanyName =
    activeCompanyId === '__all__'
      ? 'Todas las Empresas'
      : companies.find((c) => c.id === activeCompanyId)?.name ||
        session?.companyName ||
        '';


  return (
    <header className="no-print flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes, vehículos, estimados..."
          className="input-field pl-10"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Company switcher for SUPER_ADMIN */}
        {isSuperAdmin && companies.length > 0 ? (
          <div className="relative">
            <button
              onClick={() => setShowCompanyPicker(!showCompanyPicker)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-brand-600" />
              <span className="max-w-[160px] truncate">{activeCompanyName}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showCompanyPicker && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowCompanyPicker(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg max-h-64 overflow-y-auto">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCompanySwitch(c.id)}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${
                        c.id === activeCompanyId
                          ? 'text-brand-600 font-medium bg-brand-50'
                          : 'text-gray-700'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          session?.companyName && (
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {session.companyName}
            </span>
          )
        )}

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {session?.name || 'Cargando...'}
            </span>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">{session?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
