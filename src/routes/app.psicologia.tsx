import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Brain } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/app/psicologia")({
  component: PsicologiaPage,
});

const GREEN = "oklch(0.78 0.18 158)";
const RED   = "oklch(0.68 0.22 18)";

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
      name, pnl: parseFloat(d.pnl.toFixed(2)),
      wr: d.count ? Math.round(d.wins/d.count*100) : 0,
      count: d.count,
    })).sort((a,b) => b.count - a.count).slice(0,8);
  }, [closedTrades]);

  // Confianza vs resultado
  const confData = useMemo(() => {
    const map: Record<number,{pnl:number;count:number}> = {};
    closedTrades.filter(t => t.confianza).forEach(t => {
      const c = t.confianza!;
      if (!map[c]) map[c] = { pnl:0, count:0 };
      map[c].pnl += t.resultado ?? 0;
      map[c].count++;
    });
    return Array.from({length:10},(_,i) => ({
      name: String(i+1),
      avg: map[i+1]?.count ? parseFloat((map[i+1].pnl/map[i+1].count).toFixed(2)) : 0,
      count: map[i+1]?.count ?? 0,
    }));
  }, [closedTrades]);

  // Alerts
  const alerts = useMemo(() => {
    const a: {type:"warning"|"danger"|"success"; msg:string}[] = [];
    const trades7 = closedTrades.filter(t => new Date(t.fecha) >= new Date(Date.now()-7*86400000));

    // Revenge trading: loss followed by bigger size
    let revengeCount = 0;
    for (let i=1;i<closedTrades.length;i++) {
      if ((closedTrades[i-1].resultado??0)<0 && (closedTrades[i].lotes??0)>(closedTrades[i-1].lotes??0))
        revengeCount++;
    }
    if (revengeCount > 2) a.push({type:"danger", msg:`Posible revenge trading: ${revengeCount} veces aumentaste tamaño tras pérdida`});

    // Overtrading
    const days: Record<string,number> = {};
    trades7.forEach(t => { days[t.fecha] = (days[t.fecha]??0)+1; });
    const maxDay = Math.max(...Object.values(days), 0);
    if (maxDay > 8) a.push({type:"warning", msg:`Overtrading detectado: ${maxDay} operaciones en un día esta semana`});

    // Good streak
    let streak=0, maxStreak=0;
    [...closedTrades].sort((a,b)=>a.fecha.localeCompare(b.fecha)).forEach(t=>{
      if((t.resultado??0)>0){streak++;maxStreak=Math.max(maxStreak,streak);}else streak=0;
    });
    if (maxStreak >= 5) a.push({type:"success", msg:`Racha ganadora de ${maxStreak} operaciones consecutivas 🔥`});

    // Win rate by emotion
    const anxious = emoData.find(e => e.name==="ansioso");
    if (anxious && anxious.count >= 3 && anxious.wr < 40)
      a.push({type:"warning", msg:`Cuando operas ansioso tu win rate cae al ${anxious.wr}% — considera hacer pausa`});

    return a;
  }, [closedTrades, emoData]);

  // Diary emotion stats
  const diaryEmoStats = useMemo(() => {
    const map: Record<string,number> = {};
    entries.forEach(e => { if(e.emocion) map[e.emocion] = (map[e.emocion]??0)+1; });
    return EMOCIONES_ORDER.filter(k => map[k]).map(k => ({ key:k, count:map[k] }));
  }, [entries]);

  // Patterns (tag analysis)
  const tagData = useMemo(() => {
    const map: Record<string,{pnl:number;count:number;wins:number}> = {};
    closedTrades.forEach(t => {
      (t.tags??[]).forEach(tag => {
        if (!map[tag]) map[tag] = {pnl:0,count:0,wins:0};
        map[tag].pnl += t.resultado??0;
        map[tag].count++;
        if((t.resultado??0)>0) map[tag].wins++;
      });
    });
    return Object.entries(map).map(([name,d]) => ({
      name, pnl: parseFloat(d.pnl.toFixed(2)),
      wr: Math.round(d.wins/d.count*100), count: d.count,
    })).sort((a,b) => b.count-a.count).slice(0,6);
  }, [closedTrades]);

  const alertColors = { warning:"border-warning/30 bg-warning/8 text-warning", danger:"border-destructive/30 bg-destructive/8 text-destructive", success:"border-success/30 bg-success/8 text-success" };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Psicología</h1>
          <p className="text-sm text-muted-foreground">Análisis emocional y patrones de comportamiento</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a,i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${alertColors[a.type]}`}>
              <span className="text-lg flex-shrink-0">{a.type==="danger"?"🚨":a.type==="warning"?"⚠️":"✅"}</span>
              <span className="text-sm font-medium">{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Emoción vs P&L + Confianza vs Resultado */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-1">P&L por emoción</div>
          <div className="text-xs text-muted-foreground mb-4">Cómo afecta tu estado emocional al resultado</div>
          {emoData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Añade emociones a tus operaciones</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={emoData} layout="vertical" barSize={14}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                <XAxis type="number" tick={{fontSize:10,fill:"var(--muted-foreground)"}} tickFormatter={v=>`$${v}`} />
                <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:"var(--muted-foreground)"}} width={70} />
                <Tooltip formatter={(v:number) => [`$${v.toFixed(2)}`,"P&L"]} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8}} />
                <Bar dataKey="pnl" radius={[0,4,4,0]}>
                  {emoData.map((d,i) => <Cell key={i} fill={d.pnl>=0?GREEN:RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-1">Confianza vs Resultado</div>
          <div className="text-xs text-muted-foreground mb-4">P&L medio según tu nivel de confianza (1–10)</div>
          {confData.every(d=>d.count===0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Añade confianza a tus operaciones</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={confData} barSize={18}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize:10,fill:"var(--muted-foreground)"}} />
                <YAxis tick={{fontSize:10,fill:"var(--muted-foreground)"}} tickFormatter={v=>`$${v}`} />
                <Tooltip formatter={(v:number,_,p) => [`$${v.toFixed(2)} (${p.payload.count} ops)`,"P&L medio"]} contentStyle={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8}} />
                <Bar dataKey="avg" radius={[4,4,0,0]}>
                  {confData.map((d,i) => <Cell key={i} fill={d.avg>=0?GREEN:RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Tags + Diary emotions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Tags */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-4">Rendimiento por tag/setup</div>
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
                      <div className="flex gap-3 text-muted-foreground">
                        <span>{t.wr}% WR</span>
                        <span>{t.count} ops</span>
                        <span className={`font-bold ${pos?"text-success":"text-destructive"}`}>{pos?"+":""}{t.pnl.toFixed(0)}$</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${t.wr}%`,background:pos?GREEN:RED}} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Diary emotions */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur p-5">
          <div className="text-sm font-semibold mb-4">Emociones en el diario</div>
          {diaryEmoStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Registra tu estado emocional en el diario</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {diaryEmoStats.map(e => (
                <div key={e.key} className="flex items-center gap-3 p-3 rounded-xl bg-surface/40 border border-border">
                  <span className="text-2xl">{EMO_EMOJI[e.key]??"😐"}</span>
                  <div>
                    <div className="text-sm font-semibold capitalize">{e.key}</div>
                    <div className="text-xs text-muted-foreground">{e.count} {e.count===1?"día":"días"}</div>
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
          <span className="text-xl">💡</span>
          <div className="text-sm font-semibold">Consejos basados en tus datos</div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
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
  );
}
