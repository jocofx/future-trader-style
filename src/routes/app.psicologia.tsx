import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Brain, Sparkles, AlertTriangle, TrendingUp, Activity, Target, Flame, Hash } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/app/psicologia")({
    component: PsicologiaPage,
});

const GREEN = "oklch(0.78 0.18 158)";
const RED   = "oklch(0.68 0.22 18)";
const BLUE  = "oklch(0.74 0.14 240)";

const EMOCIONES_ORDER = ["sereno","confiado","motivado","neutral","inseguro","ansioso","frustrado","eufórico"];
const EMO_EMOJI: Record<string,string> = {
  sereno:"😌",confiado:"💪",ansioso:"😰",frustrado:"😤",
  motivado:"🔥",inseguro:"😟",eufórico:"🤩",neutral:"😐"
};

function PsicologiaPage() {
  const { trades: { trades }, diario: { entries } } = useApp();

  const closedTrades = useMemo(() => trades.filter(t => t.resultado != null), [trades]);

  // P&L por emoción
  const emoData = useMemo(() => {
    const map: Record<string,{pnl:number;count:number;wins:number}> = {};
    closedTrades.forEach(t => {
      const e = t.emocion || "sin emoción";
      if (!map[e]) map[e] = { pnl:0, count:0, wins:0 };
      map[e].pnl += t.resultado ?? 0;
      map[e].count++;
      if ((t.resultado??0) > 0) map[e].wins++;
    });
    return Object.entries(map).map(([name,d]) => ({
      name,
      pnl: parseFloat(d.pnl.toFixed(2)),
      wr: d.count ? Math.round(d.wins/d.count*100) : 0,
      count: d.count,
    })).sort((a,b) => b.count - a.count).slice(0,8);
  }, [closedTrades]);

  // Confianza vs resultado
  // Disciplina vs resultado — uses t.disciplina (0-100) bucketed into 10 levels
  const confData = useMemo(() => {
    const map: Record<number,{pnl:number;count:number;wins:number}> = {};
    closedTrades.filter(t => t.disciplina != null).forEach(t => {
      // Convert 0-100 scale to 1-10 buckets
      const c = Math.min(10, Math.max(1, Math.ceil((t.disciplina ?? 50) / 10)));
      if (!map[c]) map[c] = { pnl:0, count:0, wins:0 };
      map[c].pnl += t.resultado ?? 0;
      map[c].count++;
      if ((t.resultado??0) > 0) map[c].wins++;
    });
    return Array.from({length:10},(_,i) => {
      const d = map[i+1];
      return {
        level: i+1,
        avg: d?.count ? parseFloat((d.pnl/d.count).toFixed(2)) : 0,
        count: d?.count ?? 0,
        wr: d?.count ? Math.round(d.wins/d.count*100) : 0,
      };
    });
  }, [closedTrades]);

  // Alerts
  const alerts = useMemo(() => {
    const a: {type:"warning"|"danger"|"success"; msg:string}[] = [];
    const trades7 = closedTrades.filter(t => new Date(t.fecha) >= new Date(Date.now()-7*86400000));

    let revengeCount = 0;
    for (let i=1;i<closedTrades.length;i++) {
      if ((closedTrades[i-1].resultado??0)<0 && (closedTrades[i].lotes??0)>(closedTrades[i-1].lotes??0))
        revengeCount++;
    }
    if (revengeCount > 2) a.push({type:"danger", msg:`Posible revenge trading: ${revengeCount} veces aumentaste tamaño tras pérdida`});

    const days: Record<string,number> = {};
    trades7.forEach(t => { days[t.fecha] = (days[t.fecha]??0)+1; });
    const maxDay = Math.max(...Object.values(days), 0);
    if (maxDay > 8) a.push({type:"warning", msg:`Overtrading detectado: ${maxDay} operaciones en un día esta semana`});

    let streak=0, maxStreak=0;
    [...closedTrades].sort((a,b)=>a.fecha.localeCompare(b.fecha)).forEach(t=>{
      if((t.resultado??0)>0){streak++;maxStreak=Math.max(maxStreak,streak);}else streak=0;
    });
    if (maxStreak >= 5) a.push({type:"success", msg:`Racha ganadora de ${maxStreak} operaciones consecutivas`});

    const anxious = emoData.find(e => e.name==="ansioso");
    if (anxious && anxious.count >= 3 && anxious.wr < 40)
      a.push({type:"warning", msg:`Cuando operas ansioso tu win rate cae al ${anxious.wr}% — considera hacer pausa`});

    return a;
  }, [closedTrades, emoData]);

  // Diary emotions — uses e.emociones (real array field)
  const diaryEmoStats = useMemo(() => {
    const map: Record<string,number> = {};
    entries.forEach(e => {
      // emociones is a jsonb array like ["💪 Motivado", "😰 Ansioso"]
      const emos = Array.isArray(e.emociones) ? e.emociones : (e.emociones ? [e.emociones] : []);
      emos.forEach((em: string) => {
        const key = em.trim();
        if (key) map[key] = (map[key]??0)+1;
      });
    });
    // Sort by frequency
    return Object.entries(map)
      .map(([key, count]) => ({ key, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 8);
  }, [entries]);

  // Setup/tag performance — uses t.setup (real column)
  const tagData = useMemo(() => {
    const map: Record<string,{pnl:number;count:number;wins:number}> = {};
    closedTrades.forEach(t => {
      // Use setup field (real column in DB)
      const tag = t.setup?.trim();
      if (!tag) return;
      if (!map[tag]) map[tag] = {pnl:0,count:0,wins:0};
      map[tag].pnl += t.resultado??0;
      map[tag].count++;
      if((t.resultado??0)>0) map[tag].wins++;
    });
    return Object.entries(map).map(([name,d]) => ({
      name, pnl: parseFloat(d.pnl.toFixed(2)),
      wr: Math.round(d.wins/d.count*100), count: d.count,
    })).sort((a,b) => b.count-a.count).slice(0,8);
  }, [closedTrades]);

  // Wellness score (0-100): basado en racha sin emociones tóxicas + winrate
  const wellnessScore = useMemo(() => {
    if (closedTrades.length < 5) return 50;
    const wins = closedTrades.filter(t => (t.resultado??0) > 0).length;
    const wr = wins / closedTrades.length;
    const negEmo = closedTrades.filter(t => ["ansioso","frustrado","inseguro"].includes(t.emocion||"")).length;
    const negRatio = closedTrades.length ? negEmo / closedTrades.length : 0;
    const score = Math.round((wr * 60) + ((1 - negRatio) * 40));
    return Math.max(0, Math.min(100, score));
  }, [closedTrades]);

  const wellnessColor = wellnessScore >= 70 ? GREEN : wellnessScore >= 40 ? "oklch(0.80 0.16 75)" : RED;
  const wellnessTone = wellnessScore >= 70 ? "text-success" : wellnessScore >= 40 ? "text-warning" : "text-destructive";
  const wellnessLabel = wellnessScore >= 70 ? "Excelente" : wellnessScore >= 40 ? "Equilibrado" : "Atención";

  const alertColors = {
    warning: { cls: "border-warning/30 bg-warning/8 text-warning", Icon: AlertTriangle },
    danger:  { cls: "border-destructive/30 bg-destructive/8 text-destructive", Icon: AlertTriangle },
    success: { cls: "border-success/30 bg-success/8 text-success", Icon: Sparkles },
  };

  // Eje X dinámico para emoData
  const maxAbsEmoPnl = Math.max(1, ...emoData.map(d => Math.abs(d.pnl)));
  // Eje Y dinámico para confData
  const maxAbsConfAvg = Math.max(1, ...confData.map(d => Math.abs(d.avg)));

  return (
    <PlanGate feature="psicologia" plan="basic">   <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── INFO BANNER ── */}
      <div className="rounded-2xl border border-info/20 bg-info/5 p-5">
        <div className="flex gap-4">
          <div className="text-2xl shrink-0 mt-0.5">🧠</div>
          <div className="space-y-2 flex-1">
            <div className="font-semibold text-sm">¿Qué analiza este apartado?</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Psicología cruza tus <span className="font-semibold text-foreground">emociones, disciplina y setups</span> con
              tus resultados reales para detectar patrones: cuándo operas mejor o peor según tu estado mental,
              señales de <span className="font-semibold text-foreground">revenge trading, overtrading o sobreconfianza</span>.
            </p>
            <div className="grid sm:grid-cols-3 gap-2 pt-1">
              {([
                { icon: "😌", title: "Registra emociones", desc: "Al añadir operaciones en el Journal, selecciona cómo te sentías. Cuantos más datos, mejor el análisis." },
                { icon: "✍️", title: "Escribe el diario", desc: "Las entradas del Diario alimentan el gráfico 'Emociones en el diario' y el análisis de bienestar." },
                { icon: "🎯", title: "Añade el setup", desc: "Al registrar operaciones indica el setup utilizado para ver qué setups son más rentables para ti." },
              ] as const).map(s => (
                <div key={s.title} className="rounded-xl bg-surface/40 border border-border/60 p-3">
                  <div className="text-base mb-1">{s.icon}</div>
                  <div className="text-xs font-semibold text-foreground">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Brain className="h-3.5 w-3.5 text-primary" />
            Mind Performance
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Psicología del Trader</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis emocional, patrones de comportamiento y wellness score en tiempo real.
          </p>
        </div>
      </div>

      {/* Wellness + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Wellness Score donut */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 blur-3xl pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 50%, ${wellnessColor} 0%, transparent 60%)` }}
          />
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-3 relative">Wellness Score</div>
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="50" stroke="oklch(var(--border))" strokeWidth="10" fill="none" />
              <circle
                cx="60" cy="60" r="50"
                stroke={wellnessColor}
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${(wellnessScore / 100) * 314} 314`}
                style={{ filter: `drop-shadow(0 0 8px ${wellnessColor})`, transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-4xl font-bold font-mono ${wellnessTone}`}>{wellnessScore}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</div>
            </div>
          </div>
          <div className={`mt-3 text-sm font-semibold ${wellnessTone} relative`}>{wellnessLabel}</div>
          <div className="text-[11px] text-muted-foreground mt-1 relative">Basado en {closedTrades.length} operaciones</div>
        </div>

        {/* Mini KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total ops",      value: String(closedTrades.length), Icon: Activity, tone: "text-info" },
            { label: "Emociones reg.", value: String(new Set(closedTrades.map(t=>t.emocion).filter(Boolean)).size), Icon: Brain, tone: "text-primary" },
            { label: "Racha máxima",   value: (() => { let s=0,m=0; [...closedTrades].sort((a,b)=>a.fecha.localeCompare(b.fecha)).forEach(t=>{if((t.resultado??0)>0){s++;m=Math.max(m,s);}else s=0;}); return String(m); })(), Icon: Flame, tone: "text-warning" },
            { label: "Tags únicos",    value: String(new Set(closedTrades.flatMap(t=>t.tags??[])).size), Icon: Hash, tone: "text-success" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 grid place-items-center rounded-lg bg-primary/10 border border-primary/20 ${k.tone}`}>
                  <k.Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
              <div className={`text-xl font-bold font-mono mt-0.5 ${k.tone}`}>{k.value}</div>
            </div>
          ))}

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="col-span-2 lg:col-span-4 space-y-2">
              {alerts.map((a, i) => {
                const conf = alertColors[a.type];
                const Icon = conf.Icon;
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${conf.cls}`}>
                    <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{a.msg}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* P&L por emoción - barras horizontales custom */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> P&L por emoción
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Cómo afecta tu estado emocional al resultado</div>
            </div>
          </div>
          {emoData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Añade emociones a tus operaciones</div>
          ) : (
            <div className="space-y-3">
              {emoData.map(d => {
                const pos = d.pnl >= 0;
                const pct = (Math.abs(d.pnl) / maxAbsEmoPnl) * 100;
                const emoji = EMO_EMOJI[d.name] ?? "•";
                return (
                  <div key={d.name} className="group">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <span className="font-semibold capitalize">{d.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{d.count} ops · {d.wr}% WR</span>
                      </div>
                      <span className={`font-mono font-bold ${pos ? "text-success" : "text-destructive"}`}>
                        {pos ? "+" : "-"}${Math.abs(d.pnl).toFixed(0)}
                      </span>
                    </div>
                    {/* Bar with center axis */}
                    <div className="h-2 rounded-full bg-surface-2 relative overflow-hidden">
                      <div
                        className="absolute top-0 h-full rounded-full transition-all duration-700"
                        style={{
                          left: pos ? "50%" : `${50 - pct/2}%`,
                          width: `${pct/2}%`,
                          background: pos ? GREEN : RED,
                          boxShadow: `0 0 8px ${pos ? GREEN : RED}`,
                        }}
                      />
                      <div className="absolute top-0 left-1/2 h-full w-px bg-border" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disciplina vs Resultado - bars custom con eje cero */}
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Disciplina vs Resultado
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">P&L medio según tu nivel de confianza (1–10)</div>
            </div>
          </div>
          {confData.every(d => d.count === 0) ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Añade confianza a tus operaciones</div>
          ) : (
            <div className="h-56 flex items-end gap-2 relative pt-4">
              {/* Cero axis line */}
              <div className="absolute left-0 right-0 top-1/2 h-px bg-border/60" />
              {confData.map(d => {
                const hPct = (Math.abs(d.avg) / maxAbsConfAvg) * 45; // 45% para no chocar con etiquetas
                const isPos = d.avg >= 0;
                return (
                  <div key={d.level} className="flex-1 h-full flex flex-col items-center justify-center relative group">
                    <div className="absolute inset-0 flex flex-col">
                      {/* Top half (positive) */}
                      <div className="flex-1 flex items-end justify-center pb-px">
                        {isPos && d.count > 0 && (
                          <div
                            className="w-full max-w-[28px] rounded-t-md transition-all duration-700"
                            style={{
                              height: `${hPct * 2}%`,
                              background: `linear-gradient(180deg, ${GREEN}, color-mix(in oklab, ${GREEN} 50%, transparent))`,
                              boxShadow: `0 -4px 12px -2px ${GREEN}`,
                            }}
                          />
                        )}
                      </div>
                      {/* Bottom half (negative) */}
                      <div className="flex-1 flex items-start justify-center pt-px">
                        {!isPos && d.count > 0 && (
                          <div
                            className="w-full max-w-[28px] rounded-b-md transition-all duration-700"
                            style={{
                              height: `${hPct * 2}%`,
                              background: `linear-gradient(0deg, ${RED}, color-mix(in oklab, ${RED} 50%, transparent))`,
                              boxShadow: `0 4px 12px -2px ${RED}`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    {/* Tooltip */}
                    {d.count > 0 && (
                      <div className="absolute -top-2 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                        <div className="bg-surface-2 border border-border rounded-md px-2 py-1 text-[10px] font-mono whitespace-nowrap shadow-lg">
                          <span className={isPos ? "text-success" : "text-destructive"}>
                            {isPos ? "+" : "-"}${Math.abs(d.avg).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground"> · {d.count}ops · {d.wr}%</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute -bottom-5 text-[10px] font-mono text-muted-foreground">{d.level}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-6 flex justify-between text-[10px] text-muted-foreground px-1">
            <span>Baja confianza</span>
            <span>Alta confianza</span>
          </div>
        </div>
      </div>

      {/* Tags + Diary emotions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-primary" /> Rendimiento por Setup
          </div>
          {tagData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Añade tags a tus operaciones para ver patrones</div>
          ) : (
            <div className="space-y-3">
              {tagData.map(t => {
                const pos = t.pnl >= 0;
                return (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-semibold">{t.name}</span>
                      <div className="flex gap-3 text-muted-foreground items-center">
                        <span>{t.wr}% WR</span>
                        <span>{t.count} ops</span>
                        <span className={`font-bold font-mono ${pos ? "text-success" : "text-destructive"}`}>
                          {pos ? "+" : "-"}${Math.abs(t.pnl).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${t.wr}%`, background: pos ? GREEN : RED, boxShadow: `0 0 6px ${pos ? GREEN : RED}` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-5">
          <div className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Brain className="h-4 w-4 text-primary" /> Emociones en el diario
          </div>
          {diaryEmoStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Registra tu estado emocional en el diario</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {diaryEmoStats.map(e => (
                <div key={e.key} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border hover:border-primary/30 transition">
                  <span className="text-2xl">{EMO_EMOJI[e.key] ?? "😐"}</span>
                  <div>
                    <div className="text-sm font-semibold capitalize">{e.key}</div>
                    <div className="text-xs text-muted-foreground">{e.count} {e.count === 1 ? "día" : "días"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="text-sm font-semibold">Consejos basados en tus datos</div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          {closedTrades.length < 10 ? (
            <p>Registra más operaciones para obtener insights personalizados sobre tu psicología de trading.</p>
          ) : (
            <>
              <p>🎯 Analiza en qué estados emocionales obtienes mejores resultados y trata de operar siempre desde esa base.</p>
              <p>📊 Un nivel de confianza 7-8 suele ser óptimo. Demasiado alto puede indicar soberbia.</p>
              <p>⏸️ Si detectas 2 pérdidas seguidas, considera hacer una pausa de 30 minutos antes de seguir.</p>
              <p>📝 El diario te ayuda a identificar patrones que no ves en tiempo real. Escribe cada día.</p>
            </>
          )}
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
