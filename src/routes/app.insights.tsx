import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";

export const Route = createFileRoute("/app/insights")({
  component: InsightsPage,
});

function fmt(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  return (sign?(n>=0?"+":"-"):(n<0?"-":""))+"$"+abs;
}

function InsightsPage() {
  const { trades: { trades }, habits: { habits } } = useApp();

  const closed = useMemo(() => trades.filter(t => t.resultado != null), [trades]);
  const stats  = useMemo(() => computeStats(closed), [closed]);

  // Trader profile score (0-100)
  const score = useMemo(() => {
    if (closed.length < 3) return 0;
    let s = 0;
    s += Math.min(30, stats.winRate * 100 * 0.5);
    s += Math.min(25, stats.profitFactor * 10);
    s += Math.min(30, (1 - Math.min(1, stats.losses/Math.max(1,closed.length)*2))*30);
    s += Math.min(15, 15);
    return Math.min(99, Math.round(s));
  }, [closed, stats]);

  const traderType = score >= 70 ? "Disciplinado" : score >= 50 ? "En Desarrollo" : score >= 30 ? "Impulsivo" : "Iniciando";
  const typeColor  = score >= 70 ? "text-success" : score >= 50 ? "text-info" : score >= 30 ? "text-warning" : "text-destructive";

  // Best conditions
  const bestSession = useMemo(() => {
    const map: Record<string,{pnl:number;count:number;wins:number}> = {};
    closed.forEach(t => {
      const s = t.sesion || "Sin sesión";
      if (!map[s]) map[s] = {pnl:0,count:0,wins:0};
      map[s].pnl += t.resultado??0;
      map[s].count++;
      if((t.resultado??0)>0) map[s].wins++;
    });
    return Object.entries(map).sort((a,b) => (b[1].wins/b[1].count)-(a[1].wins/a[1].count))[0]?.[0] ?? null;
  }, [closed]);

  const bestInstrument = useMemo(() => {
    const map: Record<string,number> = {};
    closed.forEach(t => { map[t.instrumento] = (map[t.instrumento]??0)+(t.resultado??0); });
    return Object.entries(map).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;
  }, [closed]);

  // Habit correlation
  const habitScore = useMemo(() => {
    if (!habits.length || !closed.length) return null;
    const goodDays = habits.filter(h => (h.sueno??0)>=7 && (h.ejercicio??0)>=30).map(h => h.fecha);
    const tradesGoodDays = closed.filter(t => goodDays.includes(t.fecha));
    if (!tradesGoodDays.length) return null;
    const wr = tradesGoodDays.filter(t => (t.resultado??0)>0).length / tradesGoodDays.length * 100;
    return { wr: Math.round(wr), count: tradesGoodDays.length, vs: Math.round(stats.winRate*100) };
  }, [closed, habits, stats]);

  // Generate insight cards
  const insights = useMemo(() => {
    const list: { icon:string; title:string; body:string; type:"positive"|"warning"|"neutral" }[] = [];

    if (closed.length === 0) return [{icon:"📊",title:"Sin datos",body:"Registra tus primeras operaciones para obtener insights personalizados.",type:"neutral" as const}];

    // Win rate insight
    if (stats.winRate >= 0.6)
      list.push({icon:"🎯",title:`Win Rate sólido: ${(stats.winRate*100).toFixed(1)}%`,body:`Estás ganando más de la mitad de tus operaciones. Tu profit factor de ${stats.profitFactor.toFixed(2)} confirma que también gestionas bien el tamaño de los winners.`,type:"positive"});
    else
      list.push({icon:"⚠️",title:`Win Rate mejorable: ${(stats.winRate*100).toFixed(1)}%`,body:`Tu ratio de aciertos está por debajo del 60%. Considera revisar tus setups de entrada o ser más selectivo en qué operaciones tomar.`,type:"warning"});

    // Profit factor
    if (stats.profitFactor >= 2)
      list.push({icon:"💰",title:"Profit Factor excelente",body:`PF de ${stats.profitFactor.toFixed(2)}: por cada dólar perdido ganas ${stats.profitFactor.toFixed(2)}. Tu gestión de pérdidas y ganancias es muy buena.`,type:"positive"});
    else if (stats.profitFactor < 1)
      list.push({icon:"🔴",title:"Profit Factor negativo",body:`PF de ${stats.profitFactor.toFixed(2)}: estás perdiendo más de lo que ganas. Revisa el ratio RR de tus setups y asegúrate de cortar pérdidas antes.`,type:"warning"});

    // Best session
    if (bestSession)
      list.push({icon:"⏰",title:`Mejor sesión: ${bestSession}`,body:`Tus resultados son mejores en la sesión de ${bestSession}. Considera enfocarte en este horario y ser más selectivo en las demás sesiones.`,type:"positive"});

    // Best instrument
    if (bestInstrument)
      list.push({icon:"📈",title:`Mejor instrumento: ${bestInstrument}`,body:`${bestInstrument} es donde obtienes más P&L. La especialización en pocos instrumentos suele mejorar consistencia.`,type:"positive"});

    // Habit correlation
    if (habitScore && habitScore.count >= 3 && habitScore.wr > habitScore.vs)
      list.push({icon:"🌙",title:"Hábitos y rendimiento correlacionados",body:`Los días que duermes 7h+ y haces ejercicio, tu win rate sube al ${habitScore.wr}% (vs ${habitScore.vs}% media general). Cuídate fuera del mercado.`,type:"positive"});

    // Expectancy
    if (stats.expectancy > 0)
      list.push({icon:"✅",title:`Expectancy positiva: ${fmt(stats.expectancy,true)}`,body:`Por cada operación, puedes esperar ganar ${fmt(stats.expectancy)} de media. Sistema con edge positivo.`,type:"positive"});
    else
      list.push({icon:"🚨",title:`Expectancy negativa: ${fmt(stats.expectancy,true)}`,body:`Tu sistema pierde dinero en media. Necesitas mejorar ya sea el win rate, el RR, o ambos.`,type:"warning"});

    return list.slice(0, 6);
  }, [closed, stats, bestSession, bestInstrument, habitScore]);

  // Circumference for donut
  const C = 2 * Math.PI * 15;
  const dashArr = `${(score/100)*C} ${C}`;
  const scoreColor = score>=70?"#00b87a":score>=50?"#3b82f6":score>=30?"#f59e0b":"#f43f5e";

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="text-sm text-muted-foreground">Análisis inteligente de tu trading</p>
        </div>
      </div>

      {/* Trader Profile */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card/60 to-card/60 backdrop-blur p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Score donut */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="3"
                strokeDasharray={dashArr} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-black font-mono" style={{color:scoreColor}}>{closed.length>=3?score:"—"}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className={`text-2xl font-bold ${typeColor}`}>{closed.length>=3?traderType:"Sin datos suficientes"}</div>
            <div className="text-muted-foreground mt-1">{closed.length} operaciones analizadas</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                ["Win Rate", (stats.winRate*100).toFixed(1)+"%"],
                ["Profit Factor", stats.profitFactor>99?"∞":stats.profitFactor.toFixed(2)],
                ["Expectancy", fmt(stats.expectancy,true)],
              ].map(([k,v]) => (
                <div key={k} className="rounded-xl bg-surface/60 border border-border p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                  <div className="font-mono font-bold mt-0.5 text-sm">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-48 text-sm text-muted-foreground leading-relaxed">
            {score >= 70 ? "Operas con disciplina y consistencia. Mantén el proceso y protege el capital." :
             score >= 50 ? "Vas por buen camino. Trabaja en consistencia y en no desviarte de tu plan." :
             score >= 30 ? "Hay margen de mejora. Reduce el tamaño de posición y enfócate en la calidad." :
             "Empieza por construir un sistema claro antes de arriesgar capital real."}
          </div>
        </div>
      </div>

      {/* Insight cards grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((ins, i) => (
          <div key={i} className={`rounded-2xl border backdrop-blur p-5 ${
            ins.type==="positive" ? "border-success/20 bg-success/5" :
            ins.type==="warning"  ? "border-warning/20 bg-warning/5" :
            "border-border bg-card/60"}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{ins.icon}</span>
              <div>
                <div className="text-sm font-semibold mb-1">{ins.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{ins.body}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Best conditions */}
      {closed.length >= 5 && (
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-4">Tus mejores condiciones de trading</div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-xl bg-surface/60 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mejor sesión</div>
              <div className="font-bold">{bestSession ?? "Sin datos"}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface/60 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mejor instrumento</div>
              <div className="font-bold">{bestInstrument ?? "Sin datos"}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface/60 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hábitos + rendimiento</div>
              <div className="font-bold">
                {habitScore ? `WR ${habitScore.wr}% con buenos hábitos` : "Sin correlación aún"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
