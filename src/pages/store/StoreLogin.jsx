import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Mail, Lock } from 'lucide-react';

export default function StoreLogin() {
  const { user, userRole, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userRole === 'customer') nav('/store');
  }, [user, userRole, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setErr('بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md card">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-l from-gold-400 to-rose-400 flex items-center justify-center text-white shadow-lg">
            <Sparkles size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-gold-600 mt-3">تسجيل الدخول</h1>
          <p className="text-sm text-violet-400">سجلي دخولك لمتابعة طلباتك</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input type="email" required className="input pr-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
            </div>
          </div>
          <div>
            <label className="label">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input type="password" required className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
            </div>
          </div>

          {err && <div className="text-sm text-red-500 text-center">{err}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center text-sm text-violet-400 mt-4">
          ليس لديك حساب؟{' '}
          <Link to="/store/register" className="text-rose-500 font-bold">إنشاء حساب جديد</Link>
        </p>
      </div>
    </div>
  );
}
