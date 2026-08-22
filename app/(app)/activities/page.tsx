/**
 * Extracurriculars: the student's own ten lines, and the ladder they sit on.
 *
 * The ladder answers the question every applicant actually has — "is what I am
 * doing good enough, and what does the next step look like?" — so it runs
 * upwards from the first rung rather than opening with Platinum and telling
 * most readers they are at the bottom.
 *
 * A tier's participation rate is shown only when the database has one. "23% of
 * applicants do this" is a figure a student plans a year around, and there is
 * no version of inventing it that is worth the card looking complete.
 */

import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { MyActivities } from "@/components/activities/my-activities";
import { requireUserId } from "@/lib/user";
import {
  getActivityReferences,
  getMyActivities,
  type ActivityReferenceRow,
} from "@/lib/queries/admissions";
import { groupByTier } from "@/lib/admissions";
import { getDictionary, getLang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/config";
import type { Lang } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Activities",
};

export default async function ActivitiesPage() {
  const userId = await requireUserId();
  const lang = await getLang();
  const t = getDictionary(lang);

  const [mine, references] = await Promise.all([
    getMyActivities(userId),
    getActivityReferences(),
  ]);

  const ladder = groupByTier(references);

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.activities.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.activities.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t.activities.body}
        </p>
      </div>

      <MyActivities activities={mine} />

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t.activities.ladderTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t.activities.ladderBody}
        </p>

        {ladder.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Sparkles className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold">
              {t.activities.ladderEmpty}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t.activities.ladderEmptyBody}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-8">
            {ladder.map((group) => (
              <div key={group.tier}>
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.tier}
                </h3>

                <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                  {group.activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="rounded-2xl bg-card p-5 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-balance">
                          {label(activity, lang)}
                        </p>

                        {activity.participationRate !== null && (
                          <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground tabular-nums">
                            {fill(t.activities.participation, {
                              count: Math.round(activity.participationRate * 100),
                            })}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {activity.category}
                      </p>

                      {description(activity, lang) && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {description(activity, lang)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Reference activities are stored in both languages, so these pick rather than
 * translate. A missing Uzbek string falls back to the English one — a gap in
 * the copy should show the activity, not a blank card.
 */
function label(activity: ActivityReferenceRow, lang: Lang): string {
  if (lang === "uz" && activity.titleUz) return activity.titleUz;
  return activity.title;
}

function description(
  activity: ActivityReferenceRow,
  lang: Lang,
): string | null {
  if (lang === "uz" && activity.descriptionUz) return activity.descriptionUz;
  return activity.description;
}
