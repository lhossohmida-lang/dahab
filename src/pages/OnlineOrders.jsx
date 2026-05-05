import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { money, formatDate } from '../utils/helpers';
import Modal from '../components/Modal';
import { Eye, Trash2, RefreshCw, Globe, Check } from 'lucide-react';

const STATUSES = ['جديد', 'قيد التحضير', 'تم التوصيل', 'ملغى'];
const statusColors = {
  'جديد': 'bg-blue-100 text-blue-600',
  'قيد التحضير': 'bg-gold-100 text-gold-700',
  'تم التوصيل': 'bg-emerald-100 text-emerald-600',
  'ملغى': 'bg-red-100 text-red-500',
};

export default function OnlineOrders() {
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState(null);
  const [filter, setFilter] = useState('الكل');

  useEffect(() => {
    const u = onSnapshot(
      query(collection(db, 'onlineOrders'), orderBy('createdAt', 'desc')),
      (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const filtered = filter === 'الكل' ? orders : orders.filter((o) => o.status === filter);

  const changeStatus = async (order, newStatus) => {
    try {
      await updateDoc(doc(db, 'onlineOrders', order.id), { status: newStatus });

      // When delivered, create an invoice and it counts as a sale
      if (newStatus === 'تم التوصيل') {
        const items = (order.items || []).map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          purchasePrice: i.purchasePrice || 0,
          sellingPrice: i.sellingPrice,
          total: i.total,
          profit: (i.sellingPrice - (i.purchasePrice || 0)) * i.quantity,
        }));
        const totalProfit = items.reduce((a, i) => a + i.profit, 0);

        await addDoc(collection(db, 'sales'), {
          invoiceNumber: `ONL-${order.orderNumber || Date.now()}`,
          items,
          subtotal: order.totalAmount,
          discount: 0,
          total: order.totalAmount,
          profit: totalProfit,
          paymentMethod: 'أونلاين - الدفع عند الاستلام',
          customerName: order.customerName || '',
          customerPhone: order.phone || '',
          saleType: 'online',
          onlineOrderId: order.id,
          createdAt: serverTimestamp(),
        });
      }

      // When accepted, decrease stock
      if (newStatus === 'قيد التحضير' && order.status === 'جديد') {
        await runTransaction(db, async (tx) => {
          for (const item of order.items || []) {
            const ref = doc(db, 'products', item.productId);
            const snap = await tx.get(ref);
            if (snap.exists()) {
              const cur = Number(snap.data().quantity || 0);
              if (cur < Number(item.quantity)) throw new Error(`الكمية غير كافية: ${item.name}`);
              tx.update(ref, { quantity: cur - Number(item.quantity) });
            }
          }
        });
      }

      // If cancelled after acceptance, return quantities to stock
      if (newStatus === 'ملغى' && order.status === 'قيد التحضير') {
        await runTransaction(db, async (tx) => {
          for (const item of order.items || []) {
            const ref = doc(db, 'products', item.productId);
            const snap = await tx.get(ref);
            if (snap.exists()) {
              tx.update(ref, { quantity: Number(snap.data().quantity || 0) + Number(item.quantity) });
            }
          }
        });
      }
    } catch (e) {
      alert('خطأ: ' + e.message);
    }
  };

  const remove = async (order) => {
    if (!confirm('حذف هذا الطلب نهائياً؟')) return;
    try {
      // Return stock if accepted but not yet delivered or cancelled
      if (order.status === 'قيد التحضير') {
        await runTransaction(db, async (tx) => {
          for (const item of order.items || []) {
            const ref = doc(db, 'products', item.productId);
            const snap = await tx.get(ref);
            if (snap.exists()) {
              tx.update(ref, { quantity: Number(snap.data().quantity || 0) + Number(item.quantity) });
            }
          }
        });
      }
      await deleteDoc(doc(db, 'onlineOrders', order.id));
    } catch (e) { alert(e.message); }
  };

  const newCount = orders.filter((o) => o.status === 'جديد').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gold-700 flex items-center gap-2">
            <Globe size={24} /> البيع أونلاين
          </h1>
          <p className="text-violet-400 text-sm">{orders.length} طلب • {newCount} جديد</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['الكل', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition ${
              filter === s
                ? 'bg-gradient-to-l from-gold-400 to-rose-400 text-white'
                : 'bg-white border border-rose-200 text-violet-500 hover:bg-rose-50'
            }`}
          >
            {s}
            {s !== 'الكل' && (
              <span className="mr-1">({orders.filter((o) => o.status === s).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-rose-50">
            <tr>
              <th className="table-th">رقم الطلب</th>
              <th className="table-th">الزبونة</th>
              <th className="table-th">الهاتف</th>
              <th className="table-th">الإجمالي</th>
              <th className="table-th">الحالة</th>
              <th className="table-th">التاريخ</th>
              <th className="table-th">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50">
            {filtered.map((order) => (
              <tr key={order.id} className={order.status === 'جديد' ? 'bg-blue-50/50' : ''}>
                <td className="table-td font-bold text-xs">{order.orderNumber}</td>
                <td className="table-td">{order.customerName}</td>
                <td className="table-td text-xs">{order.phone}</td>
                <td className="table-td text-rose-500 font-bold">{money(order.totalAmount)}</td>
                <td className="table-td">
                  <select
                    value={order.status}
                    onChange={(e) => changeStatus(order, e.target.value)}
                    className={`badge cursor-pointer text-xs rounded-lg px-2 py-1 border-0 ${statusColors[order.status] || ''}`}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="table-td text-xs">{formatDate(order.createdAt)}</td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => setView(order)} className="btn-secondary !py-1 !px-2"><Eye size={14} /></button>
                    <button onClick={() => remove(order)} className="btn-danger !py-1 !px-2"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="text-center text-violet-300 py-12">لا توجد طلبات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!view} onClose={() => setView(null)} title={`طلب ${view?.orderNumber || ''}`} size="lg">
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">الزبونة</div><b>{view.customerName}</b></div>
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">الهاتف</div><b>{view.phone}</b></div>
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">البريد</div><b>{view.email || '-'}</b></div>
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">العنوان</div><b>{view.address || '-'}</b></div>
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">التاريخ</div><b>{formatDate(view.createdAt)}</b></div>
              <div className="bg-rose-50 rounded-xl p-3"><div className="text-xs text-violet-400">الحالة</div><b className={statusColors[view.status]}>{view.status}</b></div>
            </div>

            <div>
              <h4 className="font-bold text-violet-500 mb-2">المنتجات</h4>
              <table className="w-full text-sm">
                <thead className="bg-rose-50">
                  <tr><th className="table-th">المنتج</th><th className="table-th">الكمية</th><th className="table-th">السعر</th><th className="table-th">المجموع</th></tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                  {view.items?.map((i, idx) => (
                    <tr key={idx}><td className="table-td">{i.name}</td><td className="table-td">{i.quantity}</td><td className="table-td">{money(i.sellingPrice)}</td><td className="table-td font-bold">{money(i.total)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center border-t border-rose-100 pt-3">
              <span className="text-lg font-bold">الإجمالي</span>
              <span className="text-xl font-extrabold text-rose-500">{money(view.totalAmount)}</span>
            </div>

            {view.status === 'جديد' && (
              <div className="flex gap-2">
                <button onClick={() => { changeStatus(view, 'قيد التحضير'); setView(null); }} className="btn-primary flex-1">
                  <RefreshCw size={16} /> قبول الطلب
                </button>
                <button onClick={() => { changeStatus(view, 'ملغى'); setView(null); }} className="btn-danger flex-1">
                  إلغاء الطلب
                </button>
              </div>
            )}
            {view.status === 'قيد التحضير' && (
              <button onClick={() => { changeStatus(view, 'تم التوصيل'); setView(null); }} className="btn-primary w-full">
                <Check size={16} /> تأكيد التوصيل (إنشاء فاتورة)
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
