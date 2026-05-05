import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAgALD4sF_WV2j5bcNAKmbm-OqIM2gCzgg',
  authDomain: 'deheb-5ac6b.firebaseapp.com',
  projectId: 'deheb-5ac6b',
  storageBucket: 'deheb-5ac6b.firebasestorage.app',
  messagingSenderId: '892142192045',
  appId: '1:892142192045:web:867ee318170c01649c4d24',
  measurementId: 'G-H6B0RR2Y0Z',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
