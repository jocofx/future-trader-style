// Manages custom habits per user — stored in 'configuracion' table
// clave: 'habitos_config' → valor: { habits: HabitConfig[] }

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type HabitConfig = {
  id:      string
  label:   string
  unit:    string
  max:     number
  target:  string
  inverse: boolean  // true = lower is better (e.g. alcohol)
  icon:    string   // emoji icon
  order:   number
}

const DEFAULT_HABITS: HabitConfig[] = [
  { id: 'sueno',      label: 'Sueño',      unit: 'h',   max: 10,  target: '≥ 7h',    inverse: false, icon: '🌙', order: 0 },
  { id: 'ejercicio',  label: 'Ejercicio',  unit: 'min', max: 120, target: '≥ 30min', inverse: false, icon: '💪', order: 1 },
  { id: 'meditacion', label: 'Meditación', unit: 'min', max: 60,  target: '≥ 10min', inverse: false, icon: '🧘', order: 2 },
  { id: 'alcohol',    label: 'Alcohol',    unit: 'u',   max: 5,   target: '= 0',     inverse: true,  icon: '🍷', order: 3 },
]

const CLAVE = 'habitos_config'

export function useHabitosConfig(userId: string | null) {
  const [habits, setHabits]   = useState<HabitConfig[]>(DEFAULT_HABITS)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('user_id', userId)
        .eq('clave', CLAVE)
        .maybeSingle()

      if (data?.valor && (data.valor as any).habits?.length > 0) {
        setHabits((data.valor as any).habits as HabitConfig[])
      }
    } catch (e) { console.warn(e) }
    finally { setLoading(false) }
  }, [userId])

  const saveAll = async (newHabits: HabitConfig[]) => {
    if (!userId) return
    await supabase.from('configuracion').upsert({
      user_id:    userId,
      clave:      CLAVE,
      valor:      { habits: newHabits, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
    setHabits(newHabits)
  }

  const addHabit = async (h: Omit<HabitConfig, 'id' | 'order'>) => {
    const next = [...habits, {
      ...h,
      id:    crypto.randomUUID().slice(0, 8),
      order: habits.length,
    }]
    await saveAll(next)
  }

  const updateHabit = async (id: string, changes: Partial<HabitConfig>) => {
    const next = habits.map(h => h.id === id ? { ...h, ...changes } : h)
    await saveAll(next)
  }

  const removeHabit = async (id: string) => {
    const next = habits.filter(h => h.id !== id).map((h, i) => ({ ...h, order: i }))
    await saveAll(next)
  }

  const moveHabit = async (id: string, dir: 'up' | 'down') => {
    const idx = habits.findIndex(h => h.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === habits.length - 1) return
    const next = [...habits]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    await saveAll(next.map((h, i) => ({ ...h, order: i })))
  }

  return { habits, loading, load, addHabit, updateHabit, removeHabit, moveHabit, saveAll }
}
