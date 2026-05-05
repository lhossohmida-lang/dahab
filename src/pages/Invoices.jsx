import { useEffect, useState, useMemo } from 'react';
import {
  collection, onSnapshot, orderBy, query, deleteDoc, doc, runTransaction, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { money, formatDate, PAYMENT_METHODS } from '../utils/helpers';
import Modal from '../components/Modal';
import { Search, Trash2, Eye, Printer, Calendar } from 'lucide-react';

export default function Invoices() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [pm, setPm] = useState('الكل');
  const [view, setView] = useState(null);

  useEffect(() => {
    const u = onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), (s) =>
      setSales(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (search && !(s.invoiceNumber?.includes(search) || s.customerName?.includes(search) || s.customerPhone?.includes(search))) return false;
      if (pm !== 'الكل' && s.paymentMethod !== pm) return false;
      const t = s.createdAt?.toDate?.();
      if (from && t < new Date(from)) return false;
      if (to) { const d = new Date(to); d.setHours(23,59,59); if (t > d) return false; }
      return true;
    });
  }, [sales, search, from, to, pm]);

  const remove = async (s) => {
    const restore = confirm('هل تريد إرجاع الكميات للمخزون؟ اضغط OK للحذف مع الإرجاع، Cancel للحذف فقط');
    try {
      if (restore) {
        await runTransaction(db, async (tx) => {
          for (const it of s.items || []) {
            const r = doc(db, 'products', it.productId);
            const snap = await tx.get(r);
            if (snap.exists()) {
              tx.update(r, { quantity: Number(snap.data().quantity || 0) + Number(it.quantity) });
            }
          }
        });
      }
      await deleteDoc(doc(db, 'sales', s.id));
    } catch (e) { alert(e.message); }
  };

  const printInvoice = (s) => {
    const w = window.open('', '_blank');
    const rows = (s.items || []).map((i, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td>${i.quantity}</td>
        <td>${i.sellingPrice}</td>
        <td>${i.total}</td>
      </tr>`).join('');
    w.document.write(`
      <html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${s.invoiceNumber}</title>
      <style>
        body{font-family:Cairo,Tajawal,Arial;padding:20px;color:#333}
        h1{color:#d18a14;text-align:center;margin:0}
        .sub{text-align:center;color:#999;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;margin-top:15px}
        th,td{border:1px solid #eee;padding:8px;text-align:right}
        th{background:#fff1f5;color:#f43f78}
        .totals{margin-top:15px;text-align:left}
        .totals div{margin:4px 0}
        .total-final{font-size:1.3em;color:#f43f78;font-weight:bold}
      </style></head><body>
        <h1>دهب - متجر الإكسسوارات</h1>
        <div class="sub">فاتورة: ${s.invoiceNumber}<br>${formatDate(s.createdAt)}</div>
        ${s.customerName ? `<div>الزبونة: <b>${s.customerName}</b> ${s.customerPhone ? '- ' + s.customerPhone : ''}</div>` : ''}
        <table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="totals">
          <div>المجموع: ${s.subtotal} دج</div>
          <div>الخصم: ${s.discount} دج</div>
          <div class="total-final">الإجمالي: ${s.total} دج</div>
          <div>طريقة الدفع: ${s.paymentMethod}</div>
        </div>
        <p style="text-align:center;margin-top:30px;color:#999">شكرا لتسوقك معنا</p>
        <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">الفواتير</h1>

      <div className="card grid md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-rose-300" size={18}/>
          <input className="input pr-10" placeholder="بحث..." value={search} onChange={(e)=>setSearch(e.target.value)}/>
        </div>
        <input type="date" className="input" value={from} onChange={(e)=>setFrom(e.target.value)}/>
        <input type="date" className="input" value={to} onChange={(e)=>setTo(e.target.value)}/>
        <select className="input" value={pm} onChange={(e)=>setPm(e.target.value)}>
          <option>الكل</option>
          {PAYMENT_METHODS.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-rose-50">
            <tr>
              <th className="table-th">رقم الفاتورة</th>
              <th className="table-th">التاريخ</th>
              <th className="table-th">الزبونة</th>
              <th className="table-th">الدفع</th>
              <th className="table-th">الإجمالي</th>
              <th className="table-th">الربح</th>
              <th className="table-th">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="table-td font-bold">{s.invoiceNumber}</td>
                <td className="table-td text-xs">{formatDate(s.createdAt)}</td>
                <td className="table-td">{s.customerName || '-'}</td>
                <td className="table-td"><span className="badge bg-violet-100 text-violet-500">{s.paymentMethod}</span></td>
                <td className="table-td text-rose-500 font-bold">{money(s.total)}</td>
                <td className="table-td text-emerald-500 font-bold">{money(s.profit)}</td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={()=>setView(s)} className="btn-secondary !py-1 !px-2"><Eye size={14}/></button>
                    <button onClick={()=>printInvoice(s)} className="btn-secondary !py-1 !px-2"><Printer size={14}/></button>
                    <button onClick={()=>remove(s)} className="btn-danger !py-1 !px-2"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-violet-300 py-12">لا توجد فواتير</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!view} onClose={()=>setView(null)} title={view?.invoiceNumber} size="lg">
        {view && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-violet-400">التاريخ: </span><b>{formatDate(view.createdAt)}</b></div>
              <div><span className="text-violet-400">الدفع: </span><b>{view.paymentMethod}</b></div>
              <div><span className="text-violet-400">الزبونة: </span><b>{view.customerName || '-'}</b></div>
              <div><span className="text-violet-400">الهاتف: </span><b>{view.customerPhone || '-'}</b></div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-rose-50"><tr><th className="table-th">المنتج</th><th className="table-th">الكمية</th><th className="table-th">السعر</th><th className="table-th">المجموع</th></tr></thead>
              <tbody className="divide-y divide-rose-50">
                {view.items?.map((i,idx)=>(
                  <tr key={idx}><td className="table-td">{i.name}</td><td className="table-td">{i.quantity}</td><td className="table-td">{money(i.sellingPrice)}</td><td className="table-td font-bold">{money(i.total)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-rose-100 pt-3 text-sm space-y-1">
              <div className="flex justify-between"><span>المجموع</span><b>{money(view.subtotal)}</b></div>
              <div className="flex justify-between text-rose-400"><span>الخصم</span><b>-{money(view.discount)}</b></div>
              <div className="flex justify-between text-lg"><span>الإجمالي</span><b className="text-rose-500">{money(view.total)}</b></div>
              <div className="flex justify-between text-emerald-500"><span>الربح</span><b>{money(view.profit)}</b></div>
            </div>
            <button onClick={()=>printInvoice(view)} className="btn-primary w-full"><Printer size={16}/> طباعة الفاتورة</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
