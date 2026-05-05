import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, Mail, Lock, User, Phone, MapPin } from 'lucide-react';

export default function StoreRegister() {
  const { user, userRole, registerCustomer } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', address: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userRole === 'customer') nav('/store');
  }, [user, userRole, nav]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password.length < 6) { setErr('كلمة السر يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      await registerCustomer(form.email, form.password, form.fullName, form.phone, form.address);
      nav('/store');
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') setErr('هذا البريد مستخدم مسبقاً');
      else setErr('حدث خطأ: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-6">
      <div className="w-full max-w-md card">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-l from-gold-400 to-rose-400 flex items-center justify-center text-white shadow-lg">
            <Sparkles size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-gold-600 mt-3">إنشاء حساب جديد</h1>
          <p className="text-sm text-violet-400">أنشئي حسابك للتسوق أونلاين</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input required className="input pr-10" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="الاسم الكامل" />
            </div>
          </div>
          <div>
            <label className="label">رقم الهاتف</label>
            <div className="relative">
              <Phone className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input required className="input pr-10" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0555000000" />
            </div>
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input type="email" required className="input pr-10" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="example@email.com" />
            </div>
          </div>
          <div>
            <label className="label">كلمة السر</label>
            <div className="relative">
              <Lock className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input type="password" required className="input pr-10" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="6 أحرف على الأقل" />
            </div>
          </div>
          <div>
            <label className="label">العنوان</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-2.5 text-rose-300" size={18} />
              <input required className="input pr-10" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="المدينة، الحي" />
            </div>
          </div>

          {err && <div className="text-sm text-red-500 text-center">{err}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="text-center text-sm text-violet-400 mt-4">
          لديك حساب؟{' '}
          <Link to="/store/login" className="text-rose-500 font-bold">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
