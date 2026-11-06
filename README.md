# Gamers Matrix

متجر منتجات رقمية (أكواد ألعاب وشحن) بواجهة عربية RTL، مبني بـ **Next.js + NestJS + Tailwind CSS** مع تكامل **Paymob** للدفع المصري (EGP).

## الهيكل

```
GamersMatrix/
  apps/web   # واجهة المتجر (Next.js 15)
  apps/api   # واجهة برمجية (NestJS + Prisma)
  docker-compose.yml  # PostgreSQL اختياري للإنتاج
```

## المتطلبات

- Node.js 20+
- npm

قاعدة البيانات الافتراضية للتطوير: **SQLite** (`apps/api/prisma/dev.db`).

## التشغيل السريع

من جذر المشروع (Turbo يشغّل الـ API والـ Web معاً):

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

| الخدمة | الرابط |
|--------|--------|
| Web | http://localhost:3000 |
| API | http://localhost:3001 |

تشغيل خدمة واحدة فقط: `npm run dev:web` أو `npm run dev:api`

## الإنتاج (Build + Start)

```bash
npm run build
npm run start
```

قبل إعلان جاهزية الإنتاج تأكد من:

1. `JWT_SECRET` بطول ≥ 32 حرفاً و`NODE_ENV=production`
2. ترحيل قاعدة البيانات (`npm run db:migrate`) وبيانات أولية حسب الحاجة
3. مفاتيح Paymob كاملة بما فيها `PAYMOB_HMAC_SECRET` إن كان الدفع حياً
4. `FRONTEND_URL` و`API_PUBLIC_URL` و`NEXT_PUBLIC_SITE_URL` و`NEXT_PUBLIC_API_URL` تشير لأصول الإنتاج
5. مزوّد بريد حقيقي إن أردت إشعارات؛ بدون SMTP يبقى الوضع preview فقط (معطّل في الإنتاج)
6. عدم الاعتماد على بيانات الـ fixture التجريبية (مُعطّلة تلقائياً عند `NODE_ENV=production`)

## حسابات تجريبية (بعد seed)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| Admin | admin@gamersmatrix.com | Admin123! |
| User | demo@gamersmatrix.com | Demo123! |

غيّر كلمات المرور فوراً في أي بيئة مشتركة أو إنتاج.

## الدفع (Paymob)

ضع مفاتيح Paymob في `apps/api/.env` — انظر `apps/api/.env.example`.

إذا كانت المفاتيح فارغة، يعمل المتجر في **وضع تجريبي**: إنشاء الطلب وتسليم الأكواد دون بوابة دفع حقيقية.

Webhook HMAC: يُرفض التوقيع الفارغ في الإنتاج أو عند تهيئة Paymob (fail-closed).

## متغيرات البيئة

- `apps/api/.env.example`
- `apps/web/.env.example`

نسخ محلية: `apps/api/.env` و`apps/web/.env.local` (غير مُتتبَّعة في Git).

## الأمان (ملخص)

- JWT عبر `Authorization: Bearer` (محلي في المتصفح) — حماية الـ API على الخادم عبر Roles/Permissions
- Helmet على الـ API؛ رؤوس أمان أساسية على الويب
- رفع الوسائط: تحقق magic-bytes + حد حجم؛ مجلد `uploads/` في `.gitignore`
- حساب/إدارة: `Cache-Control: private, no-store`

## الصفحات

- `/` الصفحة الرئيسية
- `/products` المنتجات
- `/cart` السلة والدفع
- `/account` الطلبات والأكواد
- `/admin` لوحة الإدارة
- `/robots.txt` و`/sitemap.xml`

## PostgreSQL (اختياري)

1. شغّل `docker compose up -d`
2. غيّر في `schema.prisma` الـ provider إلى `postgresql`
3. حدّث `DATABASE_URL` في `.env`
4. أعد `prisma migrate dev`
