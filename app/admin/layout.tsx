import type { Metadata } from "next";
import { workspaceFont } from "@/lib/workspace-font";
export const metadata: Metadata = { title: "Sirius Admin", robots: { index: false, follow: false } };
export default function AdminRoot({ children }: { children: React.ReactNode }) { return <div className={`workspace ${workspaceFont.variable}`}>{children}</div>; }
