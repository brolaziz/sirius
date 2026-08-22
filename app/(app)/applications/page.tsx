/**
 * The applications database — reported admissions decisions.
 *
 * WHERE THE DATA IS MEANT TO COME FROM
 * Students submitting their own results, with consent, anonymised. Not from
 * scraping a competitor: the rows on other sites belong to the students who
 * wrote them and to the site they trusted with them, and copying those would be
 * both a legal problem and a broken promise on somebody else's behalf.
 *
 * So this page is mostly an empty state today, and it says why in plain words
 * rather than filling the grid with plausible numbers. The submission flow —
 * consent, anonymisation, review — is a piece of work in its own right and is
 * not built yet.
 */

import type { Metadata } from "next";

import { ApplicationsBrowser } from "@/components/applications/applications-browser";
import { getCurrentUserId } from "@/lib/user";
import { getLatestScore } from "@/lib/queries/score";
import {
  getApplicantProfiles,
  getSimilarApplicants,
} from "@/lib/queries/admissions";
import { getDictionary, getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Applications",
};

export default async function ApplicationsPage() {
  const userId = await getCurrentUserId();
  const t = getDictionary(await getLang());

  const [applicants, similar, myScore] = await Promise.all([
    getApplicantProfiles({ limit: 200 }),
    userId ? getSimilarApplicants(userId) : Promise.resolve([]),
    userId ? getLatestScore(userId) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {t.applications.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.02] font-extrabold tracking-tightest text-balance sm:text-5xl lg:text-6xl">
          {t.applications.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {t.applications.body}
        </p>
      </div>

      <ApplicationsBrowser
        applicants={applicants}
        similar={similar}
        myScore={myScore}
      />

      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {t.applications.sourceNote}
      </p>
    </div>
  );
}
