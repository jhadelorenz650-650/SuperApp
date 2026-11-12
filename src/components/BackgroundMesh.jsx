export function BackgroundMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 bg-[#F5F3EE]" aria-hidden="true">
      {/* Subtle architectural paper dot grid */}
      <div
        className="absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage: 'radial-gradient(rgba(18, 19, 22, 0.14) 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Restrained 10% Cornflower Blue peripheral light */}
      <div className="animate-mesh-a absolute -top-44 -right-28 w-[34rem] h-[34rem] rounded-full bg-[#5B8DEF]/[0.07] blur-[120px]" />
      <div className="animate-mesh-b absolute -bottom-44 -left-24 w-[32rem] h-[32rem] rounded-full bg-[#121316]/[0.03] blur-[120px]" />

      {/* Fine paper fiber grain texture */}
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
