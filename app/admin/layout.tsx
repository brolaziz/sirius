import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sirius Admin", robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) { return children; }
