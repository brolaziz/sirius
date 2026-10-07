import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/i18n";
import { getProductAnalytics } from "@/lib/queries/product-analytics";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage() {
  const data = await getProductAnalytics(prisma, await requireUserId());
  if (!data) notFound();
  const uz = await getLang() === "uz";
  const copy = uz ? {
    title: "Foydalanish statistikasi", body: "Oxirgi 30 kunda ro‘yxatdan o‘tgan studentlar guruhi. Bu o‘qish natijasi yoki ball o‘sishi bahosi emas.",
    students: "Yangi studentlar", onboarded: "Boshlang‘ich sozlash tugagan", practiceStarted: "Mashq boshlagan", practiceCompleted: "Mashq tugatgan",
    mockStarted: "Test boshlagan", mockCompleted: "Test tugatgan", events: "Oxirgi 30 kun amallari", help: "Har katakdagi son — shu guruhdagi odamlar soni. Bir odam bir nechta katakka kirishi mumkin. Amal qaydlari yangi versiyadan boshlab yig‘iladi; eski faoliyat qayta yaratilmaydi.",
    retention: "O‘qishga qaytish", returned: "qaytgan", eligible: "kuzatuvi tugagan", noWindow: "Kuzatuv muddati hali tugamagan", download: "CSV yuklash",
    retentionHelp: "Birinchi tugatilgan mashq, test, so‘z takrorlash yoki ariza vazifasidan keyingi 7–8 va 14–15 kun oralig‘ida yana shunday amal qilganlar. Faqat butun 24 soatlik kuzatuv oynasi tugaganlar hisoblanadi; birinchi amal oxirgi 30 kun ichida bo‘lishi kerak. Izoh ko‘ringani uni o‘qib tushunganlikni anglatmaydi.",
    labels: { onboarding_completed: "Boshlang‘ich sozlash", practice_started: "Mashq boshlangan", practice_completed: "Mashq tugagan", explanation_opened: "Izoh ekranda ko‘ringan", plan_task_completed: "Haftalik reja vazifasi bajarilgan", mistake_retried: "Xatolar qayta mashq qilingan", mock_started: "Test boshlangan", mock_completed: "Test tugagan", word_review_completed: "So‘z takrorlangan", application_task_completed: "Ariza vazifasi bajarilgan" },
  } : {
    title: "Product usage", body: "Students who joined in the past 30 days. These are activity counts, not learning or score improvement.",
    students: "New students", onboarded: "Onboarding completed", practiceStarted: "Started practice", practiceCompleted: "Completed practice",
    mockStarted: "Started a test", mockCompleted: "Completed a test", events: "Events in the past 30 days", help: "Each tile counts people in this cohort. People may appear in multiple tiles. Event collection begins with this version; historical activity is not reconstructed.",
    retention: "Return to activity", returned: "returned", eligible: "observed", noWindow: "No completed observation windows yet", download: "Download CSV",
    retentionHelp: "Return to a completed practice, test, word review or application task during days 7–8 and 14–15 after the first such action. Only fully elapsed 24-hour windows count; first activity must be in the past 30 days. Showing an explanation does not establish that it was read or understood.",
    labels: { onboarding_completed: "Onboarding completed", practice_started: "Practice started", practice_completed: "Practice completed", explanation_opened: "Explanation visible", plan_task_completed: "Weekly plan task completed", mistake_retried: "Mistakes retried", mock_started: "Test started", mock_completed: "Test completed", word_review_completed: "Word reviewed", application_task_completed: "Application task completed" },
  };
  const cards = [[copy.students, data.students], [copy.onboarded, data.onboarded], [copy.practiceStarted, data.firstPractice], [copy.practiceCompleted, data.completedPractice], [copy.mockStarted, data.firstMock], [copy.mockCompleted, data.completedMock]];
  return <div className="mx-auto max-w-5xl space-y-7">
    <header><h1 className="text-3xl font-extrabold tracking-tightest">{copy.title}</h1><p className="mt-3 text-muted-foreground">{copy.body}</p><p className="mt-2 text-xs text-muted-foreground">{data.from.toISOString().slice(0, 10)} — {data.until.toISOString().slice(0, 10)}</p></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([title, count]) => <article key={title} className="rounded-2xl bg-card p-6 shadow-card"><h2 className="text-sm text-muted-foreground">{title}</h2><p className="mt-3 text-4xl font-bold tabular-nums">{count}</p></article>)}</div>
    <p className="text-xs text-muted-foreground">{copy.help}</p>
    <section className="space-y-4"><h2 className="text-xl font-bold">{copy.retention}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{data.retention.map((window) => <article key={window.day} className="rounded-2xl bg-card p-6 shadow-card">
        <h3 className="font-semibold">D{window.day}</h3><p className="mt-3 text-3xl font-bold tabular-nums">{window.rate === null ? "—" : `${Math.round(window.rate * 100)}%`}</p>
        <p className="mt-2 text-sm text-muted-foreground">{window.eligible ? `${window.returned} ${copy.returned} / ${window.eligible} ${copy.eligible}` : copy.noWindow}</p>
      </article>)}</div><p className="text-xs text-muted-foreground">{copy.retentionHelp}</p>
    </section>
    <Button asChild variant="outline"><a href="/api/analytics/export">{copy.download}</a></Button>
    <section className="rounded-2xl bg-card p-6 shadow-card"><h2 className="text-xl font-bold">{copy.events}</h2><ul className="mt-4 divide-y divide-border">{data.events.map((event) => <li key={event.type} className="flex justify-between gap-4 py-3 text-sm"><span>{copy.labels[event.type]}</span><span className="font-semibold tabular-nums">{event.count}</span></li>)}</ul></section>
  </div>;
}
