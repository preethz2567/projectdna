import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { getMe } from '../api/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, updateUser, logout } = useStore();
  const [loading, setLoading] = useState(!user && !!token);

  useEffect(() => {
    if (token && !user) {
      getMe().then(data => {
        updateUser(data.user);
      }).catch(() => {
        logout();
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token, user, updateUser, logout]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading profile...</div>;

  return <>{children}</>;
}
