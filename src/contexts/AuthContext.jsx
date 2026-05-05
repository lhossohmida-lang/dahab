import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          setUserRole(snap.data().role || 'customer');
          setUserData(snap.data());
        } else {
          setUserRole('admin');
          setUserData(null);
        }
      } else {
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const registerCustomer = async (email, password, fullName, phone, address) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      fullName,
      phone,
      email,
      address,
      role: 'customer',
      ordersCount: 0,
      totalSpent: 0,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'customers', cred.user.uid), {
      name: fullName,
      phone,
      email,
      address,
      ordersCount: 0,
      totalSpent: 0,
      notes: 'زبون أونلاين',
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading, login, logout, registerCustomer }}>
      {children}
    </AuthContext.Provider>
  );
}
