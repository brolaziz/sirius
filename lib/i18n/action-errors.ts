import type { Lang } from "@/lib/i18n/config";

const uzMessages: Record<string, string> = {
  "Not signed in.": "Hisobga qayta kiring.",
  "Account not found.": "Hisob topilmadi. Qayta kiring.",
  "That test is not available.": "Bu test hozir mavjud emas. Mashqlar sahifasini yangilang.",
  "The full mock is not ready yet. Please use topic practice while the question bank is completed.": "To‘liq sinov hali tayyor emas. Hozircha mavzu mashqlaridan foydalaning.",
  "This test has no questions yet.": "Bu testda hali savol yo‘q.",
  "Attempt not found.": "Urinish topilmadi. Mashqlar sahifasidan qayta oching.",
  "Attempt is no longer open.": "Bu urinish yakunlangan. Natijalar sahifasini oching.",
  "The module changed. Reload to continue.": "Modul boshqa oynada almashgan. Davom etish uchun sahifani yangilang.",
  "Newer progress has already been saved. Reload this attempt.": "Boshqa oynada yangi javoblar saqlangan. Davom etish uchun sahifani yangilang.",
  "That module's time is up.": "Modul vaqti tugagan. Uni yakunlab davom eting.",
  "There are no questions for that topic yet.": "Bu mavzu bo‘yicha hali tekshirilgan savollar yo‘q. Boshqa mavzuni tanlang.",
  "That topic is not available.": "Bu mavzu hozir mavjud emas.",
  "That plan task is not available.": "Bu reja vazifasi mavjud emas. Reja sahifasini yangilang.",
  "Session not found.": "Mashq topilmadi. Mashqlar sahifasidan qayta oching.",
  "This session is already finished.": "Bu mashq yakunlangan. Tarixdan natijasini ko‘ring.",
  "That question is not part of this session.": "Bu savol joriy mashqqa tegishli emas. Sahifani yangilang.",
  "Question not found.": "Savol topilmadi. Mashqlar sahifasiga qayting.",
  "Set a target score and an exam date before building a plan.": "Reja tuzish uchun profilda maqsad ball va imtihon sanasini belgilang.",
  "Your target cannot be lower than your current score.": "Maqsad hozirgi balingizdan past bo‘lmasin.",
  "Some answers are still missing.": "Majburiy maydonlarni to‘ldiring.",
  "Task not found.": "Vazifa topilmadi. Sahifani yangilang.",
  "University not found.": "Universitet topilmadi. Ro‘yxatni yangilang.",
};

/** Uzbek flows never display a raw English server validation message. */
export function actionErrorText(message: string | undefined, fallback: string, lang: Lang): string {
  if (!message) return fallback;
  return lang === "uz" ? uzMessages[message] ?? fallback : message;
}
