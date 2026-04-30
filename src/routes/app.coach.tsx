import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { computeStats } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPA_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function CoachPage() {
  const { trades: { trades }, user } = useApp();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "¡Hola! Soy tu Coach IA de trading. Puedo analizar tus operaciones, detectar patrones en tu psicología y ayudarte a mejorar. ¿En qué te ayudo hoy?" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey]   = useState(() => localStorage.getItem("tj_ai_key") ?? "");
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) { setShowKey(true); return; }

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Save to Supabase
    if (user) {
      await supabase.from("chat_history").insert({ user_id: user.id, role: "user", content: userMsg.content }).catch(() => {});
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
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
      setMessages(prev => [...prev, { role: "assistant", content: `❌ Error: ${e instanceof Error ? e.message : "Problema de conexión"}` }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    "¿Cuál es mi mayor problema de trading?",
    "Analiza mi psicología de las últimas ops",
    "¿Qué instrumento me funciona mejor?",
    "Dame 3 cosas a mejorar esta semana",
  ];

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-glow">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Coach IA</h1>
            <p className="text-xs text-muted-foreground">Basado en tus {stats.total} operaciones reales</p>
          </div>
        </div>
        <button onClick={() => setShowKey(k => !k)} className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg transition">
          {apiKey ? "🔑 API Key configurada" : "⚙️ Configurar API Key"}
        </button>
      </div>

      {/* API Key panel */}
      {showKey && (
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur p-4">
          <div className="text-sm font-semibold mb-2">Anthropic API Key</div>
          <div className="text-xs text-muted-foreground mb-3">
            Necesitas una API key de <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-primary underline">console.anthropic.com</a> para usar el Coach IA.
          </div>
          <div className="flex gap-2">
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-..." className="flex-1 bg-surface/80 border border-border-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
            <button onClick={() => { localStorage.setItem("tj_ai_key", apiKey); setShowKey(false); }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition">
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden flex flex-col" style={{minHeight:"500px"}}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-surface/80 border border-border text-foreground"
              }`}>
                {m.content.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < m.content.split("\n").length-1 && <br/>}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-surface/80 border border-border rounded-2xl px-4 py-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {QUICK.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface/60 text-muted-foreground hover:text-foreground hover:border-border-strong transition">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border flex gap-3">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
            placeholder="Pregunta algo sobre tu trading..."
            className="flex-1 bg-surface/70 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow hover:brightness-110 transition disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
