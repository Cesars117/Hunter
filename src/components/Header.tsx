'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut } from 'lucide-react';

interface UserSession {
  name: string;
  companyName: string;
  role: string;
}

export default function Header() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setSession(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
        {/* Company name */}
        {session?.companyName && (
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {session.companyName}
          </span>
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
