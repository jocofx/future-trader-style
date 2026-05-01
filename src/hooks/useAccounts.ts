import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/lib/types'

export function useAccounts(userId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading]   = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
    const { data } = await supabase
      .from('cuentas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setAccounts((data ?? []) as Account[])
    setLoading(false)
    } catch(e) { console.warn(e); setLoading(false); }
  }, [userId])

  const save = async (account: Partial<Account> & { nombre: string }) => {
    const row = {
      user_id:  userId!,
      nombre:   account.nombre,
      tipo:     account.tipo    ?? null,
      balance:  account.balance ?? null,
      broker:   account.broker  ?? null,
      fase:     account.fase    ?? null,
      activa:   account.activa  ?? true,
      divisa:   account.divisa  ?? account.moneda ?? "USD",
      servidor: account.servidor ?? null,
      numero_cuenta: account.numero_cuenta ?? null,
      plataforma:    account.plataforma    ?? null,
      apalancamiento: account.apalancamiento ?? null,
    }
    const { data, error } = await supabase
      .from('cuentas')
      .insert(row)
      .select()
      .single()
    if (error) throw error
    setAccounts(prev => [...prev, data as Account])
    return data as Account
  }

  const update = async (id: string, changes: Partial<Account>) => {
    // Only send real columns that exist in the DB
    const allowed = ['nombre','tipo','balance','broker','fase','activa',
                     'divisa','servidor','numero_cuenta','plataforma','apalancamiento']
    const safe: Record<string, unknown> = {}
    for (const k of allowed) {
      if (k in changes) safe[k] = (changes as any)[k]
    }
    // Map virtual alias
    if ('moneda' in changes) safe.divisa = (changes as any).moneda
    safe.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('cuentas')
      .update(safe)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setAccounts(prev => prev.map(a => a.id === id ? (data as Account) : a))
  }

  const remove = async (id: string) => {
    await supabase.from('cuentas').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return { accounts, loading, load, save, update, remove }
}
