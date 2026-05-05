import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { money, formatDate } from '../../utils/helpers';
import { ClipboardList, Package } from 'lucide-react';

const statusColors = {
  'جديد': 'bg-blue-100 text-blue-600',
  'قيد التحضير': 'bg-gold-100 text-gold-700',
  'تم التوصيل': 'bg-emerald-100 text-emerald-600',
  'ملغى': 'bg-red-100 text-red-500',
};

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'onlineOrders'),
      where('customerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const u = onSnapshot(q, (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return u;
  }, [user]);

  if (orders.length === 0) {
    return (
      <div className="card text-center py-16 space-y-3">
        <ClipboardList size={48} className="mx-auto text-rose-200" />
        <h2 className="text-xl font-extrabold text-violet-500">لا توجد طلبات بعد</h2>
        <p className="text-violet-400 text-sm">طلباتك ستظهر هنا بعد أول عملية شراء</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">طلباتي</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-sm">{order.orderNumber}</div>
                <div className="text-xs text-violet-400">{formatDate(order.createdAt)}</div>
              </div>
              <span className={`badge ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </span>
            </div>
            <div className="space-y-1 mb-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-rose-50 rounded-lg p-2">
                  <span className="flex items-center gap-2"><Package size={14} className="text-rose-300" />{item.name} × {item.quantity}</span>
                  <span className="font-bold">{money(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-rose-100 pt-2">
              <span className="text-sm text-violet-400">الإجمالي</span>
              <span className="font-extrabold text-rose-500">{money(order.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
