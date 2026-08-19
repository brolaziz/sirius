/**
 * Authenticated app shell.
 *
 * A frosted sidebar on large screens, a sheet drawer on small ones, and a
 * frosted top bar. Routes under this layout are protected by `proxy.ts`, so
 * anything rendered here can assume a signed-in user.
 *
 * WHY THE GLASS WORKS HERE AND NOT ON A PLAIN PAGE
 * `backdrop-filter` only reads as glass when there is something worth blurring
 * behind it. So the shell paints its own light first: three large, heavily
 * blurred spectrum blobs fixed to the viewport, with the dot texture over them.
 * The sidebar and the top bar blur *that*, which is what gives the panels depth
 * instead of a grey wash. The blobs are `fixed` rather than `absolute` so they
 * stay put while content scrolls past — light does not scroll.
 *
 * The setup banner appears when `DATABASE_URL` is missing, which is the one
 * failure a new contributor is most likely to hit: sign-in works, and then
 * every page is empty for no visible reason.
 *
 * ABOUT `suppressHydrationWarning` ON THE WRAPPERS
 * Security extensions rewrite the DOM before React hydrates. Bitdefender stamps
 * `bis_skin_checked="1"` onto block elements, Grammarly and password managers
 * add their own attributes, and React reports each one as a hydration mismatch.
 * The flag is set on the shell's structural elements because those are the ones
 * an extension reaches first.
 *
 * It is **one level deep** — it silences the element it is on, not its
 * children — so this is damage control rather than a cure. See the note in
 * `components/dashboard/bento-grid.tsx` for the same treatment on the grid, and
 * the summary in the README for why chasing every nested div is the wrong
 * response.
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/dashboard/user-menu";

import { Logo } from "@/components/brand/logo";
import { AppNav } from "@/components/dashboard/app-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { DatabaseSetupBanner } from "@/components/dashboard/database-setup-banner";
import { DatabaseErrorBanner } from "@/components/dashboard/database-error-banner";
import { isDatabaseConfigured } from "@/lib/prisma";
import { getOrCreateCurrentUser, requireUserId } from "@/lib/user";
import { getDictionary, getLang } from "@/lib/i18n";

/*
 * Never prerender anything in this group.
 *
 * Every page here renders one specific student's data. Without this, a build
 * run before `DATABASE_URL` is set takes the "no database" branch, never calls
 * `auth()`, and Next legitimately concludes the page is static — baking an
 * empty dashboard into the build output. Declaring the segment dynamic makes
 * that impossible regardless of build-time environment.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  /*
   * The authorisation boundary for every page in this group.
   *
   * `proxy.ts` also redirects signed-out visitors, but that check only looks
   * for a session cookie and is a UX convenience. This one reads the session
   * from the database inside the route that renders the data, so a forged or
   * expired cookie stops here.
   */
  await requireUserId();

  const databaseReady = isDatabaseConfigured();
  const t = getDictionary(await getLang());

  /*
   * One user read for the whole shell. The menu needs a name, an email and an
   * avatar; fetching them here rather than inside the client component keeps it
   * to a single query per request.
   */
  let user = null;
  let databaseFailed = false;

  if (databaseReady) {
    try {
      user = await getOrCreateCurrentUser();
    } catch (error) {
      /*
       * The session was readable, so the visitor is signed in — only the
       * product query failed. The shell still renders, with a banner explaining
       * why the tiles are empty. Throwing here instead would replace a working
       * page with an error screen for what is often a transient blip.
       */
      databaseFailed = true;
      console.error("[app] could not load the current user:", error);
    }
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-surface lg:flex-row"
      suppressHydrationWarning
    >
      {/* The light the glass panels blur. Decorative, fixed, behind everything. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <span className="absolute -top-32 -left-24 size-[34rem] rounded-full bg-brand-400/25 blur-[130px]" />
        <span className="absolute top-1/3 -right-32 size-[30rem] rounded-full bg-magenta/12 blur-[130px]" />
        <span className="absolute -bottom-40 left-1/3 size-[28rem] rounded-full bg-cyan/15 blur-[130px]" />
        <span className="absolute inset-0 bg-dots-fine [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      </div>

      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/60 glass lg:flex"
        suppressHydrationWarning
      >
        <div className="px-5 py-6">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          >
            <Logo />
          </Link>
        </div>

        <div className="flex-1 px-3">
          <AppNav />
        </div>

        <div className="p-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {t.app.backToSite}
          </Link>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col" suppressHydrationWarning>
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/60 glass px-4 sm:px-6"
          suppressHydrationWarning
        >
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/dashboard" className="inline-flex lg:hidden">
              <Logo compact />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/*
             * The same switch as the marketing header. It writes a cookie and
             * refreshes the server components in place, so the whole
             * authenticated UI swaps language without a page load and without
             * losing scroll position.
             */}
            <LangSwitch />

            <span className="h-6 w-px bg-border" aria-hidden="true" />

            <UserMenu
              name={user?.name ?? null}
              email={user?.email ?? null}
              image={user?.image ?? null}
            />
          </div>
        </header>

        <main
          className="flex-1 px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12"
          suppressHydrationWarning
        >
          {!databaseReady && <DatabaseSetupBanner className="mb-8" />}
          {databaseFailed && <DatabaseErrorBanner className="mb-8" />}
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
