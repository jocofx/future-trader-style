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
        .order('created_at', { ascending: false })
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

    // Map React fields → actual Supabase column names
    // The DB may use 'direccion' instead of 'tipo', 'entrada' instead of 'precio_entrada', etc.
    // We try inserting with our field names first, fall back to legacy names if needed
    const row = {
      user_id:       userId,
      instrumento:   trade.instrumento,
      tipo:          trade.tipo,          // BUY/SELL
      direccion:     trade.tipo,          // legacy alias
      fecha:         trade.fecha,
      hora:          trade.hora           ?? null,
      cuenta:        trade.cuenta         ?? null,
      precio_entrada: trade.precio_entrada ?? null,
      entrada:       trade.precio_entrada ?? null, // legacy alias
      precio_salida: trade.precio_salida  ?? null,
      resultado:     trade.resultado      ?? null,
      lotes:         trade.lotes          ?? null,
      contratos:     trade.lotes          ?? null, // legacy alias
      rr:            trade.rr             ?? null,
      sesion:        trade.sesion         ?? null,
      emocion:       trade.emocion        ?? null,
      notas:         trade.notas          ?? null,
      estado:        trade.estado         ?? 'Cerrada',
      estrategia:    trade.estrategia     ?? null,
      setup:         trade.setup          ?? null,
      tags:          trade.tags           ?? null,
      confianza:     trade.confianza      ?? null,
      imagen_url:    trade.imagen_url     ?? null,
    }

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
