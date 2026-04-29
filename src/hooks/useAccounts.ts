import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Account } from '@/lib/types'

export function useAccounts(userId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading]   = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('cuentas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setAccounts((data ?? []) as Account[])
    setLoading(false)
  }, [userId])

  const save = async (account: Omit<Account, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('cuentas')
      .insert({ ...account, user_id: userId! })
      .select()
      .single()
    if (error) throw error
    setAccounts(prev => [...prev, data as Account])
    return data as Account
  }

  const update = async (id: string, changes: Partial<Account>) => {
    const { data, error } = await supabase
      .from('cuentas')
      .update(changes)
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
