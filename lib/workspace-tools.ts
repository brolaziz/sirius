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
  { href: "/essays", group: "apply", icon: "essay", tone: "rose", uz: ["Insholarim", "Qoralama yarating, yozing va oldingi versiyalarga qayting."], en: ["My essays", "Create drafts, write your story and return to previous versions."] },
  { href: "/profile", group: "prepare", icon: "profile", tone: "amber", uz: ["Maqsad va profil", "Ball, imtihon sanasi va haftalik vaqtingizni yangilang."], en: ["Goals & profile", "Update your score, exam date and weekly study time."] },
] as const;
export function workspaceTools(lang: Lang, group?: ToolGroup, query = "") {
  const needle = query.trim().toLocaleLowerCase();
  return WORKSPACE_TOOLS.filter(tool => (!group || tool.group === group) && (!needle || [...tool.uz, ...tool.en].join(" ").toLocaleLowerCase().includes(needle)))
    .map(tool => ({ ...tool, title: tool[lang][0], description: tool[lang][1] }));
}
