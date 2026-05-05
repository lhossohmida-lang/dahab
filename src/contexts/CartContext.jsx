import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('deheb_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('deheb_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.productId === product.id);
      if (exists) {
        if (exists.quantity + 1 > product.quantity) return prev;
        return prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      if (product.quantity < 1) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl || '',
        sellingPrice: Number(product.sellingPrice),
        purchasePrice: Number(product.purchasePrice),
        quantity: 1,
        stock: Number(product.quantity),
      }];
    });
  };

  const updateQuantity = (productId, qty) => {
    setCart((prev) =>
      prev.map((c) => (c.productId === productId ? { ...c, quantity: Math.max(1, qty) } : c))
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((a, c) => a + c.sellingPrice * c.quantity, 0);
  const cartCount = cart.reduce((a, c) => a + c.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}
