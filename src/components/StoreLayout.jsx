import { NavLink, Outlet, Link } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Sparkles, Store, ClipboardList, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function StoreLayout() {
  const { user, userRole, logout, userData } = useAuth();
  const { cartCount } = useCart();
  const isCustomer = user && userRole === 'customer';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-rose-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/store" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-l from-gold-400 to-rose-400 flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <span className="font-extrabold text-gold-600 text-lg">دهب</span>
          </Link>

          <nav className="flex items-center gap-3">
            <NavLink to="/store" end className={({ isActive }) => `text-sm font-bold ${isActive ? 'text-rose-500' : 'text-violet-500 hover:text-rose-400'}`}>
              <span className="hidden sm:inline">المتجر</span>
              <Store size={20} className="sm:hidden" />
            </NavLink>

            <NavLink to="/store/cart" className={({ isActive }) => `relative text-sm font-bold ${isActive ? 'text-rose-500' : 'text-violet-500 hover:text-rose-400'}`}>
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {isCustomer ? (
              <>
                <NavLink to="/store/orders" className={({ isActive }) => `text-sm font-bold ${isActive ? 'text-rose-500' : 'text-violet-500 hover:text-rose-400'}`}>
                  <ClipboardList size={20} />
                </NavLink>
                <NavLink to="/store/account" className={({ isActive }) => `text-sm font-bold ${isActive ? 'text-rose-500' : 'text-violet-500 hover:text-rose-400'}`}>
                  <User size={20} />
                </NavLink>
                <button onClick={logout} className="text-rose-400 hover:text-rose-500">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link to="/store/login" className="btn-primary !py-1.5 !px-3 text-xs">
                تسجيل الدخول
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <Link
        to="/login"
        aria-label="لوحة الإدارة"
        title="لوحة الإدارة"
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-white/95 border border-rose-200 text-rose-500 shadow-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition"
      >
        <Shield size={18} />
      </Link>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-rose-100 py-4 text-center text-xs text-violet-400">
        © {new Date().getFullYear()} دهب - متجر إكسسوارات البنات
      </footer>
    </div>
  );
}
