'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, Wrench } from 'lucide-react';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import toast from 'react-hot-toast';

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => toast.error('Error al cargar configuración'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success('Configuración guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!settings) return null;

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Ajustes generales del taller"
      />

      <form onSubmit={handleSave} className="max-w-3xl space-y-6">
        {/* Shop Info */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Información del Taller
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label-field">Nombre del Taller</label>
              <input
                className="input-field"
                value={settings.shopName || ''}
                onChange={(e) =>
                  setSettings({ ...settings, shopName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label-field">Dirección</label>
              <input
                className="input-field"
                value={settings.address || ''}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-field">Ciudad</label>
                <input
                  className="input-field"
                  value={settings.city || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label-field">Estado</label>
                <input
                  className="input-field"
                  value={settings.state || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, state: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label-field">Código Postal</label>
                <input
                  className="input-field"
                  value={settings.zipCode || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, zipCode: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Teléfono</label>
                <input
                  className="input-field"
                  value={settings.phone || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input
                  className="input-field"
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label-field">Sitio Web</label>
              <input
                className="input-field"
                value={settings.website || ''}
                onChange={(e) =>
                  setSettings({ ...settings, website: e.target.value })
                }
                placeholder="https://cdsrsolutions.com"
              />
            </div>
          </div>
        </div>

        {/* Rates */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">
              Tarifas y Impuestos
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">
                  Tarifa de Mano de Obra ($/hora)
                </label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  value={settings.laborRate || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, laborRate: e.target.value })
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  Tarifa estándar por hora de trabajo
                </p>
              </div>
              <div>
                <label className="label-field">
                  Tasa de Impuesto (%)
                </label>
                <input
                  className="input-field"
                  type="number"
                  step="0.1"
                  value={settings.taxRate || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, taxRate: e.target.value })
                  }
                />
                <p className="text-xs text-gray-400 mt-1">
                  IVU u otro impuesto aplicable
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Future APIs section */}
        <div className="card border-dashed border-2 border-gray-300 bg-gray-50">
          <div className="card-body text-center py-8">
            <h3 className="text-base font-semibold text-gray-600 mb-2">
              🔌 APIs de Proveedores — Próximamente
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Integración con proveedores de autopartes para cotizar en tiempo
              real. Compara precios entre proveedores y ofrece la mejor opción
              calidad/precio a tus clientes.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['AutoZone', 'O\'Reilly', 'NAPA', 'Advance Auto', 'RockAuto'].map(
                (provider) => (
                  <span
                    key={provider}
                    className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 border border-gray-200"
                  >
                    {provider}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
