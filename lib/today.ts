import type { PlanTaskView, StudyPlanView } from "@/lib/queries/study-plan";

export interface ResumeActivity { href: string; title: string; startedAt: Date }
export interface TodayAction {
  kind: "resume" | "plan" | "mock" | "practice" | "setup" | "done";
  href?: string;
  title?: string;
  titleUz?: string | null;
  taskId?: string;
  remaining?: number;
}

/** Resume unfinished work first, then this week's real outstanding task. */
export function chooseTodayAction(input: {
  resumes: ResumeActivity[]; plan: StudyPlanView | null; mockHref: string | null;
  hasPractice: boolean; now?: Date;
}): TodayAction {
  const resume = [...input.resumes].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
  if (resume) return { kind: "resume", href: resume.href, title: resume.title };
  if (input.plan) {
    const now = (input.now ?? new Date()).getTime();
    const week = input.plan.weeks.find((w) => w.startDate.getTime() <= now && w.dueDate.getTime() >= now);
    const task: PlanTaskView | undefined = week?.tasks.find((t) => t.completedQuestions < t.targetQuestions);
    if (task) return { kind: "plan", taskId: task.id, title: task.skillName, titleUz: task.skillNameUz, remaining: task.targetQuestions - task.completedQuestions };
    if (week) return { kind: "done", href: "/plan" };
  }
  if (input.mockHref) return { kind: "mock", href: input.mockHref };
  if (input.hasPractice) return { kind: "practice", href: "/practice" };
  return { kind: "setup", href: "/profile" };
}
