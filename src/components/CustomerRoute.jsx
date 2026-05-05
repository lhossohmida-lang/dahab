import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CustomerRoute({ children }) {
  const { user, userRole, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-rose-400 font-bold">
        جاري التحميل...
      </div>
    );
  if (!user || userRole !== 'customer') return <Navigate to="/store/login" replace />;
  return children;
}
