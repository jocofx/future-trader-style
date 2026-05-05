import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, RefreshCw, Sparkles, Settings, Zap, AlertCircle, MessageSquare } from "lucide-react";
import { UpgradeModal } from "@/components/UpgradeModal";
import { Lock } from "lucide-react";
import { PlanGate } from "@/components/PlanGate";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/coach")({
    component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function CoachPage() {
  const { trades: { trades }, user } = useApp();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! Soy tu Coach IA de trading. Puedo analizar tus operaciones, detectar patrones en tu psicología y ayudarte a mejorar. ¿En qué te ayudo hoy?" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey]   = useState(() => (typeof window !== "undefined" ? localStorage.getItem("tj_ai_key") ?? "" : ""));
  const [showKey, setShowKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const stats = computeStats(trades.filter(t => t.resultado != null));

  const buildContext = () => {
    const recent = trades.slice(0, 20).map(t =>
      `${t.fecha} ${t.instrumento} ${t.tipo} resultado:${t.resultado?.toFixed(2)} emocion:${t.emocion ?? "—"} rr:${t.rr ?? "—"}`
    ).join("\n");

    return `Eres un coach profesional de trading. Datos del trader:
- Total ops: ${stats.total} | Win rate: ${(stats.winRate*100).toFixed(1)}% | P&L: $${stats.pnl.toFixed(2)}
- Profit Factor: ${stats.profitFactor.toFixed(2)} | Expectancy: $${stats.expectancy.toFixed(2)}
- Mejor trade: +$${stats.bestTrade.toFixed(2)} | Peor: -$${Math.abs(stats.worstTrade).toFixed(2)}
Últimas 20 ops:
${recent}
Responde en español. Sé directo, específico y actionable. Usa emojis con moderación.`;
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (!apiKey) { setShowKey(true); return; }

    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (user) {
      await supabase.from("chat_history").insert({ user_id: user.id, role: "user", content: userMsg.content }).catch(() => {});
    }

    try {
      // Route through Supabase Edge Function to avoid exposing API key
    const { data: { session } } = await supabase.auth.getSession();
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coach-chat`;
    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          "x-user-api-key": apiKey, // user's own key if provided
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 800,
          system: buildContext(),
          messages: [...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0), userMsg].map(m => ({
            role: m.role, content: m.content
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `Error ${res.status}`);
      }

      const data = await res.json();
      const reply = data.content?.[0]?.text ?? "Sin respuesta";
      const aiMsg: Msg = { role: "assistant", content: reply };
      setMessages(prev => [...prev, aiMsg]);

      if (user) {
        await supabase.from("chat_history").insert({ user_id: user.id, role: "assistant", content: reply }).catch(() => {});
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Problema de conexión"}` }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    { icon: "🎯", text: "¿Cuál es mi mayor problema de trading?" },
    { icon: "🧠", text: "Analiza mi psicología de las últimas ops" },
    { icon: "📊", text: "¿Qué instrumento me funciona mejor?" },
    { icon: "🚀", text: "Dame 3 cosas a mejorar esta semana" },
  ];

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Conversación reiniciada. ¿En qué te ayudo?" }]);
  };

  return (
    <PlanGate feature="coach_ia" plan="pro">   <div className="p-6 max-w-[1100px] mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Coach · Powered by Claude
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Coach Inteligente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis basado en tus <span className="text-primary font-mono">{stats.total}</span> operaciones reales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat}
            className="h-9 px-3 rounded-xl border border-border bg-surface/60 text-xs font-semibold hover:border-primary/40 hover:text-primary text-muted-foreground transition flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Reiniciar
          </button>
          <button onClick={() => setShowKey(k => !k)}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
              apiKey
                ? "border-success/30 bg-success/8 text-success"
                : "border-warning/30 bg-warning/8 text-warning"
            }`}>
            <Settings className="h-3.5 w-3.5" /> {apiKey ? "API conectada" : "Configurar API"}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Total ops",  value: stats.total.toString(),                            tone: "text-info" },
          { label: "Win rate",   value: `${(stats.winRate*100).toFixed(1)}%`,              tone: stats.winRate >= 0.5 ? "text-success" : "text-warning" },
          { label: "P&L",        value: `${stats.pnl >= 0 ? "+" : "-"}$${Math.abs(stats.pnl).toFixed(0)}`, tone: stats.pnl >= 0 ? "text-success" : "text-destructive" },
          { label: "PF",         value: stats.profitFactor.toFixed(2),                     tone: "text-primary" },
          { label: "Expectancy", value: `$${stats.expectancy.toFixed(2)}`,                 tone: "text-success" },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-border bg-surface/60 backdrop-blur-xl px-3 py-2">
            <div className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
            <div className={`text-sm font-bold font-mono mt-0.5 ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* API Key panel */}
      {showKey && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 backdrop-blur p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold mb-1">Anthropic API Key</div>
              <div className="text-xs text-muted-foreground mb-3">
                Necesitas una API key de <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-primary underline">console.anthropic.com</a>. Se guarda solo en tu navegador.
              </div>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-ant-…"
                  className="flex-1 bg-surface/80 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
                <button onClick={() => { localStorage.setItem("tj_ai_key", apiKey); setShowKey(false); }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 rounded-2xl border border-border bg-surface/70 backdrop-blur-xl overflow-hidden flex flex-col" style={{minHeight:"500px"}}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Conversación
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-success font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ONLINE
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_-4px_oklch(var(--primary)/0.6)]">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto shadow-[0_0_16px_-6px_oklch(var(--primary)/0.5)]"
                  : "bg-surface-2/60 border border-border text-foreground"
              }`}>
                {m.content.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < m.content.split("\n").length-1 && <br/>}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-surface-2/60 border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{animationDelay:"0ms"}}/>
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{animationDelay:"150ms"}}/>
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{animationDelay:"300ms"}}/>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary" /> Sugerencias
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(q => (
                <button key={q.text} onClick={() => sendMessage(q.text)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-border bg-surface-2/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-surface-2 transition flex items-center gap-2">
                  <span className="text-base">{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
            placeholder="Pregunta algo sobre tu trading…"
            className="flex-1 bg-surface-2/60 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_0_16px_-4px_oklch(var(--primary)/0.5)] hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
