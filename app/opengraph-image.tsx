import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SEOKaroAI: AI SEO audits, rank tracking and competitor analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image for every page that does not set its own. */
export default function OgImage() {
  const logo = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo-mark-256.png")).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0b1220 0%, #0b3a6e 60%, #0b6bcb 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={96} height={96} alt="" />
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800 }}>SEOKaro<span style={{ color: "#8b5cf6" }}>AI</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.08, maxWidth: 980 }}>The AI SEO audit tool that tells you exactly what to fix</div>
          <div style={{ fontSize: 30, marginTop: 24, color: "#c7dcf5" }}>AI agent audits · Daily rank tracking · Beat the top 3 for any keyword</div>
        </div>
        <div style={{ fontSize: 26, color: "#9fc4ee" }}>seokaroai.com</div>
      </div>
    ),
    size,
  );
}
