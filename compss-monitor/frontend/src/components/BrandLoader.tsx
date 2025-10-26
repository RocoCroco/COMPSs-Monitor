// src/components/BrandLoader.tsx
export default function BrandLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-20 w-20">
        {/* anillo */}
        <div className="absolute inset-0 rounded-full border-4 border-neutral-200 border-t-[#FF8659] animate-spin" />
        {/* logo */}
        <img
          src="/src/assets/compss-icon.png"  // usa tu ruta (si la tienes en /src/assets, import explícito)
          alt="COMPSs"
          className="absolute inset-0 m-auto h-10 w-auto animate-pulse"
          draggable={false}
        />
      </div>
      <div className="text-sm text-neutral-500">Preparing dashboard…</div>
    </div>
  );
}
