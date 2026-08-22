# ARCHITECTURE.md — Sirius

> Bu hujjat loyihaning **haqiqiy holatini** (kodni o'qib tekshirilgan) tasvirlaydi.
> `README.md` ham bor, lekin unda **eskirgan ma'lumotlar** bor — farqlar
> [§11 "README bilan ziddiyatlar"](#11-readme-bilan-ziddiyatlar) da sanab o'tilgan.
> Ziddiyat bo'lsa — **kod haqiqat**, README emas.
>
> Tekshirilgan sana: 2026-08-20. Commit: `febb0b8` (branch `main`, ishchi daraxt toza).

---

## Mundarija

1. [Loyiha nima qiladi](#1-loyiha-nima-qiladi)
2. [Stack va versiyalar](#2-stack-va-versiyalar)
3. [Papka strukturasi](#3-papka-strukturasi)
4. [Kirish nuqtalari (entry points)](#4-kirish-nuqtalari-entry-points)
5. [Ma'lumot oqimi](#5-malumot-oqimi)
6. [Ma'lumotlar qatlami](#6-malumotlar-qatlami)
7. [Autentifikatsiya va ruxsatlar](#7-autentifikatsiya-va-ruxsatlar)
8. [Konfiguratsiya](#8-konfiguratsiya)
9. [Build / deploy / test](#9-build--deploy--test)
10. [Kod konventsiyalari](#10-kod-konventsiyalari)
11. [README bilan ziddiyatlar](#11-readme-bilan-ziddiyatlar)
12. [Xavfli va nozik joylar](#12-xavfli-va-nozik-joylar)
13. [O'lik kod va ishlatilmaydigan bog'liqliklar](#13-olik-kod-va-ishlatilmaydigan-boglqliklar)
14. [Ochiq savollar](#14-ochiq-savollar)

---

## 1. Loyiha nima qiladi

Sirius — o'zbek maktab o'quvchilari uchun **Digital SAT tayyorgarlik + universitetga
hujjat topshirish** platformasi. Uchta asosiy qism:

| Qism | Nima qiladi | Qayerda |
| --- | --- | --- |
| **SAT simulyatori** | Bluebook uslubidagi taymerli test mexanizmi | `app/simulator/[testId]/page.tsx`, `components/simulator/` |
| **Ikki tilli lug'at** | Matndagi har bir so'zni bosib o'zbekcha tarjimasini ko'rish | `components/simulator/bilingual-passage.tsx`, `lib/vocabulary.ts` |
| **Universitet explorer** | Universitetlarni filtrlash, shortlist qilish | `app/(app)/universities/page.tsx`, `components/universities/` |

Qo'shimcha: bento-grid dashboard, so'z banki (word bank), natijalar sahifasi,
marketing landing page, ikki tilli interfeys (o'zbekcha default).

**Muhim pozitsiya:** loyihaning o'zi **hech qanday SAT savoliga ega emas**. Savollar
`POST /api/tests/import` orqali tashqaridan yuklanadi (`prisma/seed.ts:10-14`).

---

## 2. Stack va versiyalar

Manba: `package.json`, `package-lock.json` (npm, `lockfileVersion` mavjud).

### Asosiy

| Texnologiya | Versiya | Eslatma |
| --- | --- | --- |
| **Next.js** | `16.3.1` | App Router, RSC, Server Actions, Turbopack |
| **React** | `19.2.8` | React Compiler eslint qoidalari yoqilgan |
| **TypeScript** | `^5` | `strict: true` (`tsconfig.json:7`) |
| **Tailwind CSS** | `^4` | CSS-first — `tailwind.config.ts` **yo'q** |
| **Prisma** | `^7.9.1` | `@prisma/client` + `@prisma/adapter-pg` |
| **PostgreSQL** | — | `pg` drayveri orqali |
| **Auth.js (NextAuth)** | `^5.0.0-beta.32` | `@auth/prisma-adapter` bilan |
| **GSAP** | `^3.15.0` | `@gsap/react` (`useGSAP`) |
| **Zod** | `^4.4.3` | Barcha validatsiya |
| **shadcn/ui** | `radix-ui ^1.6.7` | `style: "radix-nova"` (`components.json:3`) |
| **Lucide** | `^1.32.0` | Ikonkalar |

### Muhim versiya farqlari (training data'dan farq qiladi)

`AGENTS.md` ogohlantirgani bejiz emas — quyidagilar **odatdagidan boshqacha**:

1. **`proxy.ts`, `middleware.ts` emas.** Next.js 16 da Middleware → Proxy deb
   nomlangan. Fayl: `proxy.ts` (repo ildizida).
2. **Route params — Promise.** `const { testId } = await params;`
   (`app/simulator/[testId]/page.tsx:82`). `PageProps<"/path">` / `LayoutProps<"/">`
   global generic tiplari `next typegen` tomonidan yoziladi.
3. **Prisma 7:**
   - Generator `prisma-client` (`prisma-client-js` emas), `output` majburiy
     (`prisma/schema.prisma:20-23`).
   - Client `@/lib/generated/prisma/client` dan import qilinadi, **hech qachon
     `@prisma/client` dan emas**.
   - `datasource.url` `schema.prisma` da **emas**, `prisma.config.ts:19-21` da.
   - Driver adapter **majburiy** — `PrismaPg` (`lib/prisma.ts:111`).
   - `.env` avtomatik o'qilmaydi → `import "dotenv/config"` (`prisma.config.ts:9`).
4. **Auth.js v5:** `auth()`, `signIn()`, `signOut()` `auth.ts` dan eksport qilinadi.
   Daraxtda `<SessionProvider>` **yo'q** — sessiya serverda o'qiladi.

---

## 3. Papka strukturasi

```
sirius/
├── app/                          # Next.js App Router — barcha route'lar
│   ├── layout.tsx                # ROOT layout: shriftlar, LangProvider, Tooltip, Toaster
│   ├── globals.css               # 633 qator — barcha dizayn tokenlari (Tailwind v4 @theme)
│   ├── (marketing)/              # Ochiq landing page (auth talab qilinmaydi)
│   ├── (auth)/                   # sign-in / sign-up
│   ├── (app)/                    # Autentifikatsiya talab qiluvchi ilova qobig'i
│   │   ├── layout.tsx            # ← ASOSIY auth chegarasi + sidebar/topbar
│   │   ├── error.tsx             # Xato chegarasi (redirect loop'ni to'xtatadi)
│   │   ├── dashboard/            # Bento-grid bosh sahifa
│   │   ├── practice/             # Testlar ro'yxati + tarix
│   │   │   └── results/[resultId]/   # Javoblarni ko'rib chiqish
│   │   ├── universities/
│   │   └── words/
│   ├── simulator/[testId]/       # To'liq ekran test — (app) guruhidan TASHQARIDA
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js catch-all
│   │   ├── tests/import/         # SAT savol banki import (bearer token)
│   │   └── admin/bulk-import/    # Lug'at/insho/applicant import (bearer token)
│   └── design-system/            # Dizayn ko'rib chiqish sahifasi — PRODUCT EMAS
├── components/
│   ├── ui/                       # shadcn/ui primitivlari (51 ta, 30 tasi ishlatilmaydi)
│   ├── brand/ marketing/ dashboard/ simulator/ universities/ words/
│   ├── motion/                   # Reveal / Pressable / PageTransition (GSAP)
│   ├── i18n/                     # LangProvider (client context) + LangSwitch
│   └── design-system/            # /design-system sahifasi uchun
├── lib/
│   ├── prisma.ts                 # Lazy Prisma singleton (Proxy orqali)
│   ├── user.ts                   # Sessiya o'qish + requireUserId() + starter roadmap
│   ├── sat.ts                    # SAT domen mantiq: baholash, ball hisoblash, taymer
│   ├── simulator.ts              # SimulatorQuestion tipi (javob kalitisiz!)
│   ├── vocabulary.ts             # Lug'at Map + passage tokenizer
│   ├── viz.ts                    # Rang palitrasi (Tone) + universitet cover art
│   ├── gsap.ts                   # Barcha easing/duration konstantalari
│   ├── utils.ts                  # cn() — clsx + tailwind-merge
│   ├── actions/                  # "use server" — barcha yozish amallari
│   ├── queries/                  # O'qish amallari (hozircha faqat dashboard.ts)
│   ├── validation/               # Zod sxemalar + import normalizatsiyasi
│   ├── api/                      # College Scorecard tashqi API (JSON + bulk CSV)
│   ├── i18n/                     # config.ts (universal) + index.ts (server) + dictionaries.ts
│   └── generated/prisma/         # ⚠️ Prisma generate chiqishi — git-ignored
├── data/
│   ├── vocabulary.json           # Lug'at (build vaqtida import qilinadi)
│   ├── universities.ts           # 12 ta qo'lda yozilgan universitet
│   └── admissions-sample.ts      # ⚠️ HECH QAYERDA ISHLATILMAYDI (o'lik kod)
├── prisma/
│   ├── schema.prisma             # 677 qator, 16 model
│   └── seed.ts                   # Lug'at + universitetlar (SAT savollari YO'Q)
├── scripts/check-domain.ts       # Yagona "test" — 35 ta assertion
├── hooks/use-mobile.ts           # ⚠️ Faqat ishlatilmaydigan sidebar.tsx uchun
├── auth.ts                       # Auth.js konfiguratsiyasi
├── proxy.ts                      # Request interceptor (middleware.ts EMAS)
├── prisma.config.ts              # Prisma CLI konfiguratsiyasi (datasource URL shu yerda)
├── next.config.ts                # Turbopack root pin + Unsplash image host
└── netlify.toml                  # Deploy konfiguratsiyasi
```

`@/*` alias → repo ildizi (`tsconfig.json:26`). Ya'ni `@/lib/prisma` = `./lib/prisma.ts`.

### Route guruhlari nima uchun shunday

- `(marketing)`, `(auth)`, `(app)` — qavs ichidagi nom **URL'ga tushmaydi**, faqat
  layout'ni ajratadi.
- `app/simulator/[testId]` **ataylab** `(app)` dan tashqarida: test vaqtida sidebar
  va topbar chalg'itadi (`app/simulator/[testId]/page.tsx:3-6`). Shuning uchun u
  `(app)/layout.tsx` ning auth qo'riqchisini **meros olmaydi** va o'zining
  `requireUserId()` chaqiruvi bor (`:79`).

---

## 4. Kirish nuqtalari (entry points)

### Dastur ishga tushishi

| Nuqta | Fayl | Izoh |
| --- | --- | --- |
| Har bir HTTP so'rov | `proxy.ts:58` | Birinchi bo'lib ishlaydi (matcher'ga tushsa) |
| Barcha sahifalar | `app/layout.tsx:89` | Root layout — shriftlar, til, providerlar |
| Auth endpointlari | `app/api/auth/[...nextauth]/route.ts:13` | `handlers` ni `auth.ts` dan oladi |
| Prisma client | `lib/prisma.ts:145` | **Lazy** — birinchi property access'da quriladi |
| GSAP plaginlari | `lib/gsap.ts:30-44` | `typeof window !== "undefined"` ichida |

### npm skriptlari (`package.json:5-18`)

| Buyruq | Nima qiladi |
| --- | --- |
| `npm run dev` | `next dev` — dev server |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `eslint` |
| `npm run typecheck` | `tsc --noEmit` ⚠️ hozir 4 ta xato beradi — [§12.7](#127-npm-run-typecheck-hozir-tushadi) |
| `npm run check` | `tsx scripts/check-domain.ts` — domen mantiq testlari |
| `npm run db:push` | `prisma db push` — sxemani qo'llash |
| `npm run db:seed` | `tsx prisma/seed.ts` |
| `npm run db:studio` | `prisma studio` |
| `npm run setup` | `db:push` + `db:seed` |
| `postinstall` | `prisma generate` — **avtomatik**, `npm install` dan keyin |

**Migratsiyalar yo'q.** `prisma/migrations/` papkasi mavjud emas — workflow
`prisma db push` ga asoslangan. `prisma.config.ts:15` da migratsiya yo'li
e'lon qilingan, lekin papka hali yaratilmagan.

---

## 5. Ma'lumot oqimi

Loyihada **uchta alohida yozish yo'li** bor. Ularni aralashtirmang.

### 5.1 O'qish: Server Component → Prisma (controller qatlami yo'q)

Bu Next.js App Router, shuning uchun **klassik route → controller → service → DB
zanjiri yo'q**. Sahifaning o'zi server komponenti bo'lib, to'g'ridan-to'g'ri
Prisma'ga murojaat qiladi.

```
Browser GET /dashboard
  → proxy.ts:58            cookie bormi? yo'q bo'lsa /sign-in ga redirect
  → app/(app)/layout.tsx:69   requireUserId()  ← HAQIQIY auth chegarasi
  → app/(app)/dashboard/page.tsx:51  getDashboardData()
      → lib/queries/dashboard.ts:78
          → isDatabaseConfigured() tekshiruvi (DB yo'q bo'lsa bo'sh natija)
          → getOrCreateCurrentUser()   lib/user.ts:142
          → prisma.$transaction([...8 ta so'rov])  ← BITTA round trip
  → HTML/RSC payload qaytadi
```

**Muhim naqsh:** `lib/queries/dashboard.ts:95` da 8 ta so'rov bitta
`$transaction` massiviga to'planadi. Sahifada emas, query modulida — chunki
"DB yo'q" holatidagi fallback bitta joyda turishi kerak (`:62 emptyDashboard()`).

Ba'zi sahifalar query moduli bo'lmasdan to'g'ridan-to'g'ri Prisma chaqiradi
(`app/(app)/practice/page.tsx:30`, `app/(app)/universities/page.tsx:30`).
Ya'ni `lib/queries/` konventsiyasi **to'liq qo'llanilmagan** — faqat dashboard uchun.

### 5.2 Yozish: Client → Server Action → Prisma

```
Client component (masalan roadmap checkbox)
  → lib/actions/roadmap.ts:30  toggleRoadmapTask({ taskId, isDone })
      1. Zod bilan validatsiya           (:34)
      2. getCurrentUserId()              (:38)  ← sessiyani QAYTA tekshirish
      3. prisma.roadmapTask.updateMany({ where: { id, userId } })  (:43)
                                          ↑ userId WHERE ichida — bu muhim
      4. revalidatePath("/dashboard")    (:53)
  → { ok: true } qaytadi
```

Barcha Server Action'lar `lib/actions/` da, hammasi `"use server"` bilan
boshlanadi. Hammasi `ActionResult { ok: boolean; error?: string }` qaytaradi
(tip `lib/actions/roadmap.ts:24` da e'lon qilingan, boshqalari shundan import qiladi).

### 5.3 Test topshirish oqimi (eng murakkab yo'l)

```
1. GET /simulator/:testId
   app/simulator/[testId]/page.tsx:79   requireUserId()
   :100  prisma.test.findFirst — correctAnswer va explanation TANLANMAYDI
   :137  startAttempt(test.id)  ← lib/actions/attempts.ts:41
           mavjud IN_PROGRESS urinish bormi? bo'lsa uni qaytaradi (resume)
           yo'q bo'lsa yangi TestAttempt yaratadi → startedAt = taymer langari
   :147  saqlangan javoblarni o'qish (resume uchun)
   → SimulatorEngine (client) ga uzatiladi

2. Test davomida
   components/simulator/simulator-engine.tsx:183
     1.5s debounce → saveAttemptProgress()  → lib/actions/attempts.ts:97
       updateMany({ where: { id, userId, status: "IN_PROGRESS" } })

3. Topshirish (qo'lda yoki taymer tugaganda)
   simulator-engine.tsx:144  submitAttempt({ attemptId, answers })
     → lib/actions/attempts.ts:137
         :146  attempt + test.questions (correctAnswer BILAN) yuklanadi
         :163  agar COMPLETED bo'lsa — mavjud natijani qaytaradi (idempotent)
         :174  gradeAttempt()  ← lib/sat.ts:120  SERVERDA baholanadi
         :185  $transaction: TestResult yaratish + TestAttempt ni COMPLETED qilish
     → router.replace(`/practice/results/:resultId`)   simulator-engine.tsx:152

4. Natijalar sahifasi
   app/(app)/practice/results/[resultId]/page.tsx:67
     findFirst({ where: { id: resultId, userId } })   ← egalik WHERE ichida
     Bu yerda correctAnswer va explanation KO'RSATILADI (test tugagan)
```

**Xavfsizlik invarianti:** javob kaliti hech qachon brauzerga bormaydi. Buni
uchta joy ushlab turadi:
- `lib/simulator.ts:22` — `SimulatorQuestion` tipida `correctAnswer` maydoni yo'q
- `app/simulator/[testId]/page.tsx:111-121` — `select` da ataylab yo'q
- Baholash faqat serverda (`lib/actions/attempts.ts:174`)

### 5.4 Import API oqimi (klassik route handler)

```
POST /api/tests/import
  app/api/tests/import/route.ts:148
    :149  authorise() — bearer token, timingSafeEqual (:42)
    :157  isDatabaseConfigured()
    :169  Content-Length cheklovi (8 MB)
    :190  parseImportPayload()  ← lib/validation/test-import.ts:457
            normalizatsiya (alias'lar) → keyin Zod validatsiya
    :206  har bir test uchun upsertTest() (:86) — alohida $transaction, 30s timeout
```

---

## 6. Ma'lumotlar qatlami

### 6.1 Prisma sxemasi — 16 model

Fayl: `prisma/schema.prisma` (677 qator).

**Nomlash konventsiyasi:** TypeScript'da camelCase, DB'da snake_case
(`@map` orqali). Masalan `targetScore` → `target_score` (`schema.prisma:99`).
Model nomlari ham `@@map` bilan ko'plikka o'giriladi: `User` → `users`.

| Guruh | Modellar | Izoh |
| --- | --- | --- |
| **Auth.js** | `User`, `Account`, `Session`, `VerificationToken` | Adapter kontrakti — **maydon nomlarini o'zgartirmang** |
| **Test kontenti** | `Test`, `Question` | `externalId` — idempotent import kaliti |
| **Urinishlar** | `TestAttempt`, `TestResult` | `TestAttempt.startedAt` = taymer langari |
| **Lug'at** | `Vocabulary`, `SavedWord` | `Vocabulary` — JSON faylning DB nusxasi |
| **Universitetlar** | `University`, `UniversityShortlistEntry` | `scorecardId` — API upsert kaliti |
| **Roadmap** | `RoadmapTask` | `slug` — tarjima kaliti |
| **Qabul dalillari** | `ApplicantProfile`, `Essay`, `ActivityReference` | ⚠️ **Faqat yoziladi, hech qayerda o'qilmaydi** |

**Enumlar** (`schema.prisma:35-73`): `TestType` (READING/MATH/FULL),
`TestModule` (MODULE_1/MODULE_2), `QuestionFormat` (MULTIPLE_CHOICE/SPR),
`Difficulty`, `ApplicationStatus`, `AttemptStatus`.

### 6.2 Prisma client — lazy Proxy

`lib/prisma.ts:145` — bu oddiy singleton emas, **`Proxy`**:

```ts
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property);   // ← receiver UZATILMAYDI
    return typeof value === "function" ? value.bind(client) : value;
  },
  ...
});
```

Sabablari (`lib/prisma.ts:43-47`, `:132-144`):
- **Lazy**: `DATABASE_URL` yo'q bo'lsa import vaqtida crash bo'lmasligi kerak.
- **`Reflect.get` ga receiver uzatilmaydi**: Prisma model delegate'lari lazy
  getter'lar, ularga proxy'ni `this` qilib bersa — cheksiz rekursiya.

**Pool hajmi = 1 (default).** `lib/prisma.ts:71-74`. Bu `npx prisma dev`
(PGlite) uchun majburiy — parallel ulanishlar `08P01` xatosini beradi.
Haqiqiy Postgres'da `DATABASE_POOL_MAX=10` qo'ying.

**`pool.on("error")` handleri (`lib/prisma.ts:106`) — O'CHIRMANG.** `pg.Pool`
EventEmitter; listener'siz `error` event Node protsessini o'ldiradi.

### 6.3 Statik ma'lumotlar

| Fayl | Nima | Qanday yuklanadi |
| --- | --- | --- |
| `data/vocabulary.json` | Lug'at yozuvlari | `lib/vocabulary.ts:15` — **build vaqtida import**, `Map` ga aylantiriladi (`:43`) |
| `data/universities.ts` | 12 ta qo'lda yozilgan universitet | `prisma/seed.ts:31` |
| `data/admissions-sample.ts` | Namuna applicant/insho | ⚠️ **Hech qayerda import qilinmaydi** |

Lug'at ataylab statik: tarjima uchun na tarmoq so'rovi, na DB so'rovi kerak
(`lib/vocabulary.ts:1-13`). `Vocabulary` jadvali — kelajakda lug'at fayldan
o'sib ketganda ishlatish uchun.

### 6.4 Tashqi API — College Scorecard

Ikkita manba, biri ikkinchisining zaxirasi (`prisma/seed.ts:213-239`):

| Manba | Fayl | Kalit kerakmi | Qachon |
| --- | --- | --- | --- |
| JSON API | `lib/api/scorecard.ts:343` | Ha (`SCORECARD_API_KEY`) | Kalit bo'lsa |
| Bulk CSV | `lib/api/scorecard-bulk.ts:255` | Yo'q | Aks holda (23 MB yuklab olinadi, `.cache/scorecard/` ga keshlanadi) |

`fflate` paketi faqat shu bulk ZIP'ni ochish uchun ishlatiladi.

---

## 7. Autentifikatsiya va ruxsatlar

### 7.1 Konfiguratsiya

`auth.ts:43` — `NextAuth({...})`:
- **Yagona provayder: Google** (`:53-67`)
- **`session: { strategy: "database" }`** (`:51`) — JWT emas. Cookie'da faqat
  opaque token, sessiya `sessions` jadvalida. Chiqish haqiqatan serverda
  sessiyani tugatadi. Narxi: har bir `auth()` chaqiruvi = bitta DB so'rovi.
- **`callbacks.session`** (`:82`) — `session.user.id` ni qo'shadi. Bu **majburiy**:
  default session shape'da `id` yo'q, lekin server tomonda hamma narsa
  `session.user.id` ga tayanadi.
- `allowDangerousEmailAccountLinking` **ataylab yoqilmagan** (`:55-59`).

### 7.2 Himoya qatlamlari — 4 ta, lekin faqat 3 tasi haqiqiy

| Qatlam | Fayl | Haqiqiy chegarami? |
| --- | --- | --- |
| 1. Proxy | `proxy.ts:58` | ❌ **YO'Q** — faqat UX. Cookie *bor-yo'qligini* tekshiradi, haqiqiyligini emas |
| 2. Layout guard | `app/(app)/layout.tsx:69` | ✅ Ha — `requireUserId()` |
| 3. Simulator guard | `app/simulator/[testId]/page.tsx:79` | ✅ Ha — alohida, chunki `(app)` dan tashqarida |
| 4. Server Action | `lib/actions/*.ts` — har birida | ✅ Ha — sessiya qayta tekshiriladi + `userId` WHERE ichida |
| 5. Import API | `app/api/tests/import/route.ts:51` | ✅ Ha — bearer token, `timingSafeEqual` |

`proxy.ts:7-27` buni ochiq yozgan: bu **xavfsizlik chegarasi emas**. Sabab —
Proxy har bir so'rovda (prefetch'lar ham) ishlaydi, u yerda DB'ga borish qimmat.

### 7.3 `SessionState` — ikki emas, **uch** holat

`lib/user.ts:68-71`:

```ts
export type SessionState =
  | { status: "signed-in"; userId: string }
  | { status: "signed-out" }
  | { status: "unavailable"; error: Error };   // ← bu uchinchisi muhim
```

**Nima uchun:** "chiqqan" va "aniqlab bo'lmadi" — turli faktlar. Ularni
birlashtirish **redirect loop** keltirib chiqargan (`lib/user.ts:61-66`):
dashboard sign-in'ga yuborardi, sign-in sessiyani muvaffaqiyatli o'qib
dashboard'ga qaytarardi — sekundiga bir necha marta.

Shuning uchun:
- `requireUserId()` (`lib/user.ts:120`) — `signed-out` bo'lsa redirect,
  `unavailable` bo'lsa **throw** → `app/(app)/error.tsx` ga tushadi.
- `sign-in/page.tsx:34` — faqat *haqiqatan* kirgan bo'lsa redirect qiladi.

### 7.4 Ruxsat naqshi — `userId` **WHERE ichida**

Bu loyihaning eng muhim xavfsizlik konventsiyasi. `lib/actions/roadmap.ts:6-11`:

```ts
// ✅ TO'G'RI
await prisma.roadmapTask.updateMany({ where: { id: taskId, userId }, data });

// ❌ NOTO'G'RI (check-then-write oynasi)
const task = await prisma.roadmapTask.findUnique({ where: { id: taskId } });
if (task.userId !== userId) throw ...;
await prisma.roadmapTask.update(...);
```

Server Action — **ochiq HTTP endpoint**. Klientdan kelgan `id` ishonchsiz.
Shu naqsh qo'llanilgan joylar: `roadmap.ts:43`, `attempts.ts:106`,
`attempts.ts:146`, `words.ts:78`, `practice/results/[resultId]/page.tsx:69`.

### 7.5 Google sozlanmaganda

`auth.ts:39` — `isGoogleConfigured()` env o'zgaruvchilarini tekshiradi.
`sign-in/page.tsx:45` buni `AuthPanel` ga uzatadi va tugma o'rniga sozlash
ko'rsatmalarini ko'rsatadi. Ya'ni loyiha OAuth client'siz ham ishlaydi.

---

## 8. Konfiguratsiya

### 8.1 Env o'zgaruvchilari

> Faqat **nomlar va vazifalari**. Qiymatlar `.env` da (git-ignored).

| O'zgaruvchi | Majburiymi | Vazifasi | Qayerda o'qiladi |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ Ha | PostgreSQL ulanish satri | `lib/prisma.ts:57,77`, `prisma.config.ts:20`, `prisma/seed.ts:40` |
| `DATABASE_POOL_MAX` | Yo'q (default 1) | Pool hajmi. PGlite'da 1, haqiqiy PG'da 10 | `lib/prisma.ts:72` |
| `AUTH_SECRET` | ✅ Ha | Sessiya cookie'sini imzolaydi (`npx auth secret`) | Auth.js ichida (avtomatik) |
| `AUTH_GOOGLE_ID` | Prod uchun | Google OAuth client id | `auth.ts:40` (mavjudligi), Auth.js ichida |
| `AUTH_GOOGLE_SECRET` | Prod uchun | Google OAuth client secret | `auth.ts:40` |
| `AUTH_URL` | Kamdan-kam | Deploy URL aniqlanmasa (proxy orqasida) | Auth.js ichida |
| `SCORECARD_API_KEY` | Yo'q | College Scorecard API kaliti. Yo'q bo'lsa bulk CSV ishlatiladi | `lib/api/scorecard.ts:390` |
| `TEST_IMPORT_TOKEN` | Prod uchun | `POST /api/tests/import` bearer tokeni | `app/api/tests/import/route.ts:52` |
| `ADMIN_IMPORT_TOKEN` | Prod uchun | `POST /api/admin/bulk-import` bearer tokeni | `app/api/admin/bulk-import/route.ts:61` |
| `NODE_ENV` | Avtomatik | Prod'da tokensiz import butunlay o'chadi | `tests/import/route.ts:53`, `bulk-import/route.ts:62` |

> ⚠️ **`ADMIN_IMPORT_TOKEN` `.env.example` da hujjatlashtirilmagan.** Kod uni
> `app/api/admin/bulk-import/route.ts:61` da o'qiydi, lekin shablonda yo'q.
> Bu — hujjatlashtirish kamchiligi. Batafsil: [§12.4](#124-admin_import_token-hujjatlashtirilmagan).

**Muhim:** ikkala import endpointi ham **dev rejimida token talab qilmaydi**
(`tests/import/route.ts:65-66`, `bulk-import/route.ts:74-75`). Prod'da token
qo'yilmagan bo'lsa — 503 qaytaradi (ochiq qolmaydi).

### 8.2 Konfiguratsiya fayllari

| Fayl | Nima uchun |
| --- | --- |
| `next.config.ts` | Turbopack root pin (`:13`) — yuqori papkadagi begona lockfile sababli. Unsplash image host (`:24-31`) — `**` **qo'ymang**, bu SSRF vektori |
| `tsconfig.json` | `strict: true`, `@/*` alias, `next` plugin |
| `prisma.config.ts` | Prisma 7 CLI konfiguratsiyasi. `datasource.url` **shu yerda**, sxemada emas |
| `components.json` | shadcn/ui — `style: "radix-nova"`, `rsc: true`, alias'lar |
| `eslint.config.mjs` | `eslint-config-next` core-web-vitals + typescript (React Compiler qoidalari bilan) |
| `postcss.config.mjs` | Faqat `@tailwindcss/postcss` |
| `netlify.toml` | `npm run build`, publish `.next`, `@netlify/plugin-nextjs` |
| `app/globals.css` | ⚠️ **Bu ham konfiguratsiya.** Tailwind v4 CSS-first — `@theme inline` bloki (`:36-210`) v3 dagi `tailwind.config.ts` ning o'rnini bosadi |

### 8.3 Dizayn tokenlari — `app/globals.css`

633 qator. Qatlamlar (`globals.css:24-27`):
1. `@theme inline` (`:36`) — CSS o'zgaruvchilarni Tailwind utility'lariga bog'laydi
2. `:root` (`:215`) — yorug' palitra (mahsulot shunda ishlab chiqilgan)
3. `.dark` (`~:270`) — sinxron saqlanadi, lekin **hali ishlatilmaydi**

Ikkita qoida (`globals.css:14-22`):
- **Soyalar — ring'lar.** `--shadow-soft`/`--shadow-lift` 1px ring, blur emas.
  Faqat `--shadow-float` (dialog/popover) haqiqiy soya.
- **Kulranglar kulrang emas.** Har bir "kulrang" da aksent tusi bor.

Shriftlar `app/layout.tsx:34-53` da `next/font/google` orqali yuklanadi:
Bricolage Grotesque (display), Figtree (sans), DM Mono (mono).

---

## 9. Build / deploy / test

### 9.1 Nol'dan ishga tushirish

```bash
npm install                  # postinstall → prisma generate
cp .env.example .env         # keyin DATABASE_URL va AUTH_SECRET ni to'ldiring
npm run setup                # db:push + db:seed
npm run dev                  # http://localhost:3000
```

DB yo'q bo'lsa: `npx prisma dev -n sirius -d` (lokal PGlite) yoki `npx create-db`.

### 9.2 Deploy — Netlify

`netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"
[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Prod'da qo'yilishi kerak: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `TEST_IMPORT_TOKEN`, `ADMIN_IMPORT_TOKEN`,
`DATABASE_POOL_MAX=10`.

Google OAuth redirect URI ro'yxatiga qo'shish:
`https://<domain>/api/auth/callback/google`.

### 9.3 Testlar

**Test freymvorki yo'q.** Yagona test — `scripts/check-domain.ts` (87 qator),
`npm run check` bilan ishga tushadi. Bog'liqliksiz: oddiy assertion'lar +
nolga teng bo'lmagan exit kodi (`check-domain.ts:13-14`).

**Holati (tekshirilgan):** ✅ **35 passed, 0 failed.**

Nimani qamrab oladi (`check-domain.ts:4-12`):
1. **Tokenizer** — passage matni **aynan** qayta yig'ilishi (`:38`). Bu eng muhim
   assertion: buzilsa o'quvchilar noto'g'ri matn o'qiydi va hech kim sezmaydi.
2. **XSS xavfsizligi** (`:44-48`) — `<script>` tegi matn sifatida saqlanadi.
3. **Baholash va ball hisoblash** (`:60-78`).
4. **Lug'at inflektsiyalari** (`:27-33`) — `scrutinized` → `scrutinize`.
5. **Taymer formati** (`:80-84`).

Qamrab olinmagan: React komponentlari, Server Action'lar, API route'lar,
Prisma so'rovlari, auth oqimi. E2E testlar yo'q.

### 9.4 Lint / typecheck holati (tekshirilgan)

| Buyruq | Holat |
| --- | --- |
| `npm run check` | ✅ 35 passed, 0 failed |
| `npx eslint .` | ✅ Toza, xatosiz |
| `npx tsc --noEmit` | ❌ **4 ta xato** — hammasi `.next/types/validator.ts` dan |

Typecheck xatolari (manba kodida **emas**, eskirgan build artefaktida):
```
.next/types/validator.ts(161): Cannot find module '../../app/api/progress/history/route.js'
.next/types/validator.ts(170): ...'../../app/api/progress/refresh/route.js'
.next/types/validator.ts(179): ...'../../app/api/progress/summary/route.js'
.next/types/validator.ts(188): ...'../../app/api/skills/weak/route.js'
```
Batafsil: [§12.7](#127-npm-run-typecheck-hozir-tushadi).

---

## 10. Kod konventsiyalari

Yangi kod yozganda quyidagilarga amal qiling.

### 10.1 Nomlash

| Narsa | Uslub | Misol |
| --- | --- | --- |
| Fayllar | `kebab-case.tsx` | `bilingual-passage.tsx`, `metric-card.tsx` |
| React komponentlar | `PascalCase`, named export | `export function BilingualPassage(...)` |
| Funksiyalar/o'zgaruvchilar | `camelCase` | `getCurrentUserId`, `estimateScaledScore` |
| Konstantalar | `SCREAMING_SNAKE` | `AUTOSAVE_DEBOUNCE_MS`, `MODULE_MINUTES`, `STARTER_ROADMAP` |
| Tiplar/interfeyslar | `PascalCase` | `SimulatorQuestion`, `DashboardData`, `ActionResult` |
| Prisma modellar | `PascalCase` → `@@map("snake_case")` | `RoadmapTask` → `roadmap_tasks` |
| Prisma maydonlar | `camelCase` → `@map("snake_case")` | `targetScore` → `target_score` |

**Default export faqat** Next.js majburlagan joylarda (page, layout, error,
proxy). Boshqa hamma joyda **named export**.

**Imlo:** Britancha yozuv ishlatiladi — `normalise`, `authorise`, `colour`
(izohlarda). Yangi kod ham shunga amal qilsin.

### 10.2 Izohlar — bu loyihaning belgisi

Bu kod bazasida izohlar **juda zich va sabab-tushuntiruvchi**. Deyarli har bir
fayl tepasida blok izoh bor bo'lib, u **nima uchun** shunday yozilganini
tushuntiradi, **nima qilishini** emas.

Naqsh (`lib/prisma.ts:11-41` — eng yaxshi misol):
```
* ───────────────────────────────────────────────
* WHY THE POOL IS SIZED THE WAY IT IS  (fixes Postgres error 08P01)
*
* [muammo tavsifi]
* [o'lchangan natijalar]
* [xulosaga sabab]
* ───────────────────────────────────────────────
```

Ko'p izohlarda **CAPS bilan ogohlantirish** bor: `MUST NOT BE OMITTED`
(`lib/prisma.ts:97`), `NOTE:` (`simulator/page.tsx:109`), `READ THIS BEFORE
ADDING TO IT` (`data/admissions-sample.ts:4`).

**Yangi kod yozganda shu darajani saqlang.** Agar biror qaror g'ayrioddiy
bo'lsa — nima uchun ekanini yozing, aks holda keyingi odam uni "tozalab"
tashlaydi.

### 10.3 Komponent tuzilishi

```tsx
"use client";              // ← faqat kerak bo'lsa, birinchi qator

/**
 * [Nima] — bir jumlada.
 *
 * [Nima uchun shunday qilingan — bir necha abzats]
 */

import * as React from "react";        // 1. React
import Link from "next/link";          // 2. Next
import { Icon } from "lucide-react";   // 3. Tashqi paketlar

import { Button } from "@/components/ui/button";   // 4. Ichki — komponentlar
import { cn } from "@/lib/utils";                  // 5. Ichki — lib
import type { Foo } from "@/lib/simulator";        // 6. Tiplar (type import)

const CONSTANT = 1_500;    // Modul darajasidagi konstantalar

interface Props { ... }    // Props interfeysi

export function Component({ ... }: Props) { ... }

function LocalHelper() { ... }   // Yordamchilar oxirida
```

Server komponentlar — default (`"use client"` yo'q). Klient komponent faqat
holat, effekt yoki brauzer API kerak bo'lganda.

### 10.4 Xatoliklarni ushlash

Uchta alohida naqsh, kontekstga qarab:

| Kontekst | Naqsh | Misol |
| --- | --- | --- |
| **Server Action** | Hech qachon throw qilmaydi. `{ ok: false, error }` qaytaradi | `lib/actions/roadmap.ts:32` |
| **Sahifa (o'qish)** | `isDatabaseConfigured()` tekshiruvi → bo'sh holat | `lib/queries/dashboard.ts:79` |
| **Sessiya o'qish** | Hech qachon throw qilmaydi — 3 holatli tip qaytaradi | `lib/user.ts:80` |
| **Layout** | `try/catch` — sahifa baribir render qilinadi, banner ko'rsatiladi | `app/(app)/layout.tsx:83-94` |
| **API route** | `Response.json({ ok: false, error }, { status })` | `tests/import/route.ts:151` |
| **Kutilmagan xato** | `app/(app)/error.tsx` chegarasiga tushadi — **redirect qilmaydi** | `error.tsx:6-11` |

`app/(app)/error.tsx:45-47` DB xatolarini alohida taniydi (`Prisma` prefiksi
yoki `08P01` kabi patternlar) va aniqroq maslahat beradi.

### 10.5 Validatsiya

Hamma joyda **Zod v4**. Naqsh:
```ts
const schema = z.object({ ... });

export async function action(input: z.infer<typeof schema>): Promise<ActionResult> {
  const parsed = schema.safeParse(input);       // safeParse, parse EMAS
  if (!parsed.success) return { ok: false, error: "..." };
  ...
}
```

Import endpointlarida **avval normalizatsiya, keyin validatsiya**
(`lib/validation/test-import.ts:15`) — shunda xato xabarlari chaqiruvchining
haqiqiy payload'iga mos keladi.

Zod v4 farqi: `.refine()` da `{ error: "..." }` ishlatiladi, `{ message: }` emas
(`lib/actions/profile.ts:20`).

### 10.6 Ranglar va animatsiya

**Ranglar:** to'g'ridan-to'g'ri Tailwind rang klassini yozmang. `lib/viz.ts:34`
dagi `TONES` orqali `Tone` tanlang. Sabab (`lib/viz.ts:5-7`): statistika hamma
joyda bir xil ma'no bildirishi kerak — emerald doim "yetarli", rose doim "kam".

⚠️ Klass satrlari **to'liq yozilishi shart** — `bg-viz-${tone}` Tailwind
skaneri tomonidan topilmaydi (`lib/viz.ts:9-11`).

**Animatsiya:** barcha easing/duration `lib/gsap.ts` dan (`EASE`, `DUR`, `STAGGER`).
Uchta qoida (`lib/gsap.ts:8-15`):
1. Faqat `opacity` va `transform` animatsiya qiling.
2. Kirish animatsiyalari 0.9–1.3s, 30–40px.
3. Takrorlanuvchi animatsiya faqat o'zini oqlagan joyda.

`useGSAP` har doim `{ scope: ref }` bilan — unmount'da avtomatik tozalanadi.

**Reduced motion:** ikki xil API:
- `prefersReducedMotion()` (`lib/gsap.ts:116`) — GSAP callback ichida, imperativ
- `useReducedMotion()` (`components/motion/use-reduced-motion.ts:30`) — faqat
  *renderni* o'zgartirsa

⚠️ `app/layout.tsx:115` da `data-motion="full"` **qattiq yozilgan** — foydalanuvchi
o'chira olmaydi. "system" ga o'zgartirish qarorni OS'ga qaytaradi.

### 10.7 i18n

Ikki fayl, ataylab ajratilgan (`lib/i18n/config.ts:3-8`):
- `lib/i18n/config.ts` — tiplar, konstantalar, `getDictionary()`, `fill()`.
  **Universal** — klient komponentlar shundan import qiladi.
- `lib/i18n/index.ts` — `getLang()`. **Faqat server** — `next/headers` import qiladi.

⚠️ Klient komponentda `@/lib/i18n` dan import qilsangiz, server moduli brauzer
bundle'iga tushadi va build tushadi.

Naqsh:
- **Server komponent:** `const t = getDictionary(await getLang());`
- **Klient komponent:** `const { t } = useT();`

Sonlar `{count}` placeholder orqali: `fill(t.dash.pointsToGo, { count: 42 })`.
Funksiya emas — chunki funksiyalar Server→Client chegarasidan o'ta olmaydi
(`lib/i18n/dictionaries.ts:20-25`).

**O'zbekcha — manba til**, ingliz tili tarjima (`dictionaries.ts:16-18`).
Default `uz` (`config.ts:15`), `Accept-Language` sniffing **yo'q** (`index.ts:4-6`).

---

## 11. README bilan ziddiyatlar

`README.md` ba'zi joylarda eskirgan. Tekshirilgan farqlar:

| README aytadi | Haqiqat | Dalil |
| --- | --- | --- |
| "**Framer Motion** — `motion` paketi, `motion/react` dan import" | ❌ Framer Motion umuman yo'q. **GSAP** ishlatiladi | `package.json` da `motion` yo'q; `motion/react` importi 0 ta fayl |
| `lib/motion.ts` — "shared easings, springs, variants" | ❌ Bunday fayl yo'q. `lib/gsap.ts` bor | `find` natijasi |
| `data/i18n/` — "en/uz UI strings" | ❌ `lib/i18n/dictionaries.ts` da | — |
| "`auth.protect()` in `app/(app)/layout.tsx`" | ❌ Funksiya nomi `requireUserId()` | `app/(app)/layout.tsx:69` |
| `CLERK_SECRET_KEY` env talab qilinadi | ❌ Clerk butunlay olib tashlangan | `.env.example` da yo'q |
| `ADMIN_IMPORT_TOKEN` haqida hech narsa | ❌ Kod uni ishlatadi, README/env shabloni eslatmaydi | `bulk-import/route.ts:61` |
| `POST /api/admin/bulk-import` haqida hech narsa | ❌ To'liq endpoint mavjud (450 qator) | `app/api/admin/bulk-import/route.ts` |

Shuningdek eskirgan **kod izohlari**:
- `lib/i18n/index.ts:29` — "both call Clerk's `auth()`" → Clerk yo'q
- `lib/gsap.ts:110` — "inline script in `MotionProvider`" → `MotionProvider`
  komponenti mavjud emas (butun repo bo'ylab faqat shu izohda uchraydi)
- `proxy.ts:21-23` — `requireUser()` deb yozilgan, aslida `requireUserId()`
- `app/(app)/layout.tsx:5` — "Routes under this layout are protected by
  `proxy.ts`" → chalg'ituvchi; haqiqiy himoya `:69` dagi `requireUserId()`

---

## 12. Xavfli va nozik joylar

> Bu bo'lim eng muhimi. Bu yerlarni o'zgartirishdan oldin o'qing.

### 12.1 Javob kaliti brauzerga oqib ketishi

**Xavf:** `app/simulator/[testId]/page.tsx:111-121` dagi `select` ga
`correctAnswer` yoki `explanation` qo'shsangiz — javob kaliti RSC payload'iga
tushadi va o'quvchi test paytida uni o'qiy oladi.

Buni ushlab turuvchi uchta joy:
1. `lib/simulator.ts:22` — `SimulatorQuestion` tipida javob maydoni yo'q
2. `app/simulator/[testId]/page.tsx:109-121` — `select` ataylab cheklangan
3. Baholash faqat `lib/actions/attempts.ts:174` da

`app/(app)/practice/results/[resultId]/page.tsx:83-84` da `correctAnswer`
**tanlanadi** — bu to'g'ri, test allaqachon tugagan (`:3-6`).

### 12.2 Universitet seed'ida `deleteMany` xavfi

`prisma/seed.ts:352` — prune faqat **API'dan kelgan** qatorlarni o'chiradi:
```ts
where: { dataSource: "scorecard", descriptionUz: null, scorecardId: { notIn: keptIds } }
```

**`prisma.university.deleteMany()` ni to'liq ishlatmang.** Sabablar
(`seed.ts:336-350`):
- Oxford, Cambridge, UCL, Toronto, NYUAD, WIUT — AQSh federal ma'lumotlarida
  yo'q, qaytib kelmaydi
- Qo'lda yozilgan o'zbekcha matn yo'qoladi
- **`UniversityShortlistEntry` cascade** — har bir o'quvchining shortlisti
  jimgina o'chib ketadi

### 12.3 Prisma pool va `pool.on("error")`

`lib/prisma.ts:106` dagi error handler **o'chirilmasligi kerak**. `pg.Pool`
EventEmitter; listener'siz `error` event Node protsessini o'ldiradi. Dev'da bu
"server crash → restart → brauzer reload" siklini sekundiga bir marta beradi.

`poolSize()` default 1 (`:73`). Prod'da `DATABASE_POOL_MAX=10` qo'yilmasa —
barcha so'rovlar bitta ulanishda navbatga turadi. Dashboard bitta so'rovda
8 ta query yuboradi (`lib/queries/dashboard.ts:95`), ya'ni bu sezilarli.

### 12.4 `ADMIN_IMPORT_TOKEN` hujjatlashtirilmagan

`app/api/admin/bulk-import/route.ts:61` uni o'qiydi, lekin `.env.example` da
**yo'q**. Oqibati:
- Dev'da: token yo'q → autentifikatsiya talab qilinmaydi (`:74-75`) — bu ataylab
- Prod'da: token yo'q → endpoint 503 qaytaradi (`:65-72`) — ochiq qolmaydi

Ya'ni xavfsizlik teshigi emas, lekin deploy qilgan odam bu endpoint borligini
bilmasligi mumkin. `.env.example` ga qo'shish kerak.

### 12.5 `startAttempt()` — GET render paytida yozadi

`app/simulator/[testId]/page.tsx:137` Server Component render'i ichida
`startAttempt()` (Server Action) chaqiriladi. Bu **DB'ga yozadi**: `TestAttempt`
qatorini yaratadi va taymerni ishga tushiradi.

Ta'siri: `/simulator/:testId` ga har qanday render (jumladan prefetch) urinishni
boshlaydi. `startAttempt` idempotent (`:54-69` mavjud `IN_PROGRESS` ni qaytaradi),
shuning uchun ikkilanish yo'q — lekin **taymer sahifa ochilishi bilanoq ketadi**.

### 12.6 Taymer tugashi serverda majburlanmaydi

Taymer klientda (`components/simulator/countdown-timer.tsx:44`) va u
`deadlineMs` ga tayanadi. Server tomonda `submitAttempt`
(`lib/actions/attempts.ts:137`) **muddat tugaganini tekshirmaydi** — u faqat
`durationSeconds` ni hisoblaydi (`:180`).

Ya'ni: tab'ni ochiq qoldirib, JS'ni to'xtatib, keyin topshirish mumkin.
`README.md` "taymerni reload bilan qayta boshlab bo'lmaydi" deydi — bu to'g'ri,
lekin "muddatdan keyin topshirib bo'lmaydi" **degani emas**.

### 12.7 `npm run typecheck` hozir tushadi

4 ta xato, hammasi `.next/types/validator.ts` da — mavjud bo'lmagan route'larga
ishora qiladi:
- `app/api/progress/history`, `/refresh`, `/summary`
- `app/api/skills/weak`

Bu **eskirgan build artefakti**. `tsconfig.json:22` `.next/types/**/*.ts` ni
`include` ga qo'shadi, shuning uchun eski typegen chiqishi tekshiriladi.

**Yechim:** `.next` ni o'chirib qayta build qiling, yoki `npx next typegen`.

**Muhimroq xulosa:** bu artefaktlar loyihada ilgari **butun bir "progress /
skills / mastery" funksiyalar to'plami** bo'lganini ko'rsatadi. Buni
[§12.8](#128-prisma-generated-client-eskirgan) tasdiqlaydi.

### 12.8 Prisma generated client eskirgan

`lib/generated/prisma/models.ts` **26 ta** model eksport qiladi, lekin
`prisma/schema.prisma` da faqat **16 ta** bor. Ortiqcha 10 tasi:

`Attempt`, `CountdownSnapshot`, `Domain`, `Extracurricular`, `MasterySnapshot`,
`ScoreEstimate`, `Skill`, `SkillMastery`, `SkillPrerequisite`, `StudyDay`

Bu — olib tashlangan adaptive/mastery tizimidan qolgan. **Ilova kodi ularning
hech biriga murojaat qilmaydi** (tekshirildi — faqat generated fayllarning
o'zida uchraydi).

`lib/generated/prisma/` git-ignored (`.gitignore:36`), `npm install` da
qayta yaratiladi. Lekin **hozirgi holatda u sxemaga mos emas** — `prisma generate`
ishlatilmaguncha shu eskirgan tiplar ishlatiladi.

**Amal:** `npm run db:generate` ishlatib qayta yarating. Va `lib/generated/prisma/`
ni **hech qachon sxema haqiqati** deb hisoblamang — `prisma/schema.prisma` haqiqat.

### 12.9 `.clerk/` papkasi hali turibdi

`.clerk/.tmp/keyless.json` mavjud, garchi Clerk butunlay olib tashlangan bo'lsa
ham. `.gitignore:39` uni istisno qiladi ("can include secrets"), shuning uchun
commit qilinmagan. Lokal axlat — o'chirish xavfsiz.

### 12.10 Bir-biriga bog'liq joylar (birini o'zgartirsa ikkinchisi buziladi)

| Agar o'zgartirsangiz | Ham tekshiring |
| --- | --- |
| `prisma/schema.prisma` | `npm run db:generate` **shart**, keyin `lib/queries/`, `lib/actions/` |
| `User` modelining birinchi 5 maydoni | ⛔ Auth.js adapter kontrakti — nomlarni o'zgartirmang (`schema.prisma:81-83`) |
| `Account` modelidagi snake_case maydonlar | ⛔ Bular xom OAuth javob kalitlari (`schema.prisma:121-123`) |
| `lib/user.ts:27` `STARTER_ROADMAP` | `prisma/seed.ts:119` `backfillRoadmapSlugs()` ham shu ro'yxatga tayanadi |
| `lib/i18n/dictionaries.ts` `uz` obyekti | `en` obyekti `Dictionary` tipiga majbur (`:414`) — struktura mos kelishi shart |
| `lib/viz.ts` `TONES` | Klass satrlari to'liq yozilishi shart (Tailwind skaneri) |
| `proxy.ts:35` `PROTECTED_PREFIXES` | Faqat UX'ga ta'sir qiladi — haqiqiy himoya route'larda |
| `app/globals.css` `@theme` bloki | Butun UI — bu yagona token manbai |
| `lib/sat.ts` `estimateScaledScore` | `scripts/check-domain.ts:73-78` assertion'lari |
| `lib/vocabulary.ts` tokenizer | `scripts/check-domain.ts:38` — round-trip assertion **kritik** |
| `data/vocabulary.json` sxemasi | `lib/vocabulary.ts:18-35` `VocabularyEntry` **va** `prisma/seed.ts:58-67` `VocabularyFile` — ikkita alohida tip e'loni |

### 12.11 Takrorlangan kod

| Joy | Nima |
| --- | --- |
| `prisma/seed.ts:311-323` va `:336-350` | **Bir xil izoh bloki ikki marta** yozilgan. Birinchisi (`:311-323`) hech narsani izohlamaydi — ostidagi kod `updateMany` (prune emas) |
| `app/(auth)/sign-in/page.tsx:26-34` va `sign-up/page.tsx:25-33` | Bir xil izoh + bir xil mantiq |
| `tests/import/route.ts:42-47` va `bulk-import/route.ts:51-56` | `tokensMatch()` funksiyasi **aynan nusxa** |
| `tests/import/route.ts:51-83` va `bulk-import/route.ts:60-92` | `authorise()` — faqat env nomi bilan farq qiladi |
| `lib/actions/attempts.ts:19-20` | `getCurrentUserId` va `getOrCreateCurrentUser` bir xil moduldan **ikkita alohida import qatori** |

---

## 13. O'lik kod va ishlatilmaydigan bog'liqliklar

### 13.1 O'lik fayllar

| Fayl | Holat |
| --- | --- |
| `data/admissions-sample.ts` | ⚠️ **Hech qayerda import qilinmaydi.** Faqat `bulk-import/route.ts` shu nomdagi *tiplarga* o'xshash ish qiladi, lekin bu faylni ishlatmaydi |
| `hooks/use-mobile.ts` | Faqat `components/ui/sidebar.tsx` ishlatadi — u ham ishlatilmaydi |
| `.clerk/.tmp/` | Clerk qoldig'i |
| `tsconfig.tsbuildinfo` | Build keshi (416 KB), `.gitignore:32` da |

### 13.2 Ishlatilmaydigan shadcn komponentlari (51 dan 30 tasi)

```
accordion, alert, alert-dialog, aspect-ratio, avatar, breadcrumb,
button-group, calendar, card, carousel, chart, collapsible, command,
context-menu, drawer, empty, field, hover-card, input-otp, item,
menubar, navigation-menu, pagination, radio-group, resizable,
scroll-area, sidebar, spinner, table, toggle-group
```

Ishlatilayotganlari: `badge`, `button`, `checkbox`, `dialog`, `dropdown-menu`,
`input`, `label`, `popover`, `progress`, `select`, `separator`, `sheet`,
`skeleton`, `slider`, `sonner`, `switch`, `tabs`, `textarea`, `toggle`,
`tooltip`, `kbd`.

⚠️ **Ehtiyot bo'ling:** bu shadcn konventsiyasi — komponentlar `npx shadcn add`
bilan qo'shiladi va kerak bo'lganda ishlatiladi. O'chirish "tozalash" bo'lsa-da,
keyingi safar qayta qo'shishga to'g'ri keladi. `components/design-system/*`
ba'zilarini demo uchun ishlatishi mumkin — o'chirishdan oldin tekshiring.

### 13.3 Faqat ishlatilmaydigan komponentlar orqali kirib kelgan paketlar

| Paket | Yagona ishlatuvchi | Ishlatiladimi |
| --- | --- | --- |
| `recharts` | `components/ui/chart.tsx` | ❌ |
| `embla-carousel-react` | `components/ui/carousel.tsx` | ❌ |
| `vaul` | `components/ui/drawer.tsx` | ❌ |
| `cmdk` | `components/ui/command.tsx` | ❌ |
| `input-otp` | `components/ui/input-otp.tsx` | ❌ |
| `react-day-picker` | `components/ui/calendar.tsx` | ❌ |
| `react-resizable-panels` | `components/ui/resizable.tsx` | ❌ |
| `next-themes` | `components/ui/sonner.tsx` | ✅ (sonner ishlatiladi) |

**Umuman ishlatilmaydiganlar:**
- `date-fns` — manba kodda **0 ta** import
- `shadcn` — bu CLI paketi, `dependencies` da turibdi (`devDependencies` da
  bo'lishi kerak edi). ⚠️ Lekin `app/globals.css:32` `@import "shadcn/tailwind.css"`
  qiladi — ya'ni **build vaqtida kerak**, o'chirmang.

Haqiqatan ishlatiladiganlar: `fflate` (`lib/api/scorecard-bulk.ts`),
`gsap` + `@gsap/react`, `zod`, `pg`, `radix-ui` (32 fayl), `lucide-react`,
`clsx` + `tailwind-merge`, `sonner`, `class-variance-authority`.

### 13.4 Yozilib, o'qilmaydigan modellar

`ApplicantProfile`, `Essay`, `ActivityReference` — `POST /api/admin/bulk-import`
ularga **yozadi**, lekin hech bir UI ularni **o'qimaydi**. Ya'ni ma'lumot
kiritiladi va ko'rinmaydi.

`README.md` cheklov #7 buni tan oladi: "Essays, portfolio and extracurriculars
are marketing only."

---

## 14. Ochiq savollar

Kodni o'qib javob topa olmaganim — sizdan so'rayman:

1. **`app/design-system/` route'i prod'da qolishi kerakmi?**
   U himoyalanmagan (`proxy.ts:35` ro'yxatida yo'q) va uchta raqobatlashuvchi
   dizayn yo'nalishini ko'rsatadi. `robots: { index: false, follow: false }`
   qo'yilgan (`app/design-system/layout.tsx:73`), ya'ni qidiruvga tushmaydi —
   lekin URL'ni bilgan har kim ocha oladi. Bu shundayligicha qolsinmi?

2. **`.next` va `lib/generated/prisma` eskirganini tuzataymi?**
   Ikkalasi ham git-ignored build artefakti. Men **hech narsani o'zgartirmadim**
   (siz so'raganingizdek). `rm -rf .next && npm run db:generate` typecheck'ni
   ham, Prisma tiplarini ham tuzatadi. Ruxsat berasizmi?

3. **`ApplicantProfile` / `Essay` / `ActivityReference` — keyingi ish rejasidami?**
   Modellar va import endpointi tayyor, UI yo'q. Bu rejalashtirilgan ishmi yoki
   olib tashlanishi kerakmi?

4. **"progress / skills / mastery" tizimi ataylab olib tashlanganmi?**
   Eskirgan artefaktlar (`.next/types`, generated Prisma modellari) uning
   mavjud bo'lganini ko'rsatadi, lekin `git log` da faqat 3 ta commit bor va
   ularning hech birida bu ko'rinmaydi. Qaytarish rejasi bormi?

5. **Migratsiyalar kerakmi?**
   Hozir `prisma db push` workflow'i. `prisma.config.ts:15` migratsiya yo'lini
   e'lon qiladi, lekin `prisma/migrations/` papkasi yo'q. Prod'ga chiqishdan
   oldin `prisma migrate` ga o'tish rejasi bormi?

---

*Oxirgi tekshiruv: 2026-08-20 · commit `febb0b8` · `npm run check` 35/35 ✅ ·
`eslint` toza ✅ · `tsc --noEmit` 4 ta xato (eskirgan `.next` artefakti) ❌*
