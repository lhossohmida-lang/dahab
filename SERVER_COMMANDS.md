# أوامر تشغيل ونشر تطبيق دهب

## Vercel

هذا هو الخيار الأرخص والأسهل بعد التحويل إلى Gemini API.

1. افتح Vercel واختر المستودع:

```txt
lhossohmida-lang/dahab
```

2. أضف Environment Variables:

```txt
GEMINI_API_KEY=ضع_مفتاح_Gemini_هنا
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_PROJECT_ID=deheb-5ac6b
```

3. إعدادات البناء:

```txt
Build Command: npm run build
Output Directory: dist
```

4. بعد النشر، أضف دومين Vercel في Firebase:

```txt
Firebase Console -> Authentication -> Settings -> Authorized domains
```

## VPS اختياري

إذا أردت تشغيله على VPS بدل Vercel:

```bash
apt update && apt upgrade -y
apt install -y git curl nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

تحميل المشروع:

```bash
cd /var/www
git clone https://github.com/lhossohmida-lang/dahab.git
cd dahab
npm ci
npm run build
```

إنشاء ملف البيئة:

```bash
nano .env
```

ضع:

```txt
PORT=3001
FIREBASE_PROJECT_ID=deheb-5ac6b
GEMINI_API_KEY=ضع_مفتاح_Gemini_هنا
GEMINI_MODEL=gemini-2.5-flash
```

تشغيل دائم بـ PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

بعد `pm2 startup` انسخ الأمر الذي يظهر لك ونفذه.

تحديث لاحق:

```bash
cd /var/www/dahab
git pull
npm ci
npm run build
pm2 restart dahab
```

## Nginx للـ VPS

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  client_max_body_size 20M;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

اختبار وتشغيل Nginx:

```bash
nginx -t
systemctl reload nginx
```
