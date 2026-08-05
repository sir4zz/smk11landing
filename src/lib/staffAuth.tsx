import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { backendApi } from './api';
import { STAFF_ROLES } from './permissions';

export interface StaffAuthState {
  user: { id: string; email?: string } | null;
  role: string | null;
  permissions: string[];
  loading: boolean;
}

const AuthContext = createContext<StaffAuthState>({
  user: null,
  role: null,
  permissions: [],
  loading: true,
});

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StaffAuthState>({
    user: null,
    role: null,
    permissions: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const { data } = await backendApi.auth.getCurrentUser();
      if (cancelled) return;
      if (!data?.user) {
        setState({ user: null, role: null, permissions: [], loading: false });
        return;
      }

      const { data: profile } = await backendApi.database
        .from('profiles')
        .select('role, name, email')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role ?? null;
      let permissions: string[] = [];

      if (role && (STAFF_ROLES as readonly string[]).includes(role)) {
        const { data: perms } = await backendApi.database.rpc('get_my_permissions');
        if (perms) permissions = perms as string[];
      }

      if (cancelled) return;
      setState({
        user: { id: data.user.id, email: profile?.email ?? data.user.email },
        role,
        permissions,
        loading: false,
      });
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useStaffAuth() {
  return useContext(AuthContext);
}
