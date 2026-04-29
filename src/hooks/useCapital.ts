import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CapitalEntry, CapitalGanancia } from '@/lib/types'

export function useCapital(userId: string | null) {
  const [entries, setEntries]     = useState<CapitalEntry[]>([])
  const [ganancias, setGanancias] = useState<CapitalGanancia[]>([])
  const [loading, setLoading]     = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [invRes, ganRes] = await Promise.all([
      supabase.from('capital_tracker').select('*').eq('user_id', userId).order('fecha', { ascending: false }),
      supabase.from('capital_ganancias').select('*').eq('user_id', userId).order('fecha', { ascending: false }),
    ])
    setEntries((invRes.data ?? []) as CapitalEntry[])
    setGanancias((ganRes.data ?? []) as CapitalGanancia[])
    setLoading(false)
  }, [userId])

  const addEntry = async (entry: Omit<CapitalEntry, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('capital_tracker')
      .insert({ ...entry, user_id: userId! })
      .select().single()
    if (error) throw error
    setEntries(prev => [data as CapitalEntry, ...prev])
    return data as CapitalEntry
  }

  const removeEntry = async (id: string) => {
    await supabase.from('capital_tracker').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const addGanancia = async (g: Omit<CapitalGanancia, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('capital_ganancias')
      .insert({ ...g, user_id: userId! })
      .select().single()
    if (error) throw error
    setGanancias(prev => [data as CapitalGanancia, ...prev])
    return data as CapitalGanancia
  }

  const removeGanancia = async (id: string) => {
    await supabase.from('capital_ganancias').delete().eq('id', id)
    setGanancias(prev => prev.filter(g => g.id !== id))
  }

  // Computed metrics
  const getMetrics = () => {
    const inversiones = entries.filter(e => e.tipo !== 'retiro')
    const retiros     = entries.filter(e => e.tipo === 'retiro')
    const totalInv    = inversiones.reduce((s, e) => s + e.coste, 0)
    const totalRetiros= retiros.reduce((s, e) => s + e.coste, 0)
    const totalGan    = ganancias.reduce((s, g) => s + g.cantidad, 0)
    const totalGanado = totalRetiros + totalGan
    const neto        = totalGanado - totalInv
    const roi         = totalInv > 0 ? (neto / totalInv) * 100 : 0

    const challenges  = inversiones.filter(e => ['challenge','fondeada','reset'].includes(e.tipo))
    const aprobadas   = challenges.filter(e => e.estado === 'aprobada').length
    const fallidas    = challenges.filter(e => e.estado === 'fallida').length

    return { totalInv, totalGanado, totalRetiros, totalGan, neto, roi, challenges: challenges.length, aprobadas, fallidas }
  }

  const getInvStats = (invId: string) => {
    const related = ganancias.filter(g => g.inversion_id === invId)
    const totalGanado = related.reduce((s, g) => s + g.cantidad, 0)
    return { ganancias: related, totalGanado }
  }

  return { entries, ganancias, loading, load, addEntry, removeEntry, addGanancia, removeGanancia, getMetrics, getInvStats }
}
