import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { money, startOfDay, startOfWeek, startOfMonth } from '../utils/helpers';
import { TrendingUp, Coins, ShoppingBag, Calendar } from 'lucide-react';

function Card({ icon: Icon, label, value, sub, color = 'gold' }) {
  const palette = {
    gold: 'from-gold-300 to-gold-500',
    rose: 'from-rose-300 to-rose-500',
    violet: 'from-violet-300 to-violet-500',
    green: 'from-emerald-300 to-emerald-500',
  }[color];
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-l ${palette} text-white flex items-center justify-center`}>
          <Icon size={18}/>
        </div>
        <div className="text-sm font-bold text-violet-500">{label}</div>
      </div>
      <div className="text-2xl font-extrabold text-gold-700">{value}</div>
      {sub && <div className="text-xs text-violet-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Profits() {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'sales'), orderBy('createdAt','desc')), (s)=>
      setSales(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db,'expenses'), (s)=>
      setExpenses(s.docs.map(d=>({id:d.id,...d.data()}))));
    return () => { u1(); u2(); };
  }, []);

  const data = useMemo(() => {
    const today = startOfDay();
    const week = startOfWeek();
    const month = startOfMonth();

    const inRange = (arr, from) => arr.filter(s => (s.createdAt?.toDate?.() || new Date(s.date||0)) >= from);
    const sumKey = (arr, k) => arr.reduce((a,b)=>a+Number(b[k]||0), 0);
    const sumExp = (arr) => arr.reduce((a,b)=>a+Number(b.amount||0), 0);

    const todaySales = inRange(sales, today);
    const weekSales = inRange(sales, week);
    const monthSales = inRange(sales, month);

    const monthExp = sumExp(inRange(expenses, month));

    const totalSales = sumKey(sales, 'total');
    const totalProfit = sumKey(sales, 'profit');
    const totalCost = sales.reduce((a,s) =>
      a + (s.items||[]).reduce((x,i)=>x + Number(i.purchasePrice||0)*Number(i.quantity||0), 0)
    , 0);
    const allExp = sumExp(expenses);

    // Best products
    const productStats = {};
    sales.forEach(s => (s.items||[]).forEach(i => {
      const k = i.productId || i.name;
      if (!productStats[k]) productStats[k] = { name: i.name, qty: 0, profit: 0 };
      productStats[k].qty += Number(i.quantity);
      productStats[k].profit += Number(i.profit || 0);
    }));
    const topByProfit = Object.values(productStats).sort((a,b)=>b.profit-a.profit).slice(0,5);
    const topByQty = Object.values(productStats).sort((a,b)=>b.qty-a.qty).slice(0,5);

    return {
      todayProfit: sumKey(todaySales, 'profit'),
      weekProfit: sumKey(weekSales, 'profit'),
      monthProfit: sumKey(monthSales, 'profit'),
      totalSales,
      totalCost,
      totalProfit,
      monthExp,
      netProfit: totalProfit - allExp,
      topByProfit, topByQty,
    };
  }, [sales, expenses]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-gold-700">الأرباح</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon={Calendar} label="ربح اليوم" value={money(data.todayProfit)} color="rose"/>
        <Card icon={TrendingUp} label="ربح الأسبوع" value={money(data.weekProfit)} color="gold"/>
        <Card icon={Coins} label="ربح الشهر" value={money(data.monthProfit)} color="violet"/>
        <Card icon={ShoppingBag} label="صافي الربح الإجمالي" value={money(data.netProfit)} sub={`بعد خصم المصاريف`} color="green"/>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card icon={ShoppingBag} label="إجمالي المبيعات" value={money(data.totalSales)} color="gold"/>
        <Card icon={Coins} label="تكلفة المنتجات المباعة" value={money(data.totalCost)} color="rose"/>
        <Card icon={TrendingUp} label="إجمالي الأرباح (قبل المصاريف)" value={money(data.totalProfit)} color="violet"/>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-extrabold text-violet-500 mb-3">أكثر المنتجات ربحا</h3>
          <div className="space-y-2">
            {data.topByProfit.map((p,i)=>(
              <div key={i} className="flex justify-between items-center p-2 bg-rose-50 rounded-xl text-sm">
                <span className="font-bold">{i+1}. {p.name}</span>
                <span className="text-emerald-500 font-bold">{money(p.profit)}</span>
              </div>
            ))}
            {data.topByProfit.length===0 && <div className="text-violet-300 text-center py-4">لا توجد بيانات</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="font-extrabold text-violet-500 mb-3">أكثر المنتجات مبيعا</h3>
          <div className="space-y-2">
            {data.topByQty.map((p,i)=>(
              <div key={i} className="flex justify-between items-center p-2 bg-gold-50 rounded-xl text-sm">
                <span className="font-bold">{i+1}. {p.name}</span>
                <span className="text-rose-500 font-bold">{p.qty} قطعة</span>
              </div>
            ))}
            {data.topByQty.length===0 && <div className="text-violet-300 text-center py-4">لا توجد بيانات</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
