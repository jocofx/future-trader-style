import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageSquarePlus, ChevronUp, Sparkles, Clock, CheckCircle2, XCircle, ListChecks, Lightbulb, Bug, Zap, Globe, Settings, Shield, MoreHorizontal, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSugerencias } from "@/hooks/useSugerencias";

export const Route = createFileRoute("/app/sugerencias")({ component: SugerenciasPage });

const ADMIN_ID = "7b14f1e1-4e5a-41e9-a3cc-48161ca41adb";

const CATEGORIAS = [
  { id: "funcionalidad", label: "Nueva función",  Icon: Zap,             color: "text-primary bg-primary/10 border-primary/20" },
  { id: "mejora",        label: "Mejora",          Icon: Sparkles,        color: "text-warning bg-warning/10 border-warning/20" },
  { id: "bug",           label: "Bug / Error",     Icon: Bug,             color: "text-destructive bg-destructive/10 border-destructive/20" },
  { id: "ux",            label: "Diseño / UX",     Icon: Globe,           color: "text-info bg-info/10 border-info/20" },
  { id: "integracion",   label: "Integración",     Icon: Settings,        color: "text-success bg-success/10 border-success/20" },
  { id: "seguridad",     label: "Seguridad",       Icon: Shield,          color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  { id: "general",       label: "General",         Icon: Lightbulb,       color: "text-muted-foreground bg-surface border-border" },
];

const STATUS_META = {
  pendiente:    { label: "Pendiente",    color: "text-muted-foreground bg-surface border-border",           Icon: Clock },
  en_revision:  { label: "En revisión", color: "text-warning bg-warning/10 border-warning/20",             Icon: ListChecks },
  planificada:  { label: "Planificada", color: "text-info bg-info/10 border-info/20",                      Icon: Sparkles },
  implementada: { label: "Hecho ✓",     color: "text-success bg-success/10 border-success/20",             Icon: CheckCircle2 },
  descartada:   { label: "Descartada",  color: "text-muted-foreground bg-surface/40 border-border/50",     Icon: XCircle },
};

function SugerenciasPage() {
  const { user } = useApp();
  const s = useSugerencias(user?.id ?? null);
  const isAdmin = user?.id === ADMIN_ID;

  const [showForm, setShowForm]   = useState(false);
  const [titulo, setTitulo]       = useState("");
  const [desc, setDesc]           = useState("");
  const [cat, setCat]             = useState("funcionalidad");
  const [saving, setSaving]       = useState(false);
  const [filter, setFilter]       = useState<string>("all");
  const [sortBy, setSortBy]       = useState<"votos" | "reciente">("votos");
  const [adminMenu, setAdminMenu] = useState<string | null>(null);

  useEffect(() => { s.load(); }, []);

  const handleSubmit = async () => {
    if (!titulo.trim() || !desc.trim()) return;
    setSaving(true);
    try {
      await s.add(titulo.trim(), desc.trim(), cat);
      setTitulo(""); setDesc(""); setCat("funcionalidad"); setShowForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally { setSaving(false); }
  };

  const filtered = s.sugerencias
    .filter(sg => filter === "all" || sg.categoria === filter || sg.status === filter)
    .sort((a, b) => sortBy === "votos" ? b.votos - a.votos : b.created_at.localeCompare(a.created_at));

  const getCat = (id: string) => CATEGORIAS.find(c => c.id === id) ?? CATEGORIAS[6];

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <MessageSquarePlus className="h-3.5 w-3.5 text-primary" /> Comunidad
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Buzón de sugerencias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Propón mejoras, vota las ideas de otros y ayúdanos a construir TradyncApp juntos.
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow hover:brightness-110 transition">
          <MessageSquarePlus className="h-4 w-4" />
          Nueva sugerencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sugerencias", value: s.sugerencias.length },
          { label: "Planificadas", value: s.sugerencias.filter(sg => sg.status === "planificada").length },
          { label: "Implementadas", value: s.sugerencias.filter(sg => sg.status === "implementada").length },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface/60 p-4 text-center">
            <div className="text-2xl font-bold font-mono text-primary">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* New suggestion form */}
      {showForm && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur p-5 space-y-4">
          <div className="font-bold text-sm">Tu sugerencia</div>

          {/* Category */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Categoría</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CATEGORIAS.map(c => {
                const Icon = c.Icon;
                return (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
                      cat === c.id ? c.color : "border-border text-muted-foreground hover:border-primary/30"
                    }`}>
                    <Icon className="h-3 w-3" /> {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={100}
              placeholder="Resume tu idea en una frase…"
              className="mt-1 w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{titulo.length}/100</div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Descripción</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} maxLength={500}
              placeholder="Explica el problema que resuelve, cómo debería funcionar…"
              className="mt-1 w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <div className="text-[10px] text-muted-foreground mt-1 text-right">{desc.length}/500</div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold hover:bg-surface transition">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving || !titulo.trim() || !desc.trim()}
              className="flex-1 h-10 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-50">
              {saving ? "Enviando…" : "Enviar sugerencia →"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-surface/60 border border-border rounded-xl p-1">
          {(["votos", "reciente"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sortBy === s ? "bg-card shadow text-foreground" : "text-muted-foreground"}`}>
              {s === "votos" ? "Más votadas" : "Más recientes"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 ml-2">
          <button onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
            Todas
          </button>
          {["planificada", "implementada"].map(st => {
            const meta = STATUS_META[st as keyof typeof STATUS_META];
            return (
              <button key={st} onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filter === st ? meta.color : "border-border text-muted-foreground hover:border-primary/30"}`}>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {s.loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-surface/40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquarePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
          <div className="text-sm font-semibold">Sin sugerencias aún</div>
          <div className="text-xs text-muted-foreground mt-1">¡Sé el primero en proponer una mejora!</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sg => {
            const cat    = getCat(sg.categoria);
            const status = STATUS_META[sg.status as keyof typeof STATUS_META] ?? STATUS_META.pendiente;
            const CatIcon    = cat.Icon;
            const StatusIcon = status.Icon;
            const isOwn  = sg.user_id === user?.id;

            return (
              <div key={sg.id}
                className={`flex gap-4 rounded-2xl border bg-surface/60 backdrop-blur p-4 transition hover:border-primary/20 ${sg.status === "implementada" ? "opacity-70" : ""}`}>

                {/* Vote button */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <button onClick={() => s.vote(sg.id)}
                    className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border transition ${
                      sg.ya_vote
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                    }`}>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-xs font-bold font-mono">{sg.votos}</span>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm leading-snug">{sg.titulo}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
                        <CatIcon className="h-2.5 w-2.5" /> {cat.label}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                        <StatusIcon className="h-2.5 w-2.5" /> {status.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{sg.descripcion}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>{new Date(sg.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {isOwn && <span className="text-primary font-semibold">· Tu sugerencia</span>}
                  </div>
                </div>

                {/* Admin menu */}
                {isAdmin && (
                  <div className="relative shrink-0">
                    <button onClick={() => setAdminMenu(adminMenu === sg.id ? null : sg.id)}
                      className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {adminMenu === sg.id && (
                      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-border bg-card shadow-xl overflow-hidden"
                        onClick={() => setAdminMenu(null)}>
                        {(Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map(st => (
                          <button key={st} onClick={() => s.updateStatus(sg.id, st)}
                            className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-surface transition flex items-center gap-2 ${sg.status === st ? "text-primary" : "text-muted-foreground"}`}>
                            {React.createElement(STATUS_META[st].Icon, { className: "h-3 w-3" })}
                            {STATUS_META[st].label}
                          </button>
                        ))}
                        <div className="border-t border-border" />
                        <button onClick={() => { if (window.confirm("¿Eliminar esta sugerencia?")) s.remove(sg.id); }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition flex items-center gap-2">
                          <Trash2 className="h-3 w-3" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
