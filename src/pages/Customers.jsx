import { useEffect, useState, useMemo } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { money, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, Search, Phone, MapPin, Eye } from 'lucide-react';

const empty = { name: '', phone: '', address: '', notes: '' };

export default function Customers() {
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [view, setView] = useState(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db,'customers'), (s) =>
      setItems(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(query(collection(db,'sales'), orderBy('createdAt','desc')), (s)=>
      setSales(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => { u1(); u2(); };
  }, []);

  const filtered = useMemo(() =>
    items.filter(c => !search || c.name?.includes(search) || c.phone?.includes(search))
  , [items, search]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (form.id) {
        const { id, ...rest } = data;
        await updateDoc(doc(db,'customers',id), rest);
      } else {
        await addDoc(collection(db,'customers'), {
          ...data, ordersCount: 0, totalSpent: 0, createdAt: serverTimestamp(),
        });
      }
      setForm(empty); setOpen(false);
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('حذف الزبونة؟')) return;
    await deleteDoc(doc(db,'customers',id));
  };

  const customerSales = (c) => sales.filter(s =>
    (c.phone && s.customerPhone === c.phone) ||
    (c.name && s.customerName === c.name)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between flex-wrap gap-3 items-center">
        <h1 className="text-2xl font-extrabold text-gold-700">الزبونات</h1>
        <button onClick={()=>{setForm(empty);setOpen(true);}} className="btn-primary"><Plus size={18}/> زبونة جديدة</button>
      </div>

      <div className="card relative">
        <Search className="absolute right-6 top-7 text-rose-300" size={18}/>
        <input className="input pr-10" placeholder="بحث..." value={search} onChange={(e)=>setSearch(e.target.value)}/>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-gold-700 truncate">{c.name}</div>
                {c.phone && <div className="text-xs text-violet-400 flex items-center gap-1"><Phone size={12}/>{c.phone}</div>}
                {c.address && <div className="text-xs text-violet-400 flex items-center gap-1"><MapPin size={12}/>{c.address}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm bg-rose-50 rounded-xl p-2 mb-2">
              <div><div className="text-xs text-violet-400">عدد الطلبات</div><b className="text-rose-500">{c.ordersCount || 0}</b></div>
              <div><div className="text-xs text-violet-400">إجمالي الشراء</div><b className="text-rose-500">{money(c.totalSpent)}</b></div>
            </div>
            {c.notes && <div className="text-xs text-violet-400 mb-2">{c.notes}</div>}
            <div className="flex gap-1">
              <button onClick={()=>setView(c)} className="btn-secondary !py-1 !px-2 text-xs flex-1"><Eye size={14}/> السجل</button>
              <button onClick={()=>{setForm(c);setOpen(true);}} className="btn-secondary !py-1 !px-2 text-xs"><Pencil size={14}/></button>
              <button onClick={()=>remove(c.id)} className="btn-danger !py-1 !px-2 text-xs"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="col-span-full card text-center text-violet-300 py-12">لا توجد زبونات</div>
        )}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={form.id?'تعديل':'زبونة جديدة'}>
        <form onSubmit={save} className="space-y-3">
          <div><label className="label">الاسم</label><input required className="input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}/></div>
          <div><label className="label">الهاتف</label><input className="input" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
          <div><label className="label">العنوان</label><input className="input" value={form.address} onChange={(e)=>setForm({...form,address:e.target.value})}/></div>
          <div><label className="label">ملاحظات</label><textarea className="input" rows={2} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={()=>setOpen(false)} className="btn-secondary">إلغاء</button>
            <button className="btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!view} onClose={()=>setView(null)} title={`سجل ${view?.name || ''}`} size="lg">
        {view && (
          <div className="space-y-2">
            {customerSales(view).map(s => (
              <div key={s.id} className="flex justify-between items-center bg-rose-50 rounded-xl p-3">
                <div>
                  <div className="font-bold">{s.invoiceNumber}</div>
                  <div className="text-xs text-violet-400">{formatDate(s.createdAt)} • {s.items?.length} منتج</div>
                </div>
                <div className="text-rose-500 font-bold">{money(s.total)}</div>
              </div>
            ))}
            {customerSales(view).length===0 && <div className="text-center text-violet-300 py-6">لا توجد مشتريات</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
