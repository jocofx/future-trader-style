import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trade } from '@/lib/types'

export function useTrades(userId: string | null) {
  const [trades, setTrades]   = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('operaciones')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false })
      if (error) throw error
      // Normalise tipo (BUY/SELL) — mirrors parseSupabaseRow() from legacy JS
      const normalised = (data ?? []).map((t: any) => ({
        ...t,
        tipo: normalizeSide(t.tipo),
        // Normalize fecha to YYYY-MM-DD (Supabase may return full ISO string)
        fecha: (t.fecha ?? '').slice(0, 10),
      })) as Trade[]
      setTrades(normalised)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading trades')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const save = async (trade: Omit<Trade, 'id' | 'created_at'>) => {
    if (!userId) throw new Error('Not authenticated')

    // Build insert row — only include columns confirmed to exist
    // Original schema uses: instrumento, direccion, entrada, resultado, rr,
    // contratos, sesion, emocion, notas, estado, setup, cuenta, fecha
    const row: Record<string, unknown> = {
      user_id:     userId,
      instrumento: trade.instrumento,
      fecha:       trade.fecha,
      resultado:   trade.resultado    ?? null,
      sesion:      trade.sesion       ?? null,
      emocion:     trade.emocion      ?? null,
      notas:       trade.notas        ?? null,
      estado:      trade.estado       ?? 'Cerrada',
      cuenta:      trade.cuenta       ?? null,
      rr:          trade.rr           ?? null,
    }
    // Add direction field — try both column names
    row.tipo      = trade.tipo   // new schema
    row.direccion = trade.tipo   // legacy schema
    // Add price fields — try both names
    if (trade.precio_entrada != null) { row.precio_entrada = trade.precio_entrada; row.entrada = trade.precio_entrada }
    if (trade.precio_salida  != null) { row.precio_salida  = trade.precio_salida  }
    if (trade.lotes          != null) { row.lotes = trade.lotes; row.contratos = trade.lotes }
    if (trade.hora           != null) row.hora = trade.hora
    if (trade.setup          != null) row.setup = trade.setup
    if (trade.tags           != null) row.tags = trade.tags

    const { data, error } = await supabase
      .from('operaciones')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    const normalised = {
      ...data,
      tipo: normalizeSide((data as any).tipo ?? (data as any).direccion),
      fecha: ((data as any).fecha ?? '').slice(0, 10),
    } as Trade
    setTrades(prev => [normalised, ...prev])
    return normalised
  }

  const update = async (id: string, changes: Partial<Trade>) => {
    const { data, error } = await supabase
      .from('operaciones')
      .update(changes)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setTrades(prev => prev.map(t => t.id === id ? (data as Trade) : t))
    return data as Trade
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('operaciones').delete().eq('id', id)
    if (error) throw error
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  return { trades, loading, error, load, save, update, remove }
}

function normalizeSide(side: string | null): 'BUY' | 'SELL' {
  if (!side) return 'BUY'
  const s = side.toUpperCase()
  if (s === 'BUY' || s === 'LONG' || s === '0') return 'BUY'
  if (s === 'SELL' || s === 'SHORT' || s === '1') return 'SELL'
  return 'BUY'
}
