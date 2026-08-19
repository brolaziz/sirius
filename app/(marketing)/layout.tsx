/**
 * Marketing shell — the public, unauthenticated surface.
 *
 * Auth state is resolved here on the server so the header renders the right
 * call to action in the very first paint. Everything under this layout is
 * publicly reachable; `proxy.ts` protects the app routes instead.
 */

import { auth } from "@/auth";

import { StickyHeader } from "@/components/marketing/sticky-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function MarketingLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      <StickyHeader isSignedIn={Boolean(session?.user)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
