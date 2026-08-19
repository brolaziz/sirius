/**
 * The starter university list, in both languages.
 *
 * Moved out of `prisma/seed.ts` when the detail view grew: twelve universities
 * × eighteen fields is a content file, not a script, and keeping it here means
 * a non-developer can edit the copy without touching seeding logic.
 *
 * ABOUT THE NUMBERS
 * Score floors, TOEFL minimums and GPAs are *indicative* — the figure a
 * competitive applicant should aim at, drawn from what each university
 * publishes. They are not official cut-offs and the UI says so. Where a
 * university genuinely does not use a measure (Oxford and Cambridge do not read
 * GPA; Oxford does not require the SAT) the field is `null` rather than a
 * plausible-looking guess.
 *
 * ABOUT THE PHOTOS
 * `imageUrl` is null for every row. These are famous campuses and we do not
 * hold licensed photography of them, so the UI falls back to a generated cover
 * (see `coverPhoto` in `lib/viz.ts`) rather than captioning a stock photo of
 * some other campus with a real university's name. Drop a licensed URL in here
 * and the card uses it immediately.
 */

export interface UniversitySeed {
  name: string;
  country: string;
  city: string;
  acceptanceRate: number | null;
  minSat: number | null;
  minIelts: number | null;
  minToefl: number | null;
  /** Indicative admitted GPA on the US 4.0 scale. Null where unused. */
  averageGpa: number | null;
  tuitionUsd: number | null;
  meetsFullNeed: boolean;
  worldRanking: number | null;
  websiteUrl: string;
  /** ISO date for the earliest undergraduate deadline, where it is fixed. */
  applicationDeadline: string | null;
  imageUrl: string | null;
  description: string;
  descriptionUz: string;
  extracurriculars: string[];
  extracurricularsUz: string[];
  popularMajors: string[];
  popularMajorsUz: string[];
  studentProfile: string;
  studentProfileUz: string;
}

export const UNIVERSITY_SEED: UniversitySeed[] = [
  {
    name: "Massachusetts Institute of Technology",
    country: "United States",
    city: "Cambridge, MA",
    acceptanceRate: 0.04,
    minSat: 1500,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.95,
    tuitionUsd: 62000,
    meetsFullNeed: true,
    worldRanking: 1,
    websiteUrl: "https://mitadmissions.org",
    applicationDeadline: "2026-01-01",
    imageUrl: null,
    description:
      "Need-blind for all applicants, including international students, and " +
      "meets full demonstrated need. Strongest fit for applicants with " +
      "evidence of building things, not only high scores.",
    descriptionUz:
      "Barcha nomzodlar uchun, jumladan chet elliklar uchun ham, moliyaviy " +
      "ehtiyoj qabulga ta'sir qilmaydi va ehtiyoj to'liq qoplanadi. Yuqori " +
      "ball emas, biror narsa yaratganingiz muhimroq.",
    extracurriculars: [
      "Olympiad mathematics",
      "Research projects",
      "Robotics",
      "Open-source software",
    ],
    extracurricularsUz: [
      "Matematika olimpiadalari",
      "Ilmiy loyihalar",
      "Robototexnika",
      "Ochiq kodli dasturlar",
    ],
    popularMajors: [
      "Computer Science",
      "Mechanical Engineering",
      "Physics",
      "Mathematics",
      "Economics",
    ],
    popularMajorsUz: [
      "Kompyuter fanlari",
      "Mashinasozlik",
      "Fizika",
      "Matematika",
      "Iqtisodiyot",
    ],
    studentProfile:
      "MIT reads for makers. One project you carried from an idea to something " +
      "that worked — a robot, a paper, a library other people use — outweighs " +
      "ten club memberships. Show the process, not only the prize.",
    studentProfileUz:
      "MIT yaratuvchilarni qidiradi. G'oyadan ishlaydigan natijagacha olib " +
      "borgan bitta loyiha — robot, maqola yoki boshqalar ishlatadigan dastur " +
      "— o'nta to'garakdan ustun. Mukofotni emas, jarayonni ko'rsating.",
  },
  {
    name: "Harvard University",
    country: "United States",
    city: "Cambridge, MA",
    acceptanceRate: 0.03,
    minSat: 1500,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.95,
    tuitionUsd: 59000,
    meetsFullNeed: true,
    worldRanking: 4,
    websiteUrl: "https://college.harvard.edu/admissions",
    applicationDeadline: "2026-01-01",
    imageUrl: null,
    description:
      "Meets full demonstrated need with no loans. Values sustained, " +
      "deepening commitment in one or two areas over a long activity list.",
    descriptionUz:
      "Moliyaviy ehtiyojni qarzsiz to'liq qoplaydi. Uzun ro'yxatdan ko'ra bir " +
      "yoki ikki yo'nalishdagi chuqur va uzoq davom etgan mehnatni qadrlaydi.",
    extracurriculars: [
      "Debate",
      "Student journalism",
      "Community organising",
      "Music",
    ],
    extracurricularsUz: [
      "Debat",
      "Talabalar jurnalistikasi",
      "Jamoat tashabbuslari",
      "Musiqa",
    ],
    popularMajors: [
      "Economics",
      "Government",
      "Computer Science",
      "Biology",
      "History",
    ],
    popularMajorsUz: [
      "Iqtisodiyot",
      "Davlat boshqaruvi",
      "Kompyuter fanlari",
      "Biologiya",
      "Tarix",
    ],
    studentProfile:
      "Harvard asks what you would do with the room it gives you. Sustained " +
      "leadership in one thing, plus writing that sounds like a person rather " +
      "than an applicant, does more than a spread of titles.",
    studentProfileUz:
      "Harvard sizga beradigan imkoniyat bilan nima qilishingizni so'raydi. " +
      "Bitta ishdagi uzoq yetakchilik va nomzodga emas, tirik odamga o'xshab " +
      "yozilgan insho — lavozimlar to'plamidan kuchliroq.",
  },
  {
    name: "Stanford University",
    country: "United States",
    city: "Stanford, CA",
    acceptanceRate: 0.04,
    minSat: 1500,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.96,
    tuitionUsd: 62000,
    meetsFullNeed: true,
    worldRanking: 3,
    websiteUrl: "https://admission.stanford.edu",
    applicationDeadline: "2026-01-05",
    imageUrl: null,
    description:
      "Meets full need for admitted students. Reads for intellectual " +
      "vitality — what you did with an interest once nobody assigned it.",
    descriptionUz:
      "Qabul qilinganlarning ehtiyojini to'liq qoplaydi. Hech kim topshiriq " +
      "bermaganda qiziqishingiz bilan nima qilganingizga qaraydi.",
    extracurriculars: [
      "Entrepreneurship",
      "Independent research",
      "Athletics",
      "Social ventures",
    ],
    extracurricularsUz: [
      "Tadbirkorlik",
      "Mustaqil tadqiqot",
      "Sport",
      "Ijtimoiy loyihalar",
    ],
    popularMajors: [
      "Computer Science",
      "Engineering",
      "Human Biology",
      "Symbolic Systems",
      "Political Science",
    ],
    popularMajorsUz: [
      "Kompyuter fanlari",
      "Muhandislik",
      "Inson biologiyasi",
      "Symbolic Systems",
      "Siyosatshunoslik",
    ],
    studentProfile:
      "Stanford's short answers are the real test: they want curiosity you " +
      "acted on without being asked. A side project, a club you started, a " +
      "question you kept chasing after the class ended.",
    studentProfileUz:
      "Stanfordning qisqa savollari asosiy sinov: hech kim so'ramaganda ham " +
      "harakatga aylangan qiziqish kerak. Yon loyiha, o'zingiz ochgan " +
      "to'garak yoki dars tugagach ham ta'qib qilgan savolingiz.",
  },
  {
    name: "Yale University",
    country: "United States",
    city: "New Haven, CT",
    acceptanceRate: 0.05,
    minSat: 1490,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.95,
    tuitionUsd: 67000,
    meetsFullNeed: true,
    worldRanking: 10,
    websiteUrl: "https://admissions.yale.edu",
    applicationDeadline: "2026-01-02",
    imageUrl: null,
    description:
      "Need-blind for international applicants and meets full need. Strong " +
      "humanities and social science culture alongside the sciences.",
    descriptionUz:
      "Chet ellik nomzodlar uchun ham moliyaviy ehtiyoj qabulga ta'sir " +
      "qilmaydi. Aniq fanlar bilan bir qatorda gumanitar yo'nalishlar kuchli.",
    extracurriculars: [
      "Model United Nations",
      "Theatre",
      "Volunteering",
      "Literary magazines",
    ],
    extracurricularsUz: [
      "Model United Nations",
      "Teatr",
      "Ko'ngillilik",
      "Adabiy jurnallar",
    ],
    popularMajors: [
      "Economics",
      "Political Science",
      "History",
      "Molecular Biology",
      "Global Affairs",
    ],
    popularMajorsUz: [
      "Iqtisodiyot",
      "Siyosatshunoslik",
      "Tarix",
      "Molekulyar biologiya",
      "Xalqaro munosabatlar",
    ],
    studentProfile:
      "Yale reads essays closely and rewards a distinct voice. Depth in the " +
      "humanities counts as much as a science olympiad here, and how you talk " +
      "about other people matters.",
    studentProfileUz:
      "Yale insholarni diqqat bilan o'qiydi va o'ziga xos ovozni qadrlaydi. " +
      "Bu yerda gumanitar yo'nalishdagi chuqurlik olimpiada bilan teng, " +
      "boshqalar haqida qanday gapirishingiz ham muhim.",
  },
  {
    name: "Columbia University",
    country: "United States",
    city: "New York, NY",
    acceptanceRate: 0.04,
    minSat: 1490,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.91,
    tuitionUsd: 68000,
    meetsFullNeed: true,
    worldRanking: 12,
    websiteUrl: "https://undergrad.admissions.columbia.edu",
    applicationDeadline: "2026-01-01",
    imageUrl: null,
    description:
      "Core Curriculum shared by every undergraduate. Meets full " +
      "demonstrated need, including for international students.",
    descriptionUz:
      "Har bir bakalavr o'qiydigan umumiy Core Curriculum dasturi bor. " +
      "Chet elliklar uchun ham moliyaviy ehtiyoj to'liq qoplanadi.",
    extracurriculars: [
      "Urban policy projects",
      "Journalism",
      "Debate",
      "Internships",
    ],
    extracurricularsUz: [
      "Shahar siyosati loyihalari",
      "Jurnalistika",
      "Debat",
      "Amaliyot",
    ],
    popularMajors: [
      "Economics",
      "Computer Science",
      "Political Science",
      "Engineering",
      "English Literature",
    ],
    popularMajorsUz: [
      "Iqtisodiyot",
      "Kompyuter fanlari",
      "Siyosatshunoslik",
      "Muhandislik",
      "Ingliz adabiyoti",
    ],
    studentProfile:
      "Columbia wants readers. The Core is two years of great books, so show " +
      "you can argue in writing — and say something specific about using New " +
      "York, not just being near it.",
    studentProfileUz:
      "Columbia o'quvchilarni qidiradi. Core — ikki yillik jiddiy kitoblar, " +
      "shuning uchun yozma fikr yurita olishingizni ko'rsating va Nyu-Yorkdan " +
      "aynan qanday foydalanishingizni aniq ayting.",
  },
  {
    name: "New York University Abu Dhabi",
    country: "United Arab Emirates",
    city: "Abu Dhabi",
    acceptanceRate: 0.04,
    minSat: 1450,
    minIelts: 7.0,
    minToefl: 100,
    averageGpa: 3.85,
    tuitionUsd: 58000,
    meetsFullNeed: true,
    worldRanking: null,
    websiteUrl: "https://nyuad.nyu.edu/en/admissions.html",
    applicationDeadline: "2026-01-05",
    imageUrl: null,
    description:
      "Unusually generous aid for international students, and a student body " +
      "drawn from over a hundred countries. A common target for strong " +
      "Central Asian applicants.",
    descriptionUz:
      "Chet ellik talabalar uchun juda saxiy moliyaviy yordam va yuzdan ortiq " +
      "davlatdan kelgan talabalar. Markaziy Osiyodan kuchli nomzodlar ko'p " +
      "murojaat qiladigan universitet.",
    extracurriculars: [
      "Multilingual activities",
      "Research assistantships",
      "Community service",
      "Music",
    ],
    extracurricularsUz: [
      "Ko'p tilli faoliyat",
      "Tadqiqot assistentligi",
      "Jamoatchilik ishlari",
      "Musiqa",
    ],
    popularMajors: [
      "Computer Science",
      "Economics",
      "Social Research and Public Policy",
      "Engineering",
      "Biology",
    ],
    popularMajorsUz: [
      "Kompyuter fanlari",
      "Iqtisodiyot",
      "Ijtimoiy tadqiqot va davlat siyosati",
      "Muhandislik",
      "Biologiya",
    ],
    studentProfile:
      "NYUAD builds a deliberately international class and reads for people " +
      "who will live well in one. Languages, cross-cultural work and a real " +
      "reason for wanting Abu Dhabi specifically all carry weight.",
    studentProfileUz:
      "NYUAD ataylab xalqaro kurs yig'adi va shunday muhitda yashay oladigan " +
      "odamlarni qidiradi. Tillar, madaniyatlararo tajriba va aynan Abu " +
      "Dabini tanlashingizning haqiqiy sababi muhim.",
  },
  {
    name: "University of Oxford",
    country: "United Kingdom",
    city: "Oxford",
    acceptanceRate: 0.17,
    // Oxford admits on subject-specific grounds; the SAT is not a requirement.
    minSat: null,
    minIelts: 7.0,
    minToefl: 110,
    // UK admissions read A-levels or the IB, not a GPA.
    averageGpa: null,
    tuitionUsd: 39000,
    meetsFullNeed: false,
    worldRanking: 2,
    websiteUrl: "https://www.ox.ac.uk/admissions/undergraduate",
    applicationDeadline: "2025-10-15",
    imageUrl: null,
    description:
      "Admission is by subject, decided largely on written tests and " +
      "interviews. Depth in your chosen subject matters far more than breadth.",
    descriptionUz:
      "Qabul fan bo'yicha, asosan yozma test va suhbat orqali hal qilinadi. " +
      "Tanlagan faningizdagi chuqurlik kenglikdan ancha muhim.",
    extracurriculars: [
      "Subject olympiads",
      "Essay competitions",
      "Reading beyond the syllabus",
    ],
    extracurricularsUz: [
      "Fan olimpiadalari",
      "Insho tanlovlari",
      "Dastur tashqarisidagi o'qish",
    ],
    popularMajors: [
      "PPE (Philosophy, Politics and Economics)",
      "Mathematics",
      "Law",
      "Medicine",
      "Computer Science",
    ],
    popularMajorsUz: [
      "PPE (falsafa, siyosat, iqtisodiyot)",
      "Matematika",
      "Huquq",
      "Tibbiyot",
      "Kompyuter fanlari",
    ],
    studentProfile:
      "Oxford interviews you like a first tutorial: they push on a problem to " +
      "see how you think aloud. Read widely in your subject and be ready to " +
      "defend — and change — an argument in real time.",
    studentProfileUz:
      "Oxford suhbati birinchi darsga o'xshaydi: qanday fikrlashingizni " +
      "ko'rish uchun masala ustida bosim o'tkazadi. Faningiz bo'yicha keng " +
      "o'qing va fikringizni himoya qilishga — hamda o'zgartirishga — tayyor " +
      "turing.",
  },
  {
    name: "University of Cambridge",
    country: "United Kingdom",
    city: "Cambridge",
    acceptanceRate: 0.21,
    minSat: null,
    minIelts: 7.5,
    minToefl: 110,
    averageGpa: null,
    tuitionUsd: 38000,
    meetsFullNeed: false,
    worldRanking: 5,
    websiteUrl: "https://www.undergraduate.study.cam.ac.uk",
    applicationDeadline: "2025-10-15",
    imageUrl: null,
    description:
      "College-based admissions with subject interviews and admissions " +
      "assessments. Strong preference for demonstrated subject mastery.",
    descriptionUz:
      "Qabul kollejlar orqali, fan bo'yicha suhbat va maxsus imtihonlar bilan " +
      "o'tadi. Fanni chuqur egallaganingiz aniq ko'rinishi kerak.",
    extracurriculars: [
      "Subject olympiads",
      "Research placements",
      "Academic societies",
    ],
    extracurricularsUz: [
      "Fan olimpiadalari",
      "Tadqiqot amaliyoti",
      "Ilmiy to'garaklar",
    ],
    popularMajors: [
      "Natural Sciences",
      "Mathematics",
      "Engineering",
      "Economics",
      "Computer Science",
    ],
    popularMajorsUz: [
      "Tabiiy fanlar",
      "Matematika",
      "Muhandislik",
      "Iqtisodiyot",
      "Kompyuter fanlari",
    ],
    studentProfile:
      "Cambridge is the narrowest and deepest of the lot. Everything is judged " +
      "against your chosen course, so an olympiad medal in that subject is " +
      "worth more than a broad portfolio.",
    studentProfileUz:
      "Cambridge eng tor va eng chuqur yo'nalishga ega. Hamma narsa tanlagan " +
      "kursingizga qarab baholanadi, shuning uchun o'sha fandagi olimpiada " +
      "medali keng portfoliodan qimmatroq.",
  },
  {
    name: "University College London",
    country: "United Kingdom",
    city: "London",
    acceptanceRate: 0.32,
    minSat: 1300,
    minIelts: 6.5,
    minToefl: 92,
    averageGpa: 3.7,
    tuitionUsd: 31000,
    meetsFullNeed: false,
    worldRanking: 9,
    websiteUrl: "https://www.ucl.ac.uk/prospective-students/undergraduate",
    applicationDeadline: "2026-01-29",
    imageUrl: null,
    description:
      "Large, research-intensive and in central London. More attainable than " +
      "Oxbridge while still highly ranked.",
    descriptionUz:
      "Katta, tadqiqotga yo'naltirilgan va London markazida joylashgan. " +
      "Oxbridge'ga qaraganda yetib boriladigan, lekin reytingi baland.",
    extracurriculars: ["Societies", "Internships", "Volunteering"],
    extracurricularsUz: ["To'garaklar", "Amaliyot", "Ko'ngillilik"],
    popularMajors: [
      "Architecture",
      "Economics",
      "Computer Science",
      "Medicine",
      "Psychology",
    ],
    popularMajorsUz: [
      "Arxitektura",
      "Iqtisodiyot",
      "Kompyuter fanlari",
      "Tibbiyot",
      "Psixologiya",
    ],
    studentProfile:
      "UCL decides mostly on grades and the personal statement, and the " +
      "statement is expected to be about the subject rather than about you. " +
      "Name what you have read and what you want to study next.",
    studentProfileUz:
      "UCL asosan baholar va personal statement asosida qaror qiladi, insho " +
      "esa o'zingiz haqingizda emas, fan haqida bo'lishi kutiladi. Nima " +
      "o'qiganingizni va keyin nimani o'rganmoqchi ekaningizni aniq yozing.",
  },
  {
    name: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    acceptanceRate: 0.43,
    minSat: 1300,
    minIelts: 6.5,
    minToefl: 100,
    averageGpa: 3.6,
    tuitionUsd: 45000,
    meetsFullNeed: false,
    worldRanking: 21,
    websiteUrl: "https://future.utoronto.ca",
    applicationDeadline: "2026-01-15",
    imageUrl: null,
    description:
      "Admits primarily on academic record. A dependable match for strong " +
      "students who need a less lottery-like outcome than the US Ivy League.",
    descriptionUz:
      "Asosan o'quv ko'rsatkichlariga qarab qabul qiladi. AQSh Ivy League " +
      "lotereyasidan ko'ra bashoratliroq natija kerak bo'lgan kuchli " +
      "o'quvchilar uchun ishonchli match.",
    extracurriculars: ["Research assistantships", "Clubs", "Co-op placements"],
    extracurricularsUz: [
      "Tadqiqot assistentligi",
      "To'garaklar",
      "Co-op amaliyoti",
    ],
    popularMajors: [
      "Computer Science",
      "Rotman Commerce",
      "Life Sciences",
      "Engineering Science",
      "Mathematics",
    ],
    popularMajorsUz: [
      "Kompyuter fanlari",
      "Rotman Commerce",
      "Hayot haqidagi fanlar",
      "Muhandislik",
      "Matematika",
    ],
    studentProfile:
      "Toronto is the most transparent of the twelve: strong grades and the " +
      "right prerequisite subjects do most of the work. Competitive programmes " +
      "add a supplementary application, so read the programme page, not the " +
      "university page.",
    studentProfileUz:
      "Toronto o'n ikkitasining ichida eng tushunarlisi: kuchli baholar va " +
      "kerakli fanlar ishning katta qismini bajaradi. Raqobatli dasturlar " +
      "qo'shimcha ariza so'raydi, shuning uchun universitet emas, dastur " +
      "sahifasini o'qing.",
  },
  {
    name: "Arizona State University",
    country: "United States",
    city: "Tempe, AZ",
    acceptanceRate: 0.9,
    minSat: 1120,
    minIelts: 6.5,
    minToefl: 79,
    averageGpa: 3.4,
    tuitionUsd: 32000,
    meetsFullNeed: false,
    worldRanking: 200,
    websiteUrl: "https://admission.asu.edu",
    applicationDeadline: null,
    imageUrl: null,
    description:
      "Very high acceptance rate with merit scholarships available on test " +
      "scores alone. A sensible safety choice that still opens US pathways.",
    descriptionUz:
      "Qabul foizi juda yuqori, stipendiyalar faqat test ballari asosida ham " +
      "beriladi. AQShga yo'l ochadigan mantiqiy safety varianti.",
    extracurriculars: ["Any sustained activity", "Part-time work", "Leadership"],
    extracurricularsUz: [
      "Uzoq davom etgan istalgan faoliyat",
      "Yarim kunlik ish",
      "Yetakchilik",
    ],
    popularMajors: [
      "Business",
      "Computer Science",
      "Engineering",
      "Journalism",
      "Design",
    ],
    popularMajorsUz: [
      "Biznes",
      "Kompyuter fanlari",
      "Muhandislik",
      "Jurnalistika",
      "Dizayn",
    ],
    studentProfile:
      "ASU is close to rolling admission: apply early, clear the score bands, " +
      "and merit money follows the numbers. This is the place where a strong " +
      "SAT converts directly into a scholarship.",
    studentProfileUz:
      "ASU deyarli uzluksiz qabul qiladi: erta topshiring, ball chegarasidan " +
      "o'ting va stipendiya raqamlarga qarab beriladi. Kuchli SAT to'g'ridan " +
      "to'g'ri pulga aylanadigan joy shu.",
  },
  {
    name: "Westminster International University in Tashkent",
    country: "Uzbekistan",
    city: "Tashkent",
    acceptanceRate: 0.55,
    minSat: null,
    minIelts: 6.0,
    minToefl: 71,
    averageGpa: null,
    tuitionUsd: 4500,
    meetsFullNeed: false,
    worldRanking: null,
    websiteUrl: "https://wiut.uz",
    applicationDeadline: "2026-06-30",
    imageUrl: null,
    description:
      "UK-validated degrees taught in English, without leaving Tashkent. A " +
      "strong fallback while reapplying abroad, or a lower-cost route to a " +
      "British qualification.",
    descriptionUz:
      "Toshkentdan chiqmasdan ingliz tilida o'qiladigan, Britaniya tomonidan " +
      "tasdiqlangan diplom. Chet elga qayta topshirish paytida ishonchli " +
      "zaxira yoki arzonroq yo'l.",
    extracurriculars: ["Student societies", "Local internships", "Volunteering"],
    extracurricularsUz: [
      "Talabalar to'garaklari",
      "Mahalliy amaliyot",
      "Ko'ngillilik",
    ],
    popularMajors: [
      "Business Administration",
      "Economics",
      "Commercial Law",
      "Computer Science",
    ],
    popularMajorsUz: [
      "Biznes boshqaruvi",
      "Iqtisodiyot",
      "Tijorat huquqi",
      "Kompyuter fanlari",
    ],
    studentProfile:
      "WIUT runs its own entrance exam and reads English proficiency first. " +
      "Extracurriculars matter less here than a clean academic record and a " +
      "solid IELTS — which makes it the reliable floor under a bold list.",
    studentProfileUz:
      "WIUT o'z kirish imtihonini o'tkazadi va avvalo ingliz tili darajasiga " +
      "qaraydi. Bu yerda extracurricular emas, toza o'quv ko'rsatkichi va " +
      "yaxshi IELTS muhim — shuning uchun u jasur ro'yxat ostidagi ishonchli " +
      "poydevor.",
  },
];
