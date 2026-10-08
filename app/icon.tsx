import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default async function Icon() {
  const original = await readFile(join(process.cwd(), "public/brand/sirius-identity-original.png"));
  // Render a crop of the original supplied identity; no redrawing or regeneration.
  return new ImageResponse(<div style={{ display: "flex", position: "relative", width: 64, height: 64, overflow: "hidden", borderRadius: 14, background: "white" }}>
    {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a native image. */}
    <img src={`data:image/png;base64,${original.toString("base64")}`} alt="" width={115} height={115} style={{ position: "absolute", left: -26, top: -15 }} />
  </div>, size);
}
