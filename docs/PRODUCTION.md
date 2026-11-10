# دليل الإنتاج الكامل — Gamers Matrix

هذا الدليل يشرح **كل ميزات الموقع** وكيف تعمل، ثم كيف تنشره في الإنتاج
بأمان، مع تفصيل كامل لنظام الكاش **Redis** ومكوّناته.

---

## 1️⃣ ما هي ميزات الموقع؟ (خريطة كاملة)

الموقع متجر منتجات رقمية (أكواد ألعاب وشحن) بلغتين (عربي RTL / إنجليزي)،
مبني على: **Next.js 15 + NestJS 11 + Prisma + Supabase PostgreSQL + Redis + Paymob**.

### 🗄️ الطبقة الخلفية (apps/api — NestJS)

| الوحدة | الميزة | تفاصيل مهمة |
|--------|--------|-------------|
| `auth` | تسجيل دخول عبر **Supabase Auth** | التحقق من JWT عبر JWKS (مفتاح Supabase العام — لا سرّ مخزن). الأدمن يُقرأ من جدول `User` في قاعدة المتجر، مع إدارة صلاحيات Roles/Permissions |
| `products` | كتالوج المنتجات | بحث، فرز، فلترة حسب التصنيف/المنصّة/السعر، عرض بالعربي/الإنجليزي، كاش Redis |
| `categories` | التصنيفات | شجرة تصنيفات لكل لغة، كاش Redis |
| `store` | إعدادات المتجر العامة | الاسم/العملة/التوقيت/الشعارات — كاش Redis |
| `cart` | سلة المشتريات | خاصة بكل مستخدم (لا تُحفظ في الكاش أبداً) |
| `orders` | الطلبات | إنشاء طلب، تسليم الأكواد تلقائياً بعد الدفع، سجل الحالات |
| `payments` | **Paymob** (EGP) | دفع حقيقي بالمفاتيح، Webhook بتحقق HMAC `fail-closed` (يرفض أي توقيع ناقص في الإنتاج)، ووضع تجريبي محلي بدون مفاتيح |
| `wishlist` | المفضلة | لكل مستخدم |
| `reviews` | تقييمات المنتجات | مرتبطة بالمنتج والمستخدم |
| `admin` | لوحة تحكم | إدارة منتجات/تصنيفات/أكواد/طلبات/حملات — وبعد أي تعديل **يُبطِل كاش الكتالوج تلقائياً** |
| `campaigns` | الحملات والتخفيضات | خصومات مجدولة |
| `content` | صفحات المحتوى | صفحات نصية بطابع CMS |
| `media` | رفع الوسائط | تحقق **magic-bytes** + حد حجم + مجلد `uploads/` |
| `mail` | إشعارات البريد | SMTP حقيقي في الإنتاج؛ بدونه وضع preview فقط |
| `audit` | سجل التدقيق | من فعل ماذا (للتتبّع الأمني) |
| `publishing` | نشر مجدول | جدولة داخلية في Nest (بدون Redis/Bull) |
| `cache` | **Redis cache** | الموضوع كله في القسم 3 👇 |
| `cache/health` | فحص الصحة | `GET /health` — يفحص الـ DB والـ Cache ويُستخدم في Docker/Load Balancer |

### 🌐 الطبقة الأمامية (apps/web — Next.js 15)

| الصفحة | الميزة |
|--------|--------|
| `/` الرئيسية | عرض البيع مميز مع ترويسات `stale-while-revalidate` |
| `/products` | كتالوج مع فلاتر وبحث |
| `/cart` | السلة والدفع (لا تُستخدم هنا أي من الكاش) |
| `/account` | طلباتي وأكوادي (`no-store`) |
| `/admin` | لوحة الإدارة (`no-store`) |
| `/robots.txt`, `/sitemap.xml` | SEO |

كذلك: `next-intl` (عربي/إنجليزي)، رؤوس أمان، وكاش من طرف المتصفح لطلبات الكتالوج العامة في `lib/api.ts`.

---

## 2️⃣ متغيرات البيئة الكاملة (قبل الإنتاج)

انسخ `apps/api/.env.example` إلى `apps/api/.env` واملأه:

### قاعدة البيانات (Supabase)
```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&sslmode=require"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_ADMIN_EMAILS="owner@example.com,admin2@example.com"
```

### الإعدادات العامة (مهم جداً)
```env
NODE_ENV="production"
PORT=3001
# عدة نطاقات مفصولة بفواصل (النطاق + www + نطاق تجريبي)
FRONTEND_URL="https://gamersmatrix.com,https://www.gamersmatrix.com"
# يخبر الـ throttler أن يقرأ عنوان الزائر الحقيقي إذا كنت خلف Nginx/CDN
TRUST_PROXY="true"
```

### Redis
```env
REDIS_URL="redis://redis:6379"              # داخل شبكة Docker
# REDIS_URL="redis://:PASSWORD@redis:6379"  # إن فعّلت كلمة مرور
# REDIS_DISABLED="true"                     # إجبار كاش الذاكرة فقط (للتشخيص)
```

### Paymob (للتشغيل الحقيقي)
```env
PAYMOB_API_KEY="..."
PAYMOB_SECRET_KEY="..."
PAYMOB_PUBLIC_KEY="..."
PAYMOB_INTEGRATION_ID="..."
PAYMOB_HMAC_SECRET="..."     # إلزامي في الإنتاج — بدونه يرفض الـ webhook كل الطلبات (fail-closed)
PAYMOB_BASE_URL="https://accept.paymob.com/v1"
```

### البريد (اختر مزوّداً حقيقيّاً: Brevo / Resend / SES)
```env
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
```

> أيضاً في `apps/web/.env.local`: `NEXT_PUBLIC_API_URL` و`NEXT_PUBLIC_SITE_URL`
> يشيران إلى عناوين الإنتاج.

---

## 3️⃣ Redis — الشرح الكامل 🧠

### لماذا Redis أصلاً؟
قاعدة البيانات (Supabase) نمرة عبر الإنترنت وتتأخر عشرات المللي ثانية لكل استعلام.
أكثر الزوار يطلبون **نفس** صفحات المنتجات، لذا نخزّن إجابات هذه الصفحات في Redis
نفردها في أقل من ميلّي ثانية طلباً بعد الطلب الأول.

**النتيجة:** سرعة إحساس فوري للزائر + حماية قاعدة البيانات من الضغط.

### ماذا يُخزّن في Redis؟

| المفتاح | نمط المفتاح | TTL | متى يُعاد بناؤه |
|---------|-------------|-----|-----------------|
| قائمة المنتجات | `gm:products:list:{filters}` | **45 ث** | عند الطلب الأول التالي |
| تفاصيل منتج | `gm:product:{lang}:{slug}` | **90 ث** | عند الطلب الأول التالي |
| التصنيفات | `gm:categories:{lang}` | **120 ث** | عند الطلب الأول التالي |
| إعدادات المتجر | `gm:store:public` | **180 ث** | عند الطلب الأول التالي |

المفاتيح مصمّمة بعناية: بارامترات الفلترة تُرتّب أبجدياً قبل التركيب، فنضمن أن
طلبين مختلفين بنفس الفلاتر يولّدان نفس المفتاح — وهذا أساس الـ **cache-hit**.

> ما لا يُخزّن أبداً: السلة، الطلبات، الأكواد، بيانات المستخدم، لوحة الإدارة —
> أي شيء شخصي أو حساس يبقى `no-store`.

### آلية الإبطال (Cache Invalidation) — أهم جزء

عند أي تعديل إداري (إضافة/تعديل/حذف منتج أو تصنيف أو إعدادات المتجر) ينادي
`admin.service.ts` على:

```
cache.invalidateCatalog()  →   تحذف كل المفاتيح: gm:products:* و gm:product:* و gm:categories:*
cache.invalidateStore()    →   تحذف كل المفاتيح: gm:store:*
```

الحذف يتم عبر **SCAN + DEL** (وليس `KEYS` — المحظورة في الإنتاج لأنها تُجمّد الخادم).

**النتيجة:** الزائر لا يرى أبداً منتجاً قديماً أو سعراً خاطئاً — أي تغيير إداري يظهر
خلال ثوانٍ، بدل انتظار انتهاء TTL.

### استراتيجية الـ Fail-Safe (أهم ميزة)

`redis-cache.service.ts` يعمل بثلاثة أوضاع آمنة:

1. **Redis متصل** → يخزّن ويقرأ بـ `SET key value EX ttl`.
2. **Redis يتعطل** → يتحول تلقائياً لكاش في الذاكرة (Map داخل العملية) مع TTL يدوي،
   فيستمر الموقع بالعمل بسرعة جيدة **دون أن يتوقف**.
3. **Redis disabled** → `REDIS_DISABLED=true` يفرض الوضع الذاكري فقط (لتشخيص الكاش).

كاش الذاكرة محدود بـ **10,000 مفتاح** مع إخلاء تدريجي 10% — صُمم ليمنع
نفاد الذاكرة إذا تعطل Redis أثناء ذروة الزيارات.

### إعدادات Redis الإنتاجية (`docker-compose.prod.yml`)

```
appendonly yes               → مثابرة على القرص (AOF): لا تفقد كثيراً بعد إعادة التشغيل
maxmemory 512mb              → حد الذاكرة من داخل Redis
maxmemory-policy allkeys-lru → عند الامتلاء أطلق الأقدم استخداماً بدل رفض الطلبات
save 900 1 / save 300 10     → snapshots احتياطية (RDB)
slowlog > 10ms               → تُسجَّل الاستعلامات البطيئة داخل Redis نفسه
```

> **لماذا `allkeys-lru`؟** مفاتيحنا قصيرة العمر أصلاً (45-180ث)، فالإخلاء الأقدم
> أولاً منطقي وبدون خسارة، بالعكس، لو سمحنا بالامتلاء الكامل لرفض الطلبات.

### كيف تتحقق أن Redis يعمل فعلاً؟

```bash
# داخل الخادم (أو محلياً بعد docker compose up)
docker exec -it gamersmatrix-redis-prod redis-cli

# 1) هل الاتصال يعمل؟
PING               # ← PONG

# 2) كم مفتاح في الكاش الآن؟
DBSIZE

# 3) إحصاءات مفاتيح كل قاعدة
INFO keyspace

# 4) استعرض مفاتيح الكتالوج الفعلية
SCAN 0 MATCH gm:* COUNT 50

# 5) كم ثانية متبقية على مفتاح (-1 دائم، -2 غير موجود)
TTL "gm:products:list:page=1&sort=new"

# 6) راقب البث الحقيقي (التطوير فقط!)
MONITOR            # Ctrl+C للخروج

# 7) عبر الـ API — تأكد أن الخادم متّصل بـ Redis وليس fallback
curl http://localhost:3001/health
#   → {"status":"ok","db":true,"cache":"redis",...}
```

### مراقبة الحالة أثناء التشغيل

```bash
INFO stats
#   ابحث عن: keyspace_hits / keyspace_misses
#   نسبة الإصابة المطلوبة في الموقع الحقيقي: > 90%

INFO memory
INFO clients
INFO server
SLOWLOG GET 10     # آخر 10 استعلامات بطيئة
```

> لتعديل دقّة الأسعار معًا عليك تغيير TTL في `apps/api/src/cache/cache-keys.ts`
> وإعادة بناء الـ API (`npm run build:api`).

---

## 4️⃣ نشر الإنتاج خطوة بخطوة 🚀

### الطريقة الموصى بها: VPS + Docker Compose

```bash
# على الخادم (Ubuntu 22+):
# 1) Docker + Compose plugin
curl -fsSL https://get.docker.com | sh

# 2) اجلب الكود
git clone <your-repo> /srv/gamersmatrix
cd /srv/gamersmatrix

# 3) انسخ وأكمل .env الإنتاجية
cp apps/api/.env.example apps/api/.env
nano apps/api/.env        # املأ كما في القسم 2

# 4) طبّق migrations على Supabase مرة واحدة (من جهازك أو الخادم)
npm ci
npm run db:deploy

# 5) شغّل الحاويات
docker compose -f docker-compose.prod.yml --env-file apps/api/.env up -d --build

# 6) تحقق
curl http://127.0.0.1:3001/health
#   → {"status":"ok","db":true,"cache":"redis",...}
```

### الواجهة (Next.js) — اختَر واحداً

**الخيار A (الأسهل): Vercel**
1. اربط مستودع GitHub في vercel.com → New Project
2. Root Directory: `apps/web`
3. متغيرات البيئة:
   - `NEXT_PUBLIC_API_URL=https://api.gamersmatrix.com`
   - `NEXT_PUBLIC_SITE_URL=https://gamersmatrix.com`

**الخيار B:** نفس الـ VPS (Nginx reverse proxy للويب وال API معاً) — راجع نموذج
الـ nginx بالأسفل.

### Nginx reverse proxy للـ API

```nginx
server {
  listen 443 ssl http2;
  server_name api.gamersmatrix.com;

  # TLS: شهادة Let's Encrypt
  # certbot --nginx -d api.gamersmatrix.com

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }

  # حماية الـ webhook من brute-force
  location /payments/webhook {
    limit_req zone=webhook burst=10 nodelay;
    proxy_pass http://127.0.0.1:3001;
  }
}

# limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;
```

---

## 5️⃣ قائمة تحقق الإنتاج النهائية ✅

- [ ] `NODE_ENV=production` في `apps/api/.env`
- [ ] `DATABASE_URL` + `DIRECT_URL` يشيران إلى **Supabase الإنتاج**
- [ ] نُفّذ `npm run db:deploy`، و`SEED_ALLOW_RESET` يبقى `false` في الإنتاج
- [ ] `SUPABASE_ADMIN_EMAILS` بالبريد الذي يصبح أدمن عند أول تسجيل دخول
- [ ] `REDIS_URL` صحيح و مُتصل — تأكد من `/health` بـ `cache:"redis"`
- [ ] مفاتيح Paymob كاملة + `PAYMOB_HMAC_SECRET` (بدونها لا دفع حقيقي، والـ webhook يرفض)
- [ ] `FRONTEND_URL` يضم كل نطاقات الواجهة (مفصولة بفواصل)
- [ ] `TRUST_PROXY=true` إذا كان الـ API خلف Nginx أو CDN
- [ ] SMTP حقيقي للإشعارات (بدونه تبقى الإشعارات معطّلة في الإنتاج)
- [ ] DNS: `api.domain.com` → الـ VPS، `domain.com` → Vercel (أو نفس الـ VPS)
- [ ] Google & Discord OAuth فعّلتَ في **Supabase Dashboard → Auth → Providers**
      + إضافة `https://<domain>/**/auth/callback` في **Redirect URLs**
- [ ] `docker compose -f docker-compose.prod.yml up -d` يعطي `/health` OK
- [ ] تفعيل النسخ الاحتياطية في Supabase (Settings → Database → Backups)

---

## 6️⃣ التحسينات الإنتاجية التي أُضيفت للشيفر

| التحسين | الملف | التفسير |
|---------|-------|---------|
| Graceful shutdown (SIGTERM يستدعي `onModuleDestroy`) | `main.ts` | Docker/PM2/K8s يرسل SIGTERM قبل الإيقاف → تُغلق اتصالات Redis وPrisma وتنجز الطلبات بدل قطع الاتصال في منتصف العملية |
| Gzip delivery | `main.ts` + `compression` | إجابات JSON تفقد ~70% من حجمها بالضغط |
| CORS متعدد النطاقات | `main.ts` | `FRONTEND_URL=a.com,b.com` — كل نطاق مقبول تلقائياً |
| إخفاء تفاصيل أخطاء التحقق في الإنتاج | `main.ts` (`disableErrorMessages`) | المستخدم الخارجي لا يرى تفاصيل whitelist الداخلية |
| Trust proxy | `main.ts` | rate limit يرى عناوين IP الحقيقية وليس عنوان الوكيل |
| Health probe | `cache/health.controller.ts` | `GET /health` يفحص DB + cache؛ الـ Load Balancer/Docker يوقف التوصيل عند عدم توفره |
| Dockerfile إنتاج (multi-stage، non-root) | `apps/api/Dockerfile` | يشغّل بالمستخدم `app` غير الجذر، مع `HEALTHCHECK` و`STOPSIGNAL SIGTERM` |
| Compose إنتاج بحدود موارد وسجلات | `docker-compose.prod.yml` | حدود ذاكرة Redis 768M / API 1024M، سجلات تقليم 10M × 5 ملفات، Redis بدون منفذ عام |
| كاش fallback محدود | `redis-cache.service.ts` | 10,000 مفتاح كحد أقصى مع إخلاء تدريجي — لا OOM إذا تعطل Redis |
| عدم فقدان الخدمة عند تعطل Redis | `redis-cache.service.ts` | ينتقل تلقائياً للذاكرة، ولا يفشل أي طلب |

---

## 7️⃣ مراجع إضافية

- `docs/IMPLEMENTATION_PLAN.md` — الخطة الهندسية الكاملة
- `docs/SUPABASE.md` — إعداد قاعدة البيانات وOAuth
- `apps/api/docs/EMAIL.md` — بقية تفاصيل البريد

### للاختبار المحلي النشِط

```bash
docker compose up -d        # postgres + redis
npm run db:migrate          # طبّق schema
npm run db:seed             # بيانات تجريبية (SEED_ALLOW_RESET=true في dev)
npm run dev                 # يشغّل الويب والـ API معاً
```
