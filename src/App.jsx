import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRoute from './components/CustomerRoute';
import StoreLayout from './components/StoreLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import OnlineOrders from './pages/OnlineOrders';
import Invoices from './pages/Invoices';
import Profits from './pages/Profits';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import SettingsPage from './pages/Settings';
import AiAssistant from './pages/AiAssistant';
import StoreFront from './pages/store/StoreFront';
import Cart from './pages/store/Cart';
import Checkout from './pages/store/Checkout';
import StoreLogin from './pages/store/StoreLogin';
import StoreRegister from './pages/store/StoreRegister';
import MyOrders from './pages/store/MyOrders';
import Account from './pages/store/Account';
import InstallAppButton from './components/InstallAppButton';
import { CartProvider } from './contexts/CartContext';

export default function App() {
  return (
    <>
      <Routes>
        {/* Admin Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Panel */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/online-orders" element={<OnlineOrders />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/profits" element={<Profits />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Online Store (Public + Customer) */}
        <Route
          path="/store"
          element={
            <CartProvider>
              <StoreLayout />
            </CartProvider>
          }
        >
          <Route index element={<StoreFront />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="login" element={<StoreLogin />} />
          <Route path="register" element={<StoreRegister />} />
          <Route
            path="orders"
            element={<CustomerRoute><MyOrders /></CustomerRoute>}
          />
          <Route
            path="account"
            element={<CustomerRoute><Account /></CustomerRoute>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <InstallAppButton />
    </>
  );
}
