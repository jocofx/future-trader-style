import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// affiliate_payouts table
export type AffiliatePayout = {
  id:           string
  affiliate_id: string
  user_id:      string
  amount:       number
  method:       'paypal' | 'wise' | 'bank'
  paypal_email: string | null
  wise_email:   string | null
  bank_iban:    string | null
  bank_name:    string | null
  bank_holder:  string | null
  status:       'pending' | 'approved' | 'paid' | 'rejected'
  admin_notes:  string | null
  requested_at: string
  processed_at: string | null
  created_at:   string
}

// affiliates table
export type AffiliateProfile = {
  id:                 string
  user_id:            string
  codigo:             string
  nombre:             string | null
  email:              string | null
  estado:             string       // active / pending / suspended
  motivo:             string | null
  paypal_email:       string | null
  total_clicks:       number
  total_conversiones: number
  total_ganado:       number
  created_at:         string
  approved_at:        string | null
}

// affiliate_conversions table
export type AffiliateConversion = {
  id:               string
  affiliate_id:     string
  referred_user_id: string | null
  referred_email:   string | null
  plan:             string | null
  monto:            number
  comision:         number
  mes:              string | null
  pagado:           boolean
  created_at:       string
}

export function useAfiliados(userId: string | null, userPlan: string = "free") {
  const [profile,     setProfile]     = useState<AffiliateProfile | null>(null)
  const [conversions, setConversions] = useState<AffiliateConversion[]>([])
  const [payouts,     setPayouts]     = useState<AffiliatePayout[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      // Load affiliate profile
      const { data: aff, error: affErr } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (affErr) throw affErr

      if (aff) {
        setProfile(aff as AffiliateProfile)

        // Load conversions using affiliate id
        const { data: convs } = await supabase
          .from('affiliate_conversions')
          .select('*')
          .eq('affiliate_id', aff.id)
          .order('created_at', { ascending: false })
          .limit(100)

        setConversions((convs ?? []) as AffiliateConversion[])

        // Load payout history
        const { data: pays } = await supabase
          .from('affiliate_payouts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)
        setPayouts((pays ?? []) as AffiliatePayout[])
      } else {
        // Create profile
        const codigo = 'TRADYNCAPP-' + userId.slice(0, 6).toUpperCase()
        const { data: created, error: createErr } = await supabase
          .from('affiliates')
          .insert({
            user_id: userId,
            codigo,
            estado:  'active',
            total_clicks:       0,
            total_conversiones: 0,
            total_ganado:       0,
          })
          .select()
          .single()
        if (createErr) throw createErr
        if (created) setProfile(created as AffiliateProfile)
      }
    } catch (e) {
      console.warn('useAfiliados.load:', e)
      setError(e instanceof Error ? e.message : 'Error cargando afiliados')
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Derived stats from real data
  const stats = {
    totalGanado:   profile?.total_ganado       ?? 0,
    totalClicks:   profile?.total_clicks       ?? 0,
    conversiones:  profile?.total_conversiones ?? 0,
    pendiente:     conversions.filter(c => !c.pagado).reduce((s, c) => s + (c.comision ?? 0), 0),
    pagado:        conversions.filter(c =>  c.pagado).reduce((s, c) => s + (c.comision ?? 0), 0),
    activos:       conversions.filter(c => c.monto > 0 && c.pagado === false).length,
    convRate:      profile?.total_clicks
      ? (profile.total_conversiones / profile.total_clicks) * 100
      : 0,
  }

  // Commission = plan base + volume bonus
  // Free: 15% (no growth — incentive to upgrade)
  // Basic: 20% base → 25% (5+) → 30% (10+)
  // Pro:   30% base → 40% (5+) → 50% (10+)
  const getCommission = (userPlan: string, activeRefs: number): number => {
    const plan = userPlan?.toLowerCase() ?? 'free'
    if (plan === 'pro') {
      if (activeRefs >= 10) return 50
      if (activeRefs >= 5)  return 40
      return 30
    }
    if (plan === 'basic') {
      if (activeRefs >= 10) return 30
      if (activeRefs >= 5)  return 25
      return 20
    }
    return 15 // free — capped
  }
  const commission = getCommission(userPlan, stats.activos)

  const requestPayout = async (data: {
    method:       'paypal' | 'wise' | 'bank'
    paypal_email?: string
    wise_email?:   string
    bank_iban?:    string
    bank_name?:    string
    bank_holder?:  string
  }) => {
    if (!profile || !userId) throw new Error('No profile')
    if (stats.pendiente <= 0) throw new Error('Sin saldo pendiente')

    // Save payment method on affiliate profile
    const updateData: Record<string, string> = {}
    if (data.paypal_email) updateData.paypal_email = data.paypal_email
    if (Object.keys(updateData).length > 0) {
      await supabase.from('affiliates').update(updateData).eq('id', profile.id)
    }

    // Create payout request
    const { data: payout, error } = await supabase
      .from('affiliate_payouts')
      .insert({
        affiliate_id: profile.id,
        user_id:      userId,
        amount:       stats.pendiente,
        method:       data.method,
        paypal_email: data.paypal_email ?? null,
        wise_email:   data.wise_email   ?? null,
        bank_iban:    data.bank_iban    ?? null,
        bank_name:    data.bank_name    ?? null,
        bank_holder:  data.bank_holder  ?? null,
        status:       'pending',
      })
      .select()
      .single()

    if (error) throw error
    setPayouts(prev => [payout as AffiliatePayout, ...prev])
    return payout
  }

  return { profile, conversions, payouts, loading, error, stats, commission, load, requestPayout }
}
