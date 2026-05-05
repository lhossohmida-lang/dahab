import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { money, startOfDay, startOfMonth, formatDate } from '../utils/helpers';
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle, Coins, Receipt,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

function StatCard({ icon: Icon, label, value, color = 'gold' }) {
  const palette = {
    gold: 'from-gold-300 to-gold-500',
    rose: 'from-rose-300 to-rose-500',
    violet: 'from-violet-300 to-violet-500',
    green: 'from-emerald-300 to-emerald-500',
  }[color];
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-l ${palette} flex items-center justify-center text-white shadow-md`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-violet-400 font-semibold">{label}</div>
        <div className="text-lg font-extrabold text-gold-700 truncate">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'sales'), orderBy('createdAt', 'desc')), (s) =>
      setSales(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, 'products'), (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u3 = onSnapshot(collection(db, 'expenses'), (s) =>
      setExpenses(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); u3(); };
  }, []);

  const stats = useMemo(() => {
    const today = startOfDay();
    const month = startOfMonth();
    const todaySales = sales.filter((s) => s.createdAt?.toDate?.() >= today);
    const monthSales = sales.filter((s) => s.createdAt?.toDate?.() >= month);
    const monthExpenses = expenses
      .filter((e) => (e.createdAt?.toDate?.() || new Date(e.date || 0)) >= month)
      .reduce((acc, e) => acc + Number(e.amount || 0), 0);

    const sum = (arr, k) => arr.reduce((a, b) => a + Number(b[k] || 0), 0);

    const lowStock = products.filter(
      (p) => Number(p.quantity) <= Number(p.minQuantity || 0)
    );

    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const day = sales.filter((s) => {
        const t = s.createdAt?.toDate?.();
        return t >= d && t < next;
      });
      chartData.push({
        name: `${d.getDate()}/${d.getMonth() + 1}`,
        sales: sum(day, 'total'),
        profit: sum(day, 'profit'),
      });
    }

    return {
      todayTotal: sum(todaySales, 'total'),
      monthTotal: sum(monthSales, 'total'),
      todayProfit: sum(todaySales, 'profit'),
      monthProfit: sum(monthSales, 'profit') - monthExpenses,
      productsCount: products.length,
      lowStockCount: lowStock.length,
      lowStock,
      chartData,
    };
  }, [sales, products, expenses]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gold-700">لوحة التحكم</h1>
        <p className="text-violet-400 text-sm">نظرة عامة على أداء المتجر</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ShoppingBag} label="مبيعات اليوم" value={money(stats.todayTotal)} color="rose" />
        <StatCard icon={Receipt} label="مبيعات الشهر" value={money(stats.monthTotal)} color="gold" />
        <StatCard icon={Coins} label="ربح اليوم" value={money(stats.todayProfit)} color="green" />
        <StatCard icon={TrendingUp} label="صافي ربح الشهر" value={money(stats.monthProfit)} color="violet" />
        <StatCard icon={Package} label="عدد المنتجات" value={stats.productsCount} color="gold" />
        <StatCard icon={AlertTriangle} label="منتجات أوشكت على النفاد" value={stats.lowStockCount} color="rose" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="font-extrabold text-violet-500 mb-3">مبيعات آخر 14 يوم</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f78" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f78" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e9a826" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#e9a826" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#f43f78" fill="url(#g1)" name="المبيعات" />
                <Area type="monotone" dataKey="profit" stroke="#e9a826" fill="url(#g2)" name="الربح" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-extrabold text-violet-500 mb-3">آخر المبيعات</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sales.slice(0, 8).map((s) => (
              <div key={s.id} className="flex justify-between items-center text-sm border-b border-rose-50 pb-2">
                <div>
                  <div className="font-bold">{s.invoiceNumber}</div>
                  <div className="text-xs text-violet-400">{formatDate(s.createdAt)}</div>
                </div>
                <div className="text-rose-500 font-bold">{money(s.total)}</div>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center text-violet-300 py-8">لا توجد مبيعات بعد</div>
            )}
          </div>
        </div>
      </div>

      {stats.lowStock.length > 0 && (
        <div className="card border-2 border-rose-200">
          <h3 className="font-extrabold text-rose-500 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} /> منتجات بحاجة لإعادة تعبئة
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="bg-rose-50 rounded-xl p-2 text-sm">
                <div className="font-bold">{p.name}</div>
                <div className="text-xs text-rose-500">الكمية: {p.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
