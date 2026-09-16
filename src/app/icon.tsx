import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 15, color: "#061013", background: "linear-gradient(145deg,#81fff9,#4deeea 55%,#9b7cff)", fontSize: 29, fontWeight: 900, letterSpacing: -3, boxShadow: "inset 0 0 0 3px rgba(255,255,255,.25)" }}>VX</div>, size);
}
