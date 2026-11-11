import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ikon layar utama iPhone.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", background: "#15803d", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 700 }}
      >
        L
      </div>
    ),
    size,
  );
}
