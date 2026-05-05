import { createFileRoute, Link } from "@tanstack/react-router";
import { PlugZap, Info, ArrowRight, ExternalLink, CheckCircle2, Cpu, Wifi } from "lucide-react";

export const Route = createFileRoute("/app/broker")({ component: BrokerPage });

const BROKERS = [
  { id: "mt5",     name: "MetaTrader 5",        logo: "M5",  color: "oklch(0.78 0.18 158)", supported: true,  method: "ea",   popular: true },
  { id: "mt4",     name: "MetaTrader 4",        logo: "M4",  color: "oklch(0.70 0.16 250)", supported: false, method: "ea" },
  { id: "ctrader", name: "cTrader",             logo: "cT",  color: "oklch(0.72 0.18 35)",  supported: false, method: "ea" },
  { id: "ftmo",    name: "FTMO",                logo: "FT",  color: "oklch(0.68 0.22 18)",  supported: true,  method: "ea",   popular: true },
  { id: "topstep", name: "TopStep",             logo: "TS",  color: "oklch(0.74 0.20 250)", supported: true,  method: "ea",   popular: true },
  { id: "mff",     name: "MyForexFunds",        logo: "MF",  color: "oklch(0.80 0.16 75)",  supported: true,  method: "ea" },
  { id: "the5ers", name: "The5%ers",            logo: "5%",  color: "oklch(0.74 0.18 305)", supported: true,  method: "ea" },
  { id: "binance", name: "Binance",             logo: "BN",  color: "oklch(0.82 0.16 85)",  supported: false, method: "api" },
  { id: "bybit",   name: "Bybit",               logo: "BY",  color: "oklch(0.76 0.16 65)",  supported: false, method: "api" },
  { id: "ib",      name: "Interactive Brokers", logo: "IB",  color: "oklch(0.70 0.14 220)", supported: false, method: "api" },
];

function BrokerPage() {
  const supported = BROKERS.filter(b => b.supported);
  const unsupported = BROKERS.filter(b => !b.supported);

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
          <PlugZap className="h-3.5 w-3.5 text-primary" /> Conexiones
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Conectar Broker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sincroniza tus operaciones automáticamente con TradyncApp.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-info/20 bg-info/5 p-5">
        <div className="flex gap-4">
          <div className="text-2xl shrink-0">💡</div>
          <div className="space-y-2 flex-1">
            <div className="font-semibold text-sm">¿Cómo funciona la sincronización?</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TradyncApp se conecta a tu broker a través del <span className="font-semibold text-foreground">Gestor EA</span> —
              un Expert Advisor (EA) que instalas en MetaTrader 5. Una vez instalado, el EA sincroniza tus operaciones,
              balance y equity en tiempo real, y aplica automáticamente los límites de riesgo que configures.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              {[
                { icon: "📥", title: "Descarga el EA", desc: "Desde Gestor EA, descarga el archivo .mq5 con tu token ya configurado" },
                { icon: "⚙️", title: "Instala en MT5",  desc: "Arrastra el archivo a la carpeta Experts de MetaTrader 5 y compílalo" },
                { icon: "🔄", title: "Sincronización",  desc: "El EA envía operaciones y balance cada 3 segundos automáticamente" },
              ].map(s => (
                <div key={s.title} className="rounded-xl bg-surface/40 border border-border/60 p-3">
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xs font-semibold">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="pt-1">
              <Link to="/app/gestor-ea"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition">
                <Cpu className="h-3.5 w-3.5" /> Ir al Gestor EA <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Supported brokers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <h2 className="text-sm font-semibold">Compatible con TradyncApp EA</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold">
            {supported.length} plataformas
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supported.map(b => (
            <div key={b.id}
              className="rounded-2xl border border-success/20 bg-surface/60 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl grid place-items-center text-sm font-bold text-white shrink-0"
                style={{ background: b.color }}>
                {b.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  {b.name}
                  {b.popular && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-bold">Popular</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-success">
                  <Wifi className="h-3 w-3" /> Compatible con EA
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">Próximamente</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {unsupported.map(b => (
            <div key={b.id}
              className="rounded-2xl border border-border bg-surface/30 p-4 flex items-center gap-3 opacity-60">
              <div className="h-10 w-10 rounded-xl grid place-items-center text-sm font-bold text-white shrink-0 grayscale"
                style={{ background: b.color }}>
                {b.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-muted-foreground">{b.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {b.method === "api" ? "Integración API — En desarrollo" : "EA compatible — Próximamente"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-sm">¿Usas un broker que no está en la lista?</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Puedes añadir operaciones manualmente en el Journal mientras añadimos soporte oficial.
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link to="/app/operaciones"
            className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-surface transition flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5" /> Journal manual
          </Link>
          <a href="mailto:soporte@tradyncapp.com"
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" /> Solicitar integración
          </a>
        </div>
      </div>
    </div>
  );
}
