# دهب - Deheb Store Manager

تطبيق ويب احترافي لإدارة متجر إكسسوارات البنات. مبني بـ React + Vite + Tailwind + Firebase.

## الميزات
- نظام دخول آمن (Firebase Auth)
- لوحة تحكم بالإحصائيات والرسوم البيانية
- إدارة المنتجات (CRUD + صور + تنبيه نقص)
- نقطة بيع POS مع حساب الربح والخصم وإنقاص المخزون تلقائيا (Transaction)
- إدارة الفواتير + بحث/فلترة + طباعة
- صفحة الأرباح (يومي/أسبوعي/شهري + أكثر المنتجات ربحا ومبيعا)
- المصاريف
- الزبونات + سجل مشترياتهن
- إعدادات المتجر
- تصميم RTL أنيق (ذهبي/وردي/بنفسجي)
- Responsive (Sidebar + Bottom Nav)

## بنية قاعدة البيانات (Firestore)
```
products/{id}    : { name, category, imageUrl, purchasePrice, sellingPrice, quantity, minQuantity, description, createdAt, updatedAt }
sales/{id}       : { invoiceNumber, items[], subtotal, discount, total, profit, paymentMethod, customerName, customerPhone, createdAt }
expenses/{id}    : { name, amount, note, date, createdAt }
customers/{id}   : { name, phone, address, ordersCount, totalSpent, notes, createdAt }
settings/store   : { storeName, phone, address, currency, invoiceFooter }
```

## التشغيل المحلي

```bash
# 1. تثبيت الحزم
npm install

# 2. تشغيل سيرفر التطوير
npm run dev
# سيفتح على http://localhost:5173
```

### إنشاء مستخدم المسؤول (مرة واحدة)
1. افتح Firebase Console: https://console.firebase.google.com/project/deheb-5ac6b
2. Authentication → Sign-in method → فعّل **Email/Password**
3. Users → **Add user** وأدخل ايميل وكلمة سر
4. ادخل بهذه البيانات في صفحة Login

## رفع قواعد الأمان
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

## النشر على Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

سيتم نشر التطبيق على:
`https://deheb-5ac6b.web.app`

## ملاحظات أمنية
- قواعد Firestore و Storage تمنع الوصول غير المسجل (`request.auth != null`).
- لا تسجّل أحدا من واجهة Login (لا يوجد signup) - الحسابات تُنشأ من Console فقط.
- لا ترفع ملف `.env` لو أضفته.
