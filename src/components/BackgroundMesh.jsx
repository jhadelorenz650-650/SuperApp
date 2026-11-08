export function BackgroundMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
      {/* Soft pastel radial washes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(78,81,191,0.12),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,146,164,0.16),_transparent_58%)]" />

      {/* Slow drifting soft pastel blobs */}
      <div className="animate-mesh-a absolute -top-36 -left-24 w-[36rem] h-[36rem] rounded-full bg-[#4E51BF]/14 blur-[120px]" />
      <div className="animate-mesh-b absolute top-1/4 -right-32 w-[34rem] h-[34rem] rounded-full bg-[#FFE9CE]/80 blur-[120px]" />
      <div className="animate-mesh-c absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] rounded-full bg-[#FF92A4]/18 blur-[130px]" />

      {/* Subtle noise / grain texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] mix-blend-multiply">
        <filter id="pulse-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#pulse-noise)" />
      </svg>
    </div>
  );
}
