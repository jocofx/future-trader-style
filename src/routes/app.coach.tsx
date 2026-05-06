import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, RefreshCw, Sparkles, Settings, Zap, AlertCircle } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";
import { usePlan } from "@/hooks/usePlan";
import { computeStats } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/coach")({ component: CoachPage });

type Msg = { role: "user" | "assistant"; content: string; time?: string };

const QUICK = [
  { icon: "🎯", label: "Problema principal", text: "¿Cuál es mi mayor problema de trading según mis datos?" },
  { icon: "🧠", label: "Psicología",         text: "Analiza mi psicología y emociones en las últimas operaciones" },
  { icon: "📊", label: "Mejor instrumento",  text: "¿Qué instrumento me funciona mejor y por qué?" },
  { icon: "🚀", label: "Plan de mejora",     text: "Dame 3 cosas concretas a mejorar esta semana" },
  { icon: "💪", label: "Hábitos",            text: "¿Cómo están afectando mis hábitos a mis resultados?" },
  { icon: "💰", label: "Rentabilidad",       text: "¿Cuál es mi rentabilidad real y cómo puedo mejorarla?" },
];

// Render message content with markdown-like formatting
function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

function CoachPage() {
  const { trades: { trades } } = useApp();
  const { isPro } = usePlan();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu Coach IA de trading.\n\nPuedo analizar tus operaciones reales, detectar patrones en tu psicología y darte recomendaciones concretas para mejorar.\n\n¿En qué te ayudo hoy?",
      time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey]   = useState(() => sessionStorage.getItem("tj_ai_key") ?? "");
  const [showKey, setShowKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const stats = computeStats(trades.filter(t => t.resultado != null));

  const buildContext = () => {
    const recent = trades.slice(0, 20).map(t =>
      `${t.fecha} ${t.instrumento} ${t.tipo} pnl:${t.resultado?.toFixed(2)} emocion:${t.emocion ?? "—"} rr:${t.rr ?? "—"} sesion:${t.sesion ?? "—"}`
    ).join("\n");
    return `Eres un coach profesional de trading. Analiza con precisión y da consejos concretos y accionables.

Datos del trader:
- Operaciones totales: ${stats.total} | Win rate: ${(stats.winRate*100).toFixed(1)}% | P&L total: $${stats.pnl.toFixed(2)}
- Profit Factor: ${stats.profitFactor.toFixed(2)} | Expectancy: $${stats.expectancy.toFixed(2)}
- Mejor trade: +$${stats.bestTrade.toFixed(2)} | Peor trade: -$${Math.abs(stats.worstTrade).toFixed(2)}

Últimas 20 operaciones:
${recent || "Sin operaciones registradas aún"}

Instrucciones:
- Responde siempre en español
- Sé directo, específico y usa los datos reales del trader
- Usa **negrita** para resaltar puntos importantes
- Mantén respuestas concisas (máx 200 palabras salvo que pidan análisis completo)
- Si no hay datos suficientes, indícalo y da consejos generales`;
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!apiKey && !isPro) { setShowKey(true); return; }

    const now = new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Msg = { role: "user", content: text, time: now };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`, {
        method: "POST",
        headers: {
          "Content-Type":   "application/json",
          "Authorization":  `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "x-user-api-key": apiKey,
        },
        body: JSON.stringify({
          system:   buildContext(),
          messages: [...messages, userMsg]
            .filter(m => m.role !== "assistant" || messages.indexOf(m) > 0)
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Error ${res.status}`);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Sin respuesta";
      setMessages(prev => [...prev, {
        role: "assistant", content: reply,
        time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `❌ ${e instanceof Error ? e.message : "Error de conexión. Inténtalo de nuevo."}`,
        time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (!window.confirm("¿Eliminar la conversación?")) return;
    setMessages([{
      role: "assistant",
      content: "Conversación eliminada. ¿En qué te ayudo?",
      time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    }]);
  };

  return (
    <PlanGate feature="coach_ia" plan="pro">
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 max-w-[1000px] mx-auto gap-4">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-none">Coach IA</h1>
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Powered by Claude · {stats.total} operaciones analizadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <button onClick={() => setShowKey(k => !k)}
              className={`h-8 px-2.5 rounded-xl border text-[11px] font-semibold transition flex items-center gap-1.5 ${
                apiKey ? "border-success/30 bg-success/8 text-success" : "border-border text-muted-foreground hover:border-primary/40"
              }`}>
              <Settings className="h-3 w-3" /> {apiKey ? "API activa" : "API Key"}
            </button>
          )}
          <button onClick={clearChat}
            className="h-8 px-2.5 rounded-xl border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3" /> Eliminar chat
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2 shrink-0">
        {[
          { label: "Ops",       value: stats.total.toString(),                                          color: "text-foreground" },
          { label: "Win Rate",  value: `${(stats.winRate*100).toFixed(0)}%`,                            color: stats.winRate >= 0.5 ? "text-success" : "text-warning" },
          { label: "P&L",       value: `${stats.pnl >= 0 ? "+" : ""}$${stats.pnl.toFixed(0)}`,         color: stats.pnl >= 0 ? "text-success" : "text-destructive" },
          { label: "PF",        value: stats.profitFactor.toFixed(2),                                   color: stats.profitFactor >= 1 ? "text-primary" : "text-destructive" },
          { label: "Expectancy",value: `$${stats.expectancy.toFixed(1)}`,                               color: stats.expectancy >= 0 ? "text-success" : "text-destructive" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-surface/60 px-2 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* API Key panel */}
      {showKey && !isPro && (
        <div className="rounded-2xl border border-border bg-surface/60 p-4 shrink-0">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">API Key de Anthropic</div>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-…"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                <button onClick={() => { sessionStorage.setItem("tj_ai_key", apiKey); setShowKey(false); }}
                  className="px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick buttons — always visible */}
      <div className="shrink-0">
        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          <Zap className="h-3 w-3 text-primary" /> Preguntas rápidas
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {QUICK.map(q => (
            <button key={q.text} onClick={() => sendMessage(q.text)} disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface/50 hover:bg-surface hover:border-primary/30 hover:text-foreground text-muted-foreground transition disabled:opacity-40 text-left">
              <span className="text-base shrink-0">{q.icon}</span>
              <span className="text-[11px] font-medium leading-tight">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-surface/40 backdrop-blur flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center shrink-0 shadow-glow mt-0.5">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[82%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm shadow-glow"
                    : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
                }`}>
                  {m.role === "assistant"
                    ? <MessageContent content={m.content} />
                    : <p className="leading-relaxed">{m.content}</p>
                  }
                </div>
                {m.time && (
                  <span className="text-[10px] text-muted-foreground px-1">{m.time}</span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-primary grid place-items-center shrink-0 shadow-glow mt-0.5">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"0ms"}}/>
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"150ms"}}/>
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{animationDelay:"300ms"}}/>
                <span className="text-xs text-muted-foreground ml-1">Analizando...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-surface/60 flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Escribe tu pregunta…"
            className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-glow hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
    </PlanGate>
  );
}
