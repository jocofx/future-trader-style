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
    const { data, error } = await supabase
      .from('operaciones')
      .insert({ ...trade, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setTrades(prev => [data as Trade, ...prev])
    return data as Trade
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
