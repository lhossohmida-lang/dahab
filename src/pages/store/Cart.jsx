import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { money } from '../../utils/helpers';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="card text-center py-16 space-y-4">
        <ShoppingBag size={48} className="mx-auto text-rose-200" />
        <h2 className="text-xl font-extrabold text-violet-500">السلة فارغة</h2>
        <p className="text-violet-400">أضيفي منتجات من المتجر</p>
        <Link to="/store" className="btn-primary inline-flex">تصفحي المتجر</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">سلة المشتريات ({cartCount})</h1>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => (
            <div key={item.productId} className="card flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-50 to-gold-50 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={24} className="text-rose-200" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{item.name}</h3>
                <p className="text-sm text-rose-500 font-bold">{money(item.sellingPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-left min-w-[70px]">
                <div className="font-bold text-sm">{money(item.sellingPrice * item.quantity)}</div>
              </div>
              <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-500 p-1">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="card h-fit lg:sticky lg:top-20 space-y-3">
          <h3 className="font-extrabold text-violet-500">ملخص الطلب</h3>
          <div className="space-y-2 text-sm">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between">
                <span className="truncate flex-1">{item.name} × {item.quantity}</span>
                <span className="font-bold mr-2">{money(item.sellingPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-rose-100 pt-3 flex justify-between text-lg">
            <span className="font-bold">الإجمالي</span>
            <span className="font-extrabold text-rose-500">{money(cartTotal)}</span>
          </div>
          <Link to="/store/checkout" className="btn-primary w-full">
            <ArrowLeft size={16} /> متابعة الطلب
          </Link>
          <Link to="/store" className="btn-secondary w-full text-xs">
            مواصلة التسوق
          </Link>
        </div>
      </div>
    </div>
  );
}
