export function Logo({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl bg-navy ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="VetConnect" width={size * 0.74} height={size * 0.74} style={{ width: size * 0.74, height: size * 0.74 }} />
    </div>
  );
}
