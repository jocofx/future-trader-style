import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Habit } from '@/lib/types'

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (year?: number, month?: number) => {
    if (!userId) return
    setLoading(true)
    let query = supabase.from('habitos').select('*').eq('user_id', userId)
    if (year !== undefined && month !== undefined) {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const end   = `${year}-${String(month + 1).padStart(2, '0')}-31`
      query = query.gte('fecha', start).lte('fecha', end)
    }
    const { data } = await query.order('fecha', { ascending: false })
    setHabits((data ?? []) as Habit[])
    setLoading(false)
  }, [userId])

  const save = async (fecha: string, values: Partial<Habit>) => {
    if (!userId) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('habitos')
      .upsert({ ...values, user_id: userId, fecha }, { onConflict: 'user_id,fecha' })
      .select().single()
    if (error) throw error
    setHabits(prev => {
      const idx = prev.findIndex(h => h.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = data as Habit; return n }
      return [data as Habit, ...prev]
    })
    return data as Habit
  }

  const getForDate = (fecha: string) => habits.find(h => h.fecha === fecha) ?? null

  return { habits, loading, load, save, getForDate }
}
