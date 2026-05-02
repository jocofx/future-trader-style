// Manages custom checklist items per user — stored in 'configuracion' table
// clave: 'checklist_config' → valor: { items: ChecklistItem[] }

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type ChecklistItem = {
  id:    string
  text:  string
  order: number
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'He revisado el calendario económico',               order: 0 },
  { id: '2', text: 'He identificado niveles clave (soporte/resistencia)', order: 1 },
  { id: '3', text: 'Conozco mi sesgo del día (alcista/bajista/neutral)', order: 2 },
  { id: '4', text: 'He definido mi máximo de pérdida del día',           order: 3 },
  { id: '5', text: 'He descansado bien (mínimo 6h de sueño)',            order: 4 },
  { id: '6', text: 'No tengo distracciones ni estrés externo relevante', order: 5 },
  { id: '7', text: 'He revisado operaciones abiertas (si las hay)',      order: 6 },
  { id: '8', text: 'Tengo claro qué setups voy a buscar hoy',            order: 7 },
]

const CLAVE = 'checklist_config'

export function useChecklistConfig(userId: string | null) {
  const [items, setItems]     = useState<ChecklistItem[]>(DEFAULT_ITEMS)
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

      if (data?.valor && (data.valor as any).items?.length > 0) {
        setItems((data.valor as any).items as ChecklistItem[])
      }
    } catch (e) { console.warn(e) }
    finally { setLoading(false) }
  }, [userId])

  const saveAll = async (newItems: ChecklistItem[]) => {
    if (!userId) return
    await supabase.from('configuracion').upsert({
      user_id:    userId,
      clave:      CLAVE,
      valor:      { items: newItems, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
    setItems(newItems)
  }

  const addItem = async (text: string) => {
    if (!text.trim()) return
    const next = [...items, {
      id:    crypto.randomUUID().slice(0, 8),
      text:  text.trim(),
      order: items.length,
    }]
    await saveAll(next)
  }

  const updateItem = async (id: string, text: string) => {
    const next = items.map(it => it.id === id ? { ...it, text } : it)
    await saveAll(next)
  }

  const removeItem = async (id: string) => {
    const next = items.filter(it => it.id !== id).map((it, i) => ({ ...it, order: i }))
    await saveAll(next)
  }

  const moveItem = async (id: string, dir: 'up' | 'down') => {
    const idx = items.findIndex(it => it.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === items.length - 1) return
    const next = [...items]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    await saveAll(next.map((it, i) => ({ ...it, order: i })))
  }

  return { items, loading, load, addItem, updateItem, removeItem, moveItem }
}
