/**
 * Paid access, checked on the server.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHERE THE LOCK ACTUALLY IS
 *
 * Here, and in the queries that call it — never in the browser and never in
 * `proxy.ts`. A locked card in the interface is a courtesy that tells a student
 * what they would get; it is not what stops them reading an essay. The essay
 * body is simply not loaded for an account without access, in the same way an
 * unanswered question's answer key is not loaded during a test.
 *
 * The rule is one boolean on `User`. Sirius has one paid tier, and modelling
 * plans and renewals before there is a payment provider would be designing a
 * billing system on speculation.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export async function hasPremium(userId: string | null): Promise<boolean> {
  if (!userId || !isDatabaseConfigured()) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true },
  });

  return user?.isPremium ?? false;
}
