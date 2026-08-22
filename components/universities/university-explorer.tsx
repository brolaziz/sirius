"use client";

/**
 * University explorer.
 *
 * Filtering, sorting and search all happen client-side. That is the right call
 * at MVP scale — a list of a few hundred universities is a trivial payload, and
 * keeping it local makes every keystroke instant with no loading states. If the
 * list ever grows into the thousands, move this to server-side filtering with
 * `searchParams`.
 *
 * The "my SAT score" filter is the one that matters most: it answers "where can
 * I actually apply?" rather than making a student compare their score against
 * each card by hand. The score flows into every card and into the detail
 * dialog, where it colours the SAT requirement.
 *
 * Layout is a card grid rather than a table. A table is denser, but the facts
 * that decide a shortlist are read one university at a time — and a card can
 * carry a photograph, which is what makes a list of names feel like a list of
 * places you might actually live.
 *
 * PAGING
 * The list is a few hundred rows now, and each card mounts an image and an SVG
 * gauge, so they are revealed a page at a time and the next page loads when a
 * sentinel scrolls into view. Filtering still runs over the *whole* list — only
 * the rendering is paged — so a search never misses a match that happens to sit
 * on page four.
 */

import * as React from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pressable } from "@/components/motion/pressable";
import { UniversityCard } from "@/components/universities/university-card";
import { UniversityDetail } from "@/components/universities/university-detail";
import { useT } from "@/components/i18n/lang-provider";
import { fill } from "@/lib/i18n/config";
import { toggleShortlist } from "@/lib/actions/universities";
import {
  DUR,
  EASE,
  STAGGER_TIGHT,
  gsap,
  prefersReducedMotion,
  useGSAP,
} from "@/lib/gsap";

export interface UniversityView {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  state: string | null;
  acceptanceRate: number | null;
  minSat: number | null;
  minIelts: number | null;
  minToefl: number | null;
  averageGpa: number | null;
  satMath: number | null;
  satReading: number | null;
  studentSize: number | null;
  dataSource: string;
  description: string | null;
  descriptionUz: string | null;
  extracurriculars: string[];
  extracurricularsUz: string[];
  popularMajors: string[];
  popularMajorsUz: string[];
  studentProfile: string | null;
  studentProfileUz: string | null;
  imageUrl: string | null;
  tuitionUsd: number | null;
  meetsFullNeed: boolean;
  worldRanking: number | null;
  websiteUrl: string | null;
  applicationDeadline: Date | null;
}

type SortKey = "ranking" | "acceptance" | "sat" | "name";

/**
 * Cards revealed per page. Twenty-four fills three columns eight rows deep —
 * enough that scrolling feels continuous, few enough that the first paint stays
 * cheap with an image and an SVG gauge in every card.
 */
const PAGE_SIZE = 24;

export function UniversityExplorer({
  universities,
  shortlistedIds,
  initialScore = null,
}: {
  universities: UniversityView[];
  shortlistedIds: string[];
  /**
   * The student's own score, from their latest sitting or from onboarding.
   *
   * Prefilling it rather than making them type it is the difference between a
   * list of universities and a list of *their* universities: every card
   * already knows whether the score clears the bar before they touch anything.
   * It stays editable — trying a shortlist against the score you are aiming
   * for is exactly what this field is for.
   */
  initialScore?: number | null;
}) {
  const { t } = useT();
  const gridRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("ranking");
  const [satScore, setSatScore] = React.useState(
    initialScore === null ? "" : String(initialScore),
  );
  const [onlyFullNeed, setOnlyFullNeed] = React.useState(false);
  const [selected, setSelected] = React.useState<UniversityView | null>(null);

  const [isPending, startTransition] = React.useTransition();
  const [optimisticShortlist, applyOptimistic] = React.useOptimistic(
    new Set(shortlistedIds),
    (current: Set<string>, id: string) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    },
  );

  const sortLabels: Record<SortKey, string> = {
    ranking: t.uni.sortRanking,
    acceptance: t.uni.sortAcceptance,
    sat: t.uni.sortSat,
    name: t.uni.sortName,
  };

  const myScore = React.useMemo(() => {
    const parsed = Number(satScore);
    return satScore.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
  }, [satScore]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = universities.filter((university) => {
      if (onlyFullNeed && !university.meetsFullNeed) return false;

      // Keep universities with no listed requirement: an unknown floor is not a
      // reason to hide an option from a student.
      if (
        myScore !== null &&
        university.minSat !== null &&
        university.minSat > myScore
      ) {
        return false;
      }

      if (!needle) return true;

      // Search both languages, so "muhandislik" and "engineering" both work
      // whichever language the interface happens to be in. The state is in
      // here because "California" is how a student thinks about a US shortlist
      // long before they know which city they mean.
      return [
        university.name,
        university.country ?? "",
        university.city ?? "",
        university.state ?? "",
        ...university.extracurriculars,
        ...university.extracurricularsUz,
        ...university.popularMajors,
        ...university.popularMajorsUz,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    // `null` sorts last for every key, so rows with missing data do not crowd
    // the top of the list.
    const nullsLast = (a: number | null, b: number | null) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    };

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "ranking":
          return nullsLast(a.worldRanking, b.worldRanking);
        case "acceptance":
          return nullsLast(a.acceptanceRate, b.acceptanceRate);
        case "sat":
          return nullsLast(a.minSat, b.minSat);
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
  }, [universities, query, sortKey, myScore, onlyFullNeed]);

  /*
   * Re-run the cascade whenever the visible set changes, keyed on the ids
   * rather than the length: changing the sort order moves which card is where
   * without changing how many there are, and that reshuffle deserves the same
   * animation as a filter.
   */
  const visibleKey = visible.map((university) => university.id).join("|");

  /*
   * Paging state carries the filter key with it, so the page count resets when
   * the filters change without an effect calling `setState` — the render-time
   * adjustment React documents for exactly this case.
   */
  const [paging, setPaging] = React.useState({
    key: visibleKey,
    count: PAGE_SIZE,
  });
  const shownCount = paging.key === visibleKey ? paging.count : PAGE_SIZE;
  const shown = React.useMemo(
    () => visible.slice(0, shownCount),
    [visible, shownCount],
  );
  const hasMore = shownCount < visible.length;

  const loadMore = React.useCallback(() => {
    setPaging({ key: visibleKey, count: shownCount + PAGE_SIZE });
  }, [visibleKey, shownCount]);

  /*
   * Auto-load when the sentinel comes into view. The button below it stays
   * rendered and functional: it is the keyboard path, and the fallback if the
   * observer never fires.
   */
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      // Start fetching a screen early so the grid rarely shows the sentinel.
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  /*
   * Cascade only the cards that have not been animated yet.
   *
   * Selecting `:not([data-revealed])` does three jobs at once: a newly loaded
   * page animates on its own, a card that survived a filter change does not
   * flash again, and typing in the search box no longer re-cascades the entire
   * grid on every keystroke.
   */
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const cards = gridRef.current?.querySelectorAll(
        "[data-uni-card]:not([data-revealed])",
      );
      if (!cards || cards.length === 0) return;

      cards.forEach((card) => card.setAttribute("data-revealed", "true"));

      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: DUR.base,
          ease: EASE,
          stagger: STAGGER_TIGHT,
          // A fast typist can change the filter mid-cascade; without this the
          // half-finished tween would fight the new one and leave cards dim.
          overwrite: "auto",
        },
      );
    },
    { scope: gridRef, dependencies: [visibleKey, shownCount] },
  );

  function handleToggleShortlist(university: UniversityView) {
    startTransition(async () => {
      applyOptimistic(university.id);
      const result = await toggleShortlist(university.id);

      if (!result.ok) {
        toast.error(result.error ?? t.uni.updateFailed);
        return;
      }

      toast.success(
        fill(result.shortlisted ? t.uni.added : t.uni.removed, {
          name: university.name,
        }),
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          {/*
           * These three labels carried `tap-target-y` and no longer do.
           *
           * The exception was granted on the argument that the overlap was
           * harmless, because what each halo covered was the control the label
           * itself activates. The measurement says otherwise: the halo took
           * 6.5px off the top of the search field and held its hit area to
           * 37.54px inside a 44px box. A halo that pushes its neighbour under
           * the threshold is a worse trade than the 16px label it was fixing,
           * and the neighbour here is the control that actually matters.
           *
           * The labels are back to 16px and the fields they point at measure
           * their full 44. `scripts/audit-tap-targets.ts` reports a label like
           * this under `smallLabels` rather than as a failure, which is the
           * honest description of it: a convenience target, not a blocked tap.
           */}
          <div className="flex-1">
            <Label htmlFor="uni-search" className="text-xs font-semibold">
              {t.uni.search}
            </Label>
            <div className="relative mt-2">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="uni-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.uni.searchPlaceholder}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </div>

          <div className="w-full lg:w-44">
            <Label htmlFor="uni-sat" className="text-xs font-semibold">
              {t.uni.myScore}
            </Label>
            <Input
              id="uni-sat"
              type="number"
              inputMode="numeric"
              min={400}
              max={1600}
              step={10}
              value={satScore}
              onChange={(event) => setSatScore(event.target.value)}
              placeholder={t.uni.myScorePlaceholder}
              className="mt-2 h-11 rounded-xl tnum"
            />
          </div>

          <div className="w-full lg:w-52">
            <Label htmlFor="uni-sort" className="text-xs font-semibold">
              {t.uni.sortBy}
            </Label>
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              <SelectTrigger
                id="uni-sort"
                className="mt-2 h-11 w-full rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {sortLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
            <Switch
              checked={onlyFullNeed}
              onCheckedChange={setOnlyFullNeed}
              aria-label={t.uni.fullNeed}
            />
            <span className="text-sm font-medium">{t.uni.fullNeed}</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          <span className="tnum">
            {fill(t.uni.counted, {
              shown: visible.length,
              total: universities.length,
            })}
          </span>
          {myScore !== null && (
            <span className="ml-auto rounded-full bg-viz-emerald-soft px-2.5 py-1 font-semibold text-viz-emerald tnum">
              {fill(t.uni.reachableWith, { score: myScore })}
            </span>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-base font-semibold">{t.uni.noMatch}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.uni.noMatchBody}
          </p>
          <Pressable className="mt-6">
            <Button
              variant="outline"
              size="lg"
              className="h-11 rounded-xl"
              onClick={() => {
                setQuery("");
                setSatScore("");
                setOnlyFullNeed(false);
              }}
            >
              {t.uni.clearFilters}
            </Button>
          </Pressable>
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((university) => (
              <UniversityCard
                key={university.id}
                university={university}
                myScore={myScore}
                isShortlisted={optimisticShortlist.has(university.id)}
                onOpen={() => setSelected(university)}
                onToggleShortlist={() => handleToggleShortlist(university)}
              />
            ))}
          </div>

          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex flex-col items-center gap-3 pt-2"
            >
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {fill(t.uni.showing, {
                  shown: shown.length,
                  total: visible.length,
                })}
              </p>

              {/*
               * Kept in the tree even though the observer usually gets there
               * first: it is the keyboard path, and the fallback for anyone
               * whose browser never fires the sentinel.
               */}
              <Pressable>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-10 rounded-lg bg-card"
                  onClick={loadMore}
                >
                  {t.uni.loadMore}
                </Button>
              </Pressable>
            </div>
          )}
        </>
      )}

      <UniversityDetail
        university={selected}
        isShortlisted={selected ? optimisticShortlist.has(selected.id) : false}
        isPending={isPending}
        myScore={myScore}
        onClose={() => setSelected(null)}
        onToggleShortlist={() => selected && handleToggleShortlist(selected)}
      />
    </div>
  );
}
