import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { useState } from "react";
import {
  PlugZap, Plus, Search, CheckCircle2, AlertCircle, Loader2, ShieldCheck,
  Zap, RefreshCw, ExternalLink, Lock, Activity, Wifi, WifiOff, Trash2, Settings,
} from "lucide-react";
import { Modal, Field, inputCls, selectCls, ModalButton } from "@/components/Modal";

export const Route = createFileRoute("/app/broker")({
  head: () => ({
    meta: [
      { title: "Conectar Broker · Tradync" },
      { name: "description", content: "Conecta tu broker o prop firm para sincronizar operaciones automáticamente." },
    ],
  }),
  component: BrokerPage,
});

type Status = "connected" | "syncing" | "error" | "disconnected";

type Connection = {
  id: string;
  brokerId: string;
  brokerName: string;
  account: string;
  type: "MT4" | "MT5" | "cTrader" | "API";
  status: Status;
  lastSync: string;
  trades: number;
  balance: number;
};

type BrokerProvider = {
  id: string;
  name: string;
  category: "MetaTrader" | "Prop Firm" | "Crypto" | "Direct API";
  protocols: string[];
  popular?: boolean;
  color: string;
  initial: string;
};

const PROVIDERS: BrokerProvider[] = [
  { id: "mt5",        name: "MetaTrader 5",  category: "MetaTrader", protocols: ["MT5"],         popular: true, color: "oklch(0.78 0.18 158)", initial: "M5" },
  { id: "mt4",        name: "MetaTrader 4",  category: "MetaTrader", protocols: ["MT4"],         popular: true, color: "oklch(0.70 0.16 250)", initial: "M4" },
  { id: "ctrader",    name: "cTrader",       category: "MetaTrader", protocols: ["cTrader"],                    color: "oklch(0.72 0.18 35)",  initial: "cT" },
  { id: "ftmo",       name: "FTMO",          category: "Prop Firm",  protocols: ["MT4", "MT5"], popular: true,  color: "oklch(0.68 0.22 18)",  initial: "FT" },
  { id: "mff",        name: "MyForexFunds",  category: "Prop Firm",  protocols: ["MT4", "MT5"],                  color: "oklch(0.80 0.16 75)",  initial: "MF" },
  { id: "the5ers",    name: "The5%ers",      category: "Prop Firm",  protocols: ["MT5"],                         color: "oklch(0.74 0.18 305)", initial: "5%" },
  { id: "binance",    name: "Binance",       category: "Crypto",     protocols: ["API"],         popular: true,  color: "oklch(0.82 0.16 85)",  initial: "BN" },
  { id: "bybit",      name: "Bybit",         category: "Crypto",     protocols: ["API"],                         color: "oklch(0.76 0.16 65)",  initial: "BY" },
  { id: "interactive",name: "Interactive Brokers", category: "Direct API", protocols: ["API"],                  color: "oklch(0.70 0.14 220)", initial: "IB" },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "c1", brokerId: "ftmo",    brokerName: "FTMO",         account: "1208334",   type: "MT5", status: "connected", lastSync: "hace 2 min",  trades: 47, balance: 104820 },
  { id: "c2", brokerId: "mt5",     brokerName: "IC Markets",   account: "82041921",  type: "MT5", status: "syncing",   lastSync: "sincronizando", trades: 184, balance: 18540 },
  { id: "c3", brokerId: "binance", brokerName: "Binance",      account: "spot-main", type: "API", status: "error",     lastSync: "hace 1 h",    trades: 28, balance: 4210 },
];

const STATUS_META: Record<Status, { label: string; cls: string; Icon: any; dot: string }> = {
  connected:    { label: "Conectado",      cls: "text-success bg-success/10 border-success/25",          Icon: Wifi,        dot: "bg-success animate-pulse" },
  syncing:      { label: "Sincronizando",  cls: "text-info bg-info/10 border-info/25",                   Icon: RefreshCw,   dot: "bg-info animate-pulse" },
  error:        { label: "Error",          cls: "text-destructive bg-destructive/10 border-destructive/25", Icon: AlertCircle, dot: "bg-destructive" },
  disconnected: { label: "Desconectado",   cls: "text-muted-foreground bg-surface-3 border-border",      Icon: WifiOff,     dot: "bg-muted-foreground" },
};

const fmtUSD = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

function BrokerPage() {
  const { user } = useApp();
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Seed con conexiones demo (en producción se cargarían desde Supabase)
  useEffect(() => {
    setConnections(INITIAL_CONNECTIONS);
  }, [user]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<BrokerProvider | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | BrokerProvider["category"]>("all");

  const filteredProviders = PROVIDERS.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (query === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const stats = {
    connected: connections.filter((c) => c.status === "connected").length,
    totalTrades: connections.reduce((s, c) => s + c.trades, 0),
    totalBalance: connections.filter((c) => c.status !== "error").reduce((s, c) => s + c.balance, 0),
  };

  const handleConnect = (data: { account: string; type: Connection["type"]; password?: string }) => {
    if (!selected) return;
    const newConn: Connection = {
      id: `c${Date.now()}`,
      brokerId: selected.id,
      brokerName: selected.name,
      account: data.account,
      type: data.type,
      status: "syncing",
      lastSync: "ahora",
      trades: 0,
      balance: 0,
    };
    setConnections((prev) => [newConn, ...prev]);
    setModalOpen(false);
    setSelected(null);
    // Simulate connection success
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((c) => (c.id === newConn.id ? { ...c, status: "connected" as Status, lastSync: "hace unos segundos" } : c))
      );
    }, 2500);
  };

  const handleDisconnect = (id: string) => {
    if (!confirm("¿Desconectar este broker? Las operaciones ya importadas se mantendrán.")) return;
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const handleResync = (id: string) => {
    setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "syncing" as Status, lastSync: "sincronizando" } : c)));
    setTimeout(() => {
      setConnections((prev) => prev.map((c) => (c.id === id ? { ...c, status: "connected" as Status, lastSync: "hace unos segundos" } : c)));
    }, 1800);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            <PlugZap className="h-3.5 w-3.5 text-primary" />
            Integraciones
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Conectar Broker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sincroniza operaciones automáticamente desde tu broker o prop firm.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Conexiones activas", value: String(stats.connected), Icon: Wifi, tone: "text-success" },
          { label: "Trades sincronizados", value: stats.totalTrades.toLocaleString(), Icon: Activity, tone: "text-info" },
          { label: "Capital monitorizado", value: fmtUSD(stats.totalBalance), Icon: ShieldCheck, tone: "text-primary" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-4 flex items-center gap-3">
            <div className={`h-10 w-10 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 ${k.tone}`}>
              <k.Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
              <div className={`text-xl font-bold font-mono ${k.tone}`}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active connections */}
      {connections.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Conexiones activas
            </h2>
            <span className="text-[11px] text-muted-foreground">{connections.length} broker{connections.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {connections.map((c) => {
              const meta = STATUS_META[c.status];
              const StatusIcon = meta.Icon;
              const provider = PROVIDERS.find((p) => p.id === c.brokerId);
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-surface/70 backdrop-blur-xl p-4 hover:border-primary/30 transition group">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div
                      className="h-12 w-12 rounded-xl grid place-items-center font-bold text-sm shrink-0 border"
                      style={{
                        background: `color-mix(in oklab, ${provider?.color ?? "var(--primary)"} 18%, transparent)`,
                        borderColor: `color-mix(in oklab, ${provider?.color ?? "var(--primary)"} 30%, transparent)`,
                        color: provider?.color,
                      }}
                    >
                      {provider?.initial ?? c.brokerName.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-semibold text-sm">{c.brokerName}</div>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.cls}`}>
                          <StatusIcon className={`h-3 w-3 ${c.status === "syncing" ? "animate-spin" : ""}`} /> {meta.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground font-mono">{c.type}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        #{c.account} · {meta.label === "Conectado" ? meta.label.toLowerCase() : ""} {c.lastSync}
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-right">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Trades</div>
                        <div className="text-sm font-mono font-semibold">{c.trades}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</div>
                        <div className="text-sm font-mono font-semibold">{fmtUSD(c.balance)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => handleResync(c.id)} title="Re-sincronizar"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-primary/40 hover:text-primary text-muted-foreground transition">
                        <RefreshCw className={`h-3.5 w-3.5 ${c.status === "syncing" ? "animate-spin" : ""}`} />
                      </button>
                      <button title="Configuración"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-primary/40 hover:text-primary text-muted-foreground transition">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDisconnect(c.id)} title="Desconectar"
                        className="h-8 w-8 grid place-items-center rounded-lg border border-border bg-surface-2/50 hover:border-destructive/40 hover:text-destructive text-muted-foreground transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Add new broker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Conectar nuevo broker
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar broker…"
                className="h-8 pl-8 pr-3 rounded-lg bg-surface/70 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-48"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-border bg-surface/60 p-1">
              {(["all", "MetaTrader", "Prop Firm", "Crypto", "Direct API"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    category === c
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c === "all" ? "Todos" : c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setModalOpen(true); }}
              className="group relative rounded-xl border border-border bg-surface/60 backdrop-blur-xl p-4 text-left hover:border-primary/40 transition overflow-hidden"
            >
              {p.popular && (
                <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  Popular
                </span>
              )}
              <div
                className="h-10 w-10 rounded-lg grid place-items-center font-bold text-sm border mb-3"
                style={{
                  background: `color-mix(in oklab, ${p.color} 18%, transparent)`,
                  borderColor: `color-mix(in oklab, ${p.color} 30%, transparent)`,
                  color: p.color,
                }}
              >
                {p.initial}
              </div>
              <div className="text-sm font-semibold truncate">{p.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{p.category}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.protocols.map((proto) => (
                  <span key={proto} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground">
                    {proto}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Security note */}
      <div className="rounded-2xl border border-border bg-surface/40 backdrop-blur p-4 flex items-start gap-3">
        <Lock className="h-4 w-4 text-success shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Conexiones de solo lectura.</span> Tradync nunca puede operar en tu broker;
          solo lee historiales y balance. Las credenciales se cifran con AES-256.
        </div>
      </div>

      <ConnectModal
        open={modalOpen}
        provider={selected}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        onConnect={handleConnect}
      />
    </div>
  );
}

function ConnectModal({ open, provider, onClose, onConnect }: {
  open: boolean;
  provider: BrokerProvider | null;
  onClose: () => void;
  onConnect: (data: { account: string; type: Connection["type"]; password?: string }) => void;
}) {
  const [account, setAccount] = useState("");
  const [server, setServer] = useState("");
  const [password, setPassword] = useState("");
  const [type, setType] = useState<Connection["type"]>("MT5");
  const [connecting, setConnecting] = useState(false);

  const reset = () => { setAccount(""); setServer(""); setPassword(""); setType("MT5"); setConnecting(false); };
  const close = () => { onClose(); reset(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setTimeout(() => {
      onConnect({ account, type, password });
      reset();
    }, 800);
  };

  if (!provider) return null;
  const isAPI = provider.protocols.includes("API");

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Conectar ${provider.name}`}
      subtitle="Tus credenciales se cifran end-to-end y nunca abandonan tu cuenta"
      size="md"
      footer={
        <>
          <ModalButton type="button" onClick={close}>Cancelar</ModalButton>
          <ModalButton type="submit" form="connect-form" variant="primary" disabled={!account || connecting}>
            {connecting ? <><Loader2 className="h-3.5 w-3.5 inline mr-1 animate-spin" /> Conectando…</> : <><PlugZap className="h-3.5 w-3.5 inline mr-1" /> Conectar</>}
          </ModalButton>
        </>
      }
    >
      <form id="connect-form" onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/40 border border-border">
          <div
            className="h-10 w-10 rounded-lg grid place-items-center font-bold text-sm border"
            style={{
              background: `color-mix(in oklab, ${provider.color} 18%, transparent)`,
              borderColor: `color-mix(in oklab, ${provider.color} 30%, transparent)`,
              color: provider.color,
            }}
          >
            {provider.initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{provider.name}</div>
            <div className="text-[11px] text-muted-foreground">{provider.category} · {provider.protocols.join(", ")}</div>
          </div>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </div>

        {provider.protocols.length > 1 && (
          <Field label="Protocolo">
            <select className={selectCls} value={type} onChange={(e) => setType(e.target.value as unknown as Connection["type"])}>
              {provider.protocols.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        )}

        <Field label={isAPI ? "API Key" : "Número de cuenta"}>
          <input
            className={inputCls}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={isAPI ? "abc123…" : "1208334"}
            required
            maxLength={64}
          />
        </Field>

        {!isAPI && (
          <Field label="Servidor" hint="Ej: ICMarketsSC-Live01, FTMO-Server">
            <input className={inputCls} value={server} onChange={(e) => setServer(e.target.value)} placeholder="FTMO-Server" maxLength={50} />
          </Field>
        )}

        <Field label={isAPI ? "API Secret" : "Contraseña de inversor (read-only)"}>
          <input
            className={inputCls}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            maxLength={128}
          />
        </Field>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2/40 hover:border-primary/40 transition group text-xs"
        >
          <span className="text-muted-foreground">¿Cómo obtengo mis credenciales?</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
        </a>
      </form>
    </Modal>
  );
}
