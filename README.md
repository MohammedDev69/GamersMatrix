# Gamers Matrix

متجر منتجات رقمية (أكواد ألعاب وشحن) بواجهة عربية RTL، مبني بـ **Next.js + NestJS + Tailwind CSS** مع تكامل **Paymob** للدفع المصري (EGP).

## الهيكل

```
GamersMatrix/
  apps/web   # واجهة المتجر (Next.js 15)
  apps/api   # واجهة برمجية (NestJS + Prisma)
  docs/SUPABASE.md  # إعداد PostgreSQL وAuth على Supabase
```

## المتطلبات

- Node.js 20+
- npm

قاعدة البيانات: **Supabase PostgreSQL** عبر Prisma. المصادقة عبر **Supabase Auth**
(البريد الإلكتروني، Google، Discord). راجع `docs/SUPABASE.md` للإعداد والنقل من
SQLite القديم.

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

الدليل الكامل للنشر في الإنتاج — بما فيه تعليم **Redis** بالكامل وكل ميزات الموقع —
موجود في [`docs/PRODUCTION.md`](docs/PRODUCTION.md).

قبل إعلان جاهزية الإنتاج تأكد من:

1. ضبط متغيرات Supabase ووصلي `DATABASE_URL` و`DIRECT_URL`
2. نشر baseline قاعدة البيانات (`npm run db:deploy`) ونقل البيانات حسب الحاجة
3. مفاتيح Paymob كاملة بما فيها `PAYMOB_HMAC_SECRET` إن كان الدفع حياً
4. `FRONTEND_URL` و`API_PUBLIC_URL` و`NEXT_PUBLIC_SITE_URL` و`NEXT_PUBLIC_API_URL` تشير لأصول الإنتاج — `TRUST_PROXY=true` إذا ال API خلف Nginx/CDN
5. مزوّد بريد حقيقي إن أردت إشعارات؛ بدون SMTP يبقى الوضع preview فقط (معطّل في الإنتاج)
6. تفعيل Google وDiscord وإضافة Redirect URLs في Supabase Dashboard

## الحسابات والصلاحيات

الحسابات تُنشأ وتُدار في Supabase Auth. البريد الموجود في
`SUPABASE_ADMIN_EMAILS` يحصل على دور الأدمن عند أول تسجيل دخول؛ ولا توجد كلمات
مرور تجريبية داخل قاعدة بيانات المتجر.

## الدفع (Paymob)

ضع مفاتيح Paymob في `apps/api/.env` — انظر `apps/api/.env.example`.

إذا كانت المفاتيح فارغة، يعمل المتجر في **وضع تجريبي**: إنشاء الطلب وتسليم الأكواد دون بوابة دفع حقيقية.

Webhook HMAC: يُرفض التوقيع الفارغ في الإنتاج أو عند تهيئة Paymob (fail-closed).

## متغيرات البيئة

- `apps/api/.env.example`
- `apps/web/.env.example`

نسخ محلية: `apps/api/.env` و`apps/web/.env.local` (غير مُتتبَّعة في Git).

## الأمان (ملخص)

- Supabase JWT عبر `Authorization: Bearer` مع تحقق JWKS — وحماية الـ API عبر Roles/Permissions
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

## Supabase

الدليل الكامل لإنشاء المشروع، نشر migrations، نقل SQLite، وتفعيل Google وDiscord:
`docs/SUPABASE.md`.
