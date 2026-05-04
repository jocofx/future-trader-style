import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type EAStatus = 'active' | 'paused' | 'disconnected' | 'error'

export type EAInstance = {
  id:              string
  user_id:         string
  token:           string
  name:            string | null
  platform:        string
  account_number:  string | null
  broker:          string | null
  server:          string | null
  currency:        string | null
  leverage:        number | null
  account_type:    string | null
  status:          EAStatus
  // Risk config
  max_ops_dia:     number
  limite_perdida:  number
  limite_ganancia: number
  hora_inicio:     number
  hora_fin:        number
  modo_restrictivo: boolean
  // Live metrics
  balance:         number | null
  equity:          number | null
  pnl_dia:         number
  pnl_total:       number
  trades_total:    number
  trades_hoy:      number
  win_rate:        number | null
  // Behavioral
  score:           number
  perfil:          string
  disciplina:      number
  violaciones_hoy: number
  // Connection
  last_ping:       string | null
  connected_at:    string | null
  created_at:      string
  updated_at:      string | null
}

export type EACommand = {
  type:    'start' | 'pause' | 'stop' | 'update_risk' | 'reset_limits'
  payload?: Record<string, unknown>
}

export function useGestorEA(userId: string | null) {
  const [instances, setInstances] = useState<EAInstance[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ea_instances')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstances((data ?? []) as EAInstance[])
    } catch (e) {
      console.warn('useGestorEA.load:', e)
      setError(e instanceof Error ? e.message : 'Error cargando EAs')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Auto-polling every 10 seconds for live updates
  useEffect(() => {
    if (!userId) return
    load()
    const interval = setInterval(load, 15_000)
    return () => clearInterval(interval)
  }, [userId, load])

  // Trust DB status — only override to 'disconnected' if ping is very old (5+ min)
  // This prevents false flicker from polling/ping timing differences
  const withStatus = instances.map(ea => {
    if (ea.status === 'active' && ea.last_ping) {
      const secondsAgo = (Date.now() - new Date(ea.last_ping).getTime()) / 1000
      if (secondsAgo > 300) {  // 5 minutes = truly disconnected
        return { ...ea, status: 'disconnected' as EAStatus }
      }
    }
    return ea
  })

  const sendCommand = async (eaId: string, cmd: EACommand) => {
    if (!userId) return
    const { error } = await supabase
      .from('ea_commands')
      .insert({
        user_id:        userId,
        ea_instance_id: eaId,
        type:           cmd.type,
        payload:        cmd.payload ?? null,
      })
    if (error) throw error
  }

  const updateRisk = async (eaId: string, config: {
    max_ops_dia?:     number
    limite_perdida?:  number
    limite_ganancia?: number
    hora_inicio?:     number
    hora_fin?:        number
    modo_restrictivo?: boolean
  }) => {
    const { error } = await supabase
      .from('ea_instances')
      .update({ ...config, updated_at: new Date().toISOString() })
      .eq('id', eaId)
      .eq('user_id', userId!)
    if (error) throw error
    // Also send command so EA picks it up via polling
    await sendCommand(eaId, { type: 'update_risk', payload: config })
    setInstances(prev => prev.map(ea =>
      ea.id === eaId ? { ...ea, ...config } : ea
    ))
  }

  const rename = async (eaId: string, name: string) => {
    const { error } = await supabase
      .from('ea_instances')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', eaId)
      .eq('user_id', userId!)
    if (error) throw error
    setInstances(prev => prev.map(ea =>
      ea.id === eaId ? { ...ea, name } : ea
    ))
  }

  const remove = async (eaId: string) => {
    const { error } = await supabase
      .from('ea_instances')
      .delete()
      .eq('id', eaId)
      .eq('user_id', userId!)
    if (error) throw error
    setInstances(prev => prev.filter(ea => ea.id !== eaId))
  }

  return {
    instances: withStatus,
    loading, error, load,
    sendCommand, updateRisk, rename, remove,
  }
}
