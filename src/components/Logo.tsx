export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-primary rounded-[28%] shadow-glow" />
      <svg viewBox="0 0 24 24" className="relative h-full w-full p-1.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 4 4 8-9" />
        <path d="M14 7h6v6" />
      </svg>
    </div>
  );
}
