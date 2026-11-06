import 'dotenv/config';
import {
  PrismaClient,
  Prisma,
  Role,
  KeyStatus,
  ProductKind,
  PublicationStatus,
  CouponType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type SeedProduct = {
  title: string;
  titleEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  imageUrl: string;
  platform: string;
  priceEGP: number;
  originalPrice?: number;
  discountPct?: number;
  featured?: boolean;
  weeklyDeal?: boolean;
  hot?: boolean;
  isNew?: boolean;
  kind?: ProductKind;
  deliveryNote?: string;
  deliveryNoteEn?: string;
  soldCount?: number;
  categorySlug: string;
  keys: string[];
};

async function main() {
  console.log('Seeding Gamers Matrix database...');

  // Dev seed is intentionally destructive and re-runnable locally.
  // Set SEED_RESET=false to skip wipe (not implemented — always resets in development).
  await prisma.auditLog.deleteMany();
  await prisma.publicationRevision.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.contentPage.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productKey.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSettings.deleteMany();

  const categories = [
    {
      name: 'ألعاب',
      nameEn: 'Games',
      slug: 'games',
      description: 'أحدث الألعاب الرقمية',
      descriptionEn: 'Latest digital games',
      icon: 'gamepad',
    },
    {
      name: 'إصدارات جديدة',
      nameEn: 'New Releases',
      slug: 'new-releases',
      description: 'أحدث الإصدارات',
      descriptionEn: 'Newest releases',
      icon: 'sparkles',
    },
    {
      name: 'عروض',
      nameEn: 'Offers',
      slug: 'offers',
      description: 'خصومات وعروض خاصة',
      descriptionEn: 'Special deals and discounts',
      icon: 'tag',
    },
    {
      name: 'إضافات',
      nameEn: 'DLC',
      slug: 'dlc',
      description: 'إضافات ومحتوى قابل للتنزيل',
      descriptionEn: 'Downloadable content',
      icon: 'puzzle',
    },
    {
      name: 'بطاقات هدايا',
      nameEn: 'Gift Cards',
      slug: 'gift-cards',
      description: 'بطاقات شحن وهدايا للمنصات',
      descriptionEn: 'Platform gift cards and wallets',
      icon: 'credit-card',
    },
    {
      name: 'شحن مباشر',
      nameEn: 'Direct Top-ups',
      slug: 'top-ups',
      description: 'شحن ألعاب الموبايل مباشرة',
      descriptionEn: 'Direct mobile game top-ups',
      icon: 'zap',
    },
    {
      name: 'أجهزة',
      nameEn: 'Hardware',
      slug: 'hardware',
      description: 'أجهزة وإكسسوارات',
      descriptionEn: 'Devices and accessories',
      icon: 'cpu',
    },
    {
      name: 'تفعيل حسابات',
      nameEn: 'Account Activation',
      slug: 'account-activation',
      description: 'خدمات تفعيل حسابات الألعاب والمنصات',
      descriptionEn: 'Game and platform account activation',
      icon: 'key-round',
    },
    {
      name: 'ديسكورد نيترو',
      nameEn: 'Discord Nitro',
      slug: 'discord-nitro',
      description: 'روابط اشتراك Discord Nitro',
      descriptionEn: 'Discord Nitro subscription links',
      icon: 'sparkles',
    },
    {
      name: 'يوزرات ديسكورد',
      nameEn: 'Discord Usernames',
      slug: 'discord-usernames',
      description: 'يوزرات ديسكورد نادرة ومميزة',
      descriptionEn: 'Rare Discord usernames',
      icon: 'at-sign',
    },
    {
      name: 'يوزرات سوشيال',
      nameEn: 'Social Usernames',
      slug: 'social-usernames',
      description: 'يوزرات إنستجرام وتيك توك وغيرها',
      descriptionEn: 'Instagram, TikTok and more',
      icon: 'instagram',
    },
  ];

  const createdCategories = await Promise.all(
    categories.map((category) => prisma.category.create({ data: category })),
  );

  const categoryBySlug = Object.fromEntries(
    createdCategories.map((c) => [c.slug, c]),
  );

  const adminHash = await bcrypt.hash('Admin123!', 10);
  const demoHash = await bcrypt.hash('Demo123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'mohammed1.nasr.elshreef@gmail.com',
      passwordHash: adminHash,
      name: 'Mohammed',
      role: Role.ADMIN,
      cart: { create: {} },
    },
  });

  const demo = await prisma.user.create({
    data: {
      email: 'demo@gamersmatrix.com',
      passwordHash: demoHash,
      name: 'Demo User',
      role: Role.USER,
      cart: { create: {} },
    },
  });

  const editorHash = await bcrypt.hash('Editor123!', 10);
  const editor = await prisma.user.create({
    data: {
      email: 'editor@gamersmatrix.com',
      passwordHash: editorHash,
      name: 'Editor User',
      role: Role.EDITOR,
      cart: { create: {} },
    },
  });

  await prisma.storeSettings.create({
    data: {
      id: 'default',
      storeName: 'Gamers Matrix',
      defaultLocale: 'ar',
      currencyCode: 'EGP',
      timezone: 'Africa/Cairo',
    },
  });

  const products: SeedProduct[] = [
    {
      title: 'God of War Ragnarök',
      titleEn: 'God of War Ragnarök',
      slug: 'god-of-war-ragnarok',
      description:
        'انضم إلى كراتوس وأتريوس في رحلة ملحمية عبر العوالم التسعة في God of War Ragnarök.',
      descriptionEn:
        'Join Kratos and Atreus on an epic journey across the Nine Realms.',
      imageUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      platform: 'Steam',
      priceEGP: 1899,
      originalPrice: 2299,
      discountPct: 17,
      featured: true,
      hot: true,
      categorySlug: 'games',
      keys: [
        'GOWR-AAAA-1111-SEED',
        'GOWR-BBBB-2222-SEED',
        'GOWR-CCCC-3333-SEED',
      ],
    },
    {
      title: 'Elden Ring',
      titleEn: 'Elden Ring',
      slug: 'elden-ring',
      description:
        'استكشف عالم Lands Between في تحفة FromSoftware الحائزة على جوائز.',
      descriptionEn: 'Explore the Lands Between in FromSoftware’s acclaimed epic.',
      imageUrl:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
      platform: 'Steam',
      priceEGP: 1499,
      featured: true,
      hot: true,
      categorySlug: 'games',
      keys: [
        'ELDN-AAAA-1111-SEED',
        'ELDN-BBBB-2222-SEED',
        'ELDN-CCCC-3333-SEED',
      ],
    },
    {
      title: "Marvel's Spider-Man 2",
      slug: 'spiderman-2',
      description:
        'العب كـ Peter Parker و Miles Morales في مغامرة أبطال خارقين لا تُنسى.',
      imageUrl:
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 1999,
      featured: true,
      categorySlug: 'new-releases',
      keys: [
        'SPM2-AAAA-1111-SEED',
        'SPM2-BBBB-2222-SEED',
        'SPM2-CCCC-3333-SEED',
      ],
    },
    {
      title: 'Hogwarts Legacy',
      slug: 'hogwarts-legacy',
      description:
        'عش تجربة ساحر في عالم Harry Potter المفتوح — عرض الأسبوع بخصم 35%.',
      imageUrl:
        'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=800&q=80',
      platform: 'PC',
      priceEGP: 974,
      originalPrice: 1499,
      discountPct: 35,
      featured: true,
      weeklyDeal: true,
      categorySlug: 'offers',
      keys: [
        'HOGW-AAAA-1111-SEED',
        'HOGW-BBBB-2222-SEED',
        'HOGW-CCCC-3333-SEED',
        'HOGW-DDDD-4444-SEED',
      ],
    },
    {
      title: 'FC 25',
      slug: 'fc-25',
      description: 'تجربة كرة القدم الجديدة مع تحديثات اللعب والأندية الرسمية.',
      imageUrl:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 2199,
      featured: true,
      categorySlug: 'games',
      keys: ['FC25-AAAA-1111-SEED', 'FC25-BBBB-2222-SEED'],
    },
    {
      title: 'Call of Duty: Black Ops 6',
      slug: 'cod-black-ops-6',
      description:
        'حملة مشوقة وأطوار متعددة اللاعبين في أحدث إصدارات Call of Duty.',
      imageUrl:
        'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
      platform: 'Xbox Series X|S',
      priceEGP: 2499,
      featured: true,
      categorySlug: 'new-releases',
      keys: ['BO6X-AAAA-1111-SEED', 'BO6X-BBBB-2222-SEED'],
    },
    {
      title: 'The Last of Us Part I',
      slug: 'the-last-of-us-part-1',
      description: 'النسخة المعاد صنعها من الكلاسيكية الشهيرة بجودة جيل جديد.',
      imageUrl:
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
      platform: 'PC',
      priceEGP: 1299,
      featured: true,
      categorySlug: 'games',
      keys: ['TLOU-AAAA-1111-SEED', 'TLOU-BBBB-2222-SEED'],
    },
      {
      title: 'PlayStation Store 500 EGP',
      slug: 'psn-500-egp',
      description: 'بطاقة شحن بلايستيشن ستور بقيمة 500 جنيه مصري.',
      imageUrl:
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
      platform: 'PlayStation',
      priceEGP: 520,
      kind: ProductKind.GIFT_CARD,
      deliveryNote: 'فعّل الكود من حسابك على PlayStation Store.',
      soldCount: 71,
      categorySlug: 'gift-cards',
      keys: ['PSN5-AAAA-1111-SEED', 'PSN5-BBBB-2222-SEED', 'PSN5-CCCC-3333-SEED'],
    },
    {
      title: 'Steam Wallet 300 EGP',
      slug: 'steam-300-egp',
      description: 'بطاقة شحن محفظة Steam بقيمة 300 جنيه.',
      imageUrl:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
      platform: 'Steam',
      priceEGP: 315,
      kind: ProductKind.GIFT_CARD,
      deliveryNote: 'فعّل الكود من محفظة Steam.',
      soldCount: 58,
      categorySlug: 'gift-cards',
      keys: ['STM3-AAAA-1111-SEED', 'STM3-BBBB-2222-SEED'],
    },
    {
      title: 'Cyberpunk 2077: Phantom Liberty',
      slug: 'cyberpunk-phantom-liberty',
      description: 'الإضافة الرسمية لـ Cyberpunk 2077 مع قصة تجسس جديدة.',
      imageUrl:
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      platform: 'PC',
      priceEGP: 899,
      originalPrice: 1099,
      discountPct: 18,
      featured: true,
      categorySlug: 'dlc',
      keys: ['CPPL-AAAA-1111-SEED', 'CPPL-BBBB-2222-SEED'],
    },
    {
      title: 'Grand Theft Auto V',
      slug: 'gta-v',
      description:
        'عيش حياة الإجرام في لوس سانتوس — قصة ملحمة وعالم مفتوح لا ينتهي.',
      imageUrl:
        'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
      platform: 'PC',
      priceEGP: 699,
      originalPrice: 999,
      discountPct: 30,
      featured: true,
      weeklyDeal: true,
      categorySlug: 'offers',
      keys: ['GTAV-AAAA-1111-SEED', 'GTAV-BBBB-2222-SEED', 'GTAV-CCCC-3333-SEED'],
    },
    {
      title: 'Red Dead Redemption 2',
      slug: 'red-dead-redemption-2',
      description:
        'ملحمة الغرب الأمريكي من Rockstar — قصة آرثر مورغان في عالم مفتوح مذهل.',
      imageUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 1199,
      originalPrice: 1599,
      discountPct: 25,
      featured: true,
      categorySlug: 'games',
      keys: ['RDR2-AAAA-1111-SEED', 'RDR2-BBBB-2222-SEED'],
    },
    {
      title: 'Hollow Knight',
      slug: 'hollow-knight',
      description:
        'مغامرة مترويدفينيا كلاسيكية تحت الأرض في مملكة هالونست المنسية.',
      imageUrl:
        'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80',
      platform: 'PC',
      priceEGP: 249,
      originalPrice: 399,
      discountPct: 38,
      featured: true,
      weeklyDeal: true,
      categorySlug: 'offers',
      keys: ['HLKN-AAAA-1111-SEED', 'HLKN-BBBB-2222-SEED', 'HLKN-CCCC-3333-SEED'],
    },
    {
      title: 'Mortal Kombat 1',
      slug: 'mortal-kombat-1',
      description:
        'إعادة بناء عالم Mortal Kombat مع قتال أسرع وشخصيات أيقونية.',
      imageUrl:
        'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 1599,
      featured: true,
      categorySlug: 'games',
      keys: ['MK01-AAAA-1111-SEED', 'MK01-BBBB-2222-SEED'],
    },
    {
      title: "Assassin's Creed Shadows",
      slug: 'assassins-creed-shadows',
      description:
        'استكشف اليابان الإقطاعية كنينجا وساموراي في أحدث إصدارات Assassin’s Creed.',
      imageUrl:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 2299,
      featured: true,
      categorySlug: 'new-releases',
      keys: ['ACSH-AAAA-1111-SEED', 'ACSH-BBBB-2222-SEED'],
    },
    {
      title: 'Tekken 8',
      slug: 'tekken-8',
      description: 'قتال ثلاثي الأبعاد بسرعة جنونية وأطور قصة متعددة الفصول.',
      imageUrl:
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 1799,
      originalPrice: 2199,
      discountPct: 18,
      featured: true,
      categorySlug: 'games',
      keys: ['TKN8-AAAA-1111-SEED', 'TKN8-BBBB-2222-SEED'],
    },
    {
      title: 'Diablo IV',
      slug: 'diablo-iv',
      description:
        'عد إلى سانتواريو في لعبة أكشن RPG مظلمة مع تعاون متعدد اللاعبين.',
      imageUrl:
        'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
      platform: 'PC',
      priceEGP: 1399,
      originalPrice: 1899,
      discountPct: 26,
      featured: true,
      weeklyDeal: true,
      categorySlug: 'offers',
      keys: ['DBL4-AAAA-1111-SEED', 'DBL4-BBBB-2222-SEED'],
    },
    {
      title: 'Baldur\'s Gate 3',
      slug: 'baldurs-gate-3',
      description:
        'حائز على لعبة العام — مغامرة تقمص أدوار مبنية على Dungeons & Dragons.',
      imageUrl:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
      platform: 'PC',
      priceEGP: 1699,
      featured: true,
      categorySlug: 'games',
      keys: ['BG3X-AAAA-1111-SEED', 'BG3X-BBBB-2222-SEED', 'BG3X-CCCC-3333-SEED'],
    },
    {
      title: 'Resident Evil 4 Remake',
      slug: 'resident-evil-4-remake',
      description:
        'إعادة صنع كلاسيكية الرعب بقيم إنتاجية جيل جديد وتجربة لعب محدّثة.',
      imageUrl:
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80',
      platform: 'PlayStation 5',
      priceEGP: 1099,
      originalPrice: 1499,
      discountPct: 27,
      featured: false,
      weeklyDeal: true,
      categorySlug: 'offers',
      keys: ['RE4R-AAAA-1111-SEED', 'RE4R-BBBB-2222-SEED'],
    },
    {
      title: 'Xbox Gift Card 400 EGP',
      slug: 'xbox-400-egp',
      description: 'بطاقة شحن Xbox بقيمة 400 جنيه مصري.',
      imageUrl:
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
      platform: 'Xbox',
      priceEGP: 415,
      kind: ProductKind.GIFT_CARD,
      deliveryNote: 'فعّل الكود من موقع Xbox أو داخل المتجر.',
      soldCount: 42,
      categorySlug: 'gift-cards',
      keys: ['XBX4-AAAA-1111-SEED', 'XBX4-BBBB-2222-SEED'],
    },
    {
      title: 'تفعيل حساب PlayStation',
      slug: 'psn-account-activation',
      description:
        'خدمة تفعيل حساب بلايستيشن مع دعم فني حتى اكتمال التفعيل بنجاح.',
      imageUrl:
        'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80',
      platform: 'PlayStation',
      priceEGP: 149,
      kind: ProductKind.SERVICE,
      deliveryNote:
        'بعد الدفع ستصلك تعليمات التفعيل عبر الطلب. تواصل مع الدعم عبر واتساب إن احتجت مساعدة.',
      soldCount: 88,
      featured: true,
      categorySlug: 'account-activation',
      keys: [
        'PSACT-STEP-001-SEED',
        'PSACT-STEP-002-SEED',
        'PSACT-STEP-003-SEED',
      ],
    },
    {
      title: 'تفعيل حساب Steam',
      slug: 'steam-account-activation',
      description: 'تفعيل حساب Steam أو استعادة الوصول بمساعدة فريق الدعم.',
      imageUrl:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
      platform: 'Steam',
      priceEGP: 99,
      kind: ProductKind.SERVICE,
      deliveryNote: 'سيصلك دليل التفعيل فوراً بعد الدفع في صفحة الطلبات.',
      soldCount: 64,
      categorySlug: 'account-activation',
      keys: ['STMACT-AAA-001-SEED', 'STMACT-AAA-002-SEED'],
    },
    {
      title: 'Discord Nitro شهري — رابط',
      slug: 'discord-nitro-monthly',
      description: 'رابط تفعيل Discord Nitro لمدة شهر — تسليم فوري.',
      imageUrl:
        'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&q=80',
      platform: 'Discord',
      priceEGP: 189,
      originalPrice: 249,
      discountPct: 24,
      kind: ProductKind.SERVICE,
      deliveryNote:
        'افتح الرابط وأنت مسجّل دخول بحساب ديسكورد المطلوب. الرابط لمرة واحدة.',
      soldCount: 156,
      featured: true,
      weeklyDeal: true,
      categorySlug: 'discord-nitro',
      keys: [
        'https://discord.com/billing/promotions/DEMO-NITRO-M1',
        'https://discord.com/billing/promotions/DEMO-NITRO-M2',
        'https://discord.com/billing/promotions/DEMO-NITRO-M3',
      ],
    },
    {
      title: 'Discord Nitro سنوي — رابط',
      slug: 'discord-nitro-yearly',
      description: 'رابط تفعيل Discord Nitro لمدة سنة.',
      imageUrl:
        'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&q=80',
      platform: 'Discord',
      priceEGP: 899,
      kind: ProductKind.SERVICE,
      deliveryNote: 'افتح الرابط من جهازك وأنت على الحساب الصحيح قبل التفعيل.',
      soldCount: 37,
      featured: true,
      categorySlug: 'discord-nitro',
      keys: [
        'https://discord.com/billing/promotions/DEMO-NITRO-Y1',
        'https://discord.com/billing/promotions/DEMO-NITRO-Y2',
      ],
    },
    {
      title: 'يوزر ديسكورد — 3 أحرف',
      slug: 'discord-username-3char',
      description: 'يوزر ديسكورد نادر من 3 أحرف — تسليم اليوزر بعد الدفع.',
      imageUrl:
        'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&q=80',
      platform: 'Discord',
      priceEGP: 499,
      kind: ProductKind.SERVICE,
      deliveryNote:
        'سيصلك اليوزر في الطلب. غيّر يوزرك من إعدادات ديسكورد خلال المهلة المحددة.',
      soldCount: 29,
      featured: true,
      categorySlug: 'discord-usernames',
      keys: ['usr_x3a_demo', 'usr_q7k_demo'],
    },
    {
      title: 'يوزر ديسكورد — 4 أحرف',
      slug: 'discord-username-4char',
      description: 'يوزر ديسكورد مميز من 4 أحرف.',
      imageUrl:
        'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&q=80',
      platform: 'Discord',
      priceEGP: 249,
      kind: ProductKind.SERVICE,
      deliveryNote: 'استلم اليوزر من صفحة الطلبات وفعّله فوراً.',
      soldCount: 51,
      categorySlug: 'discord-usernames',
      keys: ['usr_wolf_demo', 'usr_nova_demo', 'usr_apex_demo'],
    },
    {
      title: 'يوزر إنستجرام — متاح',
      slug: 'instagram-username',
      description: 'يوزر إنستجرام نظيف وجاهز للنقل حسب الشروط.',
      imageUrl:
        'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80',
      platform: 'Instagram',
      priceEGP: 349,
      kind: ProductKind.SERVICE,
      deliveryNote:
        'بعد الدفع تواصل معنا عبر واتساب لإتمام نقل اليوزر خلال ساعات العمل.',
      soldCount: 44,
      featured: true,
      categorySlug: 'social-usernames',
      keys: ['ig_handle_demo_01', 'ig_handle_demo_02'],
    },
    {
      title: 'يوزر تيك توك — متاح',
      titleEn: 'TikTok Username',
      slug: 'tiktok-username',
      description: 'يوزر تيك توك قصير وجاهز للاستخدام.',
      descriptionEn: 'Short TikTok username ready to transfer.',
      imageUrl:
        'https://images.unsplash.com/photo-1611162616475-46b635cb495f?w=800&q=80',
      platform: 'TikTok',
      priceEGP: 299,
      kind: ProductKind.SERVICE,
      deliveryNote: 'سيصلك اليوزر وتعليمات النقل في الطلب بعد الدفع.',
      deliveryNoteEn: 'Username and transfer steps appear on your order after payment.',
      soldCount: 33,
      categorySlug: 'social-usernames',
      keys: ['tt_handle_demo_01', 'tt_handle_demo_02'],
    },
    {
      title: 'يالا لودو — شحن مباشر',
      titleEn: 'Yalla Ludo Direct Top-up',
      slug: 'yalla-ludo-topup',
      description: 'شحن مباشر لـ Yalla Ludo — تسليم فوري بعد الدفع.',
      descriptionEn: 'Instant Yalla Ludo top-up delivered after payment.',
      imageUrl:
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80',
      platform: 'Mobile',
      priceEGP: 105,
      originalPrice: 112,
      discountPct: 6,
      kind: ProductKind.TOP_UP,
      hot: true,
      featured: true,
      soldCount: 210,
      deliveryNote: 'أدخل معرف اللاعب بعد الشراء ليتم الشحن.',
      deliveryNoteEn: 'Provide your player ID after purchase for delivery.',
      categorySlug: 'top-ups',
      keys: ['YLDO-TOP-001', 'YLDO-TOP-002', 'YLDO-TOP-003', 'YLDO-TOP-004'],
    },
    {
      title: 'موبايل ليجندز — شحن مباشر',
      titleEn: 'Mobile Legends: Bang Bang Top-up',
      slug: 'mlbb-topup',
      description: 'شحن ألماس Mobile Legends مباشرة إلى حسابك.',
      descriptionEn: 'Direct Mobile Legends diamonds top-up to your account.',
      imageUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80',
      platform: 'Mobile',
      priceEGP: 16,
      kind: ProductKind.TOP_UP,
      hot: true,
      featured: true,
      soldCount: 340,
      deliveryNote: 'أدخل User ID و Server ID.',
      deliveryNoteEn: 'Enter User ID and Server ID.',
      categorySlug: 'top-ups',
      keys: ['MLBB-TOP-001', 'MLBB-TOP-002', 'MLBB-TOP-003'],
    },
    {
      title: 'ببجي موبايل — شحن UC',
      titleEn: 'PUBG Mobile UC Top-up',
      slug: 'pubg-mobile-topup',
      description: 'شحن UC لببجي موبايل بشكل فوري.',
      descriptionEn: 'Instant PUBG Mobile UC top-up.',
      imageUrl:
        'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80',
      platform: 'Mobile',
      priceEGP: 95,
      originalPrice: 100,
      discountPct: 5,
      kind: ProductKind.TOP_UP,
      hot: true,
      soldCount: 280,
      categorySlug: 'top-ups',
      keys: ['PUBG-TOP-001', 'PUBG-TOP-002', 'PUBG-TOP-003'],
    },
    {
      title: 'جواكر — شحن مباشر',
      titleEn: 'Jawaker Direct Top-up',
      slug: 'jawaker-topup',
      description: 'شحن رصيد جواكر مباشرة.',
      descriptionEn: 'Direct Jawaker balance top-up.',
      imageUrl:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
      platform: 'Mobile',
      priceEGP: 49,
      originalPrice: 52,
      discountPct: 5,
      kind: ProductKind.TOP_UP,
      hot: true,
      soldCount: 175,
      categorySlug: 'top-ups',
      keys: ['JAWK-TOP-001', 'JAWK-TOP-002'],
    },
    {
      title: 'فري فاير — شحن مباشر',
      titleEn: 'Free Fire Direct Top-up',
      slug: 'free-fire-topup',
      description: 'شحن جواهر فري فاير فوري.',
      descriptionEn: 'Instant Free Fire diamonds top-up.',
      imageUrl:
        'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&q=80',
      platform: 'Mobile',
      priceEGP: 49,
      kind: ProductKind.TOP_UP,
      isNew: true,
      soldCount: 198,
      categorySlug: 'top-ups',
      keys: ['FFRE-TOP-001', 'FFRE-TOP-002', 'FFRE-TOP-003'],
    },
    {
      title: 'Steam (Egypt) Wallet',
      titleEn: 'Steam (Egypt) Wallet',
      slug: 'steam-egypt-wallet',
      description: 'بطاقة محفظة Steam لمنطقة مصر.',
      descriptionEn: 'Steam wallet code for Egypt region.',
      imageUrl:
        'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=800&q=80',
      platform: 'Steam',
      priceEGP: 315,
      originalPrice: 330,
      discountPct: 5,
      kind: ProductKind.GIFT_CARD,
      hot: true,
      featured: true,
      soldCount: 190,
      categorySlug: 'gift-cards',
      keys: ['STMEG-AAA-001', 'STMEG-AAA-002', 'STMEG-AAA-003'],
    },
  ];

  const createdProducts: { id: string; slug: string }[] = [];

  for (const product of products) {
    const category = categoryBySlug[product.categorySlug];
    if (!category) {
      throw new Error(`Missing category ${product.categorySlug}`);
    }

    const kind =
      product.kind ??
      (product.categorySlug === 'gift-cards'
        ? ProductKind.GIFT_CARD
        : product.categorySlug === 'top-ups'
          ? ProductKind.TOP_UP
          : ProductKind.GAME_KEY);

    const created = await prisma.product.create({
      data: {
        title: product.title,
        titleEn: product.titleEn ?? product.title,
        slug: product.slug,
        description: product.description,
        descriptionEn: product.descriptionEn ?? product.description,
        imageUrl: product.imageUrl,
        platform: product.platform,
        priceEGP: new Prisma.Decimal(product.priceEGP),
        originalPrice:
          product.originalPrice != null
            ? new Prisma.Decimal(product.originalPrice)
            : null,
        discountPct: product.discountPct ?? null,
        kind,
        deliveryNote: product.deliveryNote ?? null,
        deliveryNoteEn: product.deliveryNoteEn ?? product.deliveryNote ?? null,
        soldCount: product.soldCount ?? Math.floor(Math.random() * 40) + 5,
        featured: product.featured ?? false,
        weeklyDeal: product.weeklyDeal ?? false,
        hot: product.hot ?? false,
        isNew: product.isNew ?? false,
        active: true,
        publicationStatus: PublicationStatus.PUBLISHED,
        publishedAt: new Date(),
        currencyCode: 'EGP',
        categoryId: category.id,
        keys: {
          create: product.keys.map((code) => ({
            code,
            status: KeyStatus.AVAILABLE,
          })),
        },
      },
    });

    createdProducts.push({ id: created.id, slug: created.slug });
    console.log(`  + ${created.title}`);
  }

  const reviewBodies = [
    { rating: 5, body: 'تسليم فوري وخدمة ممتازة!' },
    { rating: 5, body: 'Instant delivery, highly recommend.' },
    { rating: 4, body: 'كل شيء تمام، شكراً لكم.' },
    { rating: 5, body: 'Best prices and fast support.' },
    { rating: 5, body: 'وصلت خلال دقايق، تجربة رائعة.' },
    { rating: 4, body: 'Good store, will buy again.' },
    { rating: 5, body: 'موثوق وسريع.' },
    { rating: 5, body: 'Smooth checkout and working code.' },
  ];

  for (let i = 0; i < reviewBodies.length; i++) {
    const product = createdProducts[i % createdProducts.length];
    await prisma.review.create({
      data: {
        userId: i % 2 === 0 ? demo.id : admin.id,
        productId: product.id,
        rating: reviewBodies[i].rating,
        body: reviewBodies[i].body,
      },
    });
  }

  await prisma.contentPage.create({
    data: {
      slug: 'about',
      title: 'عن المتجر',
      titleEn: 'About',
      body: 'متجر Gamers Matrix للمنتجات الرقمية المشروعة.',
      bodyEn: 'Gamers Matrix store for legitimate digital products.',
      publicationStatus: PublicationStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.campaign.create({
    data: {
      name: 'عروض تجريبية',
      slug: 'demo-campaign',
      description: 'حملة تطوير للاختبار',
      coupons: {
        create: {
          code: 'WELCOME10',
          type: CouponType.PERCENT,
          value: new Prisma.Decimal(10),
          maxRedemptions: 100,
        },
      },
    },
  });

  console.log(`  + ${reviewBodies.length} reviews`);
  console.log('Seed complete.');
  console.log(
    `  Admin: mohammed1.nasr.elshreef@gmail.com / Admin123! (${admin.id})`,
  );
  console.log(`  Editor: editor@gamersmatrix.com / Editor123! (${editor.id})`);
  console.log(`  Demo:  demo@gamersmatrix.com / Demo123! (${demo.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
