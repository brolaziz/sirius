export const WORD_RATINGS = ["again", "hard", "good", "easy"] as const;
export type WordRating = typeof WORD_RATINGS[number];
/** Self-rated recall scheduling, independent of test scores or knowledge claims. */
export function scheduleWordReview(state: { repetitions: number; intervalDays: number }, rating: WordRating, now = new Date()) {
  const repetitions = rating === "again" ? 0 : state.repetitions + 1;
  const intervalDays = rating === "again" ? 0 : rating === "hard" ? Math.max(1, Math.ceil(state.intervalDays * 1.2))
    : rating === "easy" ? Math.max(4, Math.ceil(state.intervalDays * 3))
    : state.repetitions === 0 ? 1 : state.repetitions === 1 ? 3 : Math.max(1, Math.ceil(state.intervalDays * 2));
  const bounded = Math.min(365, intervalDays);
  return { repetitions, intervalDays: bounded, lastReviewedAt: now,
    nextReviewAt: new Date(now.getTime() + (rating === "again" ? 10 * 60_000 : bounded * 86_400_000)) };
}
