import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Sugerencia {
  id:          string
  user_id:     string
  titulo:      string
  descripcion: string
  categoria:   string
  votos:       number
  status:      'pendiente' | 'en_revision' | 'planificada' | 'implementada' | 'descartada'
  created_at:  string
  ya_vote?:    boolean
}

const ADMIN_ID = '7b14f1e1-4e5a-41e9-a3cc-48161ca41adb'

export function useSugerencias(userId: string | null) {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('sugerencias')
        .select('*')
        .order('votos', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error

      // Get user's votes
      const { data: votes } = await supabase
        .from('sugerencias_votos')
        .select('sugerencia_id')
        .eq('user_id', userId)

      const votedIds = new Set((votes ?? []).map(v => v.sugerencia_id))
      setSugerencias((data ?? []).map(s => ({ ...s, ya_vote: votedIds.has(s.id) })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const add = async (titulo: string, descripcion: string, categoria: string) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('sugerencias')
      .insert({ user_id: userId, titulo, descripcion, categoria })
      .select()
      .single()
    if (error) throw error
    setSugerencias(prev => [{ ...data, ya_vote: false }, ...prev])
    return data
  }

  const vote = async (id: string) => {
    if (!userId) return
    const sug = sugerencias.find(s => s.id === id)
    if (!sug) return

    if (sug.ya_vote) {
      // Remove vote
      await supabase.from('sugerencias_votos').delete()
        .eq('sugerencia_id', id).eq('user_id', userId)
      await supabase.from('sugerencias').update({ votos: Math.max(0, sug.votos - 1) }).eq('id', id)
      setSugerencias(prev => prev.map(s => s.id === id ? { ...s, votos: Math.max(0, s.votos - 1), ya_vote: false } : s))
    } else {
      // Add vote
      await supabase.from('sugerencias_votos').insert({ sugerencia_id: id, user_id: userId })
      await supabase.from('sugerencias').update({ votos: sug.votos + 1 }).eq('id', id)
      setSugerencias(prev => prev.map(s => s.id === id ? { ...s, votos: s.votos + 1, ya_vote: true } : s))
    }
  }

  const updateStatus = async (id: string, status: Sugerencia['status']) => {
    if (userId !== ADMIN_ID) return
    await supabase.from('sugerencias').update({ status }).eq('id', id)
    setSugerencias(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const remove = async (id: string) => {
    if (userId !== ADMIN_ID) return
    await supabase.from('sugerencias').delete().eq('id', id)
    setSugerencias(prev => prev.filter(s => s.id !== id))
  }

  return { sugerencias, loading, error, load, add, vote, updateStatus, remove }
}
