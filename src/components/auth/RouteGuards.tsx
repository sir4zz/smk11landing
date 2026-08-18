import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { backendApi } from '../../lib/api';
import { STAFF_ROLES } from '../../lib/permissions';
import { LoadingInline } from '../ui/LoadingScreen';

export function AdminRouteGuard() {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let active = true;

    const run = async () => {
      const { data: userData } = await backendApi.auth.getCurrentUser();
      if (!active) return;
      if (!userData?.user) {
        setState('denied');
        return;
      }

      const { data: profile } = await backendApi.database
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (!active) return;
      setState(profile?.role && (STAFF_ROLES as readonly string[]).includes(profile.role) ? 'allowed' : 'denied');
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <div className="py-24">
          <LoadingInline />
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

export function StudentRouteGuard() {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const run = async () => {
      const { data: userData } = await backendApi.auth.getCurrentUser();
      if (!active) return;
      if (!userData?.user) {
        setState('denied');
        return;
      }

      const { data: profile } = await backendApi.database
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      if (!active) return;
      setState(profile?.role === 'student' ? 'allowed' : 'denied');
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <div className="py-24">
          <LoadingInline />
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to={`/mading/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}
