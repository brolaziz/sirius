# Sirius: implementatsiya holati va keyingi qadamlar

2026-10-05. Asosiy reja: `ielts-nation-sirius-roadmap-2026-10-05.md`. Avval urinish va ma’lumot ishonchliligi, keyin kundalik UX, o‘qish jarayoni, shaxsiy workspace va kontent boshqaruvi amalga oshirildi. Bu koddagi holat; production’da ishga tushganlik yoki brauzerda tasdiqlanganlik emas.

Sirius’ning mavjud ko‘k ranglari, midnight/lime aksentlari, shriftlari, bento kartalari, glass sidebar va komponentlari ishlatildi. IELTS Nation’dan vazifaga kirish, resume, tarix va takrorlash usullari o‘rganildi. Uning brendi yoki kontenti ko‘chirilmadi.

## Bajarilgan paketlar

| Paket | Koddagi holat va chegarasi |
|---|---|
| SR-01–04 | Urinish boshida savollar ID va tartibi saqlanadi. Render, autosave, grading va review bir xil ID’larni ishlatadi. Bank to‘liq bo‘lmasa backend ham full mock’ni boshlamaydi. Submit transaction va yagona attempt/result bilan himoyalangan. Reimport eski savol, javob va history’ni o‘chirmaydi. |
| SR-05–09 | Dashboard’da haqiqiy Bugungi vazifa: tugallanmagan ish → joriy haftadagi qolgan reja vazifasi → mavjud mashq. Resume saqlangan javob va server vaqtini oladi. Profil’da maqsad, boshlang‘ich ball/ma’lum emas, sana, haftalik vaqt tahrirlanadi. Simulator’da saqlash holati, retry va boshqa oynadagi o‘zgarish uchun reload bor. |
| SR-10–12, 26 | Yangi oqimlarda uz/en matnlar, loading, responsive konteynerlar va yangi boshqaruvlarda katta touch target. OS reduced-motion ishlaydi. Review balli Sirius taxmini deb yozilgan. Eski UI matnlarining to‘liq auditi va barcha ekran o‘lchamlari bo‘yicha visual QA qolgan. |
| SR-13–16 | Completed review’da passage, muqobil SPR javoblar va mavjud explanation. Skill coverage hisoboti. Practice, mistake review va mock bitta tarixda. Xato/bo‘sh savol keyin to‘g‘ri ishlansa yaqin natijalar navbatidan chiqadi. Haqiqiy explanation va tekshirilgan bank sizdan olinadi. |
| SR-17 | Kamida beshta turli savolga javob dalili bo‘lgach yangi reja ustuvorligi cheklangan miqdorda moslanadi. Eski rejalar saqlanadi. Har skill bo‘yicha javoblar, to‘g‘ri javoblar va ustuvorlik sababi reja yaratilgan paytda saqlanib, shu rejaning sahifasida ko‘rsatiladi. Bu score calibration yoki mastery bahosi emas. |
| SR-18 | Shaxsiy application tracker: universitet, intake, deadline, status, checklist, notes va o‘z faoliyatlarini bog‘lash. Ommaviy qabul natijalari katalogidan alohida. Create/read/update, qaytariladigan arxiv, va universitet sahifasidan nomi tayyor ariza formasi bor. Rasmiy deadline avtomatik ko‘chirilmaydi; student intake uchun tekshiradi. |
| SR-19 | Shaxsiy essay draft, application’ga bog‘lash, autosave, stale-tab himoyasi, word limit, versiyalar, oldingi versiyani tiklash va qaytariladigan arxiv. AI feedback ulanmagan. |
| SR-20 | Due queue, ma’noni eslash va tarjimadan inglizcha so‘zni eslash, reveal, self-rating va keyingi takrorlash muddati. Tarjimasi topilmagan so‘zlar bankda qoladi. SAT balliga qo‘shilmaydi. |
| SR-21 | Serverda idempotent learning event’lar, admin uchun 30 kunlik guruh/amal sonlari, D7/D14 qaytish va faqat aggregate CSV eksport. Retention birinchi mazmunli amaldan keyin to‘liq tugagan 24 soatlik kuzatuv oynalari bo‘yicha; takroriy event bitta odamni ko‘paytirmaydi. Practice izohi ekranda ko‘ringani va joriy haftaning reja vazifasi threshold’i bajarilgani qayd etiladi. Izoh ko‘rinishi o‘qib tushunish bahosi emas. Javob, passage, insho va notes event/eksportga yozilmaydi; eski faoliyatga sun’iy event yo‘q. To‘liq plan-task conversion funnel keyingi ish.  |
| SR-23 | Role, JSON preview → draft import → question review → admin publish, tekshiruvchi/vaqt va audit trail. JSON bilan role yoki tasdiq berib bo‘lmaydi. Full mock uchun 27/27/22/22 tekshirilgan savol kerak. Yangi practice ham tekshirilgan savollardan yig‘iladi. |

## Migration va release

To‘qqizta qo‘shimcha migration tayyor: attempt identity, progress revision, mistake review, private workspaces, content review/audit, learning events, workspace archive, plan evidence, learning-event user/time indeksi. Eski ma’lumotlarni o‘chiradigan migration yozilmadi. Local Prisma Postgres’da avvalgi chain bo‘sh bazadan sinaldi va yangi migration’lar qo‘llandi. Schema diff yo‘q.

Baza egasi Neon Console’da alohida `dev/sirius` branch yaratib, uning URL’ini lokal `.env`ga joyladi. Avvalgi endpoint autentifikatsiyasi `28P01` bilan rad etildi va unga migration yuborilmadi. Yangi endpoint `ep-wild-cell-axrnm8i3`, `DATABASE_ENV=dev`. 9 yangi migration to‘g‘ridan-to‘g‘ri shu endpoint’ga `migrate deploy` bilan qo‘llandi; jami 17 migration va schema diff yo‘q. Faqat shu test branch’da foydalanuvchi aniq ko‘rsatgan mavjud hisobga ADMIN berildi. Hosted bazaga fixture yoki namunaviy savol import qilinmadi. Production branch va deploy o‘zgartirilmadi. `DATABASE.md` bazalarni ajratish tartibini tushuntiradi.

Muhim release o‘zgarishi: eski savollar `UNREVIEWED` bo‘ladi; o‘qituvchi tekshirgach yangi practice/mock’ga qo‘shiladi. Faol urinishlar va result’lar o‘z saqlangan savol ID’larini saqlaydi. Import API doim qoralama qiladi va dev’da ham `TEST_IMPORT_TOKEN` talab etadi. Dastlabki admin role baza egasi tomonidan tasdiqlangan hisobga beriladi; test branch’dagi yagona administrator foydalanuvchining aniq so‘rovi bilan tayinlandi.

## Tekshiruv

- TypeScript va ESLint o‘tdi.
- 15 faylda **226 test o‘tdi**, jumladan lokal PostgreSQL integratsion testlari.
- Domain tekshiruvi: **35 passed, 0 failed**.
- Optimallashtirilgan Next.js production build o‘tdi.
- Prisma migration/schema diff: **No difference detected**.
- Cross-container 98 savol grading/review, reimport identity, submit/advance retry, autosave tartibi, kech payload, ownership, essay revision, word-rating replay, kontent huquqlari, event idempotency, practice javob/finish retry, egaga tegishli izoh, reja threshold’i, D7/D14 chegaralari va aggregate CSV maxfiyligi sinaldi.

Lokal Prisma dev bazasi bitta connection ishlatadi. Parallel Promise so‘rovlari sinaldi; production’dagi ko‘p connectionli yuklama/stress testi bajarilmadi. Row lock va unique constraint’lar kodda bor.

Brauzerda IELTS Nation’ga qayta kirish va lokal sahifani ochish ruxsat nazoratida rad etildi. Cheklov boshqa usul bilan chetlab o‘tilmadi. Yangi UI screenshot’lari, 320–1440 px visual QA, klaviatura/focus va real student task testlari **bajarilgan deb hisoblanmaydi**.

Avvaldan mavjud `lib/study-plan.ts` va `tests/study-plan.test.ts` o‘zgarishlari saqlandi; ular ushbu implementatsiyada tahrirlanmadi. Commit, push, production deploy va haqiqiy savol banki importi bajarilmadi. Student oqimlaridagi server xatolarining uz/en ko‘rinishi yaxshilandi; mashq javob/finish tarmoq xatosida qayta urinish mumkin.

## Keyingi ketma-ket ishlar

1. **Dev’da foydalanib tekshirish.** `dev/sirius` target, migration deploy va tasdiqlangan ADMIN tayyor. 42 mavjud savolning barchasi UNREVIEWED; 31 skill mavjud. Brauzer ruxsati bilan uz/en, mobil/desktop, reload/resume, offline retry va yangi sahifalarni tekshirish. Responsive/i18n qabul mezonlarini yopish.
2. **Savollarni JSON qilish.** `docs/content/SAVOLLARNI-JSON-QILISH.md` va namuna bo‘yicha doimiy ID, passage/options, javob, explanation, skill, modul, haqiqiy manba/ruxsat. Preview → kichik birinchi batch → o‘qituvchi review → to‘liq bank. Xato javob, uzun passage, fraction/decimal va ikki modul holatlarini tekshirish.
3. **O‘qish va admissions oqimini yakunlash.** Usability muammolari; explanation holatlari; analytics’da task conversion funnel va dalilga asoslangan keyingi o‘lchovlar. D7/D14 qaytish va aggregate eksport tayyor.
4. **AI — SR-22.** Provayder/model, maxfiy env, budget va o‘qituvchi tekshirgan explanation kerak. Keyin grounded feedback, answer-key himoyasi, teacher eval, uz/en sifat testi, rate limit/timeout/cache/cost monitoring. Provayder tanlanmagani uchun xizmat yoqilmadi.
5. **To‘lov — SR-24.** Siz to‘lov hali ulanmaganini aytdingiz. Provayder, tarif/valyuta, merchant hisob va test webhook muhiti tanlangach entitlement, idempotent verified webhook, expiry, failure/recovery va refund/access siyosati amalga oshiriladi. Jonli checkout yoki premium va’dasi qo‘shilmadi.
6. **Landing demo — SR-25.** Tekshirilgan original namuna bilan authsiz demo → explanation → onboarding. Kontent tayyor bo‘lmaguncha rasmiy test/natija sifatida ko‘rsatilmaydi.
7. **Bosqich 5.** Yetarli haqiqiy savol va student ma’lumotlari yig‘ilgach difficulty/blueprint balansini baholash, score uncertainty va adaptive routing kalibratsiyasi. Games/leaderboard retention foydasi asoslangandan keyin.

To‘lov, AI, tekshirilgan haqiqiy bank va visual QA ochiq turgani uchun butun roadmap tugagan deb belgilanmadi. Asosiy oqimlar va ular uchun tekshirilgan kod tayyor.
