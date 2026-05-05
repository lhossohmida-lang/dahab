import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ReceiptText,
  TrendingUp,
  Wallet,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Globe,
  Bot,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/', label: 'الرئيسية', icon: LayoutDashboard },
  { to: '/ai-assistant', label: 'مساعد AI', icon: Bot },
  { to: '/products', label: 'المنتجات', icon: Package },
  { to: '/sales', label: 'بيع جديد', icon: ShoppingBag },
  { to: '/online-orders', label: 'البيع أونلاين', icon: Globe },
  { to: '/invoices', label: 'الفواتير', icon: ReceiptText },
  { to: '/profits', label: 'الأرباح', icon: TrendingUp },
  { to: '/expenses', label: 'المصاريف', icon: Wallet },
  { to: '/customers', label: 'الزبونات', icon: Users },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Layout() {
  const { logout, user } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur border-l border-rose-100 p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8 p-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-l from-gold-400 to-rose-400 flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="font-extrabold text-gold-600">دهب</div>
            <div className="text-xs text-violet-400">إدارة متجر الإكسسوارات</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-l from-gold-100 to-rose-100 text-rose-500'
                    : 'text-violet-500 hover:bg-rose-50'
                }`
              }
            >
              <l.icon size={18} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-rose-100 pt-3 mt-3">
          <div className="text-xs text-violet-400 mb-2 truncate">{user?.email}</div>
          <button onClick={handleLogout} className="btn-secondary w-full">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-rose-100 z-40">
        <div className="flex justify-around overflow-x-auto">
          {links.slice(0, 5).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] font-bold ${
                  isActive ? 'text-rose-500' : 'text-violet-400'
                }`
              }
            >
              <l.icon size={20} />
              <span>{l.label}</span>
            </NavLink>
          ))}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] font-bold text-rose-400">
            <LogOut size={20} />
            <span>خروج</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
