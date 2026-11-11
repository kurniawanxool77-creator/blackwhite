import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [192, 512].map((size) => ({ id: String(size), size: { width: size, height: size }, contentType: "image/png" }));
}

// Ikon aplikasi: kotak biru brand dengan huruf QR putih. Dipakai manifest dan tab browser.
export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#15803d",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.36,
          fontWeight: 700,
        }}
      >
        BW
      </div>
    ),
    { width: size, height: size },
  );
}
