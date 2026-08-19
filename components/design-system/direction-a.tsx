/**
 * Direction A · Bluebook — the precision instrument.
 *
 * Rules of this direction, applied without exception below:
 *   1. No shadows. Every division is a 1px rule or a fill change.
 *   2. One accent (#1B3BD8). Colour otherwise means state, never emphasis.
 *   3. Numbers are mono and right-aligned, so columns of figures line up the
 *      way they do on a score report.
 *   4. Labels are mono, 10px, uppercase — the instrument-panel voice.
 *
 * Fifteen blocks, numbered so they can be referenced in review ("block 06").
 * All of them are static compositions: this page is for judging the look, so
 * nothing here owns state.
 */

import {
  ArrowRight,
  Check,
  Flag,
  Minus,
  Pause,
  Play,
  Plus,
  Star,
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
  children,
  bodyClassName,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
  span: string;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col border border-[var(--ds-rule)] bg-[var(--ds-panel)]",
        span,
      )}
      style={{ borderRadius: "var(--ds-r)" }}
    >
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-[var(--ds-rule)] px-4">
        <div className="flex items-baseline gap-2">
          <span className="ds-eyebrow">{index}</span>
          <span className="ds-eyebrow" style={{ color: "var(--ds-ink-2)" }}>
            {title}
          </span>
        </div>
        {action}
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Display-face figure. Used for anything a student would read as a score. */
function Figure({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("ds-num leading-none font-semibold tracking-[-0.02em]", className)}
      style={{ fontFamily: "var(--ds-font-display)" }}
    >
      {children}
    </span>
  );
}

function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("ds-num text-[11px]", className)}
      style={{ fontFamily: "var(--ds-font-mono)" }}
    >
      {children}
    </span>
  );
}

/** Small state chip. `tone` is a role, never a colour name. */
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
        "ds-num inline-flex h-5 items-center px-1.5 text-[10px] font-medium tracking-[0.04em] uppercase",
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

function ButtonA({
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
      "bg-[var(--ds-accent)] text-[var(--ds-accent-ink)] hover:brightness-110",
    secondary:
      "border border-[var(--ds-rule-strong)] text-[var(--ds-ink)] hover:bg-[var(--ds-sunk)]",
    ghost: "text-[var(--ds-ink-2)] hover:bg-[var(--ds-sunk)]",
    danger:
      "border border-[var(--ds-bad)] text-[var(--ds-bad)] hover:bg-[var(--ds-bad-sunk)]",
  } as const;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors [&_svg]:size-3.5",
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

export function DirectionA() {
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
          action={<Mono className="text-[var(--ds-ink-3)]">TEST 4 · 12 AUG</Mono>}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <Figure className="text-[56px]">{student.bestScore}</Figure>
              <Mono className="ml-1 text-[var(--ds-ink-3)]">
                /{SCORE_CEILING}
              </Mono>
            </div>
            <div className="flex flex-col items-end gap-1.5 pb-1">
              <Chip tone="ok">
                +{student.bestScore - student.previousScore} vs last
              </Chip>
              <Mono className="text-[var(--ds-ink-3)]">
                {student.daysToTest} days to test day
              </Mono>
            </div>
          </div>

          {/* Meter — the one gradient in the system */}
          <div className="mt-5">
            <div
              className="relative h-1.5 w-full overflow-hidden bg-[var(--ds-sunk)]"
              style={{ borderRadius: "999px" }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.min(100, targetPct)}%`,
                  backgroundImage: "var(--ds-meter)",
                }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_FLOOR}</Mono>
              <Mono className="text-[var(--ds-ink-2)]">
                TARGET {student.targetScore} · {student.targetScore - student.bestScore} TO GO
              </Mono>
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_CEILING}</Mono>
            </div>
          </div>

          {/* Section split */}
          <div className="mt-5 divide-y divide-[var(--ds-rule)] border-t border-[var(--ds-rule)]">
            {sectionScores.map((section) => (
              <div
                key={section.short}
                className="flex items-center gap-4 py-2.5"
              >
                <span className="w-40 text-[13px] text-[var(--ds-ink-2)]">
                  {section.label}
                </span>
                <div
                  className="h-1 flex-1 overflow-hidden bg-[var(--ds-sunk)]"
                  style={{ borderRadius: "999px" }}
                >
                  <div
                    className="h-full bg-[var(--ds-accent)]"
                    style={{ width: `${(section.score / section.max) * 100}%` }}
                  />
                </div>
                <Mono className="w-14 text-right text-[13px] text-[var(--ds-ink)]">
                  {section.score}
                </Mono>
                <Mono className="w-10 text-right text-[var(--ds-ok)]">
                  +{section.delta}
                </Mono>
              </div>
            ))}
          </div>
        </Panel>

        {/* 02 · Domain accuracy ----------------------------------------- */}
        <Panel
          index="02"
          title="Accuracy by domain"
          span="col-span-12 sm:col-span-7 lg:col-span-4"
          action={<Mono className="text-[var(--ds-ink-3)]">188 QUESTIONS</Mono>}
        >
          <div className="space-y-3.5">
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
                    <span className="truncate text-[13px]">{domain.domain}</span>
                    <div className="flex shrink-0 items-baseline gap-2">
                      <Mono className="text-[var(--ds-ink-3)]">
                        {domain.count}q
                      </Mono>
                      <Mono
                        className="w-9 text-right text-[12px]"
                        // The percentage takes the tone; the bar repeats it.
                        // Two channels for one fact is deliberate here: this is
                        // the block a student scans fastest.
                      >
                        <span style={{ color: tone }}>
                          {pct(domain.accuracy)}
                        </span>
                      </Mono>
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 w-full bg-[var(--ds-sunk)]">
                    <div
                      className="h-full"
                      style={{
                        width: `${domain.accuracy * 100}%`,
                        backgroundColor: tone,
                      }}
                    />
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
          <dl className="divide-y divide-[var(--ds-rule)]">
            {[
              { label: "Accuracy", value: pct(student.accuracy), sub: "all tests" },
              { label: "Questions", value: String(student.questionsAnswered), sub: "answered" },
              { label: "Streak", value: `${student.streakDays}d`, sub: "consecutive" },
              { label: "Words saved", value: String(student.savedWords), sub: "in bank" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline justify-between gap-3 px-4 py-3"
              >
                <dt className="text-[13px] text-[var(--ds-ink-2)]">
                  {stat.label}
                </dt>
                <dd className="flex items-baseline gap-2">
                  <Figure className="text-[20px]">{stat.value}</Figure>
                  <Mono className="text-[10px] text-[var(--ds-ink-3)]">
                    {stat.sub}
                  </Mono>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* 04 · Question card ------------------------------------------- */}
        <Panel
          index="04"
          title="Question"
          span="col-span-12 lg:col-span-7"
          action={
            <Mono className="text-[var(--ds-ink-3)]">
              {sampleQuestion.domain.toUpperCase()} · {sampleQuestion.difficulty.toUpperCase()}
            </Mono>
          }
        >
          <div className="flex items-center gap-2.5">
            <span
              className="ds-num inline-flex size-6 items-center justify-center bg-[var(--ds-ink)] text-[11px] font-semibold text-white"
              style={{ borderRadius: "var(--ds-r-sm)" }}
            >
              {sampleQuestion.number}
            </span>
            <Mono className="text-[var(--ds-ink-3)]">{sampleQuestion.module}</Mono>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--ds-ink-2)] hover:text-[var(--ds-ink)]"
            >
              <Flag className="size-3.5" />
              Mark for review
            </button>
          </div>

          <p className="mt-3.5 text-[15px] leading-[1.5] font-medium">
            {sampleQuestion.stem}
          </p>

          <div className="ds-answer-sheet mt-3">
            {sampleQuestion.options.map((option) => {
              const isSelected = option.label === sampleQuestion.selected;
              const isEliminated = (
                sampleQuestion.eliminated as readonly string[]
              ).includes(option.label);

              return (
                <div
                  key={option.label}
                  className={cn(
                    "flex min-h-11 items-center gap-3 px-3",
                    isSelected &&
                      "border border-[var(--ds-accent)] bg-[var(--ds-accent-sunk)]",
                  )}
                  style={{ borderRadius: isSelected ? "var(--ds-r-sm)" : undefined }}
                >
                  <span
                    className={cn(
                      "ds-num inline-flex size-6 shrink-0 items-center justify-center border text-[11px] font-semibold",
                      isSelected
                        ? "border-[var(--ds-accent)] bg-[var(--ds-accent)] text-white"
                        : isEliminated
                          ? "border-[var(--ds-rule)] text-[var(--ds-ink-3)] line-through"
                          : "border-[var(--ds-rule-strong)] text-[var(--ds-ink-2)]",
                    )}
                    style={{ borderRadius: "var(--ds-r-sm)" }}
                  >
                    {isSelected ? <Check className="size-3.5" /> : option.label}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] leading-snug",
                      isEliminated &&
                        "text-[var(--ds-ink-3)] line-through decoration-[var(--ds-ink-3)]",
                    )}
                  >
                    {option.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--ds-rule)] pt-3">
            <Mono className="text-[var(--ds-ink-3)]">
              D ELIMINATED · PRESS <span className="text-[var(--ds-ink-2)]">Z</span> TO UNDO
            </Mono>
            <div className="flex gap-2">
              <ButtonA variant="secondary">Back</ButtonA>
              <ButtonA variant="primary">
                Next
                <ArrowRight />
              </ButtonA>
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
              {testMeta.answered}/{testMeta.questionCount} ANSWERED
            </Mono>
          }
        >
          <div className="grid grid-cols-9 gap-1.5">
            {navigatorStates.map((state: QuestionState, index) => {
              const styles: Record<QuestionState, string> = {
                correct:
                  "bg-[var(--ds-ok-sunk)] text-[var(--ds-ok)] border-[var(--ds-ok-sunk)]",
                wrong:
                  "bg-[var(--ds-bad-sunk)] text-[var(--ds-bad)] border-[var(--ds-bad-sunk)]",
                flagged:
                  "bg-[var(--ds-warn-sunk)] text-[var(--ds-warn)] border-[var(--ds-warn)]",
                blank:
                  "bg-[var(--ds-sunk)] text-[var(--ds-ink-3)] border-[var(--ds-rule)]",
              };

              return (
                <span
                  key={index}
                  className={cn(
                    "ds-num flex h-7 items-center justify-center border text-[11px] font-medium",
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
              { label: "Correct", color: "var(--ds-ok)" },
              { label: "Incorrect", color: "var(--ds-bad)" },
              { label: "Flagged", color: "var(--ds-warn)" },
              { label: "Unanswered", color: "var(--ds-ink-3)" },
            ].map((legend) => (
              <span key={legend.label} className="flex items-center gap-1.5">
                <span
                  className="size-2"
                  style={{
                    backgroundColor: legend.color,
                    borderRadius: "1px",
                  }}
                />
                <Mono className="text-[10px] text-[var(--ds-ink-2)]">
                  {legend.label.toUpperCase()}
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
          action={<Mono className="text-[var(--ds-ink-3)]">UZ DICTIONARY ON</Mono>}
        >
          <p className="text-[15px] leading-[1.7] text-[var(--ds-ink)]">
            {passage.before}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-pointer bg-[var(--ds-accent-sunk)] px-0.5 font-medium text-[var(--ds-accent)] underline decoration-dotted underline-offset-4"
                  style={{ borderRadius: "2px" }}
                >
                  {passage.term}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-[var(--ds-ink)] text-white">
                {dictionaryEntry.translation}
              </TooltipContent>
            </Tooltip>
            {passage.after}
          </p>
          <p className="mt-3 border-t border-[var(--ds-rule)] pt-2">
            <Mono className="text-[10px] text-[var(--ds-ink-3)]">
              {passage.source.toUpperCase()}
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
            <h4 className="text-[19px] font-semibold tracking-tight">
              {dictionaryEntry.word}
            </h4>
            <Mono className="text-[var(--ds-ink-3)]">
              {dictionaryEntry.partOfSpeech}
            </Mono>
          </div>

          <p className="mt-2 text-[15px] font-medium text-[var(--ds-accent)]">
            {dictionaryEntry.translation}
          </p>

          <div className="mt-3 space-y-1.5 border-t border-[var(--ds-rule)] pt-2.5">
            <p className="text-[12px] leading-[1.55] text-[var(--ds-ink-2)]">
              {dictionaryEntry.explanationUz}
            </p>
            <p className="text-[12px] leading-[1.55] text-[var(--ds-ink-3)]">
              {dictionaryEntry.explanation}
            </p>
          </div>

          <p className="mt-3 border-l-2 border-[var(--ds-rule-strong)] pl-2.5 text-[12px] leading-[1.55] text-[var(--ds-ink-2)] italic">
            {dictionaryEntry.example}
          </p>

          <div className="mt-3.5 flex items-center justify-between gap-3">
            <Mono className="text-[10px] text-[var(--ds-ink-3)]">
              4 OF 10 PRACTICE TESTS
            </Mono>
            <ButtonA variant="secondary">
              <Plus />
              Save word
            </ButtonA>
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
                className="flex items-baseline justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{word.word}</p>
                  <p className="truncate text-[12px] text-[var(--ds-ink-2)]">
                    {word.translation}
                  </p>
                </div>
                <Mono className="shrink-0 text-[10px] text-[var(--ds-ink-3)]">
                  ×{word.seen}
                </Mono>
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
              <h4 className="text-[19px] leading-tight font-semibold tracking-tight">
                Sit practice test 5
              </h4>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-[var(--ds-ink-2)]">
                Two modules per section, 2h 14m total. Scored the moment you
                finish.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <ButtonA variant="primary">
                <Play />
                Begin test
              </ButtonA>
              <ButtonA variant="ghost">Single module instead</ButtonA>
            </div>
          </div>
        </Panel>

        {/* 10 · Module timer --------------------------------------------- */}
        <Panel
          index="10"
          title="Module timer"
          span="col-span-12 sm:col-span-6 lg:col-span-3"
        >
          <div className="flex items-baseline justify-between">
            <span
              className="ds-num text-[34px] leading-none font-medium"
              style={{ fontFamily: "var(--ds-font-mono)" }}
            >
              {testMeta.minutesLeft}:{testMeta.secondsLeft}
            </span>
            <Chip tone="neutral">Module 2</Chip>
          </div>

          <div className="mt-4 h-1 w-full bg-[var(--ds-sunk)]">
            <div
              className="h-full bg-[var(--ds-ink)]"
              style={{
                width: `${((testMeta.totalMinutes - testMeta.minutesLeft) / testMeta.totalMinutes) * 100}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <Mono className="text-[var(--ds-ink-3)]">
              {testMeta.answered}/{testMeta.questionCount} ANSWERED
            </Mono>
            <div className="flex gap-1.5">
              <ButtonA variant="ghost" className="h-7 px-2">
                <Pause />
              </ButtonA>
              <ButtonA variant="ghost" className="h-7 px-2">
                Hide
              </ButtonA>
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
              <h4 className="text-[17px] leading-tight font-semibold tracking-tight">
                {universities[0].name}
              </h4>
              <Mono className="text-[var(--ds-ink-3)]">
                {universities[0].city.toUpperCase()} ·{" "}
                {universities[0].country.toUpperCase()} · #{universities[0].rank}
              </Mono>
            </div>
            <Chip tone={VERDICT_TONE[universities[0].verdict]}>
              {universities[0].verdict}
            </Chip>
          </div>

          <dl className="mt-4 grid grid-cols-4 divide-x divide-[var(--ds-rule)] border-y border-[var(--ds-rule)]">
            {[
              { label: "Acceptance", value: pct(universities[0].acceptance) },
              { label: "SAT", value: String(universities[0].sat) },
              { label: "IELTS", value: universities[0].ielts.toFixed(1) },
              { label: "Tuition", value: usd(universities[0].tuition) },
            ].map((stat, index) => (
              <div key={stat.label} className={cn("py-2.5", index === 0 ? "pr-3" : "px-3")}>
                <dt className="ds-eyebrow">{stat.label}</dt>
                <dd className="mt-1">
                  <Figure className="text-[15px]">{stat.value}</Figure>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip tone="ok">Meets full need</Chip>
              <Mono className="text-[var(--ds-ink-3)]">
                DEADLINE {universities[0].deadline.toUpperCase()}
              </Mono>
            </div>
            <ButtonA variant="secondary">Open profile</ButtonA>
          </div>
        </Panel>

        {/* 12 · Shortlist table ------------------------------------------ */}
        <Panel
          index="12"
          title="Shortlist"
          span="col-span-12 lg:col-span-7"
          bodyClassName="p-0"
          action={<Mono className="text-[var(--ds-ink-3)]">4 UNIVERSITIES</Mono>}
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
                          "px-3 py-2 font-normal",
                          index === 0 ? "text-left" : "text-right",
                          index === 1 && "text-left",
                        )}
                      >
                        <span className="ds-eyebrow">{heading}</span>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr
                    key={uni.id}
                    className="border-t border-[var(--ds-rule)]"
                  >
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{uni.name}</span>
                      <span className="ml-2 text-[var(--ds-ink-3)]">
                        {uni.city}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Chip tone={VERDICT_TONE[uni.verdict]}>{uni.verdict}</Chip>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Mono className="text-[12px]">{pct(uni.acceptance)}</Mono>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Mono
                        className="text-[12px]"
                        // The one number the student compares against their own.
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
                    <td className="px-3 py-2.5 text-right">
                      <Mono className="text-[12px]">{uni.ielts.toFixed(1)}</Mono>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Mono className="text-[12px]">{usd(uni.tuition)}</Mono>
                    </td>
                    <td className="px-3 py-2.5 text-right">
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
              <li key={deadline.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {deadline.university}
                    </p>
                    <Mono className="text-[10px] text-[var(--ds-ink-3)]">
                      {deadline.kind.toUpperCase()} · {deadline.date.toUpperCase()}
                    </Mono>
                  </div>
                  <Chip tone={deadline.daysLeft <= 14 ? "warn" : "neutral"}>
                    {deadline.daysLeft}d left
                  </Chip>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <Progress
                    value={(deadline.documents.done / deadline.documents.total) * 100}
                    className="h-1 bg-[var(--ds-sunk)] [&_[data-slot=progress-indicator]]:bg-[var(--ds-accent)]"
                  />
                  <Mono className="shrink-0 text-[10px] text-[var(--ds-ink-3)]">
                    {deadline.documents.done}/{deadline.documents.total} DOCS
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
          action={<Mono className="text-[var(--ds-ink-3)]">2/5 DONE</Mono>}
        >
          <ul className="divide-y divide-[var(--ds-rule)]">
            {roadmap.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-2.5">
                <Checkbox
                  checked={item.done}
                  aria-label={item.title}
                  className="mt-0.5 border-[var(--ds-rule-strong)] data-checked:border-[var(--ds-accent)] data-checked:bg-[var(--ds-accent)]"
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
                      {item.due.toUpperCase()}
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
        <Panel
          index="15"
          title="Controls"
          span="col-span-12 lg:col-span-7"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="ds-eyebrow">Buttons</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ButtonA variant="primary">Begin test</ButtonA>
                  <ButtonA variant="secondary">Review</ButtonA>
                  <ButtonA variant="ghost">Skip</ButtonA>
                  <ButtonA variant="danger">
                    <Minus />
                    Remove
                  </ButtonA>
                </div>
              </div>

              <div>
                <p className="ds-eyebrow">Field</p>
                <input
                  defaultValue="1450"
                  aria-label="Target score"
                  className="ds-num mt-2 h-9 w-full border border-[var(--ds-rule-strong)] bg-[var(--ds-panel)] px-3 text-[14px] outline-none focus:border-[var(--ds-accent)]"
                  style={{ borderRadius: "var(--ds-r-sm)" }}
                />
                <p className="mt-1 text-[11px] text-[var(--ds-ink-3)]">
                  Between 400 and 1600, in steps of 10.
                </p>
              </div>

              <div>
                <p className="ds-eyebrow">Segmented</p>
                <Tabs defaultValue="rw" className="mt-2">
                  <TabsList
                    className="h-8 bg-[var(--ds-sunk)] p-0.5"
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
                        className="h-7 px-3 text-[12px] data-[state=active]:bg-[var(--ds-panel)] data-[state=active]:text-[var(--ds-ink)]"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="ds-eyebrow">Toggles</p>
                <div className="mt-2 space-y-2.5">
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
                  <p className="ds-eyebrow">Target score</p>
                  <Mono className="text-[var(--ds-ink-2)]">1450</Mono>
                </div>
                <Slider
                  defaultValue={[1450]}
                  min={400}
                  max={1600}
                  step={10}
                  className="mt-3 [&_[data-slot=slider-range]]:bg-[var(--ds-accent)] [&_[data-slot=slider-thumb]]:border-[var(--ds-accent)] [&_[data-slot=slider-track]]:bg-[var(--ds-sunk)]"
                />
              </div>

              <div>
                <p className="ds-eyebrow">Status chips</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip tone="ok">Correct</Chip>
                  <Chip tone="warn">Flagged</Chip>
                  <Chip tone="bad">Incorrect</Chip>
                  <Chip tone="accent">Saved</Chip>
                  <Chip tone="neutral">Blank</Chip>
                </div>
              </div>

              <div>
                <p className="ds-eyebrow">Shortcuts</p>
                <KbdGroup className="mt-2">
                  <Kbd className="bg-[var(--ds-sunk)] text-[var(--ds-ink-2)]">Z</Kbd>
                  <span className="text-[11px] text-[var(--ds-ink-3)]">
                    undo eliminate
                  </span>
                  <Kbd className="ml-3 bg-[var(--ds-sunk)] text-[var(--ds-ink-2)]">
                    ⌘K
                  </Kbd>
                  <span className="text-[11px] text-[var(--ds-ink-3)]">
                    jump to question
                  </span>
                </KbdGroup>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
