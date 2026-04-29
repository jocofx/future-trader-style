import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/lib/types'

export function useDiario(userId: string | null) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (limit = 60) => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('diario')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(limit)
    setEntries((data ?? []) as DiaryEntry[])
    setLoading(false)
  }, [userId])

  const save = async (fecha: string, values: Partial<DiaryEntry>) => {
    if (!userId) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('diario')
      .upsert({ ...values, user_id: userId, fecha }, { onConflict: 'user_id,fecha' })
      .select().single()
    if (error) throw error
    setEntries(prev => {
      const idx = prev.findIndex(e => e.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = data as DiaryEntry; return n }
      return [data as DiaryEntry, ...prev]
    })
    return data as DiaryEntry
  }

  const getForDate = (fecha: string) => entries.find(e => e.fecha === fecha) ?? null

  return { entries, loading, load, save, getForDate }
}
