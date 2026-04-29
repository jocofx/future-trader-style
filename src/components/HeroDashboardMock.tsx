/* Beautiful self-contained dashboard mock for hero (real HTML/SVG, no AI artifacts) */
export function HeroDashboardMock() {
  // Synthetic equity curve points
  const points = [
    [0, 80], [8, 78], [16, 75], [24, 70], [32, 72], [40, 65],
    [48, 60], [56, 55], [64, 50], [72, 42], [80, 36], [88, 28], [96, 22], [100, 18],
  ];
  const path = points.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L100 100 L0 100 Z`;

  return (
    <div className="relative w-full">
      {/* Glow */}
      <div className="absolute -inset-10 bg-gradient-primary opacity-20 blur-3xl rounded-full" aria-hidden />
      <div className="relative glass-strong rounded-2xl p-3 md:p-4 shadow-elegant overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-1 pb-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <div className="ml-3 text-[11px] text-muted-foreground font-mono">tradync.app/dashboard</div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* Sidebar */}
          <aside className="col-span-2 hidden md:block rounded-xl bg-surface/60 border border-border p-2.5 space-y-1">
            {["Dashboard","Operaciones","Calendario","Estadísticas","Riesgo","Coach IA"].map((l, i) => (
              <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${i===0 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                <div className={`h-1.5 w-1.5 rounded-full ${i===0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                {l}
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="col-span-12 md:col-span-7 space-y-3">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { k: "Win Rate", v: "68.4%", d: "+2.1%", up: true },
                { k: "Profit Factor", v: "2.42", d: "+0.18", up: true },
                { k: "Avg R", v: "+1.8R", d: "−0.2", up: false },
              ].map((m) => (
                <div key={m.k} className="rounded-lg border border-border bg-surface/60 p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</div>
                  <div className="mt-1 font-mono text-base font-semibold tabular">{m.v}</div>
                  <div className={`text-[10px] font-mono ${m.up ? "text-success" : "text-destructive"}`}>{m.d}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-border bg-surface/60 p-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Equity Curve · 30D</div>
                  <div className="font-mono text-lg font-semibold">$48,210<span className="text-success text-xs ml-2">+12.4%</span></div>
                </div>
                <div className="flex gap-1 text-[10px] font-mono text-muted-foreground">
                  {["1D","1W","1M","3M","ALL"].map((t,i) => (
                    <span key={t} className={`px-1.5 py-0.5 rounded ${i===2 ? "bg-primary/15 text-primary" : ""}`}>{t}</span>
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 w-full h-32">
                <defs>
                  <linearGradient id="eqGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 158)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#eqGrad)" />
                <path d={path} fill="none" stroke="oklch(0.85 0.20 160)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <circle cx="100" cy="18" r="1.6" fill="oklch(0.85 0.20 160)" />
              </svg>
            </div>
          </div>

          {/* Right column: heatmap */}
          <aside className="col-span-12 md:col-span-3 rounded-xl border border-border bg-surface/60 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Calendario P&L</div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => {
                const r = (i * 9301 + 49297) % 233280 / 233280;
                const intensity = r > 0.7 ? 0.9 : r > 0.5 ? 0.6 : r > 0.3 ? 0.3 : 0.1;
                const loss = i % 11 === 0;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-[3px]"
                    style={{
                      background: loss
                        ? `color-mix(in oklab, var(--destructive) ${intensity * 60}%, transparent)`
                        : `color-mix(in oklab, var(--primary) ${intensity * 80}%, transparent)`,
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Menos</span>
              <div className="flex gap-1">
                {[0.15, 0.35, 0.55, 0.8].map((o) => (
                  <span key={o} className="h-2 w-2 rounded-[2px]" style={{ background: `color-mix(in oklab, var(--primary) ${o * 100}%, transparent)` }} />
                ))}
              </div>
              <span>Más</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
