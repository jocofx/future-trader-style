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
        .limit(1000) // safety cap — prevents huge queries
      if (error) throw error
      // Normalise tipo (BUY/SELL) — mirrors parseSupabaseRow() from legacy JS
      const normalised = (data ?? []).map((t: any) => ({
        ...t,
        // Normalize direction field
        tipo:          normalizeSide(t.tipo ?? t.direccion),
        // Normalize fecha to YYYY-MM-DD
        fecha:         (t.fecha ?? '').slice(0, 10),
        // Virtual aliases for frontend display
        precio_entrada: t.entrada    ?? null,
        precio_salida:  t.tp         ?? null,
        lotes:          t.contratos  ?? null,
      })) as Trade[]
      setTrades(normalised)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading trades')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const save = async (trade: Omit<Trade, 'id' | 'created_at'> & Record<string, unknown>) => {
    if (!userId) throw new Error('Not authenticated')

    // Build insert row using REAL column names from operaciones table
    const row: Record<string, unknown> = {
      user_id:    userId,
      instrumento: trade.instrumento,
      fecha:      new Date(trade.fecha || new Date()).toISOString(),
      tipo:       trade.tipo,
      direccion:  trade.tipo,
      resultado:  trade.resultado   ?? null,
      rr:         trade.rr          ?? null,
      sesion:     trade.sesion      ?? null,
      emocion:    trade.emocion     ?? null,
      notas:      trade.notas       ?? null,
      estado:     trade.estado      ?? 'Cerrada',
      cuenta:     trade.cuenta      ?? null,
      setup:      trade.setup       ?? null,
      // Map virtual aliases to real column names
      entrada:    trade.precio_entrada ?? trade.entrada   ?? null,
      sl:         null,
      tp:         trade.precio_salida  ?? trade.tp        ?? null,
      contratos:  trade.lotes          ?? trade.contratos ?? null,
    }

        const { data, error } = await supabase
      .from('operaciones')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    const normalised = {
      ...(data as any),
      tipo:          normalizeSide((data as any).tipo ?? (data as any).direccion),
      fecha:         ((data as any).fecha ?? '').slice(0, 10),
      precio_entrada: (data as any).entrada   ?? null,
      precio_salida:  (data as any).tp        ?? null,
      lotes:          (data as any).contratos ?? null,
    } as Trade
    setTrades(prev => [normalised, ...prev])
    return normalised
  }

  const update = async (id: string, changes: Partial<Trade>) => {
    const { data, error } = await supabase
      .from('operaciones')
      .update(changes)
      .eq('id', id)
      .eq('user_id', userId!) // extra RLS safety
      .select()
      .single()
    if (error) throw error
    const normalised = {
      ...(data as any),
      tipo:           normalizeSide((data as any).tipo ?? (data as any).direccion),
      fecha:          ((data as any).fecha ?? '').slice(0, 10),
      precio_entrada: (data as any).entrada   ?? null,
      precio_salida:  (data as any).tp        ?? null,
      lotes:          (data as any).contratos ?? null,
    } as Trade
    setTrades(prev => prev.map(t => t.id === id ? normalised : t))
    return normalised
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
