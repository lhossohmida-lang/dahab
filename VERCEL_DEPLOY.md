# نشر تطبيق دهب على Vercel

هذا المشروع جاهز للنشر على Vercel بعد استبدال Ollama بـ Gemini API.

## 1. ارفع المستودع

المستودع:

```txt
https://github.com/lhossohmida-lang/dahab
```

## 2. أنشئ مشروعًا في Vercel

1. ادخل إلى Vercel.
2. اختر `Add New Project`.
3. اربط GitHub.
4. اختر مستودع `lhossohmida-lang/dahab`.
5. اترك Framework كما هو أو اختر `Vite`.

إعدادات البناء:

```txt
Build Command: npm run build
Output Directory: dist
```

## 3. أضف Environment Variables

في Vercel:

```txt
Project Settings -> Environment Variables
```

أضف:

```txt
GEMINI_API_KEY=ضع_مفتاح_Gemini_هنا
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=deheb-5ac6b
```

لا تضع مفتاح Gemini داخل الكود ولا ترفعه إلى GitHub.

## 4. انشر المشروع

اضغط `Deploy`.

بعد النشر سيعطيك Vercel رابطًا مثل:

```txt
https://dahab.vercel.app
```

## 5. أضف دومين Vercel في Firebase

ادخل Firebase Console:

```txt
Authentication -> Settings -> Authorized domains
```

أضف دومين Vercel:

```txt
dahab.vercel.app
```

وأضف دومين العميل إذا استعملته لاحقًا.

## 6. اختبار مساعد AI

بعد تسجيل الدخول إلى لوحة الإدارة:

1. افتح `مساعد AI`.
2. اسأل: `ما هي المنتجات الموجودة؟`
3. يجب أن يقرأ المساعد بيانات Firestore ويرد عبر Gemini.

## ملاحظات

- لا تحتاج VPS.
- لا تحتاج Ollama.
- `/api/ai-chat` يعمل كـ Vercel Function.
- قاعدة البيانات تبقى Firebase.
