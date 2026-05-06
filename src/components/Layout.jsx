import { useState } from 'react';
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
  Globe,
  Bot,
  MoreHorizontal,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    nav('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur border-l border-rose-100 p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8 p-2">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm ring-1 ring-gold-100 overflow-hidden">
            <img src="/pwa-icon-192.png" alt="Accessories" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="font-extrabold text-gold-600">Accessories</div>
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
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* Floating Menu - Mobile */}
      <div className="md:hidden fixed bottom-4 left-4 z-50">
        {mobileMenuOpen && (
          <>
            <button
              type="button"
              aria-label="إغلاق القائمة"
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setMobileMenuOpen(false)}
            />

            <nav className="absolute bottom-14 left-0 z-50 w-56 overflow-hidden rounded-2xl border border-rose-100 bg-white/95 shadow-soft backdrop-blur">
              <div className="max-h-[70vh] overflow-y-auto p-2">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${
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

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50"
                >
                  <LogOut size={18} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </nav>
          </>
        )}

        <button
          type="button"
          aria-label={mobileMenuOpen ? 'إغلاق قائمة الإدارة' : 'فتح قائمة الإدارة'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-l from-gold-400 to-rose-400 text-white shadow-lg transition hover:opacity-90"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>
    </div>
  );
}
