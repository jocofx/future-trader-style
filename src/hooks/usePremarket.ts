import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DayPlan } from '@/lib/types'

export function usePremarket(userId: string | null) {
  const [plans, setPlans]         = useState<DayPlan[]>([])
  const [checklistState, setState] = useState<Record<string, boolean[]>>({})
  const [loading, setLoading]     = useState(false)

  const load = useCallback(async (year?: number, month?: number) => {
    if (!userId) return
    setLoading(true)
    let query = supabase.from('planes').select('*').eq('user_id', userId)
    if (year !== undefined && month !== undefined) {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const end   = `${year}-${String(month + 1).padStart(2, '0')}-31`
      query = query.gte('fecha', start).lte('fecha', end)
    }
    const { data: planData } = await query.order('fecha', { ascending: false })
    setPlans((planData ?? []) as DayPlan[])

    // Load checklist states for the month
    if (year !== undefined && month !== undefined) {
      const prefix = `checklist_daily_${year}-${String(month + 1).padStart(2, '0')}`
      const { data: configs } = await supabase
        .from('configuracion')
        .select('clave,valor')
        .eq('user_id', userId)
        .like('clave', `${prefix}%`)
      const stateMap: Record<string, boolean[]> = {}
      ;(configs ?? []).forEach((c: any) => {
        const date = c.clave.replace('checklist_daily_', '')
        const val = c.valor as { state?: boolean[] }
        if (val?.state) stateMap[date] = val.state
      })
      setState(prev => ({ ...prev, ...stateMap }))
    }
    setLoading(false)
  }, [userId])

  const savePlan = async (fecha: string, plan: Partial<DayPlan>) => {
    if (!userId) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('planes')
      .upsert({ ...plan, user_id: userId, fecha }, { onConflict: 'user_id,fecha' })
      .select().single()
    if (error) throw error
    setPlans(prev => {
      const idx = prev.findIndex(p => p.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = data as DayPlan; return n }
      return [data as DayPlan, ...prev]
    })
    return data as DayPlan
  }

  const saveChecklist = async (fecha: string, state: boolean[]) => {
    if (!userId) return
    setState(prev => ({ ...prev, [fecha]: state }))
    await supabase.from('configuracion').upsert({
      user_id: userId,
      clave: `checklist_daily_${fecha}`,
      valor: { state, date: fecha, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
  }

  const getPlan = (fecha: string) => plans.find(p => p.fecha === fecha) ?? null
  const getChecklist = (fecha: string) => checklistState[fecha] ?? []

  return { plans, checklistState, loading, load, savePlan, saveChecklist, getPlan, getChecklist }
}
