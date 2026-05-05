import { useEffect, useState, useMemo } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import Modal from '../components/Modal';
import { CATEGORIES, money, formatDate } from '../utils/helpers';
import { Plus, Pencil, Trash2, Search, AlertTriangle, Package } from 'lucide-react';

const empty = {
  name: '', category: CATEGORIES[0], imageUrl: '', purchasePrice: '',
  sellingPrice: '', quantity: '', minQuantity: 5, description: '',
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('الكل');
  const [showLow, setShowLow] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u = onSnapshot(collection(db, 'products'), (s) =>
      setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return u;
  }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (cat !== 'الكل' && p.category !== cat) return false;
      if (showLow && Number(p.quantity) > Number(p.minQuantity || 0)) return false;
      if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, cat, showLow]);

  const openNew = () => { setForm(empty); setImageFile(null); setOpen(true); };
  const openEdit = (p) => { setForm({ ...p }); setImageFile(null); setOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = form.imageUrl || '';
      if (imageFile) {
        const path = `products/${Date.now()}_${imageFile.name}`;
        const r = ref(storage, path);
        await uploadBytes(r, imageFile);
        imageUrl = await getDownloadURL(r);
      }
      const data = {
        name: form.name,
        category: form.category,
        imageUrl,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        minQuantity: Number(form.minQuantity),
        description: form.description || '',
        updatedAt: serverTimestamp(),
      };
      if (form.id) {
        await updateDoc(doc(db, 'products', form.id), data);
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      }
      setOpen(false);
    } catch (e) {
      alert('خطأ: ' + e.message);
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!confirm(`حذف "${p.name}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'products', p.id));
      if (p.imageUrl?.includes('firebase')) {
        try { await deleteObject(ref(storage, p.imageUrl)); } catch {}
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gold-700">المنتجات</h1>
          <p className="text-violet-400 text-sm">{items.length} منتج</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={18}/> منتج جديد</button>
      </div>

      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-3 top-2.5 text-rose-300" size={18}/>
          <input className="input pr-10" placeholder="بحث..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <select className="input max-w-xs" value={cat} onChange={(e)=>setCat(e.target.value)}>
          <option>الكل</option>
          {CATEGORIES.map(c=> <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm font-bold text-rose-500">
          <input type="checkbox" checked={showLow} onChange={(e)=>setShowLow(e.target.checked)} />
          الناقصة فقط
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((p) => {
          const low = Number(p.quantity) <= Number(p.minQuantity || 0);
          return (
            <div key={p.id} className="card relative">
              {low && (
                <div className="absolute top-2 left-2 badge bg-rose-100 text-rose-500 flex items-center gap-1">
                  <AlertTriangle size={12}/> ناقص
                </div>
              )}
              <div className="aspect-square rounded-xl bg-gradient-to-br from-rose-50 to-gold-50 flex items-center justify-center overflow-hidden mb-2">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={40} className="text-rose-300" />
                )}
              </div>
              <div className="font-extrabold text-sm truncate">{p.name}</div>
              <div className="text-xs text-violet-400">{p.category}</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-rose-500 font-bold">{money(p.sellingPrice)}</div>
                <div className="text-xs text-violet-500">الكمية: <b>{p.quantity}</b></div>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={()=>openEdit(p)} className="btn-secondary flex-1 !py-1 !px-2 text-xs"><Pencil size={14}/> تعديل</button>
                <button onClick={()=>remove(p)} className="btn-danger !py-1 !px-2 text-xs"><Trash2 size={14}/></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full card text-center text-violet-400 py-12">
            لا توجد منتجات
          </div>
        )}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={form.id ? 'تعديل منتج' : 'إضافة منتج جديد'} size="lg">
        <form onSubmit={save} className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="label">اسم المنتج</label>
            <input required className="input" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})}/>
          </div>
          <div>
            <label className="label">التصنيف</label>
            <select className="input" value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">صورة المنتج</label>
            <input type="file" accept="image/*" className="input" onChange={(e)=>setImageFile(e.target.files?.[0]||null)}/>
          </div>
          <div>
            <label className="label">سعر الشراء</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.purchasePrice} onChange={(e)=>setForm({...form, purchasePrice:e.target.value})}/>
          </div>
          <div>
            <label className="label">سعر البيع</label>
            <input required type="number" min="0" step="0.01" className="input" value={form.sellingPrice} onChange={(e)=>setForm({...form, sellingPrice:e.target.value})}/>
          </div>
          <div>
            <label className="label">الكمية المتوفرة</label>
            <input required type="number" min="0" className="input" value={form.quantity} onChange={(e)=>setForm({...form, quantity:e.target.value})}/>
          </div>
          <div>
            <label className="label">الحد الأدنى للتنبيه</label>
            <input type="number" min="0" className="input" value={form.minQuantity} onChange={(e)=>setForm({...form, minQuantity:e.target.value})}/>
          </div>
          <div className="md:col-span-2">
            <label className="label">الوصف</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})}/>
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={()=>setOpen(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving?'جاري الحفظ...':'حفظ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
