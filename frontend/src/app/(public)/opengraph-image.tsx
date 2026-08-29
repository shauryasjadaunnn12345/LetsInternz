import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#16213e",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              borderRadius: 16,
              backgroundColor: "#f2a93b",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "#16213e",
            }}
          >
            ↗
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#ffffff" }}>
            LetsInternz
          </div>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 34,
            fontWeight: 500,
            color: "#f2a93b",
            textAlign: "center",
          }}
        >
          Find Internships from 20+ Platforms
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 22,
            color: "rgba(255,255,255,0.65)",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Internshala · Unstop · LinkedIn · AngelList and more — searched,
          filtered, and tracked in one place.
        </div>
      </div>
    ),
    { ...size }
  );
}
