/**
 * Direction B · Meridian — the night console.
 *
 * Rules of this direction:
 *   1. Two surfaces only: panel (#11141B) on ground (#0A0C11), separated by a
 *      hairline. No third elevation, no shadow, no blur.
 *   2. The accent is a *spine*, not a fill: a 2px rail marks whatever is
 *      currently live (the running module, the open question, today's task).
 *   3. Figures are set in Space Grotesk at 600–700 with a mono unit beneath.
 *      On dark ground, thin type at small sizes disappears — everything here is
 *      a step heavier than direction A.
 *   4. State colour appears only on state. Nothing decorative is coloured.
 *
 * Same fifteen blocks as direction A, same indices, so the two can be compared
 * block for block.
 */

import {
  ArrowRight,
  Check,
  Flag,
  Pause,
  Play,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SCORE_CEILING,
  SCORE_FLOOR,
  deadlines,
  dictionaryEntry,
  domainScores,
  navigatorStates,
  passage,
  pct,
  roadmap,
  sampleQuestion,
  savedWords,
  sectionScores,
  student,
  testMeta,
  universities,
  usd,
  type QuestionState,
  type Verdict,
} from "@/components/design-system/data";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Local primitives                                                           */
/* -------------------------------------------------------------------------- */

function Panel({
  index,
  title,
  action,
  span,
  live = false,
  children,
  bodyClassName,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
  span: string;
  /** Marks the panel as the live one — draws the accent spine. */
  live?: boolean;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col border bg-[var(--ds-panel)]",
        live
          ? "ds-rail border-[var(--ds-rule-strong)]"
          : "border-[var(--ds-rule)]",
        span,
      )}
      style={{ borderRadius: "var(--ds-r)" }}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[var(--ds-rule)] px-4">
        <div className="flex items-center gap-2.5">
          <span
            className="ds-num px-1.5 py-0.5 text-[10px] tracking-[0.08em] text-[var(--ds-ink-3)]"
            style={{
              fontFamily: "var(--ds-font-mono)",
              backgroundColor: "var(--ds-sunk)",
              borderRadius: "var(--ds-r-sm)",
            }}
          >
            {index}
          </span>
          <span className="text-[12px] font-medium text-[var(--ds-ink-2)]">
            {title}
          </span>
          {live && (
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: "var(--ds-accent)" }}
              aria-label="Live"
            />
          )}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

function Figure({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("ds-num leading-none font-bold tracking-[-0.02em]", className)}
      style={{ fontFamily: "var(--ds-font-display)" }}
    >
      {children}
    </span>
  );
}

function Mono({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  /** Merged after the mono family, so callers can tint a figure. */
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cn("ds-num text-[11px]", className)}
      style={{ fontFamily: "var(--ds-font-mono)", ...style }}
    >
      {children}
    </span>
  );
}

/** Unit label that sits under a figure. The console voice. */
function Unit({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block text-[10px] tracking-[0.12em] text-[var(--ds-ink-3)] uppercase"
      style={{ fontFamily: "var(--ds-font-mono)" }}
    >
      {children}
    </span>
  );
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-[var(--ds-sunk)] text-[var(--ds-ink-2)]",
    accent: "bg-[var(--ds-accent-sunk)] text-[var(--ds-accent)]",
    ok: "bg-[var(--ds-ok-sunk)] text-[var(--ds-ok)]",
    warn: "bg-[var(--ds-warn-sunk)] text-[var(--ds-warn)]",
    bad: "bg-[var(--ds-bad-sunk)] text-[var(--ds-bad)]",
  } as const;

  return (
    <span
      className={cn(
        "ds-num inline-flex h-[22px] items-center px-2 text-[10px] font-medium tracking-[0.06em] uppercase",
        tones[tone],
      )}
      style={{
        borderRadius: "var(--ds-r-sm)",
        fontFamily: "var(--ds-font-mono)",
      }}
    >
      {children}
    </span>
  );
}

function ButtonB({
  variant = "primary",
  children,
  className,
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const variants = {
    primary:
      "bg-[var(--ds-accent)] text-[var(--ds-accent-ink)] font-semibold hover:brightness-110",
    secondary:
      "border border-[var(--ds-rule-strong)] text-[var(--ds-ink)] hover:bg-[var(--ds-sunk)]",
    ghost: "text-[var(--ds-ink-2)] hover:bg-[var(--ds-sunk)] hover:text-[var(--ds-ink)]",
    danger:
      "border border-[var(--ds-bad)] text-[var(--ds-bad)] hover:bg-[var(--ds-bad-sunk)]",
  } as const;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center gap-2 px-3.5 text-[13px] transition-[background-color,filter] [&_svg]:size-3.5",
        variants[variant],
        className,
      )}
      style={{ borderRadius: "var(--ds-r-sm)" }}
    >
      {children}
    </button>
  );
}

const VERDICT_TONE: Record<Verdict, "warn" | "ok" | "accent"> = {
  reach: "warn",
  match: "ok",
  safety: "accent",
};

/* -------------------------------------------------------------------------- */
/* The showcase                                                               */
/* -------------------------------------------------------------------------- */

export function DirectionB() {
  const targetPct =
    ((student.bestScore - SCORE_FLOOR) / (student.targetScore - SCORE_FLOOR)) *
    100;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-2 pb-16">
      <div className="grid grid-cols-12 gap-4">
        {/* 01 · Score summary ------------------------------------------- */}
        <Panel
          index="01"
          title="Score summary"
          span="col-span-12 lg:col-span-5"
          action={<Mono className="text-[var(--ds-ink-3)]">test 4 · 12 aug</Mono>}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <Figure className="text-[58px]">{student.bestScore}</Figure>
              <Unit>best of 4 attempts · {SCORE_CEILING} max</Unit>
            </div>
            <div className="flex flex-col items-end gap-2 pb-1">
              <Chip tone="ok">
                +{student.bestScore - student.previousScore}
              </Chip>
              <Mono className="text-[var(--ds-ink-3)]">
                {student.daysToTest}d to test
              </Mono>
            </div>
          </div>

          <div className="mt-6">
            <div
              className="relative h-2 w-full overflow-hidden bg-[var(--ds-sunk)]"
              style={{ borderRadius: "999px" }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.min(100, targetPct)}%`,
                  backgroundImage: "var(--ds-meter)",
                }}
              />
              {/* Target notch */}
              <span
                className="absolute inset-y-0 w-px bg-[var(--ds-ink)]"
                style={{ left: "100%" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_FLOOR}</Mono>
              <Mono className="text-[var(--ds-ink-2)]">
                {student.targetScore - student.bestScore} points to target{" "}
                {student.targetScore}
              </Mono>
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_CEILING}</Mono>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {sectionScores.map((section) => (
              <div
                key={section.short}
                className="border border-[var(--ds-rule)] bg-[var(--ds-sunk)] p-3"
                style={{ borderRadius: "var(--ds-r-sm)" }}
              >
                <div className="flex items-baseline justify-between">
                  <Figure className="text-[24px]">{section.score}</Figure>
                  <Mono className="text-[var(--ds-ok)]">+{section.delta}</Mono>
                </div>
                <Unit>{section.label}</Unit>
              </div>
            ))}
          </div>
        </Panel>

        {/* 02 · Domain accuracy ----------------------------------------- */}
        <Panel
          index="02"
          title="Accuracy by domain"
          span="col-span-12 sm:col-span-7 lg:col-span-4"
          action={<Mono className="text-[var(--ds-ink-3)]">188q</Mono>}
        >
          <div className="space-y-4">
            {domainScores.map((domain) => {
              const tone =
                domain.accuracy >= 0.75
                  ? "var(--ds-ok)"
                  : domain.accuracy >= 0.6
                    ? "var(--ds-warn)"
                    : "var(--ds-bad)";

              return (
                <div key={domain.domain}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] text-[var(--ds-ink-2)]">
                      {domain.domain}
                    </span>
                    <Mono style={{ color: tone }}>{pct(domain.accuracy)}</Mono>
                  </div>
                  {/* Segmented track: one cell per five questions, so the bar
                      also says how much evidence is behind the number. */}
                  <div className="mt-1.5 flex gap-[3px]">
                    {Array.from({ length: 12 }).map((_, cell) => (
                      <span
                        key={cell}
                        className="h-1.5 flex-1"
                        style={{
                          backgroundColor:
                            cell / 12 < domain.accuracy
                              ? tone
                              : "var(--ds-sunk)",
                          borderRadius: "1px",
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* 03 · Stat column --------------------------------------------- */}
        <Panel
          index="03"
          title="This month"
          span="col-span-12 sm:col-span-5 lg:col-span-3"
          bodyClassName="p-0"
        >
          <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--ds-rule)]">
            {[
              { label: "Accuracy", value: pct(student.accuracy) },
              { label: "Questions", value: String(student.questionsAnswered) },
              { label: "Streak", value: `${student.streakDays}d` },
              { label: "Words", value: String(student.savedWords) },
            ].map((stat) => (
              <div key={stat.label} className="p-4">
                <dd>
                  <Figure className="text-[22px]">{stat.value}</Figure>
                </dd>
                <dt className="mt-1.5">
                  <Unit>{stat.label}</Unit>
                </dt>
              </div>
            ))}
          </dl>
        </Panel>

        {/* 04 · Question card ------------------------------------------- */}
        <Panel
          index="04"
          title="Question"
          live
          span="col-span-12 lg:col-span-7"
          action={
            <Mono className="text-[var(--ds-ink-3)]">
              {sampleQuestion.domain.toLowerCase()} · {sampleQuestion.difficulty.toLowerCase()}
            </Mono>
          }
        >
          <div className="flex items-center gap-3">
            <span
              className="ds-num inline-flex size-7 items-center justify-center bg-[var(--ds-accent)] text-[12px] font-bold text-[var(--ds-accent-ink)]"
              style={{ borderRadius: "var(--ds-r-sm)" }}
            >
              {sampleQuestion.number}
            </span>
            <Mono className="text-[var(--ds-ink-3)]">{sampleQuestion.module}</Mono>
            <ButtonB variant="ghost" className="ml-auto h-8">
              <Flag />
              Mark
            </ButtonB>
          </div>

          <p className="mt-4 text-[15px] leading-[1.5] font-medium">
            {sampleQuestion.stem}
          </p>

          <div className="mt-4 space-y-2">
            {sampleQuestion.options.map((option) => {
              const isSelected = option.label === sampleQuestion.selected;
              const isEliminated = (
                sampleQuestion.eliminated as readonly string[]
              ).includes(option.label);

              return (
                <div
                  key={option.label}
                  className={cn(
                    "flex min-h-12 items-center gap-3 border px-3",
                    isSelected
                      ? "border-[var(--ds-accent)] bg-[var(--ds-accent-sunk)]"
                      : "border-[var(--ds-rule)] bg-[var(--ds-sunk)]",
                    isEliminated && "opacity-45",
                  )}
                  style={{ borderRadius: "var(--ds-r-sm)" }}
                >
                  <span
                    className={cn(
                      "ds-num inline-flex size-7 shrink-0 items-center justify-center text-[12px] font-semibold",
                      isSelected
                        ? "bg-[var(--ds-accent)] text-[var(--ds-accent-ink)]"
                        : "border border-[var(--ds-rule-strong)] text-[var(--ds-ink-2)]",
                    )}
                    style={{ borderRadius: "var(--ds-r-sm)" }}
                  >
                    {isSelected ? <Check className="size-3.5" /> : option.label}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] leading-snug",
                      isEliminated && "line-through",
                    )}
                  >
                    {option.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <KbdGroup>
              <Kbd className="border-[var(--ds-rule-strong)] bg-[var(--ds-sunk)] text-[var(--ds-ink-2)]">
                Z
              </Kbd>
              <span className="text-[11px] text-[var(--ds-ink-3)]">
                undo eliminate
              </span>
            </KbdGroup>
            <div className="flex gap-2">
              <ButtonB variant="secondary">Back</ButtonB>
              <ButtonB variant="primary">
                Next
                <ArrowRight />
              </ButtonB>
            </div>
          </div>
        </Panel>

        {/* 05 · Question navigator -------------------------------------- */}
        <Panel
          index="05"
          title="Navigator"
          span="col-span-12 lg:col-span-5"
          action={
            <Mono className="text-[var(--ds-ink-3)]">
              {testMeta.answered}/{testMeta.questionCount}
            </Mono>
          }
        >
          <div className="grid grid-cols-9 gap-1.5">
            {navigatorStates.map((state: QuestionState, index) => {
              const styles: Record<QuestionState, string> = {
                correct: "bg-[var(--ds-ok-sunk)] text-[var(--ds-ok)]",
                wrong: "bg-[var(--ds-bad-sunk)] text-[var(--ds-bad)]",
                flagged:
                  "bg-[var(--ds-warn-sunk)] text-[var(--ds-warn)] ring-1 ring-[var(--ds-warn)]",
                blank:
                  "bg-[var(--ds-sunk)] text-[var(--ds-ink-3)] ring-1 ring-[var(--ds-rule)]",
              };

              return (
                <span
                  key={index}
                  className={cn(
                    "ds-num flex h-8 items-center justify-center text-[11px] font-medium",
                    styles[state],
                  )}
                  style={{ borderRadius: "var(--ds-r-sm)" }}
                >
                  {index + 1}
                </span>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--ds-rule)] pt-3">
            {[
              { label: "correct", color: "var(--ds-ok)" },
              { label: "incorrect", color: "var(--ds-bad)" },
              { label: "flagged", color: "var(--ds-warn)" },
              { label: "unanswered", color: "var(--ds-ink-3)" },
            ].map((legend) => (
              <span key={legend.label} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: legend.color }}
                />
                <Mono className="text-[10px] text-[var(--ds-ink-2)]">
                  {legend.label}
                </Mono>
              </span>
            ))}
          </div>
        </Panel>

        {/* 06 · Passage -------------------------------------------------- */}
        <Panel
          index="06"
          title="Passage"
          span="col-span-12 lg:col-span-5"
          action={<Chip tone="accent">UZ on</Chip>}
        >
          <p className="text-[15px] leading-[1.75] text-[var(--ds-ink-2)]">
            {passage.before}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-pointer bg-[var(--ds-accent-sunk)] px-1 font-medium text-[var(--ds-accent)] underline decoration-dotted underline-offset-4"
                  style={{ borderRadius: "3px" }}
                >
                  {passage.term}
                </span>
              </TooltipTrigger>
              <TooltipContent className="border border-[var(--ds-rule-strong)] bg-[var(--ds-sunk)] text-[var(--ds-ink)]">
                {dictionaryEntry.translation}
              </TooltipContent>
            </Tooltip>
            {passage.after}
          </p>
          <p className="mt-4 border-t border-[var(--ds-rule)] pt-2.5">
            <Mono className="text-[10px] text-[var(--ds-ink-3)]">
              {passage.source.toLowerCase()}
            </Mono>
          </p>
        </Panel>

        {/* 07 · Dictionary card ------------------------------------------ */}
        <Panel
          index="07"
          title="Dictionary"
          span="col-span-12 sm:col-span-7 lg:col-span-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-[20px] font-bold tracking-tight">
              {dictionaryEntry.word}
            </h4>
            <Mono className="text-[var(--ds-ink-3)]">
              {dictionaryEntry.partOfSpeech}
            </Mono>
          </div>

          <p className="mt-2.5 text-[16px] font-medium text-[var(--ds-accent)]">
            {dictionaryEntry.translation}
          </p>

          <div className="mt-3.5 space-y-2 border-t border-[var(--ds-rule)] pt-3">
            <p className="text-[12px] leading-[1.6] text-[var(--ds-ink-2)]">
              {dictionaryEntry.explanationUz}
            </p>
            <p className="text-[12px] leading-[1.6] text-[var(--ds-ink-3)]">
              {dictionaryEntry.explanation}
            </p>
          </div>

          <p
            className="ds-rail mt-3.5 py-1 pl-3 text-[12px] leading-[1.6] text-[var(--ds-ink-2)] italic"
          >
            {dictionaryEntry.example}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Mono className="text-[10px] text-[var(--ds-ink-3)]">
              seen in 4/10 tests
            </Mono>
            <ButtonB variant="secondary" className="h-8">
              <Plus />
              Save
            </ButtonB>
          </div>
        </Panel>

        {/* 08 · Word bank ------------------------------------------------ */}
        <Panel
          index="08"
          title="Word bank"
          span="col-span-12 sm:col-span-5 lg:col-span-3"
          bodyClassName="p-0"
          action={<Mono className="text-[var(--ds-ink-3)]">128</Mono>}
        >
          <ul className="divide-y divide-[var(--ds-rule)]">
            {savedWords.map((word) => (
              <li
                key={word.word}
                className="group flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{word.word}</p>
                  <p className="truncate text-[12px] text-[var(--ds-ink-3)]">
                    {word.translation}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <Mono className="text-[10px] text-[var(--ds-ink-3)]">
                    ×{word.seen}
                  </Mono>
                  <Trash2 className="size-3.5 text-[var(--ds-ink-3)] opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 09 · Start test ----------------------------------------------- */}
        <Panel
          index="09"
          title="Next action"
          span="col-span-12 sm:col-span-6 lg:col-span-4"
        >
          <div className="flex h-full flex-col justify-between">
            <div>
              <h4 className="text-[20px] leading-tight font-bold tracking-tight">
                Sit practice test 5
              </h4>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--ds-ink-2)]">
                Two modules per section, 2h 14m. Scored the moment you finish.
              </p>
              <div className="mt-3 flex gap-2">
                <Chip tone="neutral">adaptive</Chip>
                <Chip tone="neutral">2h 14m</Chip>
                <Chip tone="neutral">98 questions</Chip>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <ButtonB variant="primary">
                <Play />
                Begin test
              </ButtonB>
              <ButtonB variant="ghost">One module</ButtonB>
            </div>
          </div>
        </Panel>

        {/* 10 · Module timer --------------------------------------------- */}
        <Panel
          index="10"
          title="Module timer"
          live
          span="col-span-12 sm:col-span-6 lg:col-span-3"
        >
          <div className="flex items-baseline justify-between">
            <span
              className="ds-num text-[36px] leading-none"
              style={{ fontFamily: "var(--ds-font-mono)" }}
            >
              {testMeta.minutesLeft}:{testMeta.secondsLeft}
            </span>
            <Chip tone="neutral">mod 2</Chip>
          </div>
          <Unit>remaining of {testMeta.totalMinutes} min</Unit>

          {/* One tick per minute — a console readout, not a bar. */}
          <div className="mt-4 flex gap-[2px]">
            {Array.from({ length: testMeta.totalMinutes }).map((_, minute) => (
              <span
                key={minute}
                className="h-4 flex-1"
                style={{
                  backgroundColor:
                    minute < testMeta.totalMinutes - testMeta.minutesLeft
                      ? "var(--ds-accent)"
                      : "var(--ds-sunk)",
                  borderRadius: "1px",
                }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Mono className="text-[var(--ds-ink-3)]">
              {testMeta.answered}/{testMeta.questionCount} answered
            </Mono>
            <div className="flex gap-1">
              <ButtonB variant="ghost" className="h-7 px-2">
                <Pause />
              </ButtonB>
              <ButtonB variant="ghost" className="h-7 px-2">
                Hide
              </ButtonB>
            </div>
          </div>
        </Panel>

        {/* 11 · University card ------------------------------------------ */}
        <Panel
          index="11"
          title="University"
          span="col-span-12 lg:col-span-5"
          action={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ds-accent)]"
            >
              <Star className="size-3.5 fill-current" />
              Shortlisted
            </button>
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-[18px] leading-tight font-bold tracking-tight">
                {universities[0].name}
              </h4>
              <Mono className="text-[var(--ds-ink-3)]">
                {universities[0].city.toLowerCase()} ·{" "}
                {universities[0].country.toLowerCase()} · rank #
                {universities[0].rank}
              </Mono>
            </div>
            <Chip tone={VERDICT_TONE[universities[0].verdict]}>
              {universities[0].verdict}
            </Chip>
          </div>

          <dl className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: "accept", value: pct(universities[0].acceptance) },
              { label: "sat", value: String(universities[0].sat) },
              { label: "ielts", value: universities[0].ielts.toFixed(1) },
              { label: "tuition", value: usd(universities[0].tuition) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[var(--ds-sunk)] p-2.5"
                style={{ borderRadius: "var(--ds-r-sm)" }}
              >
                <dd>
                  <Figure className="text-[15px]">{stat.value}</Figure>
                </dd>
                <dt className="mt-1">
                  <Unit>{stat.label}</Unit>
                </dt>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--ds-rule)] pt-3">
            <div className="flex items-center gap-2">
              <Chip tone="ok">meets full need</Chip>
              <Mono className="text-[var(--ds-ink-3)]">
                due {universities[0].deadline.toLowerCase()}
              </Mono>
            </div>
            <ButtonB variant="secondary" className="h-8">
              Open
            </ButtonB>
          </div>
        </Panel>

        {/* 12 · Shortlist table ------------------------------------------ */}
        <Panel
          index="12"
          title="Shortlist"
          span="col-span-12 lg:col-span-7"
          bodyClassName="p-0"
          action={<Mono className="text-[var(--ds-ink-3)]">4 saved</Mono>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[var(--ds-sunk)]">
                  {["University", "Verdict", "Accept.", "SAT", "IELTS", "Tuition", "Due"].map(
                    (heading, index) => (
                      <th
                        key={heading}
                        className={cn(
                          "px-3 py-2.5 font-normal",
                          index === 0 || index === 1 ? "text-left" : "text-right",
                        )}
                      >
                        <Mono className="text-[10px] tracking-[0.1em] text-[var(--ds-ink-3)] uppercase">
                          {heading}
                        </Mono>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr key={uni.id} className="border-t border-[var(--ds-rule)]">
                    <td className="px-3 py-3">
                      <span className="font-medium">{uni.name}</span>
                      <span className="ml-2 text-[var(--ds-ink-3)]">
                        {uni.city}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Chip tone={VERDICT_TONE[uni.verdict]}>{uni.verdict}</Chip>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Mono className="text-[12px]">{pct(uni.acceptance)}</Mono>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Mono
                        className="text-[12px]"
                        // Green when the student already clears the bar.
                      >
                        <span
                          style={{
                            color:
                              student.bestScore >= uni.sat
                                ? "var(--ds-ok)"
                                : "var(--ds-ink)",
                          }}
                        >
                          {uni.sat}
                        </span>
                      </Mono>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Mono className="text-[12px]">{uni.ielts.toFixed(1)}</Mono>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Mono className="text-[12px]">{usd(uni.tuition)}</Mono>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Mono className="text-[12px] text-[var(--ds-ink-2)]">
                        {uni.deadline}
                      </Mono>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* 13 · Deadlines ------------------------------------------------ */}
        <Panel
          index="13"
          title="Deadlines"
          span="col-span-12 lg:col-span-5"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-[var(--ds-rule)]">
            {deadlines.map((deadline) => (
              <li key={deadline.id} className="px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {deadline.university}
                    </p>
                    <Mono className="text-[10px] text-[var(--ds-ink-3)]">
                      {deadline.kind.toLowerCase()} · {deadline.date.toLowerCase()}
                    </Mono>
                  </div>
                  <Chip tone={deadline.daysLeft <= 14 ? "warn" : "neutral"}>
                    {deadline.daysLeft}d
                  </Chip>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <Progress
                    value={(deadline.documents.done / deadline.documents.total) * 100}
                    className="h-1 bg-[var(--ds-sunk)] [&_[data-slot=progress-indicator]]:bg-[var(--ds-accent)]"
                  />
                  <Mono className="shrink-0 text-[10px] text-[var(--ds-ink-3)]">
                    {deadline.documents.done}/{deadline.documents.total} docs
                  </Mono>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 14 · Roadmap -------------------------------------------------- */}
        <Panel
          index="14"
          title="Roadmap"
          span="col-span-12 lg:col-span-5"
          bodyClassName="p-0"
          action={<Mono className="text-[var(--ds-ink-3)]">2/5 done</Mono>}
        >
          <ul className="divide-y divide-[var(--ds-rule)]">
            {roadmap.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 px-4 py-3",
                  // The next undone task is the live one.
                  index === 2 && "ds-rail bg-[var(--ds-sunk)]",
                )}
              >
                <Checkbox
                  checked={item.done}
                  aria-label={item.title}
                  className="mt-0.5 border-[var(--ds-rule-strong)] data-checked:border-[var(--ds-accent)] data-checked:bg-[var(--ds-accent)] data-checked:text-[var(--ds-accent-ink)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "text-[13px] font-medium",
                        item.done && "text-[var(--ds-ink-3)] line-through",
                      )}
                    >
                      {item.title}
                    </p>
                    <Mono className="shrink-0 text-[10px] text-[var(--ds-ink-3)]">
                      {item.due.toLowerCase()}
                    </Mono>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-[var(--ds-ink-3)]">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 15 · Controls ------------------------------------------------- */}
        <Panel index="15" title="Controls" span="col-span-12 lg:col-span-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-5">
              <div>
                <Unit>Buttons</Unit>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <ButtonB variant="primary">Begin test</ButtonB>
                  <ButtonB variant="secondary">Review</ButtonB>
                  <ButtonB variant="ghost">Skip</ButtonB>
                  <ButtonB variant="danger">Remove</ButtonB>
                </div>
              </div>

              <div>
                <Unit>Field</Unit>
                <input
                  defaultValue="1450"
                  aria-label="Target score"
                  className="ds-num mt-2.5 h-10 w-full border border-[var(--ds-rule-strong)] bg-[var(--ds-sunk)] px-3 text-[14px] text-[var(--ds-ink)] outline-none focus:border-[var(--ds-accent)]"
                  style={{ borderRadius: "var(--ds-r-sm)" }}
                />
                <p className="mt-1.5 text-[11px] text-[var(--ds-ink-3)]">
                  Between 400 and 1600, in steps of 10.
                </p>
              </div>

              <div>
                <Unit>Segmented</Unit>
                <Tabs defaultValue="rw" className="mt-2.5">
                  <TabsList
                    className="h-9 bg-[var(--ds-sunk)] p-1"
                    style={{ borderRadius: "var(--ds-r-sm)" }}
                  >
                    {[
                      { value: "rw", label: "Reading" },
                      { value: "math", label: "Math" },
                      { value: "all", label: "Both" },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="h-7 px-3 text-[12px] text-[var(--ds-ink-3)] data-[state=active]:bg-[var(--ds-panel)] data-[state=active]:text-[var(--ds-ink)]"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Unit>Toggles</Unit>
                <div className="mt-2.5 space-y-3">
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-[13px]">Uzbek dictionary</span>
                    <Switch
                      defaultChecked
                      className="data-checked:bg-[var(--ds-accent)] data-unchecked:bg-[var(--ds-rule-strong)]"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-[13px]">Timer visible</span>
                    <Switch className="data-checked:bg-[var(--ds-accent)] data-unchecked:bg-[var(--ds-rule-strong)]" />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <Unit>Target score</Unit>
                  <Mono className="text-[var(--ds-ink-2)]">1450</Mono>
                </div>
                <Slider
                  defaultValue={[1450]}
                  min={400}
                  max={1600}
                  step={10}
                  className="mt-3.5 [&_[data-slot=slider-range]]:bg-[var(--ds-accent)] [&_[data-slot=slider-thumb]]:border-[var(--ds-accent)] [&_[data-slot=slider-thumb]]:bg-[var(--ds-panel)] [&_[data-slot=slider-track]]:bg-[var(--ds-sunk)]"
                />
              </div>

              <div>
                <Unit>Status chips</Unit>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Chip tone="ok">correct</Chip>
                  <Chip tone="warn">flagged</Chip>
                  <Chip tone="bad">incorrect</Chip>
                  <Chip tone="accent">saved</Chip>
                  <Chip tone="neutral">blank</Chip>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
