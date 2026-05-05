import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { money } from '../../utils/helpers';
import { Check, AlertTriangle } from 'lucide-react';

export default function Checkout() {
  const { user, userRole, userData } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isCustomer = user && userRole === 'customer';

  if (!isCustomer) {
    return (
      <div className="card text-center py-12 space-y-4">
        <AlertTriangle size={48} className="mx-auto text-gold-400" />
        <h2 className="text-xl font-extrabold text-violet-500">سجلي دخولك لإتمام الطلب</h2>
        <p className="text-violet-400">تحتاجين حساب لتتمكني من الشراء</p>
        <div className="flex gap-3 justify-center">
          <Link to="/store/login" className="btn-primary">تسجيل الدخول</Link>
          <Link to="/store/register" className="btn-secondary">إنشاء حساب</Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="card text-center py-12 space-y-4">
        <h2 className="text-xl font-extrabold text-violet-500">السلة فارغة</h2>
        <Link to="/store" className="btn-primary inline-flex">تصفحي المتجر</Link>
      </div>
    );
  }

  const placeOrder = async () => {
    setLoading(true);
    setError('');
    try {
      // Check stock availability (read only)
      for (const c of cart) {
        const snap = await getDoc(doc(db, 'products', c.productId));
        if (!snap.exists()) throw new Error(`المنتج "${c.name}" غير موجود`);
        const cur = Number(snap.data().quantity);
        if (cur < c.quantity) throw new Error(`الكمية غير متوفرة: ${c.name} (متبقي ${cur} فقط)`);
      }

      const orderNumber = `ON-${Date.now()}`;
      const items = cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        quantity: c.quantity,
        purchasePrice: c.purchasePrice,
        sellingPrice: c.sellingPrice,
        total: c.sellingPrice * c.quantity,
      }));

      await addDoc(collection(db, 'onlineOrders'), {
        orderNumber,
        customerId: user.uid,
        customerName: userData?.fullName || '',
        phone: userData?.phone || '',
        email: userData?.email || user.email,
        address: userData?.address || '',
        items,
        totalAmount: cartTotal,
        status: 'جديد',
        createdAt: serverTimestamp(),
      });

      // Update customer stats
      const custRef = doc(db, 'customers', user.uid);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        await updateDoc(custRef, {
          ordersCount: (custSnap.data().ordersCount || 0) + 1,
          totalSpent: (custSnap.data().totalSpent || 0) + cartTotal,
        });
      }
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          ordersCount: (userSnap.data().ordersCount || 0) + 1,
          totalSpent: (userSnap.data().totalSpent || 0) + cartTotal,
        });
      }

      clearCart();
      setSuccess(orderNumber);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card text-center py-12 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
          <Check size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-extrabold text-emerald-600">تم تأكيد طلبك بنجاح!</h2>
        <p className="text-violet-400">رقم الطلب: <b className="text-gold-600">{success}</b></p>
        <p className="text-sm text-violet-400">سنتواصل معك قريباً لتأكيد التوصيل</p>
        <div className="flex gap-3 justify-center">
          <Link to="/store/orders" className="btn-primary">طلباتي</Link>
          <Link to="/store" className="btn-secondary">مواصلة التسوق</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">تأكيد الطلب</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h3 className="font-extrabold text-violet-500 mb-3">معلومات التوصيل</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-rose-50 rounded-xl p-3">
                <div className="text-xs text-violet-400">الاسم</div>
                <div className="font-bold">{userData?.fullName}</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <div className="text-xs text-violet-400">الهاتف</div>
                <div className="font-bold">{userData?.phone}</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <div className="text-xs text-violet-400">البريد</div>
                <div className="font-bold">{userData?.email || user.email}</div>
              </div>
              <div className="bg-rose-50 rounded-xl p-3">
                <div className="text-xs text-violet-400">العنوان</div>
                <div className="font-bold">{userData?.address || 'لم يُحدد'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-extrabold text-violet-500 mb-3">المنتجات ({cart.length})</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-sm bg-rose-50 rounded-xl p-3">
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-xs text-violet-400">{money(item.sellingPrice)} × {item.quantity}</div>
                  </div>
                  <div className="font-bold text-rose-500">{money(item.sellingPrice * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card h-fit lg:sticky lg:top-20 space-y-3">
          <h3 className="font-extrabold text-violet-500">ملخص الدفع</h3>
          <div className="flex justify-between text-lg border-t border-rose-100 pt-3">
            <span>الإجمالي</span>
            <span className="font-extrabold text-rose-500">{money(cartTotal)}</span>
          </div>
          <p className="text-xs text-violet-400">الدفع عند الاستلام</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button onClick={placeOrder} disabled={loading} className="btn-primary w-full">
            {loading ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب'}
          </button>
          <Link to="/store/cart" className="btn-secondary w-full text-xs">
            العودة للسلة
          </Link>
        </div>
      </div>
    </div>
  );
}
