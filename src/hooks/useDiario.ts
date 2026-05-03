import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/lib/types'

export function useDiario(userId: string | null) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (limit = 60) => {
    if (!userId) return
    setLoading(true)
    try {
    const { data } = await supabase
      .from('diario')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(Math.max(limit, 365))  // always load at least a year of entries
    const normalised = (data ?? []).map((e: any) => ({
      ...e,
      fecha: (e.fecha ?? '').slice(0, 10),
    })) as DiaryEntry[]
    setEntries(normalised)
    setLoading(false)
    } catch(e) { console.warn(e); setLoading(false); }
  }, [userId])

  const save = async (fecha: string, values: Partial<DiaryEntry>) => {
    if (!userId) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('diario')
      .upsert({ ...values, user_id: userId, fecha }, { onConflict: 'user_id,fecha' })
      .select().single()
    if (error) throw error
    const normalised = { ...(data as any), fecha: ((data as any).fecha ?? '').slice(0, 10) } as DiaryEntry
    setEntries(prev => {
      const idx = prev.findIndex(e => e.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = normalised; return n }
      return [normalised, ...prev]
    })
    return normalised
  }

  const getForDate = (fecha: string) => entries.find(e => (e.fecha ?? '').slice(0, 10) === fecha.slice(0, 10)) ?? null

  return { entries, loading, load, save, getForDate }
}
