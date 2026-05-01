// ── App-level types (derived from DB types) ──────────────────────

export type Trade = {
  id:              string
  user_id:         string
  fecha:           string        // timestamp → we slice to YYYY-MM-DD
  instrumento:     string
  tipo:            'BUY' | 'SELL'
  direccion:       string | null  // same as tipo, legacy name
  entrada:         number | null  // open price
  sl:              number | null
  tp:              number | null
  rr:              number | null
  contratos:       number | null  // lot size
  resultado:       number | null
  setup:           string | null
  emocion:         string | null
  sesion:          string | null
  disciplina:      number | null
  impulsos:        number | null
  errores:         string | null
  notas:           string | null
  estado:          string | null
  cuenta:          string | null
  img_apertura:    string | null
  img_cierre:      string | null
  created_at:      string
  updated_at:      string | null
  mt_ticket:       string | null
  fecha_cierre:    string | null
  plataforma:      string | null
  mt_sincronizada: boolean | null
  // Virtual fields computed by frontend (not in DB):
  precio_entrada?: number | null  // alias of entrada
  precio_salida?:  number | null  // alias of tp (approx)
  lotes?:          number | null  // alias of contratos
  hora?:           string | null
  tags?:           string[] | null
  confianza?:      number | null
  imagen_url?:     string | null
  estrategia?:     string | null
}

export type Account = {
  id: string
  user_id: string
  nombre: string
  broker: string | null
  tipo: string | null
  balance: number | null
  moneda: string | null
  activa: boolean | null
  notas: string | null
  created_at: string
}

export type Habit = {
  id: string
  user_id: string
  fecha: string
  sueno: number | null
  ejercicio: number | null
  meditacion: number | null
  alcohol: number | null
  habitos_extra: Record<string, number> | null
  encuesta: Record<string, unknown> | null
  created_at: string
}

export type DiaryEntry = {
  id: string
  user_id: string
  fecha: string
  contenido: string | null
  emocion: string | null
  confianza: number | null
  imagen_url: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type DayPlan = {
  id: string
  user_id: string
  fecha: string
  sesgo: string | null
  niveles: string | null
  no_hacer: string | null
  notas: string | null
  max_operaciones: number | null
  created_at: string
  updated_at: string
}

export type CapitalEntry = {
  id: string
  user_id: string
  tipo: 'challenge' | 'fondeada' | 'reset' | 'capital_propio' | 'retiro' | 'otro'
  proveedor: string | null
  tamano: string | null
  coste: number
  estado: 'activa' | 'aprobada' | 'fallida' | 'retirada' | null
  fecha: string
  notas: string | null
  created_at: string
}

export type CapitalGanancia = {
  id: string
  user_id: string
  inversion_id: string
  cantidad: number
  fecha: string
  tipo: 'payout' | 'parcial' | 'scaling' | 'reembolso' | 'otro' | null
  notas: string | null
  created_at: string
}

export type ChatMessage = {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type UserPlan = 'free' | 'basic' | 'pro'

export type RiskSettings = {
  maxLoss: number
  maxOps: number
  objetivo: number
  riskPct: number
}

// ── Computed types ───────────────────────────────────────────────

export type TradeStats = {
  total: number
  wins: number
  losses: number
  winRate: number
  pnl: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  expectancy: number
  bestTrade: number
  worstTrade: number
  avgRR: number
}

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter(t => t.resultado !== null && t.resultado !== undefined)
  const wins   = closed.filter(t => (t.resultado ?? 0) > 0)
  const losses = closed.filter(t => (t.resultado ?? 0) < 0)
  const pnl    = closed.reduce((s, t) => s + (t.resultado ?? 0), 0)
  const grossW = wins.reduce((s, t) => s + (t.resultado ?? 0), 0)
  const grossL = Math.abs(losses.reduce((s, t) => s + (t.resultado ?? 0), 0))
  const wr     = closed.length ? wins.length / closed.length : 0
  const avgW   = wins.length   ? grossW / wins.length   : 0
  const avgL   = losses.length ? grossL / losses.length : 0

  return {
    total: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: wr,
    pnl,
    profitFactor: grossL > 0 ? grossW / grossL : grossW > 0 ? 99 : 0,
    avgWin: avgW,
    avgLoss: avgL,
    expectancy: wr * avgW - (1 - wr) * avgL,
    bestTrade:  wins.length   ? Math.max(...wins.map(t => t.resultado ?? 0))    : 0,
    worstTrade: losses.length ? Math.min(...losses.map(t => t.resultado ?? 0))  : 0,
    avgRR: closed.filter(t => t.rr).reduce((s, t) => s + (t.rr ?? 0), 0)
           / (closed.filter(t => t.rr).length || 1),
  }
}
