import type { Lang } from "@/lib/i18n/config";
export type ToolGroup = "explore" | "prepare" | "apply";
export const WORKSPACE_TOOLS = [
  { href: "/universities", group: "explore", icon: "college", tone: "sky", uz: ["Universitetlar", "Joylashuv, xarajat va qabul ma’lumotlarini solishtiring. Yoqqanlarini saqlang."], en: ["Find colleges", "Compare location, cost and admissions data. Save your favorites."] },
  { href: "/applications", group: "explore", icon: "profiles", tone: "violet", uz: ["Ariza namunalari", "Mavjud, ruxsat bilan ulashilgan profillar va qabul natijalaridan o‘rganing."], en: ["Application examples", "Learn from available profiles and admissions outcomes shared with permission."] },
  { href: "/plan", group: "prepare", icon: "plan", tone: "amber", uz: ["Mening rejam", "Maqsad va bo‘sh vaqtingizga mos haftalik vazifalarni bajaring."], en: ["My study plan", "Work through weekly tasks based on your goal and available time."] },
  { href: "/practice", group: "prepare", icon: "practice", tone: "sky", uz: ["SAT mashqlari", "Mavzu tanlang, javob bering, izohni o‘qing va xatolarni takrorlang."], en: ["SAT practice", "Pick a topic, answer questions, read explanations and revisit mistakes."] },
  { href: "/words", group: "prepare", icon: "words", tone: "violet", uz: ["So‘zlarim", "Saqlangan so‘zlarni ko‘ring va eslash mashqlari bilan mustahkamlang."], en: ["My vocabulary", "Keep your saved words and reinforce them with recall reviews."] },
  { href: "/activities", group: "prepare", icon: "activities", tone: "emerald", uz: ["Faoliyatlarim", "Loyihalar, yutuqlar va tajribangizni bir joyga jamlang."], en: ["My activities", "Collect your projects, achievements and experience in one place."] },
  { href: "/applications/tracker", group: "apply", icon: "tracker", tone: "emerald", uz: ["Arizalarim", "Har universitet uchun deadline, holat va checklist yuriting."], en: ["My applications", "Track deadlines, status and a checklist for each college."] },
  { href: "/essay-editor", group: "apply", icon: "essay", tone: "rose", uz: ["Insho editori", "Qoralama yarating, yozing va oldingi versiyalarga qayting."], en: ["Essay editor", "Create drafts, edit and restore earlier versions."] },
  { href: "/essays", group: "apply", icon: "library", tone: "violet", uz: ["Insho namunalari", "Foydalanishga ruxsat berilgan insho namunalarini ko‘ring."], en: ["Essay library", "Browse essay examples shared with permission."] },
  { href: "/insights", group: "explore", icon: "insights", tone: "sky", uz: ["Natijalar va tahlil", "Yakunlangan mashq va testlarning natijalarini ko‘ring."], en: ["Insights", "Review your completed practice and test results."] },
  { href: "/admissions-analysis", group: "explore", icon: "analysis", tone: "emerald", uz: ["Ariza tayyorgarligi tahlili", "Saqlangan ishlar, arizalar va checklist holatini tekshiring."], en: ["Admissions analysis", "Review your recorded work and application checklists."] },
  { href: "/masterclass", group: "prepare", icon: "library", tone: "amber", uz: ["Admissions qo‘llanma", "Universitet, faoliyat, insho va yakuniy tekshiruv bo‘yicha amaliy bo‘limlar."], en: ["Admissions guide", "Read practical sections on colleges, activities, essays and final review."] },
  { href: "/profile", group: "prepare", icon: "profile", tone: "amber", uz: ["Maqsad va profil", "Ball, imtihon sanasi va haftalik vaqtingizni yangilang."], en: ["Goals & profile", "Update your score, exam date and weekly study time."] },
] as const;
export function workspaceTools(lang: Lang, group?: ToolGroup, query = "") {
  const needle = query.trim().toLocaleLowerCase();
  return WORKSPACE_TOOLS.filter(tool => (!group || tool.group === group) && (!needle || [...tool.uz, ...tool.en].join(" ").toLocaleLowerCase().includes(needle)))
    .map(tool => ({ ...tool, title: tool[lang][0], description: tool[lang][1] }));
}
