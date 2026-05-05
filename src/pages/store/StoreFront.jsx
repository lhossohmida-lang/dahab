import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { CATEGORIES, money } from '../../utils/helpers';
import { useCart } from '../../contexts/CartContext';
import { ShoppingBag, Package, Search, Check } from 'lucide-react';

export default function StoreFront() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('الكل');
  const [addedId, setAddedId] = useState(null);
  const { addToCart, cart } = useCart();

  useEffect(() => {
    const u = onSnapshot(collection(db, 'products'), (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const filtered = useMemo(() =>
    products.filter((p) => {
      if (Number(p.quantity) < 1) return false;
      if (cat !== 'الكل' && p.category !== cat) return false;
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
  [products, search, cat]);

  const handleAdd = (p) => {
    addToCart(p);
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gold-700">متجر دهب</h1>
        <p className="text-violet-400 mt-1">إكسسوارات تليق بأناقتك</p>
      </div>

      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-2.5 text-rose-300" size={18} />
          <input className="input pr-10" placeholder="ابحثي عن منتج..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['الكل', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition ${
                cat === c ? 'bg-gradient-to-l from-gold-400 to-rose-400 text-white' : 'bg-white border border-rose-200 text-violet-500 hover:bg-rose-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const inCart = cart.find((c) => c.productId === p.id);
          return (
            <div key={p.id} className="card group hover:shadow-lg transition-shadow">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-rose-50 to-gold-50 overflow-hidden mb-3">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={40} className="text-rose-200" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-sm truncate">{p.name}</h3>
              <p className="text-xs text-violet-400 mt-0.5 line-clamp-2">{p.description || p.category}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-rose-500 font-extrabold">{money(p.sellingPrice)}</span>
                <span className="text-[11px] text-violet-400">متوفر: {p.quantity}</span>
              </div>
              <button
                onClick={() => handleAdd(p)}
                disabled={Number(p.quantity) < 1}
                className={`mt-3 w-full btn text-xs ${
                  addedId === p.id
                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                    : inCart
                    ? 'bg-gold-100 text-gold-700 border border-gold-200'
                    : 'btn-primary'
                }`}
              >
                {addedId === p.id ? (
                  <><Check size={14} /> تمت الإضافة</>
                ) : inCart ? (
                  <><ShoppingBag size={14} /> في السلة ({inCart.quantity})</>
                ) : (
                  <><ShoppingBag size={14} /> أضيفي إلى السلة</>
                )}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full card text-center text-violet-300 py-16">
            لا توجد منتجات حالياً
          </div>
        )}
      </div>
    </div>
  );
}
