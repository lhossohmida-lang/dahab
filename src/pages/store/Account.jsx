import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { money } from '../../utils/helpers';
import { User, Save, ShoppingBag } from 'lucide-react';

export default function Account() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [stats, setStats] = useState({ ordersCount: 0, totalSpent: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const s = await getDoc(doc(db, 'users', user.uid));
      if (s.exists()) {
        const d = s.data();
        setForm({ fullName: d.fullName || '', phone: d.phone || '', address: d.address || '' });
        setStats({ ordersCount: d.ordersCount || 0, totalSpent: d.totalSpent || 0 });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
      });
      await updateDoc(doc(db, 'customers', user.uid), {
        name: form.fullName,
        phone: form.phone,
        address: form.address,
      });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center text-violet-400 py-12">جاري التحميل...</div>;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700 flex items-center gap-2"><User /> حسابي</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <ShoppingBag size={20} className="mx-auto text-rose-400 mb-1" />
          <div className="text-xs text-violet-400">عدد الطلبات</div>
          <div className="font-extrabold text-gold-700">{stats.ordersCount}</div>
        </div>
        <div className="card text-center">
          <ShoppingBag size={20} className="mx-auto text-gold-400 mb-1" />
          <div className="text-xs text-violet-400">إجمالي المشتريات</div>
          <div className="font-extrabold text-gold-700">{money(stats.totalSpent)}</div>
        </div>
      </div>

      <form onSubmit={save} className="card space-y-3">
        <div>
          <label className="label">الاسم الكامل</label>
          <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label">رقم الهاتف</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">البريد</label>
          <input className="input" disabled value={user?.email} />
        </div>
        <div>
          <label className="label">العنوان</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex justify-between items-center">
          {ok && <span className="text-emerald-500 text-sm font-bold">تم الحفظ</span>}
          <button disabled={saving} className="btn-primary mr-auto"><Save size={16} /> {saving ? 'جاري...' : 'حفظ التعديلات'}</button>
        </div>
      </form>

      <button onClick={logout} className="btn-secondary w-full">تسجيل الخروج</button>
    </div>
  );
}
