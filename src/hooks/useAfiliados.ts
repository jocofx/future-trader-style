import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

export function useAfiliados(userId: string | null) {
  const [profile,     setProfile]     = useState<AffiliateProfile | null>(null)
  const [conversions, setConversions] = useState<AffiliateConversion[]>([])
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

  // Commission tier based on active conversions
  const commission = (() => {
    const n = stats.activos
    if (n >= 25) return 50
    if (n >= 10) return 40
    if (n >= 5)  return 35
    return 30
  })()

  const requestPayout = async (paypalEmail: string) => {
    if (!profile) return
    const { error } = await supabase
      .from('affiliates')
      .update({ paypal_email: paypalEmail })
      .eq('id', profile.id)
    if (error) throw error
    // Log request in configuracion
    await supabase.from('configuracion').upsert({
      user_id:    userId!,
      clave:      'payout_request',
      valor:      {
        amount:       stats.pendiente,
        paypal:       paypalEmail,
        requested_at: new Date().toISOString(),
        status:       'pending'
      },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
  }

  return { profile, conversions, loading, error, stats, commission, load, requestPayout }
}
