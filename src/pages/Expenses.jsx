import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { money, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Plus, Trash2, Wallet } from 'lucide-react';

const empty = { name: '', amount: '', note: '', date: new Date().toISOString().slice(0,10) };

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    const u = onSnapshot(query(collection(db,'expenses'), orderBy('createdAt','desc')), (s) =>
      setItems(s.docs.map(d=>({id:d.id,...d.data()}))));
    return u;
  }, []);

  const total = items.reduce((a,e)=>a+Number(e.amount||0), 0);

  const save = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db,'expenses'), {
        name: form.name,
        amount: Number(form.amount),
        note: form.note || '',
        date: form.date,
        createdAt: serverTimestamp(),
      });
      setForm(empty); setOpen(false);
    } catch (e) { alert(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('حذف المصروف؟')) return;
    await deleteDoc(doc(db,'expenses',id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gold-700">المصاريف</h1>
          <p className="text-violet-400 text-sm">إجمالي المصاريف: <b className="text-rose-500">{money(total)}</b></p>
        </div>
        <button onClick={()=>setOpen(true)} className="btn-primary"><Plus size={18}/> مصروف جديد</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-rose-50">
            <tr>
              <th className="table-th">المصروف</th>
              <th className="table-th">القيمة</th>
              <th className="table-th">التاريخ</th>
              <th className="table-th">ملاحظة</th>
              <th className="table-th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {items.map(it => (
              <tr key={it.id}>
                <td className="table-td font-bold flex items-center gap-2"><Wallet size={14} className="text-rose-400"/>{it.name}</td>
                <td className="table-td text-rose-500 font-bold">{money(it.amount)}</td>
                <td className="table-td text-xs">{it.date || formatDate(it.createdAt)}</td>
                <td className="table-td text-xs text-violet-400">{it.note}</td>
                <td className="table-td"><button onClick={()=>remove(it.id)} className="btn-danger !py-1 !px-2"><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {items.length===0 && (
              <tr><td colSpan="5" className="text-center text-violet-300 py-12">لا توجد مصاريف</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="مصروف جديد">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">اسم المصروف</label>
            <input required className="input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="مثال: كراء، توصيل، تغليف"/>
          </div>
          <div>
            <label className="label">القيمة</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})}/>
          </div>
          <div>
            <label className="label">التاريخ</label>
            <input type="date" className="input" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/>
          </div>
          <div>
            <label className="label">ملاحظة</label>
            <textarea className="input" rows={2} value={form.note} onChange={(e)=>setForm({...form,note:e.target.value})}/>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={()=>setOpen(false)} className="btn-secondary">إلغاء</button>
            <button className="btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
