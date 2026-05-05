import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LineChart, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Plus, Wallet, Target, Percent } from "lucide-react";
import { useState } from "react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";
import type { CapitalEntry, CapitalGanancia } from "@/lib/types";

export const Route = createFileRoute("/app/capital")({
  component: CapitalPage,
});

function fmtUSD(n: number, sign = false) {
  const abs = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pfx = sign ? (n >= 0 ? "+" : "-") : (n < 0 ? "-" : "");
  return pfx + "$" + abs;
}
function fmtPct(n: number) { return (n >= 0 ? "+" : "") + n.toFixed(1) + "%" }

const TIPO_EMOJI: Record<string, string> = {
  challenge: "🎯", fondeada: "🏆", reset: "🔄", capital_propio: "💰", retiro: "📈", otro: "📦"
}
const GAN_EMOJI: Record<string, string> = {
  payout: "💸", parcial: "📊", scaling: "📈", reembolso: "🔄", otro: "📦"
}

// ── Modal components ──────────────────────────────────────────────
function InversionModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (e: Omit<CapitalEntry, "id" | "created_at">) => Promise<CapitalEntry | void>
}) {
  const [tipo, setTipo]       = useState("")
  const [proveedor, setProv]  = useState("")
  const [tamano, setTam]      = useState("")
  const [coste, setCoste]     = useState("")
  const [estado, setEstado]   = useState("activa")
  const [fecha, setFecha]     = useState(new Date().toISOString().slice(0, 10))
  const [notas, setNotas]     = useState("")
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState("")

  const submit = async () => {
    if (!tipo) return setErr("Selecciona el tipo")
    if (!coste || isNaN(Number(coste))) return setErr("Introduce el importe")
    setSaving(true)
    try {
      await onSave({ user_id: "", tipo: tipo as CapitalEntry["tipo"], proveedor: proveedor || null, tamano: tamano || null, coste: Number(coste), estado: estado as CapitalEntry["estado"], fecha, notas: notas || null })
      onClose()
    } catch(e) { setErr(e instanceof Error ? e.message : "Error guardando") }
    finally { setSaving(false) }
  }

  const tipos = [["challenge","🎯 Challenge"],["fondeada","🏆 Fondeada"],["reset","🔄 Reset"],["capital_propio","💰 Capital propio"],["retiro","📈 Retiro"],["otro","📦 Otro"]]

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border-strong rounded-2xl w-full max-width-md shadow-elegant p-6" style={{maxWidth:"480px"}}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-lg font-bold">Registrar inversión</div>
            <div className="text-xs text-muted-foreground mt-0.5">Challenge, fondeada, retiro...</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {tipos.map(([val, label]) => (
            <button key={val} onClick={() => setTipo(val)}
              className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition ${tipo === val ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:border-border-strong"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Proveedor</label>
            <input value={proveedor} onChange={e => setProv(e.target.value)} placeholder="FTMO, TopStep..." className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tamaño</label>
            <input value={tamano} onChange={e => setTam(e.target.value)} placeholder="50K, 100K..." className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Coste ($)</label>
            <input type="number" value={coste} onChange={e => setCoste(e.target.value)} placeholder="149.00" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {(["activa","aprobada","fallida","retirada"] as const).map(s => (
            <button key={s} onClick={() => setEstado(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${estado === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-border-strong"}`}>
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>

        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Notas opcionales..." className="w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none mb-4" />

        {err && <div className="text-destructive text-xs mb-3">{err}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-2 flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar inversión"}
          </button>
        </div>
      </div>
    </div>
  )
}

function GananciaModal({ entries, onClose, onSave, preselect }: {
  entries: CapitalEntry[]
  preselect?: string
  onClose: () => void
  onSave: (g: Omit<CapitalGanancia, "id" | "created_at">) => Promise<CapitalGanancia | void>
}) {
  const [invId, setInvId]   = useState(preselect ?? "")
  const [cantidad, setCant] = useState("")
  const [fecha, setFecha]   = useState(new Date().toISOString().slice(0, 10))
  const [tipo, setTipo]     = useState("payout")
  const [notas, setNotas]   = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState("")

  const submit = async () => {
    if (!invId) return setErr("Selecciona una inversión")
    if (!cantidad || isNaN(Number(cantidad))) return setErr("Introduce la cantidad")
    setSaving(true)
    try {
      await onSave({ user_id: "", inversion_id: invId, cantidad: Number(cantidad), fecha, tipo: tipo as CapitalGanancia["tipo"], notas: notas || null })
      onClose()
    } catch(e) { setErr(e instanceof Error ? e.message : "Error guardando") }
    finally { setSaving(false) }
  }

  const tipos = [["payout","💸 Payout"],["parcial","📊 Parcial"],["scaling","📈 Scaling"],["reembolso","🔄 Reembolso"],["otro","📦 Otro"]]

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border-strong rounded-2xl w-full shadow-elegant p-6" style={{maxWidth:"460px"}}>
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg font-bold text-success">↑ Registrar ganancia</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition">✕</button>
        </div>

        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Inversión vinculada *</label>
          <select value={invId} onChange={e => setInvId(e.target.value)} className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="">— Selecciona —</option>
            {entries.filter(e => e.tipo !== "retiro").map(e => (
              <option key={e.id} value={e.id}>
                {TIPO_EMOJI[e.tipo] ?? "📦"} {e.proveedor ?? e.tipo}{e.tamano ? ` ${e.tamano}` : ""} · ${e.coste} ({e.fecha.slice(0,10)})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cantidad ($) *</label>
            <input type="number" value={cantidad} onChange={e => setCant(e.target.value)} placeholder="500.00" className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" style={{borderColor:"rgba(0,184,122,0.3)"}} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1 w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {tipos.map(([val, label]) => (
            <button key={val} onClick={() => setTipo(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${tipo === val ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:border-border-strong"}`}>
              {label}
            </button>
          ))}
        </div>

        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} placeholder="Notas opcionales..." className="w-full bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none mb-4" />

        {err && <div className="text-destructive text-xs mb-3">{err}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold shadow-glow hover:brightness-110 transition disabled:opacity-50" style={{background:"linear-gradient(135deg,var(--success),var(--info))"}}>
            {saving ? "Guardando..." : "Guardar ganancia"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────
function CapitalPage() {
  const { capital: { entries, ganancias, loading, addEntry, removeEntry, addGanancia, removeGanancia, getMetrics, getInvStats } } = useApp()
  const [showInv, setShowInv]         = useState(false)
  const [showGan, setShowGan]         = useState(false)
  const [preselect, setPreselect]     = useState<string | undefined>()
  const [view, setView]               = useState<"inversiones" | "ganancias">("inversiones")

  const m = getMetrics()

  const kpis = [
    { label: "Total Invertido",   value: fmtUSD(m.totalInv),    icon: ArrowUpFromLine, tone: "destructive" as const },
    { label: "Total Ganado",      value: fmtUSD(m.totalGanado), icon: ArrowDownToLine, tone: "success" as const },
    { label: "Beneficio Neto",    value: fmtUSD(m.neto, true),  icon: TrendingUp,      tone: m.neto >= 0 ? "success" as const : "destructive" as const },
    { label: "ROI Total",         value: fmtPct(m.roi),         icon: Percent,         tone: m.roi >= 0 ? "success" as const : "destructive" as const },
    { label: "Cuentas",           value: String(m.challenges),  icon: Wallet,          tone: "default" as const },
    { label: "Aprobadas",         value: String(m.aprobadas),   icon: Target,          tone: "success" as const },
  ]

  const toneColor = (t: string) =>
    t === "success" ? "text-success" : t === "destructive" ? "text-destructive" : "text-foreground"

  return (
    <PlanGate feature="capital" plan="basic">
       <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Modals */}
      {showInv && (
        <InversionModal
          onClose={() => setShowInv(false)}
          onSave={e => addEntry(e)}
        />
      )}
      {showGan && (
        <GananciaModal
          entries={entries}
          preselect={preselect}
          onClose={() => { setShowGan(false); setPreselect(undefined) }}
          onSave={g => addGanancia(g)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <LineChart className="h-3.5 w-3.5 text-primary" />
            Capital Tracker
            <span className="ml-1 rounded-md bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 tracking-wider">NEW</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rentabilidad real</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Invertido {fmtUSD(m.totalInv)} · Ganado {fmtUSD(m.totalGanado)} →{" "}
            <span className={m.neto >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
              {fmtUSD(m.neto, true)} neto
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGan(true)} className="glass rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 hover:border-success/30 transition">
            <TrendingUp className="h-4 w-4 text-success" /> Registrar ganancia
          </button>
          <button onClick={() => setShowInv(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-glow hover:brightness-110 transition">
            <Plus className="h-4 w-4" /> Registrar inversión
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur p-4">
            <div className="flex items-start justify-between">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
              <div className="h-8 w-8 grid place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <k.icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`text-xl font-bold font-mono mt-2 ${toneColor(k.tone)}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex gap-2">
            {(["inversiones","ganancias"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${view === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
                {v === "ganancias" && ganancias.length > 0 && (
                  <span className="ml-1.5 text-success font-mono">+{fmtUSD(ganancias.reduce((s,g) => s+g.cantidad, 0))}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Cargando…</div>
        ) : view === "inversiones" ? (
          entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <div className="text-3xl mb-3">💰</div>
              Sin inversiones registradas. Registra tu primer challenge o capital.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  {["Tipo","Proveedor","Fecha","Estado","Coste","Neto","Ganancias",""].map(h => (
                    <th key={h} className="text-left font-medium py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const stats = getInvStats(e.id)
                  const neto  = stats.totalGanado - e.coste
                  const isPos = neto >= 0
                  return (
                    <tr key={e.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                      <td className="py-3 px-4">{TIPO_EMOJI[e.tipo] ?? "📦"} <span className="font-semibold">{e.tipo.replace("_"," ")}</span></td>
                      <td className="py-3 px-4 text-muted-foreground">{e.proveedor ?? "—"}{e.tamano ? ` ${e.tamano}` : ""}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{e.fecha.slice(0,10)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          e.estado === "aprobada" ? "text-success border-success/30 bg-success/10" :
                          e.estado === "fallida"  ? "text-destructive border-destructive/30 bg-destructive/10" :
                          e.estado === "retirada" ? "text-warning border-warning/30 bg-warning/10" :
                          "text-primary border-primary/30 bg-primary/10"}`}>
                          {(e.estado ?? "activa").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-destructive font-mono font-semibold">-{fmtUSD(e.coste)}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${isPos ? "text-success" : "text-destructive"}`}>
                        {e.tipo !== "retiro" ? fmtUSD(neto, true) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {stats.ganancias.length > 0 ? (
                          <span className="text-success font-mono text-xs">+{fmtUSD(stats.totalGanado)} ({stats.ganancias.length})</span>
                        ) : (
                          <button onClick={() => { setPreselect(e.id); setShowGan(true) }}
                            className="text-xs text-primary/70 hover:text-primary border border-primary/20 hover:border-primary/40 px-2 py-0.5 rounded-md transition">
                            + Ganancia
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => removeEntry(e.id)} className="text-muted-foreground hover:text-destructive transition text-sm">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        ) : (
          ganancias.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <div className="text-3xl mb-3">📈</div>
              Sin ganancias registradas todavía.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-surface/30">
                  {["Fecha","Tipo","Cantidad","Inversión","Notas",""].map(h => (
                    <th key={h} className="text-left font-medium py-3 px-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ganancias.map(g => {
                  const inv = entries.find(e => e.id === g.inversion_id)
                  const invLabel = inv ? `${TIPO_EMOJI[inv.tipo] ?? "📦"} ${inv.proveedor ?? inv.tipo}${inv.tamano ? ` ${inv.tamano}` : ""}` : "—"
                  return (
                    <tr key={g.id} className="border-b border-border/60 hover:bg-surface/40 transition">
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{g.fecha.slice(0,10)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/30 bg-success/10 text-success">
                          {GAN_EMOJI[g.tipo ?? "otro"] ?? "📦"} {(g.tipo ?? "otro").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-success">+{fmtUSD(g.cantidad)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{invLabel}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{g.notas ?? "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => removeGanancia(g.id)} className="text-muted-foreground hover:text-destructive transition text-sm">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
    </PlanGate>
  )
}
