import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Store } from 'lucide-react';

const empty = {
  storeName: 'دهب', phone: '', address: '', currency: 'DZD',
  invoiceFooter: 'شكرا لتسوقك معنا',
};

export default function Settings() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getDoc(doc(db,'settings','store'));
      if (s.exists()) setForm({ ...empty, ...s.data() });
      setLoading(false);
    })();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db,'settings','store'), { ...form, updatedAt: serverTimestamp() });
      setOk(true); setTimeout(()=>setOk(false), 3000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center text-violet-400 py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-gold-700 flex items-center gap-2"><Store/> الإعدادات</h1>
      <form onSubmit={save} className="card space-y-3">
        <div><label className="label">اسم المتجر</label>
          <input required className="input" value={form.storeName} onChange={(e)=>setForm({...form,storeName:e.target.value})}/></div>
        <div><label className="label">رقم الهاتف</label>
          <input className="input" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
        <div><label className="label">العنوان</label>
          <input className="input" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/></div>
        <div><label className="label">العملة</label>
          <input className="input" value={form.currency} onChange={(e)=>setForm({...form,currency:e.target.value})}/></div>
        <div><label className="label">تذييل الفاتورة</label>
          <textarea className="input" rows={2} value={form.invoiceFooter} onChange={(e)=>setForm({...form,invoiceFooter:e.target.value})}/></div>
        <div className="flex justify-between items-center">
          {ok && <span className="text-emerald-500 font-bold">تم الحفظ ✓</span>}
          <button disabled={saving} className="btn-primary mr-auto"><Save size={16}/> {saving?'جاري الحفظ...':'حفظ الإعدادات'}</button>
        </div>
      </form>
    </div>
  );
}
