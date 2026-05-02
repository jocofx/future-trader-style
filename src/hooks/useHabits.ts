import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Habit } from '@/lib/types'

export function useHabits(userId: string | null) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (year?: number, month?: number) => {
    if (!userId) return
    setLoading(true)
    try {
      let query = supabase.from('habitos').select('*').eq('user_id', userId)
      if (year !== undefined && month !== undefined) {
        const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
        const end   = `${year}-${String(month + 1).padStart(2, '0')}-31`
        query = query.gte('fecha', start).lte('fecha', end)
      }
      const { data } = await query.order('fecha', { ascending: false })
      // Normalize: merge habitos_extra into top-level keys
      const normalised = (data ?? []).map((h: any) => ({
        ...h,
        fecha: (h.fecha ?? '').slice(0, 10),
        ...(h.habitos_extra ?? {}),
      })) as Habit[]
      setHabits(normalised)
      setLoading(false)
    } catch(e) { console.warn('useHabits.load:', e); setLoading(false) }
  }, [userId])

  const save = async (fecha: string, values: Record<string, number>) => {
    if (!userId) throw new Error('Not authenticated')

    // Split values into builtin columns and extra fields
    const BUILTIN = ['sueno', 'ejercicio', 'meditacion', 'alcohol']
    const builtin: Record<string, number> = {}
    const extra:   Record<string, number> = {}

    for (const [k, v] of Object.entries(values)) {
      if (BUILTIN.includes(k)) builtin[k] = v
      else extra[k] = v
    }

    // Calculate puntuacion based on builtin habits
    let puntuacion = 0
    if ((builtin.sueno      ?? 0) >= 7)  puntuacion++
    if ((builtin.ejercicio  ?? 0) >= 30) puntuacion++
    if ((builtin.meditacion ?? 0) >= 10) puntuacion++
    if ((builtin.alcohol    ?? 0) === 0) puntuacion++

    const row: Record<string, unknown> = {
      user_id:        userId,
      fecha,
      ...builtin,
      habitos_extra:  Object.keys(extra).length > 0 ? extra : null,
      puntuacion,
      updated_at:     new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('habitos')
      .upsert(row, { onConflict: 'user_id,fecha' })
      .select()
      .single()
    if (error) throw error

    const normalised = {
      ...(data as any),
      fecha: ((data as any).fecha ?? '').slice(0, 10),
      ...((data as any).habitos_extra ?? {}),
    } as Habit

    setHabits(prev => {
      const idx = prev.findIndex(h => h.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = normalised; return n }
      return [normalised, ...prev]
    })
    return normalised
  }

  const getForDate = (fecha: string) =>
    habits.find(h => (h.fecha ?? '').slice(0, 10) === fecha) ?? null

  return { habits, loading, load, save, getForDate }
}
