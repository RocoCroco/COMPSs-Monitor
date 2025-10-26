// src/components/BackgroundDots.tsx
import DotGrid from "./DotGrid"; // ajusta el path si tu DotGrid está en otro sitio

export default function BackgroundDots() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
    >
      <DotGrid
        dotSize={3}
        gap={20}
        baseColor="#f0f0f0"
        activeColor="#FF8659"
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
      />
      {/* Opcional: suaviza el contraste del fondo con una veladura */}
      {/* <div className="absolute inset-0 bg-white/35" /> */}
    </div>
  );
}