import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0b0b0c",
        color: "#fff",
        padding: 80,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 96,
            height: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ff6b1a",
            color: "#fff",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -2,
            borderRadius: 20,
          }}
        >
          hn
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, color: "#9ca3af" }}>{SITE_NAME}</div>
      </div>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ fontSize: 28, color: "#9ca3af", lineHeight: 1.35, maxWidth: 980 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
