'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Car, FileText, Wrench, Plus, Trash2, Edit, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    customers: number;
    vehicles: number;
    estimates: number;
    workOrders: number;
  };
  shopSettings: { shopName: string; phone: string | null; email: string | null } | null;
  users: CompanyUser[];
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for new company
  const [newCompany, setNewCompany] = useState({
    name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '',
  });

  // Form state for editing company
  const [editForm, setEditForm] = useState({ name: '', slug: '' });

  // Form state for adding user
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'ADMIN',
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies');
      if (!res.ok) throw new Error('No autorizado');
      const data = await res.json();
      setCompanies(data);
    } catch (err) {
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompany),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Empresa "${data.name}" creada`);
      setNewCompany({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
      setShowCreateForm(false);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear empresa');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Empresa actualizada');
      setEditingId(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !company.isActive }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success(company.isActive ? 'Empresa desactivada' : 'Empresa activada');
      fetchCompanies();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (company: Company) => {
    if (!confirm(`¿Eliminar "${company.name}" y TODOS sus datos? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success(`Empresa "${company.name}" eliminada`);
      fetchCompanies();
    } catch {
      toast.error('Error al eliminar empresa');
    }
  };

  const handleAddUser = async (companyId: string, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Usuario creado');
      setNewUser({ name: '', email: '', password: '', role: 'ADMIN' });
      setShowAddUserForm(null);
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-400">Cargando empresas...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las empresas (tenants) del sistema — {companies.length} empresas
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card mb-6 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear Nueva Empresa</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre de la Empresa</label>
              <input
                type="text"
                className="input-field"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Ej: Sacket Prestige"
                required
              />
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input
                type="text"
                className="input-field"
                value={newCompany.slug}
                onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="ej: sacket-prestige"
                required
              />
            </div>
            <div>
              <label className="label">Nombre del Admin</label>
              <input
                type="text"
                className="input-field"
                value={newCompany.adminName}
                onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="label">Email del Admin</label>
              <input
                type="email"
                className="input-field"
                value={newCompany.adminEmail}
                onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                placeholder="admin@empresa.com"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña del Admin</label>
              <input
                type="password"
                className="input-field"
                value={newCompany.adminPassword}
                onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary">Crear Empresa</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List */}
      <div className="space-y-4">
        {companies.map((company) => (
          <div key={company.id} className="card overflow-hidden">
            {/* Company Header Row */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
              >
                {expandedId === company.id ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Building2 className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{company.name}</p>
                  <p className="text-xs text-gray-400">{company.slug}</p>
                </div>
                {!company.isActive && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Inactiva
                  </span>
                )}
              </button>

              {/* Stats */}
              <div className="flex items-center gap-4 mr-4">
                <StatPill icon={<Users className="h-3.5 w-3.5" />} value={company._count.users} label="usuarios" />
                <StatPill icon={<Users className="h-3.5 w-3.5" />} value={company._count.customers} label="clientes" />
                <StatPill icon={<Car className="h-3.5 w-3.5" />} value={company._count.vehicles} label="vehículos" />
                <StatPill icon={<FileText className="h-3.5 w-3.5" />} value={company._count.estimates} label="estimados" />
                <StatPill icon={<Wrench className="h-3.5 w-3.5" />} value={company._count.workOrders} label="órdenes" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(editingId === company.id ? null : company.id);
                    setEditForm({ name: company.name, slug: company.slug });
                  }}
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleActive(company);
                  }}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    company.isActive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {company.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(company);
                  }}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Edit Form (inline) */}
            {editingId === company.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="label">Nombre</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="label">Slug</label>
                    <input
                      type="text"
                      className="input-field"
                      value={editForm.slug}
                      onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    />
                  </div>
                  <button onClick={() => handleUpdate(company.id)} className="btn-primary">
                    Guardar
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Expanded: Users */}
            {expandedId === company.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Usuarios</h3>
                  <button
                    onClick={() => setShowAddUserForm(showAddUserForm === company.id ? null : company.id)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Agregar Usuario
                  </button>
                </div>

                {/* Add User Form */}
                {showAddUserForm === company.id && (
                  <form onSubmit={(e) => handleAddUser(company.id, e)} className="mb-4 grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      className="input-field text-sm"
                      placeholder="Nombre"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      className="input-field text-sm"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                    <input
                      type="password"
                      className="input-field text-sm"
                      placeholder="Contraseña"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        className="input-field text-sm flex-1"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="TECH">Técnico</option>
                      </select>
                      <button type="submit" className="btn-primary text-sm px-3">Crear</button>
                    </div>
                  </form>
                )}

                {/* User List */}
                <div className="space-y-1">
                  {company.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <span className="ml-2 text-gray-400">{user.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'MANAGER'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                        {!user.isActive && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">Inactivo</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {company.users.length === 0 && (
                    <p className="text-xs text-gray-400 py-2">Sin usuarios</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No hay empresas registradas
        </div>
      )}
    </div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500" title={label}>
      {icon}
      <span className="font-medium">{value}</span>
    </div>
  );
}
