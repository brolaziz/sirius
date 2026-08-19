/**
 * Direction C · Registan — tilework.
 *
 * Rules of this direction:
 *   1. Panels are tiles: 3px corners, flat plaster fills, hairline joints. No
 *      shadow, because a tile does not float.
 *   2. Cobalt leads, turquoise supports, saffron warns, clay corrects. The
 *      palette is lifted from Samarkand tile, not from a UI kit.
 *   3. Importance is marked by a girih key-line — a 2px bracket turning two
 *      opposite corners — never by a fill or a badge.
 *   4. The eight-point star (two crossed squares) is the only glyph invented
 *      for this system. It marks a flag and a shortlist, nothing else.
 *
 * Same fifteen blocks and indices as directions A and B.
 */

import { ArrowRight, Check, Pause, Play, Plus } from "lucide-react";

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

/**
 * The eight-point star — two squares crossed at 45°, the founding figure of
 * girih tiling. Drawn rather than imported so it inherits `currentColor`.
 */
function StarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="4" y="4" width="16" height="16" fill="currentColor" />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        fill="currentColor"
        transform="rotate(45 12 12)"
      />
    </svg>
  );
}

function Panel({
  index,
  title,
  action,
  span,
  primary = false,
  children,
  bodyClassName,
}: {
  index: string;
  title: string;
  action?: React.ReactNode;
  span: string;
  /** Draws the girih key-line. One per screen, at most. */
  primary?: boolean;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col border border-[var(--ds-rule)] bg-[var(--ds-panel)]",
        primary && "ds-girih",
        span,
      )}
      style={{ borderRadius: "var(--ds-r)" }}
    >
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[var(--ds-rule)] px-4">
        <h3
          className="text-[13px] font-bold tracking-tight"
          style={{ fontFamily: "var(--ds-font-display)" }}
        >
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {action}
          <span className="ds-eyebrow">{index}</span>
        </div>
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
      className={cn("ds-num leading-none font-extrabold tracking-[-0.03em]", className)}
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

/** Label with the 2px cobalt underline — this direction's section marker. */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block border-b-2 border-[var(--ds-accent)] pb-1 text-[11px] font-semibold tracking-[0.08em] text-[var(--ds-ink-2)] uppercase">
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
        "ds-num inline-flex h-[21px] items-center px-2 text-[10px] font-semibold tracking-[0.08em] uppercase",
        tones[tone],
      )}
      style={{ borderRadius: "var(--ds-r-sm)" }}
    >
      {children}
    </span>
  );
}

function ButtonC({
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
      "bg-[var(--ds-accent)] text-[var(--ds-accent-ink)] font-semibold hover:brightness-115",
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
        "inline-flex h-9 items-center gap-2 px-4 text-[13px] transition-colors [&_svg]:size-3.5",
        variants[variant],
        className,
      )}
      style={{ borderRadius: "var(--ds-r-sm)" }}
    >
      {children}
    </button>
  );
}

/** The tile meter: progress as a run of square tiles, not a smooth bar. */
function TileMeter({
  value,
  tiles = 24,
  className,
}: {
  /** 0–100. */
  value: number;
  tiles?: number;
  className?: string;
}) {
  const filled = Math.round((value / 100) * tiles);

  return (
    <div className={cn("flex gap-[3px]", className)}>
      {Array.from({ length: tiles }).map((_, index) => (
        <span
          key={index}
          className="h-3 flex-1"
          style={{
            // Each tile takes its colour from its own position along the run,
            // so the cobalt→turquoise shift happens tile by tile.
            backgroundColor:
              index < filled
                ? `color-mix(in oklab, var(--ds-accent) ${100 - (index / tiles) * 100}%, var(--ds-ok))`
                : "var(--ds-sunk)",
          }}
        />
      ))}
    </div>
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

export function DirectionC() {
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
          primary
          span="col-span-12 lg:col-span-5"
          action={<Mono className="text-[var(--ds-ink-3)]">TEST 4</Mono>}
          bodyClassName="relative overflow-hidden"
        >
          {/* The tiled dado, at the threshold of visibility. */}
          <span
            aria-hidden="true"
            className="ds-tile-field pointer-events-none absolute inset-0 opacity-40"
          />

          <div className="relative">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Figure className="text-[58px]">{student.bestScore}</Figure>
                <p className="mt-1.5">
                  <Mono className="text-[var(--ds-ink-3)]">
                    BEST OF 4 · MAX {SCORE_CEILING}
                  </Mono>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 pb-1">
                <Chip tone="ok">
                  +{student.bestScore - student.previousScore}
                </Chip>
                <Mono className="text-[var(--ds-ink-3)]">
                  {student.daysToTest} DAYS LEFT
                </Mono>
              </div>
            </div>

            <TileMeter value={Math.min(100, targetPct)} className="mt-6" />
            <div className="mt-2 flex items-center justify-between">
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_FLOOR}</Mono>
              <Mono className="text-[var(--ds-ink-2)]">
                {student.targetScore - student.bestScore} TO TARGET{" "}
                {student.targetScore}
              </Mono>
              <Mono className="text-[var(--ds-ink-3)]">{SCORE_CEILING}</Mono>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
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
                  <p className="mt-1.5 text-[11px] text-[var(--ds-ink-2)]">
                    {section.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* 02 · Domain accuracy ----------------------------------------- */}
        <Panel
          index="02"
          title="Accuracy by domain"
          span="col-span-12 sm:col-span-7 lg:col-span-4"
          action={<Mono className="text-[var(--ds-ink-3)]">188Q</Mono>}
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
                    <span className="truncate text-[13px]">{domain.domain}</span>
                    <Mono style={{ color: tone }}>{pct(domain.accuracy)}</Mono>
                  </div>
                  {/* Tile run, one tile per two questions of evidence. */}
                  <div className="mt-1.5 flex gap-[3px]">
                    {Array.from({ length: 10 }).map((_, cell) => (
                      <span
                        key={cell}
                        className="h-2 flex-1"
                        style={{
                          backgroundColor:
                            cell / 10 < domain.accuracy ? tone : "var(--ds-sunk)",
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
          <dl className="divide-y divide-[var(--ds-rule)]">
            {[
              { label: "Accuracy", value: pct(student.accuracy) },
              { label: "Questions", value: String(student.questionsAnswered) },
              { label: "Streak", value: `${student.streakDays} days` },
              { label: "Words saved", value: String(student.savedWords) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-baseline justify-between gap-3 px-4 py-3.5"
              >
                <dt className="text-[13px] text-[var(--ds-ink-2)]">
                  {stat.label}
                </dt>
                <dd>
                  <Figure className="text-[19px]">{stat.value}</Figure>
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
              {sampleQuestion.difficulty.toUpperCase()}
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
            <Mono className="text-[var(--ds-ink-3)]">
              {sampleQuestion.module.toUpperCase()} ·{" "}
              {sampleQuestion.domain.toUpperCase()}
            </Mono>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--ds-ink-2)] hover:text-[var(--ds-accent)]"
            >
              <StarGlyph className="size-3.5" />
              Mark for review
            </button>
          </div>

          <p className="mt-4 text-[15px] leading-[1.5] font-medium">
            {sampleQuestion.stem}
          </p>

          <div className="mt-4 divide-y divide-[var(--ds-rule)] border-y border-[var(--ds-rule)]">
            {sampleQuestion.options.map((option) => {
              const isSelected = option.label === sampleQuestion.selected;
              const isEliminated = (
                sampleQuestion.eliminated as readonly string[]
              ).includes(option.label);

              return (
                <div
                  key={option.label}
                  className={cn(
                    "flex min-h-11 items-center gap-3 px-2",
                    isSelected && "bg-[var(--ds-accent-sunk)]",
                  )}
                >
                  {/* The selected option is marked with a cobalt spine, the
                      same key-line vocabulary as the panel bracket. */}
                  <span
                    className="h-6 w-[2px] shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--ds-accent)"
                        : "transparent",
                    }}
                  />
                  <span
                    className={cn(
                      "ds-num inline-flex size-6 shrink-0 items-center justify-center text-[11px] font-bold",
                      isSelected
                        ? "bg-[var(--ds-accent)] text-[var(--ds-accent-ink)]"
                        : isEliminated
                          ? "border border-[var(--ds-rule)] text-[var(--ds-ink-3)]"
                          : "border border-[var(--ds-rule-strong)] text-[var(--ds-ink-2)]",
                    )}
                    style={{ borderRadius: "var(--ds-r-sm)" }}
                  >
                    {isSelected ? <Check className="size-3.5" /> : option.label}
                  </span>
                  <span
                    className={cn(
                      "py-2 text-[13px] leading-snug",
                      isEliminated && "text-[var(--ds-ink-3)] line-through",
                    )}
                  >
                    {option.text}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Mono className="text-[var(--ds-ink-3)]">D ELIMINATED</Mono>
            <div className="flex gap-2">
              <ButtonC variant="secondary">Back</ButtonC>
              <ButtonC variant="primary">
                Next
                <ArrowRight />
              </ButtonC>
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
          {/* Squares butted together with a 2px joint, like a tile course. */}
          <div className="grid grid-cols-9 gap-[3px]">
            {navigatorStates.map((state: QuestionState, index) => {
              const styles: Record<QuestionState, string> = {
                correct: "bg-[var(--ds-ok-sunk)] text-[var(--ds-ok)]",
                wrong: "bg-[var(--ds-bad-sunk)] text-[var(--ds-bad)]",
                flagged:
                  "bg-[var(--ds-warn-sunk)] text-[var(--ds-warn)] outline-1 -outline-offset-1 outline-[var(--ds-warn)]",
                blank: "bg-[var(--ds-sunk)] text-[var(--ds-ink-3)]",
              };

              return (
                <span
                  key={index}
                  className={cn(
                    "ds-num flex h-8 items-center justify-center text-[11px] font-semibold",
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
                  style={{ backgroundColor: legend.color }}
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
          action={<Chip tone="accent">UZ on</Chip>}
        >
          <p className="text-[15px] leading-[1.75]">
            {passage.before}
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-pointer bg-[var(--ds-accent-sunk)] px-1 font-semibold text-[var(--ds-accent)] underline decoration-dotted underline-offset-4"
                  style={{ borderRadius: "2px" }}
                >
                  {passage.term}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-[var(--ds-accent)] text-[var(--ds-accent-ink)]">
                {dictionaryEntry.translation}
              </TooltipContent>
            </Tooltip>
            {passage.after}
          </p>
          <p className="mt-4 border-t border-[var(--ds-rule)] pt-2.5">
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
            <h4 className="text-[21px] font-extrabold tracking-tight">
              {dictionaryEntry.word}
            </h4>
            <Mono className="text-[var(--ds-ink-3)]">
              {dictionaryEntry.partOfSpeech}
            </Mono>
          </div>

          {/* The translation is the reason the word was tapped: it gets the
              cobalt and the key-line. */}
          <p className="mt-3 border-l-2 border-[var(--ds-accent)] pl-3 text-[16px] font-semibold text-[var(--ds-accent)]">
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

          <p className="mt-3 bg-[var(--ds-sunk)] p-2.5 text-[12px] leading-[1.6] text-[var(--ds-ink-2)] italic">
            {dictionaryEntry.example}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Mono className="text-[10px] text-[var(--ds-ink-3)]">
              IN 4 OF 10 TESTS
            </Mono>
            <ButtonC variant="secondary" className="h-8">
              <Plus />
              Save
            </ButtonC>
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
                className="flex items-baseline justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{word.word}</p>
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
              <Label>Recommended</Label>
              <h4 className="mt-3 text-[21px] leading-tight font-extrabold tracking-tight">
                Sit practice test 5
              </h4>
              <p className="mt-2 text-[13px] leading-[1.6] text-[var(--ds-ink-2)]">
                Two modules per section, 2h 14m. Scored the moment you finish.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <ButtonC variant="primary">
                <Play />
                Begin test
              </ButtonC>
              <ButtonC variant="ghost">One module</ButtonC>
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
            <Chip tone="neutral">Mod 2</Chip>
          </div>

          <TileMeter
            value={
              ((testMeta.totalMinutes - testMeta.minutesLeft) /
                testMeta.totalMinutes) *
              100
            }
            tiles={16}
            className="mt-4"
          />

          <div className="mt-3 flex items-center justify-between">
            <Mono className="text-[var(--ds-ink-3)]">
              {testMeta.answered}/{testMeta.questionCount} ANSWERED
            </Mono>
            <div className="flex gap-1">
              <ButtonC variant="ghost" className="h-7 px-2">
                <Pause />
              </ButtonC>
              <ButtonC variant="ghost" className="h-7 px-2">
                Hide
              </ButtonC>
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
              <StarGlyph className="size-3" />
              Shortlisted
            </button>
          }
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="text-[18px] leading-tight font-extrabold tracking-tight">
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

          <dl className="mt-4 grid grid-cols-4 border-y border-[var(--ds-rule)] divide-x divide-[var(--ds-rule)]">
            {[
              { label: "Acceptance", value: pct(universities[0].acceptance) },
              { label: "SAT", value: String(universities[0].sat) },
              { label: "IELTS", value: universities[0].ielts.toFixed(1) },
              { label: "Tuition", value: usd(universities[0].tuition) },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={cn("py-3", index === 0 ? "pr-3" : "px-3")}
              >
                <dt className="ds-eyebrow">{stat.label}</dt>
                <dd className="mt-1.5">
                  <Figure className="text-[15px]">{stat.value}</Figure>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Chip tone="ok">Meets full need</Chip>
              <Mono className="text-[var(--ds-ink-3)]">
                DUE {universities[0].deadline.toUpperCase()}
              </Mono>
            </div>
            <ButtonC variant="secondary" className="h-8">
              Open
            </ButtonC>
          </div>
        </Panel>

        {/* 12 · Shortlist table ------------------------------------------ */}
        <Panel
          index="12"
          title="Shortlist"
          span="col-span-12 lg:col-span-7"
          bodyClassName="p-0"
          action={<Mono className="text-[var(--ds-ink-3)]">4 SAVED</Mono>}
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
                        <span className="ds-eyebrow">{heading}</span>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {universities.map((uni) => (
                  <tr key={uni.id} className="border-t border-[var(--ds-rule)]">
                    <td className="px-3 py-2.5">
                      <span className="font-semibold">{uni.name}</span>
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
                      <Mono className="text-[12px]">
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
              <li key={deadline.id} className="px-4 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {deadline.university}
                    </p>
                    <Mono className="text-[10px] text-[var(--ds-ink-3)]">
                      {deadline.kind.toUpperCase()} · {deadline.date.toUpperCase()}
                    </Mono>
                  </div>
                  <Chip tone={deadline.daysLeft <= 14 ? "warn" : "neutral"}>
                    {deadline.daysLeft} days
                  </Chip>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <Progress
                    value={(deadline.documents.done / deadline.documents.total) * 100}
                    className="h-1.5 rounded-none bg-[var(--ds-sunk)] [&_[data-slot=progress-indicator]]:rounded-none [&_[data-slot=progress-indicator]]:bg-[var(--ds-accent)]"
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
              <li key={item.id} className="flex gap-3 px-4 py-3">
                <Checkbox
                  checked={item.done}
                  aria-label={item.title}
                  className="mt-0.5 rounded-[2px] border-[var(--ds-rule-strong)] data-checked:border-[var(--ds-accent)] data-checked:bg-[var(--ds-accent)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "text-[13px] font-semibold",
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
        <Panel index="15" title="Controls" span="col-span-12 lg:col-span-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-5">
              <div>
                <Label>Buttons</Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ButtonC variant="primary">Begin test</ButtonC>
                  <ButtonC variant="secondary">Review</ButtonC>
                  <ButtonC variant="ghost">Skip</ButtonC>
                  <ButtonC variant="danger">Remove</ButtonC>
                </div>
              </div>

              <div>
                <Label>Field</Label>
                <input
                  defaultValue="1450"
                  aria-label="Target score"
                  className="ds-num mt-3 h-10 w-full border border-[var(--ds-rule-strong)] bg-[var(--ds-panel)] px-3 text-[14px] outline-none focus:border-[var(--ds-accent)]"
                  style={{ borderRadius: "var(--ds-r-sm)" }}
                />
                <p className="mt-1.5 text-[11px] text-[var(--ds-ink-3)]">
                  Between 400 and 1600, in steps of 10.
                </p>
              </div>

              <div>
                <Label>Segmented</Label>
                <Tabs defaultValue="rw" className="mt-3">
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
                        className="h-7 rounded-[2px] px-3 text-[12px] data-[state=active]:bg-[var(--ds-panel)] data-[state=active]:text-[var(--ds-accent)]"
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
                <Label>Toggles</Label>
                <div className="mt-3 space-y-3">
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
                  <Label>Target score</Label>
                  <Mono className="text-[var(--ds-ink-2)]">1450</Mono>
                </div>
                <Slider
                  defaultValue={[1450]}
                  min={400}
                  max={1600}
                  step={10}
                  className="mt-4 [&_[data-slot=slider-range]]:bg-[var(--ds-accent)] [&_[data-slot=slider-thumb]]:rounded-[2px] [&_[data-slot=slider-thumb]]:border-[var(--ds-accent)] [&_[data-slot=slider-track]]:rounded-none [&_[data-slot=slider-track]]:bg-[var(--ds-sunk)]"
                />
              </div>

              <div>
                <Label>Status chips</Label>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip tone="ok">Correct</Chip>
                  <Chip tone="warn">Flagged</Chip>
                  <Chip tone="bad">Incorrect</Chip>
                  <Chip tone="accent">Saved</Chip>
                  <Chip tone="neutral">Blank</Chip>
                </div>
              </div>

              <div>
                <Label>Shortcuts</Label>
                <KbdGroup className="mt-3">
                  <Kbd className="rounded-[2px] bg-[var(--ds-sunk)] text-[var(--ds-ink-2)]">
                    Z
                  </Kbd>
                  <span className="text-[11px] text-[var(--ds-ink-3)]">
                    undo eliminate
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
