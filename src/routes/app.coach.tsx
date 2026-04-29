import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkles, Bot } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/coach")({
  component: CoachPage,
});

const SUGGESTIONS = [
  "¿En qué horario tengo mejor win rate?",
  "Analiza mi sesgo emocional esta semana",
  "Plan para reducir drawdown en NAS100",
  "Detecta mis errores recurrentes",
];

function CoachPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hola Juan Carlos 👋 He revisado tus últimas 30 operaciones. Tu disciplina mejoró un 14% esta semana — pero detecté un patrón de revenge trading después de las 14:00. ¿Quieres que profundice?" },
    { role: "user", text: "Sí, muéstrame el patrón." },
    { role: "ai", text: "Tras una pérdida superior a 1.5R, en 7 de 9 casos abriste una nueva operación en menos de 12 minutos, sin checklist completo. El R promedio de esos trades fue −0.9R. Recomendación: cool-down obligatorio de 30 min y revisar tu checklist antes de re-entrar." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", text: input }, { role: "ai", text: "Analizando tu pregunta sobre tus datos…" }]);
    setInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-4 h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Coach IA
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/20 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> ONLINE
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">Personalizado con tus 247 operaciones · GPT-4 turbo + datos en vivo</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-border bg-card/40 backdrop-blur p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 text-xs font-bold ${m.role === "user" ? "bg-surface-3 text-foreground" : "bg-gradient-primary text-primary-foreground shadow-glow"}`}>
              {m.role === "user" ? "JC" : <Sparkles className="h-4 w-4" />}
            </div>
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary/15 text-foreground border border-primary/20" : "glass"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full glass hover:border-primary/40 text-muted-foreground hover:text-foreground transition">
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Pregúntale al Coach IA…"
            className="w-full h-14 pl-5 pr-14 rounded-2xl bg-card/80 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-card"
          />
          <button onClick={send} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
