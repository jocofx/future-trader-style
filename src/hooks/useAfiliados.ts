import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type AffiliateProfile = {
  id:           string
  user_id:      string
  code:         string       // referral code
  status:       string       // active / pending / suspended
  commission:   number       // % commission (30, 35, 40, 50)
  total_earned: number
  total_paid:   number
  pending:      number
  clicks:       number
  conversions:  number
  created_at:   string
}

export type AffiliateConversion = {
  id:          string
  referred_email: string | null
  referred_name:  string | null
  plan:        string | null
  status:      string        // trial / active / churned
  earned:      number
  created_at:  string
}

export function useAfiliados(userId: string | null) {
  const [profile,     setProfile]     = useState<AffiliateProfile | null>(null)
  const [conversions, setConversions] = useState<AffiliateConversion[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Load affiliate profile
      const { data: aff } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (aff) {
        setProfile(aff as AffiliateProfile)
      } else {
        // Create profile if doesn't exist
        const code = 'TRADYNC-' + userId.slice(0, 6).toUpperCase()
        const { data: created } = await supabase
          .from('affiliates')
          .insert({ user_id: userId, code, status: 'active', commission: 30 })
          .select()
          .single()
        if (created) setProfile(created as AffiliateProfile)
      }

      // Load conversions
      const { data: convs } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      setConversions((convs ?? []) as AffiliateConversion[])
    } catch (e) {
      console.warn('useAfiliados.load:', e)
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const requestPayout = async () => {
    if (!profile) return
    // Insert payout request in configuracion table until proper payouts table exists
    await supabase.from('configuracion').upsert({
      user_id:    userId!,
      clave:      'payout_request',
      valor:      { amount: profile.pending, requested_at: new Date().toISOString(), status: 'pending' },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
  }

  return { profile, conversions, loading, error, load, requestPayout }
}
