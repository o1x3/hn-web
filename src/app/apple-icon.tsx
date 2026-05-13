import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ff6b1a",
        color: "#fff",
        fontSize: 96,
        fontWeight: 800,
        letterSpacing: -4,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        borderRadius: 36,
      }}
    >
      hn
    </div>,
    { ...size },
  );
}
