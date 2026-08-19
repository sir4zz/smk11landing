import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { backendApi } from './api';
import { STAFF_ROLES } from './permissions';

export interface StaffAuthState {
  user: { id: string; email?: string; name?: string } | null;
  role: string | null;
  permissions: string[];
  mustChangePassword: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<StaffAuthState>({
  user: null,
  role: null,
  permissions: [],
  mustChangePassword: false,
  loading: true,
  refresh: async () => {},
});

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<StaffAuthState, 'refresh'>>({
    user: null,
    role: null,
    permissions: [],
    mustChangePassword: false,
    loading: true,
  });
  const mounted = useRef(true);

  const hydrate = useCallback(async () => {
    const { data } = await backendApi.auth.getCurrentUser();
    if (!mounted.current) return;
    if (!data?.user) {
      setState({ user: null, role: null, permissions: [], mustChangePassword: false, loading: false });
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

    if (!mounted.current) return;
    setState({
      user: { id: data.user.id, email: profile?.email ?? data.user.email, name: profile?.name ?? undefined },
      role,
      permissions,
      mustChangePassword: Boolean(data.mustChangePassword),
      loading: false,
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    void hydrate();
    return () => {
      mounted.current = false;
    };
  }, [hydrate]);

  const refresh = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  return <AuthContext.Provider value={{ ...state, refresh }}>{children}</AuthContext.Provider>;
}

export function useStaffAuth() {
  return useContext(AuthContext);
}
