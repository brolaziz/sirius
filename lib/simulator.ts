/**
 * Types and helpers shared between the simulator's server page and its client
 * engine.
 *
 * The single most important rule in this file: **`correctAnswer` is never part
 * of `SimulatorQuestion`.** The client receives only what it needs to render a
 * question. Shipping the answer key to the browser — even inside a prop that no
 * component reads — would put it in the page's serialised RSC payload, where
 * anyone can read it during the test. Grading happens server-side in
 * `lib/actions/attempts.ts`.
 */

import type { QuestionFormat, TestModule } from "@/lib/generated/prisma/enums";

/** An answer option as rendered in the question pane. */
export interface SimulatorOption {
  label: string;
  text: string;
}

/** A question, stripped of anything that would reveal the answer. */
export interface SimulatorQuestion {
  id: string;
  order: number;
  module: TestModule;
  passageText: string | null;
  passageTitle: string | null;
  questionText: string;
  format: QuestionFormat;
  options: SimulatorOption[];
  domain: string | null;
}

/**
 * Normalise the `options` JSON column into `SimulatorOption[]`.
 *
 * The importer writes the canonical `{label, text}[]` shape, but this is
 * defensive: the column is `Json`, so rows could also have been inserted by a
 * migration, a seed script, or by hand. Anything unrecognised yields an empty
 * list rather than throwing, which renders as an unanswerable question instead
 * of a crashed page.
 */
export function parseQuestionOptions(value: unknown): SimulatorOption[] {
  if (!Array.isArray(value)) return [];

  const options: SimulatorOption[] = [];

  value.forEach((item, index) => {
    if (typeof item === "string") {
      options.push({ label: labelFor(index), text: item });
      return;
    }

    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      const text = record.text ?? record.value ?? record.content;
      if (typeof text !== "string") return;

      const label = record.label ?? record.key ?? record.letter;
      options.push({
        label: typeof label === "string" ? label : labelFor(index),
        text,
      });
    }
  });

  return options;
}

const LABELS = ["A", "B", "C", "D", "E", "F"];

function labelFor(index: number): string {
  return LABELS[index] ?? String(index + 1);
}
