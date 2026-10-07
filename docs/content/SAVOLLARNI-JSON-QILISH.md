# Sirius savollarini JSON qilish

Bu loyiha hozir sizdagi savollarni qabul qilishga tayyor. Namuna `sirius-questions-template.json` faylida. Undagi ikki arifmetik savol formatni tushuntirish uchun yozilgan; ular rasmiy SAT kontenti yoki tayyor savol banki emas. Fayl avtomatik yuklanmadi.

## Qanday tayyorlaysiz?

1. Math va Reading & Writing savollarini alohida `tests` obyektlariga ajrating. Bir obyektga ko‘pi bilan 200 savol; bitta faylga ko‘pi bilan 50 obyekt, 8 MB.
2. Har test va savolga o‘zgarmaydigan `externalId` bering: masalan, `sirius-math-bank-01`, `math-linear-001-v1`. ID har safar qayta eksportda bir xil qolishi kerak.
3. Savol, passage, variantlar, javob va izohni aynan materialingizdan kiriting. Manba va foydalanish ruxsatini haqiqiy ma’lumot bilan yozing.
4. `skillCode`ni loyiha taksonomiyasidan tanlang: `lib/taxonomy.ts` ichidagi `SKILL_CODES`. Erkin topic nomi uning o‘rnini bosmaydi. Taksonomiya tegishli bazada mavjud bo‘lishi kerak.
5. `/content` sahifasida JSON’ni tanlang → **Avval ko‘rib chiqish** → **Qoralama sifatida saqlash**. Preview format, sonlar, izoh, skill va manba mavjudligini tekshiradi; savolning pedagogik to‘g‘riligini o‘qituvchi tekshiradi.
6. O‘qituvchi savol, variantlar, javob, izoh, skill va manbani tekshirib **Tekshirildi** deydi. Administrator tayyor testni nashr qiladi.

## Asosiy maydonlar

| Maydon | Qiymat va ma’nosi |
|---|---|
| test.externalId | Qayta import uchun doimiy test ID |
| test.type | `MATH`, `READING` yoki `FULL` |
| test.sourceName | Haqiqiy muallif/manba |
| test.rightsNote | Shu materialdan foydalanishga ruxsat yoki egalik izohi |
| test.isPublished | Namunalarda `false`; import har doim qoralamaga saqlaydi |
| test.questions | Savollar; faqat `FULL` container’da bo‘sh bo‘lishi mumkin |
| question.externalId | Shu test ichidagi doimiy, noyob savol ID |
| question.order | Modul ichida 1 dan boshlanadigan tartib |
| question.module | `MODULE_1` yoki `MODULE_2`; yo‘q bo‘lsa birinchi modul hisoblanadi |
| question.passageText / passageTitle | Reading uchun asl passage va ixtiyoriy nom |
| question.questionText | Savol matni |
| question.format | `MULTIPLE_CHOICE` yoki `SPR` |
| question.options | MCQ uchun kamida ikki `{label, text}` variant |
| question.correctAnswer | MCQ’da variant belgisi, masalan `C`; SPR’da to‘g‘ri son/ifoda |
| question.acceptedAnswers | Muqobil SPR javoblar, masalan `["0.75"]` |
| question.explanation | O‘qituvchi tekshiradigan yechim va tushuntirish |
| question.skillCode | Mavjud taksonomiyadagi aniq kod |
| question.difficulty | Ixtiyoriy `EASY`, `MEDIUM`, `HARD`; ma’lum bo‘lmasa kiritmang |

`reviewStatus`, `reviewedById` yoki `role`ni JSON bilan berib tasdiqlash mumkin emas. Holat va tekshiruvchi serverda belgilanadi. Hozir yangi practice va mock faqat `VERIFIED` savollardan yig‘iladi. Eski savollar migratsiyadan keyin `UNREVIEWED` bo‘ladi; o‘qituvchi tekshirmaguncha yangi mashqlarga qo‘shilmaydi. Faol urinishlar va natijalar o‘z saqlangan ID’lari orqali ochiladi.

## To‘liq mock uchun bank

| Bo‘lim | 1-modul | 2-modul |
|---|---:|---:|
| Reading & Writing | Kamida 27 tekshirilgan savol | Kamida 27 |
| Math | Kamida 22 tekshirilgan savol | Kamida 22 |

Bu jami kamida 98 savol. `FULL` test container’i shu global bankdan to‘rt modulni yig‘adi. Bitta faylda 98 savol borligi yetmaydi: bo‘lim, skill, modul va tekshiruv holati mos bo‘lishi kerak. Blueprint bo‘yicha mavzu muvozanati va statistik kalibratsiya alohida keyingi ish; ball hozir Sirius taxmini sifatida ko‘rsatiladi.

## Savolni tuzatish

Bir xil ID bilan aynan bir xil kontentni yuklash savolni ko‘paytirmaydi. Matn, variant, javob, skill yoki izohni almashtirsangiz yangi savol ID ishlating (`…-v2`). Eski savolni kontent boshqaruvida rad qiling. U history’dan o‘chmaydi. Importdan tushirib qoldirish savolni o‘chirmaydi. Urinishlari bor testning turini almashtirish uchun ham yangi test ID kerak.

## Kontent huquqlari

`STUDENT` — o‘z ma’lumotlari va o‘qish oqimlari; `EDITOR` — preview/import/tekshirish; `ADMIN` — ularga qo‘shimcha nashr va ichki statistika. Dastlabki administratorni baza egasi tasdiqlangan hisobga bir marta belgilaydi. Ilovada o‘ziga administrator huquqini berish yo‘li yo‘q. 2026-10-05 kuni foydalanuvchi aniq ko‘rsatgan mavjud hisobga faqat `dev/sirius` test branch’da ADMIN berildi.

Import API ham mavjud: `/api/tests/import`, token bilan. U ham qoralama saqlaydi; nashr va o‘qituvchi tekshiruvi `/content` orqali amalga oshiriladi. Maxfiy token va baza kalitlarini JSON ichiga yoki chatga yozmang.

## Birinchi 5–10 savol uchun qabul tartibi

Hozir tekshiruvchi hali tayinlanmagan. Savollarni JSON qilib qoralamaga saqlash mumkin; nashrdan oldin savollarni tekshiradigan mas’ulni belgilang. Birinchi kichik batch’ni quyidagicha tekshiring:

1. Manba/ruxsat haqiqiy; passage va variantlar to‘liq; externalId’lar takrorlanmagan.
2. Mas’ul har savolni javob kalitiga qaramasdan yechadi, keyin kalit va explanation’ni solishtiradi. MCQ’da bitta to‘g‘ri variant bo‘lsin; SPR’da fraction/decimal kabi qabul qilinadigan muqobil javoblar ko‘rsatilgan bo‘lsin.
3. Skill va bo‘lim mosligini tekshiradi; daraja ma’lum bo‘lmasa taxminiy difficulty qo‘ymaydi.
4. CMS’da faqat tekshirilgan savollar VERIFIED bo‘ladi. Tuzatishda yangi savol ID ishlatiladi; eski savol REJECTED qilinadi.
5. Test branch’da nashr → bir to‘g‘ri, bir noto‘g‘ri javob → explanation → reload/history tekshiriladi. Keyin navbatdagi batch.

ADMIN huquqi pedagogik tekshiruvning o‘rnini bosmaydi. Hozirgi 42 eski savol avtomatik tasdiqlanmadi.
