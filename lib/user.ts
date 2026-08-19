/**
 * The user layer between Auth.js and the product.
 *
 * Auth.js owns identity: `@auth/prisma-adapter` creates the `User` row on the
 * first Google sign-in, so nothing here has to mirror an external service the
 * way the Clerk version did. What is left is the product's own concern —
 * reading the session, and making sure a brand-new account starts with a
 * roadmap instead of an empty checklist.
 */

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/generated/prisma/client";

/**
 * The starter roadmap, seeded once on a student's first authenticated request
 * so the dashboard checklist is never empty on first visit.
 *
 * Each entry carries a `slug`. The row stores English text — which is what a
 * student sees if they ever export their data — but the checklist renders the
 * dictionary entry for the slug when there is one, so the seeded steps switch
 * language with the rest of the UI. Tasks a student writes themselves have no
 * slug and are shown exactly as typed.
 */
export const STARTER_ROADMAP: Array<{
  slug: string;
  title: string;
  detail: string;
}> = [
  {
    slug: "set-target",
    title: "Set your target score",
    detail: "Pick the score your shortlist actually needs, then work backwards.",
  },
  {
    slug: "first-test",
    title: "Sit one full practice test",
    detail: "A cold baseline is more useful than a warmed-up one.",
  },
  {
    slug: "review-answers",
    title: "Review every wrong answer",
    detail: "Read the explanation and name the reason you missed it.",
  },
  {
    slug: "save-words",
    title: "Save 20 words to your word bank",
    detail: "Tap unfamiliar words while you read — they collect automatically.",
  },
  {
    slug: "shortlist",
    title: "Shortlist five universities",
    detail: "Two reaches, two matches, one safety.",
  },
];

/**
 * Three states, not two.
 *
 * "Signed out" and "we could not tell" are different facts and must not be
 * collapsed. Treating a failed session read as "signed out" is what produced
 * the redirect loop this type exists to prevent: the dashboard bounced to
 * sign-in, sign-in read the session successfully on the retry and bounced back
 * to the dashboard, and the page reloaded a few times a second.
 */
export type SessionState =
  | { status: "signed-in"; userId: string }
  | { status: "signed-out" }
  | { status: "unavailable"; error: Error };

/**
 * Read the session without ever throwing.
 *
 * A session read hits the database (Auth.js stores sessions in a table), so it
 * can fail for reasons that have nothing to do with the visitor's identity.
 * Callers decide what to do about that; this only reports it accurately.
 */
export async function readSession(): Promise<SessionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    return userId ? { status: "signed-in", userId } : { status: "signed-out" };
  } catch (error) {
    return {
      status: "unavailable",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * The signed-in user's id, or null when signed out.
 *
 * This is the join key for everything user-owned. Every query that touches
 * student data must scope by it.
 *
 * Returns null when the session cannot be read at all, which is the safe answer
 * for a Server Action: it refuses the write rather than performing it for an
 * unknown user.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const state = await readSession();
  return state.status === "signed-in" ? state.userId : null;
}

/**
 * The authorisation boundary for a page.
 *
 * Redirects to sign-in when the visitor is genuinely signed out, and returns
 * the id when they are not — so a caller can write
 * `const userId = await requireUserId()` and be certain of what follows.
 *
 * When the session *cannot be read*, it throws instead of redirecting. That
 * sends the request to the nearest `error.tsx`, which explains the failure and
 * offers a retry. Redirecting on an infrastructure failure is what turns a
 * database hiccup into an infinite bounce between two routes.
 */
export async function requireUserId(): Promise<string> {
  const state = await readSession();

  if (state.status === "signed-in") return state.userId;
  if (state.status === "signed-out") redirect("/sign-in");

  throw state.error;
}

/**
 * The signed-in user's row, with the starter roadmap seeded on first call.
 *
 * Returns null when nobody is signed in. Throws if the database is unreachable
 * — callers that must survive an unconfigured database should check
 * `isDatabaseConfigured()` first.
 *
 * The roadmap is seeded here rather than in an Auth.js `events.createUser`
 * callback on purpose: the callback runs inside the OAuth redirect, where a
 * slow write delays the sign-in, and a failure there leaves an account that can
 * never be repaired without an admin. Doing it lazily means the worst case is
 * one extra query on the first dashboard load.
 */
export async function getOrCreateCurrentUser(): Promise<User | null> {
  const state = await readSession();
  if (state.status !== "signed-in") return null;

  const { userId } = state;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const roadmapCount = await prisma.roadmapTask.count({ where: { userId } });
  if (roadmapCount > 0) return user;

  /*
   * `skipDuplicates` rather than a transaction: two tabs opening the dashboard
   * at the same moment would both see a count of zero, and this turns the
   * second insert into a no-op instead of a crash.
   */
  await prisma.roadmapTask.createMany({
    data: STARTER_ROADMAP.map((task, index) => ({
      userId,
      slug: task.slug,
      title: task.title,
      detail: task.detail,
      order: index,
    })),
    skipDuplicates: true,
  });

  return user;
}

/**
 * A display name for greetings.
 *
 * Google returns a full name, so the greeting takes the first word of it —
 * "Hi, Abdulaziz" reads like a person talking; "Hi, Abdulaziz Mamadov" reads
 * like a bank. Falls back through the email local part to a generic label, so
 * the dashboard never greets "undefined".
 */
export function displayName(
  user: Pick<User, "name" | "email"> | null,
): string {
  if (!user) return "there";

  const firstName = user.name?.trim().split(/\s+/)[0];
  if (firstName) return firstName;

  if (user.email) return user.email.split("@")[0];
  return "there";
}
