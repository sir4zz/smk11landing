import { useEffect, useMemo, useState } from 'react';
import { Save, ShieldCheck, Loader2, AlertTriangle, Check } from 'lucide-react';
import { backendApi } from '../../lib/api';
import { PERMISSION_CATALOG, PERMISSION_MODULES } from '../../lib/permissions';

interface RoleRow {
  id: string;
  slug: string;
  name: string;
}

interface PermissionRow {
  id: string;
  slug: string;
}

export default function RolePermissions() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [rolesRes, permsRes] = await Promise.all([
        backendApi.database.from('roles').select('*').order('slug'),
        backendApi.database.from('permissions').select('*').order('slug'),
      ]);
      if (rolesRes.data) setRoles(rolesRes.data as RoleRow[]);
      if (permsRes.data) setPermissions(permsRes.data as PermissionRow[]);
      if (rolesRes.data && rolesRes.data.length > 0) {
        setSelectedRole((prev) => prev ?? (rolesRes.data as RoleRow[])[0].id);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadRolePermissions = async (roleId: string) => {
    if (!roleId) return;
    setLoading(true);
    const { data } = await backendApi.database
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);
    const ids = (data as { permission_id: string }[] | null)?.map((r) => r.permission_id) ?? [];
    setChecked(new Set(ids));
    setLoading(false);
  };

  useEffect(() => {
    if (selectedRole) void loadRolePermissions(selectedRole);
  }, [selectedRole]);

  const selectedRoleData = useMemo(
    () => roles.find((r) => r.id === selectedRole),
    [roles, selectedRole],
  );
  const isAdminRole = selectedRoleData?.slug === 'admin';

  const permIdBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    permissions.forEach((p) => { map[p.slug] = p.id; });
    return map;
  }, [permissions]);

  const toggle = (slug: string) => {
    if (isAdminRole) return;
    setChecked((current) => {
      const next = new Set(current);
      const id = permIdBySlug[slug];
      if (!id) return current;
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!selectedRole || isAdminRole) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error: delErr } = await backendApi.database
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole);
      if (delErr) throw delErr;

      const rows = Array.from(checked).map((permissionId) => ({
        role_id: selectedRole,
        permission_id: permissionId,
      }));
      if (rows.length > 0) {
        const { error: insErr } = await backendApi.database.from('role_permissions').insert(rows);
        if (insErr) throw insErr;
      }
      setMessage({ type: 'ok', text: `Permission untuk ${selectedRoleData?.name} berhasil disimpan.` });
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal menyimpan permission.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && roles.length === 0) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#1B2A4A]">
              <ShieldCheck className="text-[#866D2C]" /> Role &amp; Permission
            </h2>
            <p className="mt-1 text-sm text-[#5B7088]">
              Atur menu dan aksi yang dapat diakses oleh setiap role. Admin selalu memiliki akses penuh.
            </p>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-lg border border-[#1B2A4A]/20 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        {isAdminRole && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Admin memiliki akses penuh ke seluruh menu dan aksi dan tidak dapat dikurangi.
          </div>
        )}
      </div>

      {!isAdminRole && (
        <>
          {PERMISSION_MODULES.map((module) => {
            const perms = PERMISSION_CATALOG.filter((p) => p.module === module.key);
            if (perms.length === 0) return null;
            const checkedCount = perms.filter((p) => checked.has(permIdBySlug[p.slug] ?? '')).length;
            return (
              <div key={module.key} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-[#1B2A4A]">{module.label}</h3>
                  <span className="rounded-full bg-[#FAF6F0] px-3 py-1 text-xs font-semibold text-[#866D2C]">
                    {checkedCount}/{perms.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {perms.map((p) => (
                    <label
                      key={p.slug}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                        checked.has(permIdBySlug[p.slug] ?? '')
                          ? 'border-[#C8A951] bg-[#FFF9E8]'
                          : 'border-[#1B2A4A]/10 bg-[#FAF6F0] hover:border-[#1B2A4A]/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(permIdBySlug[p.slug] ?? '')}
                        onChange={() => toggle(p.slug)}
                        className="h-4 w-4 accent-[#C8A951]"
                      />
                      <span className="font-semibold text-[#1B2A4A]">{p.name}</span>
                      <span className="ml-auto font-mono text-xs text-[#5B7088]">{p.slug}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {message && (
            <p className={`flex items-center gap-2 rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'ok' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {message.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-3 font-bold text-white hover:bg-[#15203a] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Permission'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
