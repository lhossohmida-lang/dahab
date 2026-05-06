import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const { user, userRole, loading: authLoading, login, logout } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && userRole !== 'customer') nav('/');
  }, [authLoading, user, userRole, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setErr('بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md card">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg ring-1 ring-gold-100 overflow-hidden">
            <img src="/pwa-icon-192.png" alt="Accessories" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold text-gold-600 mt-3">Accessories</h1>
          <p className="text-sm text-violet-400">إدارة متجر إكسسوارات البنات</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input
                type="email"
                required
                className="input pr-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@deheb.com"
              />
            </div>
          </div>
          <div>
            <label className="label">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input
                type="password"
                required
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>
          </div>

          {err && <div className="text-sm text-red-500 text-center">{err}</div>}

          {user && userRole === 'customer' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-700">
              أنت مسجل حاليًا كزبون. أدخل بيانات حساب الإدارة هنا أو سجل الخروج أولًا.
              <button type="button" onClick={logout} className="mt-2 block w-full font-bold text-rose-500 hover:text-rose-600">
                تسجيل الخروج من حساب الزبون
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
          <p className="text-xs text-violet-400 text-center">
            أنشئ حساب المسؤول من Firebase Console &gt; Authentication
          </p>
        </form>
      </div>
    </div>
  );
}
