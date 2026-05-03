import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiaryEntry } from '@/lib/types'

function normalise(e: any): DiaryEntry {
  return {
    ...e,
    fecha:     (e.fecha ?? '').slice(0, 10),
    emociones: Array.isArray(e.emociones) ? e.emociones : (e.emociones ? [e.emociones] : []),
    // Virtual aliases
    contenido: e.texto    ?? null,
    emocion:   Array.isArray(e.emociones) && e.emociones.length > 0 ? e.emociones[0] : (e.emociones ?? null),
    confianza: e.energia  ?? null,
  } as DiaryEntry
}

export function useDiario(userId: string | null) {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (limit = 365) => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('diario')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false })
        .limit(limit)
      if (error) throw error
      setEntries((data ?? []).map(normalise))
    } catch (e) { console.warn('useDiario.load:', e) }
    finally { setLoading(false) }
  }, [userId])

  const save = async (fecha: string, values: {
    texto?:     string
    leccion?:   string
    energia?:   number
    emociones?: string[]
  }) => {
    if (!userId) throw new Error('Not authenticated')
    const row = {
      user_id:   userId,
      fecha,
      texto:     values.texto     ?? null,
      leccion:   values.leccion   ?? null,
      energia:   values.energia   ?? null,
      emociones: values.emociones ?? null,
    }
    const { data, error } = await supabase
      .from('diario')
      .upsert(row, { onConflict: 'user_id,fecha' })
      .select()
      .single()
    if (error) throw error
    const normalised = normalise(data)
    setEntries(prev => {
      const idx = prev.findIndex(e => e.fecha === fecha)
      if (idx >= 0) { const n = [...prev]; n[idx] = normalised; return n }
      return [normalised, ...prev]
    })
    return normalised
  }

  const getForDate = (fecha: string) =>
    entries.find(e => (e.fecha ?? '').slice(0, 10) === fecha.slice(0, 10)) ?? null

  return { entries, loading, load, save, getForDate }
}
