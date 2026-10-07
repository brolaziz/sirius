import { Nunito_Sans } from "next/font/google";
/** Scoped to the workspace; marketing retains its current typefaces. */
export const workspaceFont = Nunito_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-workspace", display: "swap" });
