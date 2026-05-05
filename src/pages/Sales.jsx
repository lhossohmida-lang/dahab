import { useEffect, useState, useMemo } from 'react';
import {
  collection, onSnapshot, addDoc, doc, runTransaction, serverTimestamp, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { money, genInvoiceNumber, PAYMENT_METHODS } from '../utils/helpers';
import { Search, Plus, Minus, Trash2, ShoppingBag, Check } from 'lucide-react';

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const u = onSnapshot(collection(db, 'products'), (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const filtered = useMemo(() =>
    search ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 8) : []
  , [products, search]);

  const addToCart = (p) => {
    const found = cart.find((c) => c.productId === p.id);
    if (found) {
      if (found.quantity + 1 > p.quantity) { alert('الكمية غير كافية'); return; }
      setCart(cart.map(c => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if (p.quantity < 1) { alert('نفد المخزون'); return; }
      setCart([...cart, {
        productId: p.id, name: p.name,
        purchasePrice: Number(p.purchasePrice),
        sellingPrice: Number(p.sellingPrice),
        quantity: 1, stock: Number(p.quantity),
      }]);
    }
    setSearch('');
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.productId !== id) return c;
      const newQ = c.quantity + delta;
      if (newQ < 1) return c;
      if (newQ > c.stock) { alert('الكمية غير كافية'); return c; }
      return { ...c, quantity: newQ };
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.productId !== id));

  const totals = useMemo(() => {
    const subtotal = cart.reduce((a, c) => a + c.sellingPrice * c.quantity, 0);
    const cost = cart.reduce((a, c) => a + c.purchasePrice * c.quantity, 0);
    const total = subtotal - Number(discount || 0);
    const profit = total - cost;
    return { subtotal, cost, total, profit };
  }, [cart, discount]);

  const checkout = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    try {
      const items = cart.map(c => ({
        productId: c.productId,
        name: c.name,
        quantity: c.quantity,
        purchasePrice: c.purchasePrice,
        sellingPrice: c.sellingPrice,
        total: c.sellingPrice * c.quantity,
        profit: (c.sellingPrice - c.purchasePrice) * c.quantity,
      }));

      await runTransaction(db, async (tx) => {
        const refs = cart.map(c => doc(db, 'products', c.productId));
        const snaps = await Promise.all(refs.map(r => tx.get(r)));
        snaps.forEach((s, i) => {
          if (!s.exists()) throw new Error('منتج محذوف');
          const cur = Number(s.data().quantity);
          if (cur < cart[i].quantity) throw new Error(`الكمية غير كافية: ${cart[i].name}`);
          tx.update(refs[i], { quantity: cur - cart[i].quantity });
        });
      });

      const sale = {
        invoiceNumber: genInvoiceNumber(),
        items,
        subtotal: totals.subtotal,
        discount: Number(discount || 0),
        total: totals.total,
        profit: totals.profit,
        paymentMethod,
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        createdAt: serverTimestamp(),
      };
      const saleDoc = await addDoc(collection(db, 'sales'), sale);

      // Update or create customer
      if (customerPhone) {
        const q = query(collection(db, 'customers'), where('phone', '==', customerPhone));
        const cs = await getDocs(q);
        if (cs.empty) {
          await addDoc(collection(db, 'customers'), {
            name: customerName || 'بدون اسم',
            phone: customerPhone, address: '',
            ordersCount: 1, totalSpent: totals.total, notes: '',
            createdAt: serverTimestamp(),
          });
        } else {
          const c = cs.docs[0];
          await runTransaction(db, async (tx) => {
            const s = await tx.get(c.ref);
            tx.update(c.ref, {
              ordersCount: (s.data().ordersCount || 0) + 1,
              totalSpent: (s.data().totalSpent || 0) + totals.total,
              name: customerName || s.data().name,
            });
          });
        }
      }

      setSuccess(sale.invoiceNumber);
      setCart([]); setDiscount(0); setCustomerName(''); setCustomerPhone('');
      setTimeout(()=>setSuccess(''), 4000);
    } catch (e) {
      alert('خطأ: ' + e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">بيع جديد</h1>

      {success && (
        <div className="card border-2 border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-2">
          <Check size={20}/> تمت العملية بنجاح! رقم الفاتورة: <b>{success}</b>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 text-rose-300" size={18}/>
            <input className="input pr-10" placeholder="ابحث عن منتج..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          {filtered.length > 0 && (
            <div className="border border-rose-100 rounded-xl divide-y divide-rose-50 max-h-64 overflow-y-auto">
              {filtered.map(p => (
                <button key={p.id} onClick={()=>addToCart(p)} className="w-full text-right flex justify-between items-center p-3 hover:bg-rose-50">
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xs text-violet-400">{p.category} • متوفر: {p.quantity}</div>
                  </div>
                  <div className="text-rose-500 font-bold">{money(p.sellingPrice)}</div>
                </button>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-bold text-violet-500 mb-2">السلة ({cart.length})</h3>
            {cart.length === 0 ? (
              <div className="text-center text-violet-300 py-8 border-2 border-dashed border-rose-100 rounded-xl">
                ابحث وأضف منتجات
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.productId} className="flex items-center gap-2 bg-rose-50 rounded-xl p-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{c.name}</div>
                      <div className="text-xs text-violet-400">{money(c.sellingPrice)} × {c.quantity} = <b className="text-rose-500">{money(c.sellingPrice*c.quantity)}</b></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>updateQty(c.productId,-1)} className="w-7 h-7 rounded-lg bg-white text-rose-500 flex items-center justify-center"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold">{c.quantity}</span>
                      <button onClick={()=>updateQty(c.productId,1)} className="w-7 h-7 rounded-lg bg-white text-rose-500 flex items-center justify-center"><Plus size={14}/></button>
                    </div>
                    <button onClick={()=>removeFromCart(c.productId)} className="text-red-400 p-1"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card space-y-3 h-fit lg:sticky lg:top-4">
          <h3 className="font-extrabold text-violet-500">ملخص الفاتورة</h3>
          <div>
            <label className="label">اسم الزبونة (اختياري)</label>
            <input className="input" value={customerName} onChange={(e)=>setCustomerName(e.target.value)}/>
          </div>
          <div>
            <label className="label">رقم الهاتف (اختياري)</label>
            <input className="input" value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)}/>
          </div>
          <div>
            <label className="label">طريقة الدفع</label>
            <select className="input" value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الخصم</label>
            <input type="number" min="0" className="input" value={discount} onChange={(e)=>setDiscount(e.target.value)}/>
          </div>
          <div className="border-t border-rose-100 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>المجموع</span><b>{money(totals.subtotal)}</b></div>
            <div className="flex justify-between text-rose-400"><span>الخصم</span><b>-{money(discount)}</b></div>
            <div className="flex justify-between text-lg pt-1 border-t border-rose-100"><span>الإجمالي</span><b className="text-rose-500">{money(totals.total)}</b></div>
            <div className="flex justify-between text-emerald-500"><span>الربح</span><b>{money(totals.profit)}</b></div>
          </div>
          <button onClick={checkout} disabled={saving || cart.length===0} className="btn-primary w-full">
            <ShoppingBag size={18}/> {saving?'جاري الحفظ...':'إتمام البيع'}
          </button>
        </div>
      </div>
    </div>
  );
}
