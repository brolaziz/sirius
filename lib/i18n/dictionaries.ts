/**
 * The two dictionaries.
 *
 * POSITIONING — read this before writing a single string.
 * Sirius is a college admissions platform, not an SAT site. The application is
 * the product: dream universities, essays and personal statements, portfolios,
 * extracurriculars, deadlines and documents. The SAT simulator is one tool
 * inside that, and no string should make it sound like the whole thing.
 *
 * VOICE
 * Professional and authoritative about the process, informal about the person.
 * Short sentences, second person, no exclamation marks, no "unlock your
 * potential". The reader is a sixteen-year-old who is already ambitious and can
 * tell when they are being sold to.
 *
 * Uzbek is the source language, not a translation of the English: Sirius is
 * built for students in Tashkent, and the first thing every visitor sees is
 * Uzbek unless they ask otherwise.
 *
 * Every value is a plain string. Strings that need a number carry a `{count}`
 * placeholder and are filled with `fill()` at the call site — the dictionary is
 * handed from a Server Component to a Client Component, and functions cannot
 * cross that boundary ("Functions cannot be passed directly to Client
 * Components"). A template also gives a translator the whole sentence, which a
 * function body does not.
 */

export const uz = {
  nav: {
    features: "Imkoniyatlar",
    journey: "Yo'l xaritasi",
    signIn: "Kirish",
    getStarted: "Boshlash",
    dashboard: "Kabinetga o'tish",
    openMenu: "Menyuni ochish",
    closeMenu: "Menyuni yopish",
    home: "Sirius bosh sahifasi",
  },

  lang: {
    label: "Til",
    uz: "O'zbekcha",
    en: "English",
    switchTo: "Switch to English",
  },

  hero: {
    badge: "Top universitetlarga kirish platformasi",
    headline: "Sirius: Top universitetlarga kirishingizda shaxsiy yordamchingiz",
    /*
     * The words the highlighter sweeps across. Matched word by word against the
     * headline, so every entry has to be a whole word from it.
     */
    highlight: ["Top", "universitetlarga", "shaxsiy", "yordamchingiz"],
    body: "SAT balingizni maksimal darajaga ko'taring va profilingizni dunyoning Top universitetlari uchun moslashtiring. Mukammal portfolio, insholar va Extracurricular faoliyatlarni bitta platformada boshqaring.",
    ctaPrimary: "Profilimni boshlash",
    ctaSecondary: "Hisobim bor",
    note: "Karta kerak emas. Profilingiz birinchi kundan to'planib boradi.",
  },

  ticker: {
    items: [
      "Personal statement — 4 ta qoralama",
      "Reach · Match · Safety",
      "Extracurricular profil",
      "Ivy League deadline: 1-yanvar",
      "Portfolio — 12 ta ish",
      "SAT 1310 → 1450",
      "Tavsiyanoma xatlari",
      "ubiquitous → hamma yerda mavjud",
      "Moliyaviy yordam: to'liq need",
    ],
  },

  features: {
    heading: "Ariza — bitta katta ish emas, oltita kichik ish",
    body: "Universitet tanlashdan tortib insho qoralamalarigacha. Har bir bo'lak alohida jadval yoki alohida ilova emas — hammasi bitta joyda, bir-biriga ulangan holda.",
    items: [
      {
        title: "Dream universitetlar",
        body: "Har bir universitet uchun qabul foizi, qabul qilinganlarning o'rtacha bali va moliyaviy yordam shartlari. Taxmin qilish tugadi.",
        bullets: ["Qabul foizi", "Qabul qilinganlar o'rtachasi", "Moliyaviy yordam"],
      },
      {
        title: "Insho va personal statement",
        body: "Qoralamalar, struktura va nimani aytmaslik kerakligi. Bitta hikoya — rezyume emas.",
        bullets: ["650 so'z", "Qoralamalar tarixi", "Supplemental insholar"],
      },
      {
        title: "Extracurricular faoliyat",
        body: "Ro'yxat emas, ta'sir. Har bir faoliyatni admissions ofisi o'qiydigan tilda yozib chiqasiz.",
        bullets: ["10 ta slot", "Ta'sir o'lchovi", "Yetakchilik"],
      },
      {
        title: "Portfolio",
        body: "Loyihalar, olimpiadalar, sertifikatlar va ishlaringiz — bitta havolada yig'ilgan holda.",
        bullets: ["Loyihalar", "Yutuqlar", "Bitta havola"],
      },
      {
        title: "Deadline va hujjatlar",
        body: "Qaysi universitet nima so'raydi va qachongacha. Hech narsa oxirgi kechada esga tushmaydi.",
        bullets: ["ED / EA / RD", "Hujjat ro'yxati", "Eslatmalar"],
      },
      {
        title: "SAT va til",
        body: "Imtihon kunidek simulyator va matn ichidagi o'zbekcha lug'at. Bu — platformaning bir bo'lagi, hammasi emas.",
        bullets: ["Ikki modul", "Inglizcha → o'zbekcha", "Taxminiy ball"],
      },
    ],
  },

  /*
   * The dictionary demo. Presented as one capability of the SAT toolkit, not as
   * a headline feature — its own last sentence has always said as much, and the
   * eyebrow now says it before the heading does.
   */
  dictionary: {
    eyebrow: "SAT tayyorgarligining bir qismi",
    heading: "Matn ichidagi o'zbekcha lug'at",
    body: "Simulyatordagi parchalarda, universitet sahifalarida va insho namunalarida belgilangan so'zga bosing — o'zbekchasi shu yerda chiqadi. Hech narsa yuklanmaydi, chunki lug'at ilova ichida keladi.",
    hintOn: "Istalgan belgilangan so'zga bosing",
    hintOff: "{count} ta so'zni ochish uchun UZ ni yoqing",
    footer: "Lug'atda hozir {count} ta so'z bor va u har hafta o'sib boradi.",
  },

  journey: {
    badge: "Yo'l xaritasi",
    heading: "11-sinfdan qabul xatigacha",
    body: "Ko'pchilik arizani noyabrda boshlaydi va yil oxirigacha yetib olishga urinadi. Sirius jarayonni to'rt bosqichga bo'ladi va har bosqichda aynan nima kerakligini aytadi.",
    stats: [
      { value: "4", label: "bosqich" },
      { value: "10", label: "extracurricular slot" },
      { value: "650", label: "so'z, personal statement" },
      { value: "1600", label: "maksimal SAT" },
    ],
    steps: [
      {
        title: "Profilingizni tuzing",
        body: "Baholar, faoliyatlar, yutuqlar. Qayerda kuchli, qayerda bo'sh ekaningiz birinchi kuni ko'rinadi.",
      },
      {
        title: "Ro'yxatni shakllantiring",
        body: "Ikki reach, ikki match, bitta safety. Har biri nima so'rashini bilib turasiz.",
      },
      {
        title: "Hikoyangizni yozing",
        body: "Personal statement va supplemental insholar. Birinchi qoralamadan yakuniy variantgacha.",
      },
      {
        title: "Arizani topshiring",
        body: "Hujjatlar, tavsiyanomalar, moliyaviy yordam — muddat bo'yicha tartiblangan holda.",
      },
    ],
  },

  cta: {
    heading: "Ro'yxatingizdagi universitet sizni kutmaydi",
    body: "Profilingizni bugun boshlang. O'n besh daqiqada qayerda turganingizni va keyingi qadam nima ekanini bilib olasiz.",
    primary: "Profilimni ochish",
    secondary: "Menda allaqachon bor",
  },

  footer: {
    tagline:
      "Top universitetlarga kirish uchun to'liq platforma: universitet ro'yxati, insholar, portfolio, extracurricular va SAT.",
    product: "Platforma",
    account: "Hisob",
    rights: "Barcha huquqlar himoyalangan.",
    disclaimer:
      "SAT® — College Board savdo belgisi. College Board Sirius bilan bog'liq emas va uni qo'llab-quvvatlamaydi.",
  },

  app: {
    backToSite: "Saytga qaytish",
    build: "Profil",
    apply: "Ariza",
    today: "Bugun",
    plan: "Reja",
    practice: "Mashq",
    myWords: "So'zlarim",
    universities: "Universitetlar",
    applications: "Qabul natijalari",
    applicationsTracker: "Arizalarim",
    essays: "Insholar",
    activities: "Faoliyatlar",
  },

  today: {
    eyebrow: "BUGUNGI QADAM", resume: "Boshlaganingizni davom ettiring", resumeBody: "Javoblaringiz va urinish vaqti saqlangan.",
    task: "Rejangizdagi keyingi mashq", remaining: "Bu haftadagi vazifada {count} ta savol qoldi.", startTask: "Mashqni boshlash",
    done: "Bu haftaning vazifalari bajarildi", doneBody: "Natijalaringizni ko'ring yoki qo'shimcha mashq uchun Practice bo'limiga o'ting.",
    setup: "Tayyorgarlik maqsadini belgilang", setupBody: "Maqsad, imtihon sanasi va haftalik vaqtni profil orqali sozlang. Hozir mavjud mavzularni ham mashq qilishingiz mumkin.",
    practice: "Bir mavzuni mashq qiling", practiceBody: "Mavzuni tanlang, javob bering va tushuntirishlar orqali xatolaringizni ko'rib chiqing.",
    continue: "Davom ettirish", editGoal: "Maqsadni sozlash", viewPlan: "Rejani ko'rish", viewPractice: "Mashqlarga o'tish",
  },
  dash: {
    greeting: "Salom, {name}",
    subtitle: "Bugun profilingizni bir qadam oldinga suramiz.",
    subtitleNoTarget:
      "Avval maqsad ballni belgilang — shundan keyin bu yerdagi raqamlar ma'no kasb etadi.",
    targetSet: "Maqsad {score}",
    targetUnset: "Maqsad ballni tanlang",
    targetDialogTitle: "Qaysi ballga qarab ishlaymiz?",
    targetDialogBody:
      "Ro'yxatingizdagi universitetlar so'raydigan ballni kiriting. Kabinetdagi hamma narsa shu raqamga qarab o'lchanadi.",
    targetLabel: "Maqsad ball",
    targetHint: "{min} dan {max} gacha, 10 lik qadam bilan.",
    targetSaved: "Saqlandi. Endi hammasi shu ballga qarab o'lchanadi.",
    targetInvalid: "400 va 1600 orasida raqam kiriting.",
    save: "Saqlash",
    saving: "Saqlanmoqda…",
    cancel: "Hozir emas",

    universities: "Dream universitetlar",
    universitiesEmpty: "Hali birorta universitet saqlanmagan.",
    universitiesCta: "Ro'yxatni ochish",
    moreUniversities: "+{count} ta yana",

    deadline: "Eng yaqin muddat",
    deadlineEmpty: "Muddat ko'rsatilgan universitet yo'q.",
    daysLeft: "{count} kun qoldi",
    daysPassed: "Muddat o'tdi",

    bestScore: "Eng yaxshi SAT ball",
    bestScoreEmpty: "Hali ball yo'q",
    accuracy: "Aniqlik",
    accuracyEmpty: "Birinchi testdan keyin ko'rinadi",
    accuracyHint: "Mashq va testlardagi javoblar bo'yicha",
    words: "So'z boyligi",
    wordsHint: "O'qiyotib bosgan so'zlaringiz",
    shortlistCount: "Ro'yxatdagi universitetlar",
    shortlistHint: "Ikki reach, ikki match, bitta safety",
    pointsToGo: "{count} ball qoldi",
    targetMet: "Maqsadga yetdingiz",
    strong: "Yaxshi ketyapti",
    building: "O'sish bor",
    needsWork: "Ishlash kerak",

    roadmap: "Keyingi qadamlar",
    roadmapDone: "{done} bajarildi, {left} qoldi",
    taskUpdateFailed: "Vazifani yangilab bo‘lmadi. Qayta urinib ko‘ring.",
    roadmapEmpty:
      "Hisobingiz sozlangach, birinchi qadamlar shu yerda paydo bo'ladi.",

    startTest: "To'liq mock testga tayyormisiz?",
    startTestBody: "Vaqt bilan, to'liq ekranda va tugatgan zahoti baholanadi.",
    startTestCta: "Boshlash",
    startTestEmpty: "Hali test yuklanmagan",
    startTestEmptyBody:
      "Sirius savollarsiz keladi — savollar sizniki. JSON bazangizni import endpointiga yuboring va testlar shu yerda paydo bo'ladi.",

    lastResult: "Oxirgi topshirilgan test",
    raw: "Xom ball",
    estimated: "Taxminiy",
  },

  /*
   * The profile page. Only the target score is editable here; the current score
   * and the exam date are still onboarding's, and the copy says so rather than
   * rendering a field that cannot be saved.
   */
  settings: {
    weeklyMinutes: "Haftalik tayyorgarlik vaqti (daq.)", baselineHelp: "Joriy ball siz kiritgan boshlang'ich natija. Hali test topshirmagan bo'lsangiz, bo'sh qoldiring.",
    planHelp: "Saqlanganda yangi reja tuziladi. Oldingi rejalar va bajargan mashqlaringiz saqlanadi.",
    invalid: "Ballar 400–1600 oralig'ida, 10 qadam bilan bo'lsin; maqsad joriy balldan past bo'lmasin. Haqiqiy kelajak sanasini va 30–2100 daqiqa vaqtni 15 qadam bilan kiriting.",
    saved: "Maqsadlar saqlandi va reja yangilandi.", failed: "Sozlamalar saqlanmadi. Yana urinib ko'ring.",
  },
  profile: {
    eyebrow: "Hisob",
    title: "Profil",
    body: "Hisobingiz, SAT maqsadingiz, imtihon sanasi va haftalik tayyorgarlik vaqti.",
    accountHeading: "Hisob",
    name: "Ism",
    email: "Email",
    accountNote: "Ism va email Google hisobingizdan olinadi.",
    satHeading: "SAT maqsadingiz",
    notSet: "Belgilanmagan",
    lockedNote:
      "Hozirgi ball va imtihon sanasi hozircha faqat boshlang'ich sozlashda o'zgaradi.",
    planNote:
      "Maqsadni o'zgartirsangiz, haftalik reja shu zahoti qayta hisoblanadi. Eski reja o'chmaydi — yangisi ustiga yoziladi.",
    planFailed:
      "Ball saqlandi, lekin reja qayta hisoblanmadi. Reja sahifasidan qayta urinib ko'ring.",
    belowCurrent: "Maqsad hozirgi balingizdan past bo'lolmaydi.",
  },

  pages: {
    practiceEyebrow: "Profil",
    practiceTitle: "Mashq",
    practiceBody:
      "Vaqt bilan modul topshiring va har bir javobni yodingizdan chiqmasidan ko'rib chiqing.",
    practiceAvailable: "Topshirish mumkin",
    practiceHistory: "Topshirganlaringiz",
    practiceEmptyTitle: "Hozircha test yo'q",
    practiceHistoryEmpty:
      "Hali hech narsa tugatilmagan. Topshirgan zahotingiz ball va tahlil shu yerda chiqadi.",

    wordsEyebrow: "Profil",
    wordsTitle: "So'zlarim",
    wordsBody:
      "O'qiyotib bosgan har bir so'z va uni tushunarli qilgan o'zbekcha tarjimasi.",
    wordsDictionary: "Sirius biladigan barcha so'zlar",

    uniEyebrow: "Ariza",
    uniTitle: "Universitetlar",
    uniBody:
      "SAT balingizni kiriting va har bir karta sizga o'zi reach, match yoki safety ekanini aytsin. Jadval ham, taxmin ham kerak emas.",
    uniEmptyTitle: "Ro'yxat hali bo'sh",

    resultsReview: "Har bir savolni ko'rib chiqing",
  },

  onboarding: {
    eyebrow: "Boshlanish",
    title: "Rejani sizga moslaymiz",
    body: "Besh savol — javoblardan haftalik reja chiqadi.",
    stepOf: "{current} / {total}-qadam",
    back: "Orqaga",
    next: "Davom etish",
    finish: "Rejani tuzish",
    saving: "Saqlanmoqda…",
    failed: "Saqlanmadi. Yana urinib ko'ring.",

    gradeTitle: "Nechanchi sinfdasiz?",
    gradeBody: "Bu qancha imtihon davri qolganini ko'rsatadi.",
    grade9: "9-sinf",
    grade10: "10-sinf",
    grade11: "11-sinf",
    grade12: "12-sinf",
    graduated: "Maktabni tugatganman",

    currentTitle: "Hozirgi balingiz qancha?",
    currentBody:
      "Oxirgi rasmiy yoki mashq testidagi ball. Aniq bilmasangiz — pastdagi tugmani tanlang.",
    currentLabel: "Hozirgi ball",
    currentUnknown: "Bilmayman — diagnostikadan boshlayman",
    currentUnknownNote:
      "Reja baribir tuziladi, lekin bashorat ko'rsatilmaydi: noma'lum balldan chiqarilgan raqam hech narsani anglatmaydi.",

    targetTitle: "Qaysi ballga chiqmoqchisiz?",
    targetBody: "Ro'yxatingizdagi universitetlar so'raydigan ball.",
    targetLabel: "Maqsad ball",
    scoreHint: "{min} dan {max} gacha, 10 lik qadam bilan.",

    dateTitle: "Imtihon qachon?",
    dateBody: "Sana rejani necha haftaga bo'lishni belgilaydi.",
    dateLabel: "Imtihon sanasi",

    priorityTitle: "Nimaga ko'proq e'tibor beramiz?",
    priorityBody: "Buni keyin ham o'zgartirishingiz mumkin.",
    prioritySat: "SAT bali",
    prioritySatBody: "Asosiy maqsad — ballni ko'tarish.",
    priorityAdmissions: "Universitetga hujjat",
    priorityAdmissionsBody: "Ro'yxat, insholar, muddatlar.",
    priorityBoth: "Ikkalasi",
    priorityBothBody: "Ball ustida ham, ariza ustida ham parallel ishlaymiz.",
  },

  progress: {
    planReasons: "Reja ustuvorliklari sababi", noSnapshot: "Bu eski reja yaratilganda dalillar saqlanmagan.", tooLittle: "Moslashish uchun kamida 5 turli javob kerak", priority: "Mashq ustuvorligi", snapshotHelp: "Bu reja yaratilgan paytdagi yaqin natijalar. Sonlar to‘g‘ri / javob berilgan savollarni bildiradi. Ustuvorlik mashq taqsimotiga ta’sir qiladi; savol soni aynan shu foizga ortishi shart emas.",
    loading: "Yuklanmoqda…",
    mixed: "Aralash mashq", topicPractice: "Mavzu mashqi", test: "Yakunlangan test", mistakes: "Xatolar ustida ishlash",
    mistakesCount: "So'nggi natijalaringizda {count} ta qayta ishlash kerak bo'lgan savol bor.", mistakesEmpty: "So'nggi javoblaringizda qayta ishlash kerak bo'lgan savollar yo'q.",
    mistakesHelp: "Xato yoki bo'sh qolgan savolga qayta to'g'ri javob berganingizda u ro'yxatdan chiqadi. Bu yaqindagi mashq va test natijalaridan tuziladi.",
    review: "Xatolarni mashq qilish", coverage: "Savol banki qamrovi", coverageHelp: "Mashq va mock uchun faqat tekshirilgan savollar ishlatiladi. Tekshiruv statistik kalibratsiya degani emas.",
    verified: "Tekshirilgan", questions: "Savollar", explained: "Tushuntirishi bor", module2: "2-modul", evidenceHelp: "Yangi reja kamida beshta turli savolga berilgan javoblar asosida mashq ustuvorligini moslaydi. Bu bilim darajasi yoki rasmiy ball bahosi emas.",
  },
  practice: {
    /* ---- Full mock, the top section ------------------------------------ */
    resultsTitle: "Natijalaringiz",
    timeUpSoft: "Vaqt tugadi",
    mockTitle: "To'liq sinov imtihoni",
    mockBody:
      "Haqiqiy Digital SAT bilan bir xil: ikkita bo'lim, har birida ikki modul, o'rtada 10 daqiqa tanaffus. Vaqt haqiqiy imtihondagidek yuradi va to'xtatib bo'lmaydi — shuning uchun bu yerdagi ball nimani bildirishini bilasiz.",
    mockShape:
      "{questions} savol · boshidan oxirigacha {minutes} daqiqa ({breakMinutes} daqiqalik tanaffus bilan)",
    mockStart: "Sinov imtihonini boshlash",

    /* ---- and what to say when the bank cannot fill it ------------------- */
    mockShortTitle: "To'liq sinov uchun savollar yetarli emas",
    mockShortBody:
      "Bankda hozir {available} ta savol bor, to'liq sinov uchun {needed} ta kerak — {short} tasi yetishmaydi. Qisqa testni “to'liq sinov” deb atamaymiz: unday ball haqiqiy imtihon haqida noto'g'ri tasavvur beradi.",
    mockShortMeanwhile:
      "Shu vaqtgacha quyidagi mashqlardan foydalaning — bankdagi har bir savol o'sha yerda mavjud.",
    mockModuleRow: "{section}, {module}-modul",
    mockModuleCount: "{available} / {needed}",
    sectionReading: "O'qish va yozish",
    sectionMath: "Matematika",

    /* ---- Practice, the lower section ------------------------------------ */
    practiceTitle: "Mashq",
    practiceBody:
      "Qisqa mashq: savollar bittalab keladi, javobdan keyin darhol tushuntirish chiqadi. Vaqt ixtiyoriy.",
    randomTitle: "Aralash mashq",
    randomBody: "Barcha mavzulardan tasodifiy savollar.",
    randomStart: "Aralash mashqni boshlash",
    countLabel: "Nechta savol",
    timerLabel: "Vaqtni yoqish",
    timerOff: "Vaqtsiz",

    topicsTitle: "Mavzular",
    topicsBody:
      "Bitta mavzuni tanlang — savollar bittalab keladi, javobdan keyin darhol tushuntirish chiqadi.",
    topicsEmpty: "Savol banki hali bo'sh.",

    weakTitle: "Zaif mavzular",
    weakBody:
      "Yetarli javob bergan mavzularingiz ichida eng past natijalilari. Kam ma'lumotli mavzular bu ro'yxatga tushmaydi.",

    available: "{count} savol",
    accuracy: "{count}%",

    start: "Mashq",
    starting: "Ochilmoqda…",
    startFailed: "Sessiya ochilmadi. Yana urinib ko'ring.",

    questionOf: "{current} / {total}",
    answerLabel: "Javobingiz",
    check: "Tekshirish",
    next: "Keyingisi",
    finish: "Yakunlash",
    finishing: "Yakunlanmoqda…",
    answerFailed: "Javob saqlanmadi. Yana urinib ko'ring.",

    correct: "To'g'ri",
    incorrect: "Noto'g'ri",
    correctAnswerIs: "To'g'ri javob: {answer}",
    noExplanation: "Bu savol uchun tushuntirish hali yozilmagan.",

    summaryTitle: "Sessiya yakuni",
    summaryAccuracy: "{count}% to'g'ri",
    summaryTime: "o'rtacha {count} soniya",
    summaryStrong: "Yaxshi natija. Shu mavzuni vaqti-vaqti bilan takrorlab turing.",
    summaryWeak: "{skill} bo'yicha yana mashq qilish foydali bo'ladi.",
    backToPractice: "Mashqqa qaytish",
    backToPlan: "Rejaga qaytish",
  },

  /*
   * The timed test screen. Only the module label is here so far — the rest of
   * the simulator is still English-only, which is a Phase B gap. This one moved
   * first because it is the string an Uzbek student reads for two hours under
   * time pressure, and it is shorter in Uzbek than in English, which also buys
   * back room in the header at 320px.
   */
  /*
   * The timed test screen.
   *
   * WRITE SHORT HERE, SHORTER THAN ANYWHERE ELSE IN THE PRODUCT.
   *
   * Every string below is read by someone with a clock running, and several are
   * read at the moment the clock hits zero. That is not the moment to be
   * eloquent. `timeUp` in particular is the sentence a student sees at second
   * zero: it says the time went and the work was kept, in that order, because
   * the second half is the part that stops a panic.
   *
   * These are not literal translations of the English. Uzbek phrasing that is
   * natural at reading speed beats phrasing that maps word-for-word.
   */
  saveStatus: { conflict: "Boshqa oynada yangi javoblar saqlangan. Davom etish uchun sahifani yangilang.", reload: "Sahifani yangilash", saved: "Javoblar saqlandi", saving: "Saqlanmoqda…", pending: "O'zgarishlar hali saqlanmagan", failed: "Saqlanmadi. Internetni tekshiring va qayta urinib ko'ring.", retry: "Qayta saqlash" },
  review: {
    estimated: "Taxminiy ball", estimateHelp: "Xom natijadan hisoblangan Sirius taxmini. College Board rasmiy konversiyasi emas.",
    finishedIn: "{time} da yakunlangan", correct: "To'g'ri", incorrect: "Xato", blank: "Bo'sh qoldirilgan", yourAnswer: "Javobingiz", acceptedAnswer: "Qabul qilinadigan javob", or: "yoki", why: "Tushuntirish",
    explanationMissing: "Bu savol uchun tushuntirish hali kiritilmagan.", sectionMissing: "Bu urinishda yo'q", missingQuestions: "Eski natijadagi {count} ta savolning matni mavjud emas. Yozilgan ball saqlangan.",
  },
  simulator: {
    tabTitle: "Test davom etmoqda",
    sectionModule: "{section}-bo'lim, {module}-modul",
    module1: "1-modul",
    module2: "2-modul",

    typeReading: "O'qish va yozish",
    typeMath: "Matematika",
    typeFull: "To'liq test",

    passageLabel: "Matn",
    questionLabel: "Savol",
    questionOf: "{current}-savol / {total}",
    questionNumber: "{index}-savol",
    answered: "javob berilgan",
    notAnswered: "javob berilmagan",
    flaggedForReview: "belgilangan",
    current: "joriy",

    flagged: "Belgilangan",
    markForReview: "Belgilab qo'yish",
    removeFlag: "Belgini olib tashlash",
    addFlag: "Keyin qaytish uchun belgilang",
    crossOut: "Variantni o'chirish",
    undoCrossOut: "O'chirishni bekor qilish",

    timerShow: "Vaqtni ko'rsatish",
    timerHide: "Vaqtni yashirish",
    timerHidden: "Yashirilgan",
    timerWarning: "5 daqiqa qoldi",

    dictionaryToggle: "O'zbekcha lug'atni yoqish",
    dictionaryOn: "Belgilangan so'zga bosing — tarjimasi chiqadi",
    dictionaryOff: "Inglizcha → o'zbekcha lug'atni yoqing",
    saveWord: "So'z bazasiga saqlash",
    savedWord: "Saqlandi",
    saveWordFailed: "So'z saqlanmadi.",

    finishModule: "Modulni yakunlash",
    finishSection: "Bo'limni yakunlash",
    finishShort: "Yakunlash",
    finishModuleTitle: "Modul yakunlansinmi?",
    finishSectionTitle: "Bo'lim yakunlansinmi?",
    finishBlank:
      "{count} ta savol bo'sh qoldi. Bo'sh javob xato deb hisoblanadi.",
    finishAllModule:
      "Hamma savolga javob berilgan. Bu modulga qaytib bo'lmaydi.",
    finishAllSection: "Hamma savolga javob berilgan. Natija darhol chiqadi.",
    statAnswered: "Javob berilgan",
    statBlank: "Bo'sh",
    statFlagged: "Belgilangan",
    cancel: "Bekor qilish",
    closing: "Yakunlanmoqda…",
    scoring: "Baholanmoqda…",
    submitSection: "Bo'limni topshirish",

    /* Read at second zero. Short, and the reassurance comes second. */
    timeUp: "Vaqt tugadi. Javoblaringiz saqlandi.",
    submitFailed: "Test topshirilmadi. Qayta urinib ko'ring.",
    nextModuleFailed: "Keyingi modul boshlanmadi.",

    breakTitle: "Tanaffus",
    breakBody:
      "Turing, uzoqqa qarang, suv iching. Keyingi bo'lim siz tayyor bo'lganda boshlanadi — bu sanoq undan vaqt olmaydi.",
    breakStart: "Keyingi modulni boshlash",
    breakStarting: "Boshlanmoqda…",

    errorNoDatabase: "Ma'lumotlar bazasi ulanmagan",
    errorNoQuestions: "Bu testda savollar yo'q",
    errorNoQuestionsBody:
      "Avval bu test uchun savollar bazasini import qiling.",
    errorCannotStart: "Test boshlanmadi",
    errorCannotStartBody: "Nimadir noto'g'ri ketdi. Qayta urinib ko'ring.",
    errorNoModuleQuestions: "Bu modulda savollar yo'q",
    errorNoModuleQuestionsBody:
      "Sessiya yig'ilmadi. Savollar bazasini to'ldirib, qaytadan boshlang.",
    backToPractice: "Mashqqa qaytish",
  },

  plan: {
    eyebrow: "Profil",
    title: "Haftalik reja",
    body: "Imtihon sanangiz, maqsad balingiz va savol bankidan chiqarilgan reja.",
    empty: "Reja hali tuzilmagan.",
    emptyBody: "Onboarding javoblaringizdan reja bir soniyada tuziladi.",
    regenerate: "Rejani yangilash",
    regenerating: "Tuzilmoqda…",
    regenerateFailed: "Reja tuzilmadi. Yana urinib ko'ring.",
    regenerateHint:
      "Imtihon sanasi yoki maqsad ball o'zgargan bo'lsa, rejani yangilang.",

    thisWeek: "Shu hafta",
    weekLabel: "{n}-hafta",
    questionsCount: "{count} savol",
    due: "{date} gacha",
    allWeeks: "To'liq reja",

    target: "Maqsad ball",
    projected: "Kutilayotgan ball",
    projectedNote: "Model bahosi, kafolat emas.",
    projectedUnknown: "Hozirgi ball noma'lum",
    projectedUnknownNote: "Diagnostika topshirsangiz, bashorat paydo bo'ladi.",
    examDate: "Imtihon sanasi",
    weeksLeft: "{count} hafta qoldi",
    weeklyLoad: "Haftasiga {count} savol",
    weeklyLoadLabel: "Haftalik yuk",

    onTrack: "Shu sur'at maqsadga yetkazadi.",
    offTrack: "Shu sur'atda maqsadga yetib bo'lmaydi.",
    shortfall: "Haftasiga yana {count} daqiqa kerak bo'ladi.",
    bankLimited:
      "Savollar banki hozircha kichik, shuning uchun ba'zi haftalar rejadagidan yengil.",
  },

  uni: {
    search: "Qidiruv",
    searchPlaceholder: "Nomi, shahri, shtati yoki yo'nalish…",
    sortBy: "Saralash",
    sortRanking: "Jahon reytingi",
    sortAcceptance: "Eng tanlab oladigan",
    sortSat: "Qabul qilinganlar o'rtachasi",
    sortName: "Nomi (A–Z)",
    fullNeed: "To'liq yordam beradi",
    counted: "{total} tadan {shown} tasi",
    noMatch: "Mos universitet topilmadi",
    noMatchBody: "Ballni oshiring yoki filtrlarni tozalang.",
    clearFilters: "Filtrlarni tozalash",
    stockPhoto: "Namuna surat",
    shortlisted: "Ro'yxatda",
    addToShortlist: "Ro'yxatga qo'shish",
    removeFromShortlist: "{name} ni ro'yxatdan olib tashlash",
    addNamed: "{name} ni ro'yxatga qo'shish",
    added: "{name} ro'yxatga qo'shildi.",
    removed: "{name} ro'yxatdan olib tashlandi.",
    updateFailed: "Ro'yxatni yangilab bo'lmadi.",
    verdictReach: "reach",
    verdictMatch: "match",
    verdictSafety: "safety",
    acceptanceRate: "Qabul foizi",
    acceptanceBody: "{rate} nomzod qabul qilinadi",
    tuition: "Yillik o'qish narxi",
    sat: "SAT",
    ielts: "IELTS",
    deadline: "Muddat",
    officialSite: "Rasmiy sayt",
    majors: "Ommabop yo'nalishlar",
    profile: "Ular nimaga qaraydi",
    noData: "Ma'lumot yo'q",
    students: "Talabalar",
    showing: "{total} tadan {shown} tasi ko'rsatilyapti",
    loadMore: "Yana yuklash",

    rankingBadge: "Jahon reytingi: {rank}",
    satBenchmark: "SAT o'rtachasi",
    noSatRequirement: "SAT ko'rsatkichi e'lon qilinmagan",

    verdictNoScore:
      "Balingiz hali ma'lum emas. Diagnostika topshiring yoki onboardingda joriy balni kiriting — shundan keyin bu yerda taqqoslash chiqadi.",
    verdictNoBenchmark:
      "Bu universitet SAT ko'rsatkichini e'lon qilmagan, shuning uchun taqqoslash uchun raqam yo'q.",
    verdictLevel:
      "Balingiz ({score}) bu universitetning o'rtachasi bilan bir darajada.",
    verdictAbove:
      "Balingiz ({score}) o'rtachadan {difference} ball yuqori (o'rtacha {benchmark}).",
    verdictBelow:
      "Balingiz ({score}) o'rtachadan {difference} ball past (o'rtacha {benchmark}).",
    verdictNote:
      "Bu qabul kafolati emas: universitetlar ballga qo'shimcha ravishda butun profilga qaraydi.",

    outcomesSection: "Qabul natijalari",
    outcomesTitle: "Nomzodlar natijalari",
    outcomesCount: "{count} ta natija",
    outcomesAccepted: "{count}% qabul qilingan",
    outcomesYours: "Sizning balingiz: {score}",
    outcomesEmpty: "Hali natija yo'q",
    outcomesEmptyBody:
      "Bu universitet bo'yicha nomzodlar natijalari hali yig'ilmagan. Bo'sh joyni to'ldirish uchun raqam o'ylab topmaymiz — ma'lumot paydo bo'lishi bilan shu yerda chiqadi.",
    outcomesDisclaimer:
      "Natijalar nomzodlarning o'zlari yuborgan ma'lumotlar asosida. Rasmiy statistika emas.",

    accepted: "Qabul qilingan",
    rejected: "Rad etilgan",
    waitlisted: "Navbatda",

    sampleAll: "Namuna ma'lumot",
    sampleSome: "Qisman namuna ma'lumot",
  },

  applications: {
    eyebrow: "Ariza",
    title: "Arizalar bazasi",
    body: "Nomzodlar o'z natijalarini yuboradi: qaysi ball bilan qayerga kirgan, qayerdan rad javob olgan.",
    likeYou: "Sizga o'xshash nomzodlar",
    likeYouBody: "{score} ballga eng yaqin natijalar.",
    likeYouNoScore:
      "Avval balingiz kerak: diagnostika topshiring yoki joriy balni kiriting — shundan keyin sizga o'xshash nomzodlarni ko'rsatamiz.",
    likeYouNoData:
      "Hozircha taqqoslash uchun yetarli natija yo'q. Ma'lumot to'planishi bilan shu yerda chiqadi.",
    allTitle: "Barcha natijalar",
    counted: "{total} tadan {shown} tasi",
    searchPlaceholder: "Universitet yoki yo'nalish…",
    status: "Natija",
    statusAll: "Hammasi",
    empty: "Baza hozircha bo'sh",
    emptyBody:
      "Nomzodlar natijalari hali yig'ilmagan. Boshqa saytlardan ko'chirib olmaymiz — bu ma'lumot o'sha talabalarniki. Sirius o'z foydalanuvchilari roziligi bilan yuborgan natijalardan to'planadi.",
    noMatch: "Mos natija topilmadi",
    noMatchBody: "Qidiruvni yoki filtrni o'zgartiring.",
    sourceNote:
      "Har bir qator — bitta qaror, bitta odam emas. Ism-sharif saqlanmaydi; nomzod faqat taxallus kod bilan belgilanadi.",
  },

  workspace: {
    archive: "Arxivlash", unarchive: "Arxivdan tiklash", archivedItems: "Arxivdagi ishlar", activeItems: "Faol ishlar", archiveHelp: "Bu ish arxivda. Kontent va versiyalar saqlangan; tahrirlash uchun tiklang.",
    tracker: "Arizalarim", trackerHelp: "O'zingizning universitet arizalaringiz, muddatlar va hujjatlarni bir joyda kuzating.", newApplication: "Ariza qo'shish", applicationsEmpty: "Hali shaxsiy ariza qo'shilmagan. Universitet va intake bilan boshlang.", viewOutcomes: "Boshqalarning qabul natijalarini ko'rish",
    university: "Universitet", intake: "Intake / qabul davri", deadline: "Siz belgilagan muddat", status: "Holat", deadlineHelp: "Bu sizning shaxsiy rejangizdagi sana. Rasmiy muddatni universitetning o'zidan tekshirib kiriting.",
    states: { PLANNING: "Rejalashtirilmoqda", IN_PROGRESS: "Tayyorlanmoqda", SUBMITTED: "Yuborilgan", WAITLISTED: "Kutish ro'yxati", ACCEPTED: "Qabul qilingan", REJECTED: "Rad etilgan", WITHDRAWN: "Bekor qilingan" },
    checklist: "Hujjatlar checklisti", defaultChecklist: ["Insho", "Baholar / transcript", "Tavsiyanomalar", "Moliyaviy yordam hujjatlari"], documentName: "Hujjat nomi", newDocument: "Yangi hujjat", addDocument: "Hujjat qo'shish", remove: "O'chirish", notes: "Shaxsiy qaydlar",
    activities: "Arizaga bog'langan faoliyatlar", activitiesEmpty: "Faoliyatlar bo'limida o'zingizning faoliyatlaringizni qo'shing.", manageActivities: "Faoliyatlarni boshqarish",
    saved: "Saqlandi.", failed: "Saqlanmadi. Matningizni saqlab turing va yana urinib ko'ring.", invalid: "Majburiy maydonlar, sana va checklistni tekshiring.", conflict: "Boshqa oynada yangi o'zgarish saqlangan. Mahalliy matningizni nusxalang va sahifani yangilang.",
    myDrafts: "Mening qoralamalarim", newDraft: "Yangi insho qoralamasi", untitledDraft: "Yangi qoralama", draftTitle: "Qoralama nomi", wordLimit: "So'z limiti", prompt: "Insho savoli / prompt", draftBody: "Insho matni", words: "so'z", revisions: "Oldingi versiyalar", version: "Versiya", restore: "Versiyani tiklash", refreshHistory: "Tarixni yangilash", privateHelp: "Qoralama shaxsiy profilingizda saqlanadi. Tiklash oldingi tarixni o'chirmay, yangi versiya yaratadi.", draftWorkspace: "Insho ustida ishlash", linkedApplication: "Bog'langan ariza",
  },
  recall: {
    recognition: "Ma’nosini eslash", production: "Inglizcha so‘zni eslash", productionPrompt: "Tarjimaga qarab inglizcha so‘zni eslang.", nextReview: "Keyingi takrorlash",
    title: "So'zlarni takrorlash", dueCount: "Hozir {count} ta kartani takrorlash vaqti keldi.", empty: "Hozir takrorlanadigan karta yo'q. Saqlangan so'zlar va keyingi muddatlarni So'zlar bo'limida ko'ring.", prompt: "Tarjimasini ko'rmasdan ma'nosini eslang.", reveal: "Javobni ko'rsatish", rateHelp: "Qanchalik oson esladingiz?", ratings: { again: "Yana", hard: "Qiyin", good: "Yaxshi", easy: "Oson" }, selfRating: "Bu o'zingiz bergan eslab qolish bahosi. SAT balliga qo'shilmaydi.", dictionaryHelp: "Kartalar tarjimasi Sirius lug'atida mavjud saqlangan so'zlardan tuziladi. Tarjimasi topilmagan so'zlar So'zlar ro'yxatida qoladi.", start: "Takrorlashni boshlash",
  },
  essays: {
    eyebrow: "Ariza",
    title: "Insholar",
    body: "Kuchli insholar qanday yozilganini ko'chirish uchun emas, hunarni tushunish uchun o'qing.",
    empty: "Kutubxona hozircha bo'sh",
    emptyBody:
      "Insho — kimningdir mehnati. Boshqa saytlardagi insholar o'sha talabalar tomonidan o'sha saytga yuborilgan, va ularni bu yerga ko'chirish ruxsatsiz olish bo'lardi. Kutubxona muallif roziligi bilan yuborilgan insholardan to'ldiriladi.",
    locked: "Qulflangan",
    lockedTitle: "Bu insho premium",
    lockedBody:
      "Insho matni premium obuna bilan ochiladi. Mashq, reja va universitetlar bo'limi har doim ochiq qoladi.",
    commonApp: "Common App",
    wordCount: "{count} so'z",
    readingNote:
      "Insholar o'qish uchun, ko'chirish uchun emas. Ko'chirilgan insho arizani kuchaytirmaydi — uni bekor qiladi.",
  },

  activities: {
    eyebrow: "Ariza",
    title: "Faoliyatlar",
    body: "Common App ro'yxatingiz va u qanday darajalardan iboratligi.",

    mineTitle: "Mening ro'yxatim",
    mineCount: "{count} / {max} ta faoliyat",
    mineEmpty: "Hali faoliyat qo'shilmagan.",
    full: "Common App {max} tagacha ruxsat beradi. Yangisini qo'shish uchun bittasini o'chiring.",
    add: "Qo'shish",
    addTitle: "Yangi faoliyat",
    editTitle: "Faoliyatni tahrirlash",
    edit: "Tahrirlash",
    remove: "O'chirish",
    cancel: "Bekor qilish",
    save: "Saqlash",
    saving: "Saqlanmoqda…",
    saveFailed: "Saqlanmadi. Yana urinib ko'ring.",

    fieldTitle: "Nomi",
    fieldRole: "Rolingiz",
    fieldOrganisation: "Tashkilot",
    fieldHours: "Soat/hafta",
    fieldWeeks: "Hafta/yil",
    fieldDescription: "Tavsif",
    descriptionHint:
      "Common App {max} belgi beradi. Shu chegara ichida yozish — mashqning o'zi.",
    hours: "{count} soat/hafta",
    weeks: "{count} hafta/yil",

    ladderTitle: "Faoliyat darajalari",
    ladderBody:
      "Quyi pog'onadan yuqoriga. Savol — «hozir qayerdaman va keyingi qadam qanday ko'rinadi».",
    ladderEmpty: "Daraja ro'yxati bo'sh",
    ladderEmptyBody:
      "Ma'lumot hali yuklanmagan. Admin import yo'li orqali qo'shiladi.",
    participation: "{count}%",
  },

  roadmapTasks: {
    "set-target": {
      title: "Maqsad ballni belgilang",
      detail: "Ro'yxatingiz talab qiladigan ballni tanlang va shundan orqaga ishlang.",
    },
    "first-test": {
      title: "Bitta to'liq mock test topshiring",
      detail: "Tayyorgarliksiz olingan boshlang'ich natija ancha foydali.",
    },
    "review-answers": {
      title: "Har bir xato javobni ko'rib chiqing",
      detail: "Izohni o'qing va nima uchun xato qilganingizni yozib qo'ying.",
    },
    "save-words": {
      title: "So'z bazasiga 20 ta so'z saqlang",
      detail: "O'qiyotib notanish so'zlarga bosing — ular o'zi yig'iladi.",
    },
    shortlist: {
      title: "Beshta universitetni ro'yxatga oling",
      detail: "Ikki reach, ikki match, bitta safety.",
    },
  },

  words: {
    emptyTitle: "So'z bazangiz hozircha bo'sh",
    emptyBody:
      "Mashq matnida o'zbekcha lug'atni yoqing va istalgan belgilangan so'zga bosing — “So'z bazasiga saqlash” uni shu yerga qo'shadi.",
    searchPlaceholder: "So'zlaringizdan qidirish…",
    searchLabel: "Saqlangan so'zlardan qidirish",
    counted: "{total} tadan {shown} tasi",
    notInDictionary: "Lug'atda yo'q",
    remove: "O'chirish",
    removeNamed: "{word} ni so'z bazasidan o'chirish",
    removeFailed: "So'zni o'chirib bo'lmadi.",
  },

  auth: {
    signInTitle: "Qaytganingizdan xursandmiz",
    signInBody: "Google hisobingiz bilan kiring va qolgan joydan davom eting.",
    signUpTitle: "Profilingizni oching",
    signUpBody:
      "Bir bosishda hisob yarating. Parol o'ylab topish, tasdiqlash xati kutish shart emas.",
    continueWithGoogle: "Google bilan davom etish",
    redirecting: "Google'ga yo'naltirilmoqda…",
    terms: "Davom etish orqali xizmat shartlariga rozilik bildirasiz.",
    noAccount: "Hisobingiz yo'qmi?",
    haveAccount: "Hisobingiz bormi?",
    createOne: "Hisob oching",
    signInLink: "Kiring",
    account: "Hisob",
    myProfile: "Mening profilim",
    signOut: "Chiqish",
    errorTitle: "Kirib bo'lmadi",
    errorBody: "Google bilan bog'lanishda muammo chiqdi. Yana bir marta urinib ko'ring.",
    setupTitle: "Google kirish hali sozlanmagan",
    setupBody:
      "Google Cloud Console'da OAuth mijozini yarating va kalitlarni .env fayliga qo'shing:",
  },

  errors: {
    dbTitle: "Ma'lumotlar bazasiga ulanib bo'lmadi",
    dbBody:
      "Hisobingiz joyida — faqat ma'lumotlarni o'qib bo'lmadi. Odatda bu vaqtinchalik: sahifani yangilab ko'ring.",
    dbHint: "Lokal ishlayotgan bo'lsangiz, `npx prisma dev` ishlab turganini tekshiring.",
    retry: "Qayta urinish",
    genericTitle: "Nimadir noto'g'ri ketdi",
    genericBody:
      "Bu sahifani yuklab bo'lmadi. Qayta urinib ko'ring — muammo takrorlansa, xato matnini bizga yuboring.",
    backToDashboard: "Kabinetga qaytish",
  },
};

/*
 * Note the missing `as const`: it would make every Uzbek string its own literal
 * type, and then the English dictionary could not satisfy the shape ("Platform"
 * is not assignable to "Imkoniyatlar"). Widening to `string` is exactly what is
 * wanted here — the contract is the set of keys, not the words.
 */

/** The shape every dictionary must satisfy. */
export type Dictionary = typeof uz;

export const en: Dictionary = {
  nav: {
    features: "Platform",
    journey: "The journey",
    signIn: "Sign in",
    getStarted: "Get started",
    dashboard: "Go to dashboard",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    home: "Sirius home",
  },

  lang: {
    label: "Language",
    uz: "O'zbekcha",
    en: "English",
    switchTo: "O'zbek tiliga o'tish",
  },

  hero: {
    badge: "The admissions platform for top universities",
    headline: "Sirius: your personal guide into the world's top universities",
    highlight: ["your", "personal", "guide"],
    body: "Push your SAT score to its ceiling and shape your profile for the universities you actually want. Portfolio, essays and extracurriculars — one platform, one plan.",
    ctaPrimary: "Start my profile",
    ctaSecondary: "I have an account",
    note: "No card required. Your profile starts building from day one.",
  },

  ticker: {
    items: [
      "Personal statement — 4 drafts",
      "Reach · Match · Safety",
      "Extracurricular profile",
      "Ivy deadline: January 1",
      "Portfolio — 12 pieces",
      "SAT 1310 → 1450",
      "Recommendation letters",
      "ubiquitous → hamma yerda mavjud",
      "Financial aid: meets full need",
    ],
  },

  features: {
    heading: "An application is not one big job. It is six small ones.",
    body: "From picking universities to the fourth draft of an essay. None of it lives in a separate spreadsheet or a separate app — it is all here, and the parts talk to each other.",
    items: [
      {
        title: "Dream universities",
        body: "Every university tells you whether it is a reach, a match or a safety for your score and your profile. No more guessing.",
        bullets: ["Acceptance rates", "Average admitted scores", "Financial aid"],
      },
      {
        title: "Essays and personal statement",
        body: "Drafts, structure, and what not to say. One story — not a résumé in prose.",
        bullets: ["650 words", "Draft history", "Supplemental essays"],
      },
      {
        title: "Extracurriculars",
        body: "Not a list, an impact. Write every activity the way an admissions officer reads it.",
        bullets: ["10 slots", "Impact framing", "Leadership"],
      },
      {
        title: "Portfolio",
        body: "Projects, olympiads, certificates and work — collected behind a single link.",
        bullets: ["Projects", "Awards", "One link"],
      },
      {
        title: "Deadlines and documents",
        body: "What each university asks for and when. Nothing surfaces on the last night.",
        bullets: ["ED / EA / RD", "Document checklist", "Reminders"],
      },
      {
        title: "SAT and language",
        body: "A test-day simulator and an Uzbek dictionary inside every passage. One part of the platform, not the whole of it.",
        bullets: ["Two modules", "English → Uzbek", "Score estimate"],
      },
    ],
  },

  dictionary: {
    eyebrow: "Part of the SAT toolkit",
    heading: "An Uzbek dictionary inside the passage",
    body: "In simulator passages, on university pages and in sample essays — tap a highlighted word and the Uzbek is right there. Nothing loads, because the dictionary ships inside the app.",
    hintOn: "Tap any highlighted word",
    hintOff: "Turn on UZ to reveal {count} words",
    footer: "The dictionary holds {count} entries today and grows every week.",
  },

  journey: {
    badge: "The journey",
    heading: "From year eleven to the acceptance letter",
    body: "Most students start the application in November and spend the rest of the year catching up. Sirius splits it into four stages and tells you what the current one needs.",
    stats: [
      { value: "4", label: "stages" },
      { value: "10", label: "extracurricular slots" },
      { value: "650", label: "words, personal statement" },
      { value: "1600", label: "SAT ceiling" },
    ],
    steps: [
      {
        title: "Build the profile",
        body: "Grades, activities, awards. Where you are strong and where you are thin shows up on day one.",
      },
      {
        title: "Shape the list",
        body: "Two reaches, two matches, one safety — and what each of them actually asks for.",
      },
      {
        title: "Write your story",
        body: "Personal statement and supplementals, from first draft to the version you submit.",
      },
      {
        title: "Submit",
        body: "Documents, recommendations and aid forms, ordered by the deadline that comes first.",
      },
    ],
  },

  cta: {
    heading: "The university on your list is not waiting for you",
    body: "Start your profile today. Fifteen minutes tells you where you stand and what the next move is.",
    primary: "Open my profile",
    secondary: "I already have one",
  },

  footer: {
    tagline:
      "The complete platform for getting into a top university: your list, essays, portfolio, extracurriculars and the SAT.",
    product: "Platform",
    account: "Account",
    rights: "All rights reserved.",
    disclaimer:
      "SAT® is a trademark of the College Board, which is not affiliated with and does not endorse Sirius.",
  },

  app: {
    backToSite: "Back to the website",
    build: "Profile",
    apply: "Application",
    today: "Today",
    plan: "Plan",
    practice: "Practice",
    myWords: "My words",
    universities: "Universities",
    applications: "Admission outcomes",
    applicationsTracker: "My applications",
    essays: "Essays",
    activities: "Activities",
  },

  today: {
    eyebrow: "TODAY'S NEXT STEP", resume: "Pick up where you left off", resumeBody: "Your saved answers and attempt clock are preserved.",
    task: "Your next planned practice", remaining: "{count} questions remain in this week's task.", startTask: "Start practice",
    done: "This week's tasks are complete", doneBody: "Review your results or open Practice for additional work.",
    setup: "Set your preparation goal", setupBody: "Update your target, exam date and weekly time in your profile. You can also practise the available topics now.",
    practice: "Practise a topic", practiceBody: "Choose a topic, answer questions and review explanations for your mistakes.",
    continue: "Continue", editGoal: "Edit goal", viewPlan: "View plan", viewPractice: "Open practice",
  },
  dash: {
    greeting: "Hi, {name}",
    subtitle: "Let's move your profile one step forward today.",
    subtitleNoTarget:
      "Set a target score first — every number here is measured against it.",
    targetSet: "Target {score}",
    targetUnset: "Pick a target score",
    targetDialogTitle: "What are we aiming at?",
    targetDialogBody:
      "Use the score the universities on your list actually ask for. Everything on this page is measured against it.",
    targetLabel: "Target score",
    targetHint: "Between {min} and {max}, in steps of 10.",
    targetSaved: "Saved. Everything is measured against it now.",
    targetInvalid: "Enter a number between 400 and 1600.",
    save: "Save",
    saving: "Saving…",
    cancel: "Not now",

    universities: "Dream universities",
    universitiesEmpty: "No universities saved yet.",
    universitiesCta: "Open the list",
    moreUniversities: "+{count} more",

    deadline: "Next deadline",
    deadlineEmpty: "None of your universities lists a deadline.",
    daysLeft: "{count} days left",
    daysPassed: "Deadline passed",

    bestScore: "Best SAT score",
    bestScoreEmpty: "No score yet",
    accuracy: "Accuracy",
    accuracyEmpty: "Shows up after your first test",
    accuracyHint: "Across practice and test answers",
    words: "Vocabulary",
    wordsHint: "Words you tapped while reading",
    shortlistCount: "Universities saved",
    shortlistHint: "Two reaches, two matches, one safety",
    pointsToGo: "{count} points to go",
    targetMet: "Target met",
    strong: "Looking good",
    building: "Getting there",
    needsWork: "Worth a look",

    roadmap: "Next steps",
    roadmapDone: "{done} done, {left} to go",
    taskUpdateFailed: "Could not update that task. Please try again.",
    roadmapEmpty:
      "Your first steps appear here once your account finishes setting up.",

    startTest: "Ready for a full mock test?",
    startTestBody: "Timed, full screen, and scored the second you finish.",
    startTestCta: "Start",
    startTestEmpty: "No tests imported yet",
    startTestEmptyBody:
      "Sirius comes without questions — they are yours. Send your JSON bank to the import endpoint and your tests show up here.",

    lastResult: "Last test you sat",
    raw: "Raw score",
    estimated: "Estimated",
  },

  settings: {
    weeklyMinutes: "Weekly study time (minutes)", baselineHelp: "Current score is your self-reported starting result. Leave it blank if you have not taken a test yet.",
    planHelp: "Saving creates a new plan. Previous plans and completed practice are preserved.",
    invalid: "Use scores from 400 to 1600 in steps of 10, with target at least current score. Choose a real future date and 30–2100 weekly minutes in steps of 15.",
    saved: "Goals saved and plan rebuilt.", failed: "Settings could not be saved. Please try again.",
  },
  profile: {
    eyebrow: "Account",
    title: "Profile",
    body: "Your account, SAT goal, exam date and weekly study time.",
    accountHeading: "Account",
    name: "Name",
    email: "Email",
    accountNote: "Your name and email come from your Google account.",
    satHeading: "Your SAT target",
    notSet: "Not set",
    lockedNote:
      "The current score and the exam date are still set during onboarding.",
    planNote:
      "Change the target and the weekly plan is recomputed straight away. The old plan is kept — the new one is written on top of it.",
    planFailed:
      "Saved, but the plan could not be rebuilt. Try again from the plan page.",
    belowCurrent: "Your target cannot be lower than the score you already have.",
  },

  pages: {
    practiceEyebrow: "Profile",
    practiceTitle: "Practice",
    practiceBody:
      "Sit a timed module, then go through every answer while it is still fresh.",
    practiceAvailable: "Ready to sit",
    practiceHistory: "What you have sat",
    practiceEmptyTitle: "Nothing to sit yet",
    practiceHistoryEmpty:
      "Nothing finished yet. Your scores and answer review show up here the moment you hand one in.",

    wordsEyebrow: "Profile",
    wordsTitle: "My words",
    wordsBody:
      "Every word you tapped while reading, with the Uzbek that made it make sense.",
    wordsDictionary: "Everything Sirius knows",

    uniEyebrow: "Application",
    uniTitle: "Universities",
    uniBody:
      "Put your SAT score in and every card tells you whether it is a reach, a match or a safety. No spreadsheet, no guessing.",
    uniEmptyTitle: "The list is still empty",

    resultsReview: "Go through every question",
  },

  onboarding: {
    eyebrow: "Getting started",
    title: "Let's shape the plan around you",
    body: "Five questions. Your weekly plan comes out of the answers.",
    stepOf: "Step {current} of {total}",
    back: "Back",
    next: "Continue",
    finish: "Build my plan",
    saving: "Saving…",
    failed: "That did not save. Try again.",

    gradeTitle: "What year are you in?",
    gradeBody: "It tells us how many admissions cycles you have left.",
    grade9: "Grade 9",
    grade10: "Grade 10",
    grade11: "Grade 11",
    grade12: "Grade 12",
    graduated: "I have finished school",

    currentTitle: "What do you score today?",
    currentBody:
      "Your most recent official or practice score. If you do not know it, pick the option below.",
    currentLabel: "Current score",
    currentUnknown: "I don't know — start me with a diagnostic",
    currentUnknownNote:
      "You still get a plan, but no projection: a number derived from an unknown starting point means nothing.",

    targetTitle: "What are you aiming for?",
    targetBody: "The score the universities on your list actually ask for.",
    targetLabel: "Target score",
    scoreHint: "{min} to {max}, in steps of 10.",

    dateTitle: "When is the exam?",
    dateBody: "The date decides how many weeks the plan is split into.",
    dateLabel: "Exam date",

    priorityTitle: "What should we lead with?",
    priorityBody: "You can change this later.",
    prioritySat: "SAT score",
    prioritySatBody: "The score is the thing to move.",
    priorityAdmissions: "Applications",
    priorityAdmissionsBody: "Shortlist, essays, deadlines.",
    priorityBoth: "Both",
    priorityBothBody: "Score and application, side by side.",
  },

  progress: {
    planReasons: "Why these plan priorities", noSnapshot: "Evidence was not stored when this older plan was created.", tooLittle: "At least 5 distinct answers are needed to adjust", priority: "Practice priority", snapshotHelp: "Recent results at the time this plan was created. Counts show correct / answered questions. Priority influences the allocation; question counts do not necessarily rise by the same percentage.",
    loading: "Loading…",
    mixed: "Mixed practice", topicPractice: "Topic practice", test: "Completed test", mistakes: "Work on mistakes",
    mistakesCount: "{count} questions from your recent results need another look.", mistakesEmpty: "No questions in your recent answers currently need another look.",
    mistakesHelp: "Answer a missed or blank question correctly again to remove it from this list. It is based on recent practice and completed tests.",
    review: "Practise mistakes", coverage: "Question bank coverage", coverageHelp: "Only reviewed questions are used for practice and mock tests. Review does not indicate statistical calibration.",
    verified: "Reviewed", questions: "Questions", explained: "With explanations", module2: "Module 2", evidenceHelp: "New plans adjust practice priorities after at least five distinct answered questions. This is a scheduling preference, not a mastery or official-score estimate.",
  },
  practice: {
    /* ---- Full mock, the top section ------------------------------------ */
    resultsTitle: "Your results",
    timeUpSoft: "Time is up",
    mockTitle: "Full mock exam",
    mockBody:
      "The same shape as the real Digital SAT: two sections, two modules each, with a 10-minute break between them. The clock runs the way it runs on test day and cannot be paused — which is what makes the score here mean something.",
    mockShape:
      "{questions} questions · {minutes} minutes end to end, including a {breakMinutes}-minute break",
    mockStart: "Start the mock exam",

    /* ---- and what to say when the bank cannot fill it ------------------- */
    mockShortTitle: "Not enough questions for a full mock",
    mockShortBody:
      "The bank holds {available} questions and a full sitting needs {needed} — {short} short. We will not serve a short test and call it a mock: a score from one would teach you the wrong thing about the real exam.",
    mockShortMeanwhile:
      "Until then, use the practice below — every question in the bank is reachable there.",
    mockModuleRow: "{section}, module {module}",
    mockModuleCount: "{available} / {needed}",
    sectionReading: "Reading & Writing",
    sectionMath: "Math",

    /* ---- Practice, the lower section ------------------------------------ */
    practiceTitle: "Practice",
    practiceBody:
      "Short sessions: one question at a time, with the explanation straight after you answer. The timer is optional.",
    randomTitle: "Mixed practice",
    randomBody: "Random questions across every topic.",
    randomStart: "Start mixed practice",
    countLabel: "How many questions",
    timerLabel: "Use a timer",
    timerOff: "No timer",

    topicsTitle: "Topics",
    topicsBody:
      "Pick one topic. Questions come one at a time, and the explanation appears the moment you answer.",
    topicsEmpty: "The question bank is still empty.",

    weakTitle: "Weakest topics",
    weakBody:
      "The lowest scores among the topics you have answered enough of. Topics with too little evidence are left out.",

    available: "{count} questions",
    accuracy: "{count}%",

    start: "Practise",
    starting: "Opening…",
    startFailed: "The session could not be opened. Try again.",

    questionOf: "{current} / {total}",
    answerLabel: "Your answer",
    check: "Check",
    next: "Next",
    finish: "Finish",
    finishing: "Finishing…",
    answerFailed: "That answer did not save. Try again.",

    correct: "Correct",
    incorrect: "Not quite",
    correctAnswerIs: "The answer is {answer}",
    noExplanation: "No explanation has been written for this question yet.",

    summaryTitle: "Session summary",
    summaryAccuracy: "{count}% correct",
    summaryTime: "{count} seconds each on average",
    summaryStrong: "Strong session. Come back to this topic now and then.",
    summaryWeak: "{skill} is worth another session.",
    backToPractice: "Back to practice",
    backToPlan: "Back to the plan",
  },

  /** See the note on the Uzbek side. */
  /** See the note on the Uzbek side: shortest wording that is still clear. */
  saveStatus: { conflict: "Newer answers were saved in another tab. Reload before continuing.", reload: "Reload page", saved: "Answers saved", saving: "Saving…", pending: "Changes have not been saved yet", failed: "Could not save. Check your connection and retry.", retry: "Retry save" },
  review: {
    estimated: "Estimated score", estimateHelp: "A Sirius estimate from your raw result. It is not an official College Board conversion.",
    finishedIn: "finished in {time}", correct: "Correct", incorrect: "Incorrect", blank: "Left blank", yourAnswer: "Your answer", acceptedAnswer: "Accepted answer", or: "or", why: "Explanation",
    explanationMissing: "An explanation has not been added for this question yet.", sectionMissing: "Not in this sitting", missingQuestions: "The text of {count} questions in this older result is unavailable. Its recorded score is preserved.",
  },
  simulator: {
    tabTitle: "Test in progress",
    sectionModule: "Section {section}, Module {module}",
    module1: "Module 1",
    module2: "Module 2",

    typeReading: "Reading & Writing",
    typeMath: "Math",
    typeFull: "Full test",

    passageLabel: "Passage",
    questionLabel: "Question",
    questionOf: "Question {current} of {total}",
    questionNumber: "Question {index}",
    answered: "answered",
    notAnswered: "not answered",
    flaggedForReview: "flagged for review",
    current: "current",

    flagged: "Flagged",
    markForReview: "Mark for review",
    removeFlag: "Remove the review flag",
    addFlag: "Flag this question to come back to it",
    crossOut: "Cross out this option",
    undoCrossOut: "Undo cross-out",

    timerShow: "Show timer",
    timerHide: "Hide timer",
    timerHidden: "Hidden",
    timerWarning: "5 min left",

    dictionaryToggle: "Toggle Uzbek dictionary",
    dictionaryOn: "Tap a highlighted word for its Uzbek translation",
    dictionaryOff: "Turn on the English → Uzbek dictionary",
    saveWord: "Save to word bank",
    savedWord: "Saved",
    saveWordFailed: "Could not save that word.",

    finishModule: "Finish module",
    finishSection: "Finish section",
    finishShort: "Finish",
    finishModuleTitle: "Finish this module?",
    finishSectionTitle: "Finish this section?",
    finishBlank: "{count} still blank. Blank answers are marked incorrect.",
    finishAllModule:
      "Every question has an answer. You cannot come back to this module.",
    finishAllSection:
      "Every question has an answer. Your test will be scored immediately.",
    statAnswered: "Answered",
    statBlank: "Blank",
    statFlagged: "Flagged",
    cancel: "Cancel",
    closing: "Closing…",
    scoring: "Scoring…",
    submitSection: "Submit section",

    /* Read at second zero. Short, and the reassurance comes second. */
    timeUp: "Time is up. Your answers are saved.",
    submitFailed: "Could not submit your test. Try again.",
    nextModuleFailed: "Could not start the next module.",

    breakTitle: "Break",
    breakBody:
      "Stand up, look out of a window, drink something. The next section starts when you say so — this countdown does not take time away from it.",
    breakStart: "Start the next module",
    breakStarting: "Starting…",

    errorNoDatabase: "No database connected",
    errorNoQuestions: "This test has no questions",
    errorNoQuestionsBody:
      "Import a question bank for this test, then try again.",
    errorCannotStart: "Could not start this test",
    errorCannotStartBody: "Something went wrong. Please try again.",
    errorNoModuleQuestions: "This module has no questions",
    errorNoModuleQuestionsBody:
      "The sitting could not be assembled. Import more of the question bank and start again.",
    backToPractice: "Back to practice",
  },

  plan: {
    eyebrow: "Build",
    title: "Weekly plan",
    body: "Built from your exam date, your target score and what the question bank holds.",
    empty: "No plan yet.",
    emptyBody: "Your answers are enough to build one in a second.",
    regenerate: "Rebuild the plan",
    regenerating: "Building…",
    regenerateFailed: "The plan could not be built. Try again.",
    regenerateHint:
      "Rebuild after changing your exam date or target score.",

    thisWeek: "This week",
    weekLabel: "Week {n}",
    questionsCount: "{count} questions",
    due: "by {date}",
    allWeeks: "The whole plan",

    target: "Target score",
    projected: "Projected score",
    projectedNote: "A model estimate, not a promise.",
    projectedUnknown: "Starting score unknown",
    projectedUnknownNote: "Sit a diagnostic and the projection appears.",
    examDate: "Exam date",
    weeksLeft: "{count} weeks left",
    weeklyLoad: "{count} questions a week",
    weeklyLoadLabel: "Weekly load",

    onTrack: "This pace reaches your target.",
    offTrack: "This pace does not reach your target.",
    shortfall: "It would need {count} more minutes a week.",
    bankLimited:
      "The question bank is still small, so some weeks are lighter than the plan asks for.",
  },

  uni: {
    search: "Search",
    searchPlaceholder: "Name, city, state or major…",
    sortBy: "Sort by",
    sortRanking: "World ranking",
    sortAcceptance: "Most selective",
    sortSat: "Average admitted score",
    sortName: "Name (A–Z)",
    fullNeed: "Meets full need",
    counted: "{shown} of {total}",
    noMatch: "No universities match",
    noMatchBody: "Try a higher score, or clear the filters.",
    clearFilters: "Clear filters",
    stockPhoto: "Stock photo",
    shortlisted: "Shortlisted",
    addToShortlist: "Add to shortlist",
    removeFromShortlist: "Remove {name} from your shortlist",
    addNamed: "Add {name} to your shortlist",
    added: "{name} added to your shortlist.",
    removed: "{name} removed from your shortlist.",
    updateFailed: "Could not update your shortlist.",
    verdictReach: "reach",
    verdictMatch: "match",
    verdictSafety: "safety",
    acceptanceRate: "Acceptance rate",
    acceptanceBody: "{rate} of applicants are admitted",
    tuition: "Tuition, per year",
    sat: "SAT",
    ielts: "IELTS",
    deadline: "Deadline",
    officialSite: "Official site",
    majors: "Popular majors",
    profile: "What they look for",
    noData: "Not listed",
    students: "Students",
    showing: "Showing {shown} of {total}",
    loadMore: "Load more",

    rankingBadge: "World rank {rank}",
    satBenchmark: "Average SAT",
    noSatRequirement: "No SAT figure published",

    verdictNoScore:
      "We do not know your score yet. Sit a diagnostic, or add your current score in onboarding, and the comparison appears here.",
    verdictNoBenchmark:
      "This university publishes no SAT figure, so there is nothing to compare against.",
    verdictLevel: "Your score ({score}) is level with their average.",
    verdictAbove:
      "Your score ({score}) is {difference} points above their average of {benchmark}.",
    verdictBelow:
      "Your score ({score}) is {difference} points below their average of {benchmark}.",
    verdictNote:
      "Not a prediction: admissions offices read the whole profile, not only the score.",

    outcomesSection: "Reported outcomes",
    outcomesTitle: "Applicant outcomes",
    outcomesCount: "{count} reported",
    outcomesAccepted: "{count}% accepted",
    outcomesYours: "Your score: {score}",
    outcomesEmpty: "No outcomes yet",
    outcomesEmptyBody:
      "Nobody has reported a decision from this university yet. We will not invent numbers to fill the space — as soon as there is data, it appears here.",
    outcomesDisclaimer:
      "Self-reported by applicants. Not official admissions statistics.",

    accepted: "Accepted",
    rejected: "Rejected",
    waitlisted: "Waitlisted",

    sampleAll: "Sample data",
    sampleSome: "Partly sample data",
  },

  applications: {
    eyebrow: "Apply",
    title: "Applications database",
    body: "Applicants report their own results: what they scored, where they got in, where they did not.",
    likeYou: "Applicants like you",
    likeYouBody: "The reported results closest to {score}.",
    likeYouNoScore:
      "We need your score first. Sit a diagnostic or add your current score, and the closest applicants appear here.",
    likeYouNoData:
      "There are not enough reported results to compare against yet. They will appear here as they arrive.",
    allTitle: "All results",
    counted: "Showing {shown} of {total}",
    searchPlaceholder: "University or major…",
    status: "Decision",
    statusAll: "All",
    empty: "Nothing reported yet",
    emptyBody:
      "No applicant results have been collected. We do not copy them from other sites — that data belongs to the students who submitted it there. This fills up from Sirius users who choose to share their own.",
    noMatch: "No matching results",
    noMatchBody: "Try a different search or filter.",
    sourceNote:
      "Each row is a decision, not a person. No names are stored; an applicant appears only as a pseudonymous key.",
  },

  workspace: {
    archive: "Archive", unarchive: "Restore from archive", archivedItems: "Archived items", activeItems: "Active items", archiveHelp: "This item is archived. Content and versions are preserved; restore it to edit.",
    tracker: "My applications", trackerHelp: "Keep your university applications, deadlines and documents in one place.", newApplication: "Add application", applicationsEmpty: "You have no personal applications yet. Start with a university and intake.", viewOutcomes: "Explore reported admission outcomes",
    university: "University", intake: "Intake / admission cycle", deadline: "Your planned deadline", status: "Status", deadlineHelp: "This is a date in your personal plan. Verify the official deadline with the university before entering it.",
    states: { PLANNING: "Planning", IN_PROGRESS: "In progress", SUBMITTED: "Submitted", WAITLISTED: "Waitlisted", ACCEPTED: "Accepted", REJECTED: "Rejected", WITHDRAWN: "Withdrawn" },
    checklist: "Document checklist", defaultChecklist: ["Essay", "Transcript", "Recommendations", "Financial aid documents"], documentName: "Document name", newDocument: "New document", addDocument: "Add document", remove: "Remove", notes: "Private notes",
    activities: "Activities linked to this application", activitiesEmpty: "Add your own activities in the Activities section first.", manageActivities: "Manage activities",
    saved: "Saved.", failed: "Could not save. Keep your text and try again.", invalid: "Check required fields, the date and the checklist.", conflict: "A newer change was saved in another tab. Copy your local text and reload the page.",
    myDrafts: "My drafts", newDraft: "New essay draft", untitledDraft: "Untitled draft", draftTitle: "Draft title", wordLimit: "Word limit", prompt: "Essay question / prompt", draftBody: "Essay text", words: "words", revisions: "Previous versions", version: "Version", restore: "Restore version", refreshHistory: "Refresh history", privateHelp: "This draft is saved in your private profile. Restoring creates a new version and preserves previous history.", draftWorkspace: "Essay workspace", linkedApplication: "Linked application",
  },
  recall: {
    recognition: "Recall meaning", production: "Recall English word", productionPrompt: "Recall the English word from its translation.", nextReview: "Next review",
    title: "Review words", dueCount: "{count} cards are due for review now.", empty: "No cards are due now. Open My words for your saved words and upcoming reviews.", prompt: "Recall the meaning before revealing the translation.", reveal: "Reveal answer", rateHelp: "How easily did you remember it?", ratings: { again: "Again", hard: "Hard", good: "Good", easy: "Easy" }, selfRating: "This is your self-rated recall. It does not contribute to a SAT score.", dictionaryHelp: "Review cards use saved words with a translation in the Sirius dictionary. Words without translations remain in your word list.", start: "Start review",
  },
  essays: {
    eyebrow: "Apply",
    title: "Essays",
    body: "Read strong essays as craft — how they are built — rather than as something to copy.",
    empty: "The library is empty",
    emptyBody:
      "An essay is somebody's work. The ones on other sites were submitted by students to those sites, and copying them here would be taking work nobody gave us. The library fills up from essays donated with permission.",
    locked: "Locked",
    lockedTitle: "This essay is premium",
    lockedBody:
      "The text opens with a premium subscription. Practice, your plan and the university explorer stay open either way.",
    commonApp: "Common App",
    wordCount: "{count} words",
    readingNote:
      "These are for reading, not for reusing. A copied essay does not strengthen an application — it ends it.",
  },

  activities: {
    eyebrow: "Apply",
    title: "Activities",
    body: "Your Common App list, and the ladder it sits on.",

    mineTitle: "My list",
    mineCount: "{count} of {max} activities",
    mineEmpty: "Nothing added yet.",
    full: "The Common App allows {max}. Remove one to add another.",
    add: "Add",
    addTitle: "New activity",
    editTitle: "Edit activity",
    edit: "Edit",
    remove: "Remove",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    saveFailed: "That did not save. Try again.",

    fieldTitle: "Name",
    fieldRole: "Your role",
    fieldOrganisation: "Organisation",
    fieldHours: "Hours/week",
    fieldWeeks: "Weeks/year",
    fieldDescription: "Description",
    descriptionHint:
      "The Common App gives you {max} characters. Writing inside that limit is the exercise.",
    hours: "{count} hrs/week",
    weeks: "{count} weeks/year",

    ladderTitle: "The ladder",
    ladderBody:
      "From the first rung upwards. The question is where you are now and what the next step looks like.",
    ladderEmpty: "No tiers loaded",
    ladderEmptyBody: "This list arrives through the admin import path.",
    participation: "{count}%",
  },

  roadmapTasks: {
    "set-target": {
      title: "Set your target score",
      detail: "Pick the score your shortlist actually needs, then work backwards.",
    },
    "first-test": {
      title: "Sit one full practice test",
      detail: "A cold baseline is more useful than a warmed-up one.",
    },
    "review-answers": {
      title: "Review every wrong answer",
      detail: "Read the explanation and name the reason you missed it.",
    },
    "save-words": {
      title: "Save 20 words to your word bank",
      detail: "Tap unfamiliar words while you read — they collect automatically.",
    },
    shortlist: {
      title: "Shortlist five universities",
      detail: "Two reaches, two matches, one safety.",
    },
  },

  words: {
    emptyTitle: "Your word bank is empty",
    emptyBody:
      "Turn on the Uzbek dictionary in a practice passage and tap any highlighted word — “Save to word bank” collects it here.",
    searchPlaceholder: "Search your words…",
    searchLabel: "Search saved words",
    counted: "{shown} of {total}",
    notInDictionary: "Not in the dictionary",
    remove: "Remove",
    removeNamed: "Remove {word} from your word bank",
    removeFailed: "Could not remove that word.",
  },

  auth: {
    signInTitle: "Welcome back",
    signInBody: "Sign in with Google and pick up where you left off.",
    signUpTitle: "Open your profile",
    signUpBody:
      "One click and you have an account. No password to invent, no confirmation email to wait for.",
    continueWithGoogle: "Continue with Google",
    redirecting: "Redirecting to Google…",
    terms: "By continuing you agree to the terms of service.",
    noAccount: "No account yet?",
    haveAccount: "Already have an account?",
    createOne: "Create one",
    signInLink: "Sign in",
    account: "Account",
    myProfile: "My profile",
    signOut: "Sign out",
    errorTitle: "Could not sign you in",
    errorBody: "Something went wrong talking to Google. Please try again.",
    setupTitle: "Google sign-in is not configured yet",
    setupBody:
      "Create an OAuth client in the Google Cloud Console and add the keys to .env:",
  },

  errors: {
    dbTitle: "Could not reach the database",
    dbBody:
      "Your account is fine — we just could not read your data. This is usually temporary: try reloading the page.",
    dbHint: "Running locally? Check that `npx prisma dev` is still up.",
    retry: "Try again",
    genericTitle: "Something went wrong",
    genericBody:
      "This page could not be loaded. Try again — if it keeps happening, send us the error text.",
    backToDashboard: "Back to the dashboard",
  },
};

export const DICTIONARIES = { uz, en } as const;
