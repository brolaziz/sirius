/**
 * One practice session.
 *
 * Inside the `(app)` shell rather than full screen like the simulator: practice
 * is not an exam, so there is no reason to take the navigation away. A student
 * who wants to stop after three questions should be able to see where to go.
 *
 * The page never loads the answer key for a question that has not been answered
 * — see the note at the top of `lib/queries/practice.ts`.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PracticeRunner } from "@/components/practice/practice-runner";
import { getPracticeSession } from "@/lib/queries/practice";
import { requireUserId } from "@/lib/user";
import { getLang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Practice session",
};

export default async function PracticeSessionPage({
  params,
}: PageProps<"/practice/session/[sessionId]">) {
  const userId = await requireUserId();
  const { sessionId } = await params;

  const session = await getPracticeSession(userId, sessionId);
  if (!session) notFound();

  const lang = await getLang();

  /*
   * Skill names live on the taxonomy rows in both languages, so this picks
   * rather than translates. Done here rather than in the client component to
   * keep the language decision on the server with the rest of the dictionary.
   */
  const skillLabel =
    lang === "uz" && session.skillNameUz ? session.skillNameUz : session.skillName;

  return <PracticeRunner session={session} skillLabel={skillLabel} />;
}
