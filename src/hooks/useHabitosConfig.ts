// Manages custom habits per user — stored in 'habitos_custom' table
// habitos_custom.habitos = { config: HabitConfig[], updated_at: string }

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type HabitConfig = {
  id:      string
  label:   string
  unit:    string
  max:     number
  target:  string
  inverse: boolean
  icon:    string
  order:   number
  // If 'builtin', maps to a fixed column in habitos table
  // If 'extra', stored in habitos_extra jsonb
  type:    'builtin' | 'extra'
  dbKey:   string   // column name or key in habitos_extra
}

export const DEFAULT_HABITS: HabitConfig[] = [
  { id: 'sueno',      label: 'Sueño',      unit: 'h',   max: 10,  target: '≥ 7h',    inverse: false, icon: '🌙', order: 0, type: 'builtin', dbKey: 'sueno'      },
  { id: 'ejercicio',  label: 'Ejercicio',  unit: 'min', max: 120, target: '≥ 30min', inverse: false, icon: '💪', order: 1, type: 'builtin', dbKey: 'ejercicio'  },
  { id: 'meditacion', label: 'Meditación', unit: 'min', max: 60,  target: '≥ 10min', inverse: false, icon: '🧘', order: 2, type: 'builtin', dbKey: 'meditacion' },
  { id: 'alcohol',    label: 'Alcohol',    unit: 'u',   max: 5,   target: '= 0',     inverse: true,  icon: '🍷', order: 3, type: 'builtin', dbKey: 'alcohol'    },
]

export function useHabitosConfig(userId: string | null) {
  const [habits, setHabits]   = useState<HabitConfig[]>(DEFAULT_HABITS)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('habitos_custom')
        .select('habitos')
        .eq('user_id', userId)
        .maybeSingle()

      if (data?.habitos && (data.habitos as any).config?.length > 0) {
        setHabits((data.habitos as any).config as HabitConfig[])
      }
      // else keep defaults
    } catch (e) { console.warn('useHabitosConfig.load:', e) }
    finally { setLoading(false) }
  }, [userId])

  const saveAll = async (newHabits: HabitConfig[]) => {
    if (!userId) return
    const { error } = await supabase
      .from('habitos_custom')
      .upsert({
        user_id:    userId,
        habitos:    { config: newHabits, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    if (error) throw error
    setHabits(newHabits)
  }

  const addHabit = async (h: Omit<HabitConfig, 'id' | 'order' | 'type' | 'dbKey'>) => {
    const id = crypto.randomUUID().slice(0, 8)
    const next = [...habits, {
      ...h, id, order: habits.length,
      type:  'extra' as const,
      dbKey: `custom_${id}`,
    }]
    await saveAll(next)
  }

  const updateHabit = async (id: string, changes: Partial<HabitConfig>) => {
    const next = habits.map(h => h.id === id ? { ...h, ...changes } : h)
    await saveAll(next)
  }

  const removeHabit = async (id: string) => {
    const next = habits
      .filter(h => h.id !== id)
      .map((h, i) => ({ ...h, order: i }))
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
