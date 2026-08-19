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
    dictionary: "Lug'at",
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
        body: "Ballingiz va profilingizga qarab har bir universitet reach, match yoki safety ekanini aytadi. Taxmin qilish tugadi.",
        bullets: ["Qabul foizi", "Ball talablari", "Moliyaviy yordam"],
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

  dictionary: {
    badge: "Qani, ko'k so'zga bosing",
    heading: "Inglizcha o'qish endi to'siq emas",
    body: "Universitet sahifalari, insho namunalari va SAT parchalarida istalgan so'zga bosing — o'zbekchasi shu yerda chiqadi. Hech narsa yuklanmaydi, chunki lug'at ilova ichida keladi.",
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
    practice: "Mashq",
    myWords: "So'zlarim",
    universities: "Universitetlar",
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

    readiness: "Ariza tayyorligi",
    readinessHint: "{done} / {total} bosqich yopilgan",
    readinessSteps: {
      target: "Maqsad ball belgilandi",
      test: "Birinchi mock test topshirildi",
      shortlist: "Ro'yxatda kamida 3 ta universitet",
      words: "So'z bazasida 20+ so'z",
      roadmap: "Rejaning yarmi bajarildi",
    },

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
    accuracyHint: "Barcha tugatilgan testlar bo'yicha",
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

  uni: {
    search: "Qidiruv",
    searchPlaceholder: "Nomi, davlati yoki faoliyat…",
    myScore: "Mening SAT balim",
    myScorePlaceholder: "masalan 1400",
    sortBy: "Saralash",
    sortRanking: "Jahon reytingi",
    sortAcceptance: "Eng tanlab oladigan",
    sortSat: "SAT talabi",
    sortName: "Nomi (A–Z)",
    fullNeed: "To'liq yordam beradi",
    counted: "{total} tadan {shown} tasi",
    reachableWith: "{score} ball bilan yetib boriladi",
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
    toefl: "TOEFL",
    gpa: "O'rtacha GPA",
    ranking: "Reyting",
    deadline: "Muddat",
    officialSite: "Rasmiy sayt",
    requirements: "Qabul talablari",
    requirementsNote:
      "Raqamlar taxminiy — raqobatbardosh nomzod qaratadigan daraja. Rasmiy talablarni universitet saytidan tekshiring.",
    majors: "Ommabop yo'nalishlar",
    profile: "Ular nimaga qaraydi",
    activities: "Qadrlanadigan faoliyatlar",
    fullNeedTitle: "Moliyaviy ehtiyoj to'liq qoplanadi",
    fullNeedBody:
      "Qabul qilinsangiz, o'qish narxi bilan oilangiz to'lay oladigan summa orasidagi farq yordam bilan yopiladi.",
    noData: "Ma'lumot yo'q",
    satMath: "SAT matematika",
    satReading: "SAT o'qish",
    students: "Talabalar",
    sourceScorecard:
      "Qabul foizi, SAT va narx — AQSh Ta'lim vazirligining College Scorecard ma'lumotlaridan.",
    showing: "{total} tadan {shown} tasi ko'rsatilyapti",
    loadMore: "Yana yuklash",
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
    myShortlist: "Universitet ro'yxatim",
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
    dictionary: "Dictionary",
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
        bullets: ["Acceptance rates", "Score requirements", "Financial aid"],
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
    badge: "Go on, tap a blue word",
    heading: "Reading in English stops being the obstacle",
    body: "University pages, sample essays, SAT passages — tap any word and the Uzbek is right there. Nothing loads, because the dictionary ships inside the app.",
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
    practice: "Practice",
    myWords: "My words",
    universities: "Universities",
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

    readiness: "Application readiness",
    readinessHint: "{done} of {total} stages closed",
    readinessSteps: {
      target: "Target score set",
      test: "First mock test done",
      shortlist: "At least 3 universities saved",
      words: "20+ words in your bank",
      roadmap: "Half the plan finished",
    },

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
    accuracyHint: "Across every completed test",
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

  uni: {
    search: "Search",
    searchPlaceholder: "Name, country or activity…",
    myScore: "My SAT score",
    myScorePlaceholder: "e.g. 1400",
    sortBy: "Sort by",
    sortRanking: "World ranking",
    sortAcceptance: "Most selective",
    sortSat: "SAT requirement",
    sortName: "Name (A–Z)",
    fullNeed: "Meets full need",
    counted: "{shown} of {total}",
    reachableWith: "Reachable with {score}",
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
    toefl: "TOEFL",
    gpa: "Average GPA",
    ranking: "Ranking",
    deadline: "Deadline",
    officialSite: "Official site",
    requirements: "Admission requirements",
    requirementsNote:
      "Figures are indicative — what a competitive applicant aims at. Check the university's own page for official requirements.",
    majors: "Popular majors",
    profile: "What they look for",
    activities: "Activities that count here",
    fullNeedTitle: "Meets full demonstrated need",
    fullNeedBody:
      "If you are admitted, aid is designed to cover the gap between the cost and what your family can pay.",
    noData: "Not listed",
    satMath: "SAT Math",
    satReading: "SAT Reading",
    students: "Students",
    sourceScorecard:
      "Admission rate, SAT and cost come from the US Department of Education's College Scorecard.",
    showing: "Showing {shown} of {total}",
    loadMore: "Load more",
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
    myShortlist: "My shortlist",
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
