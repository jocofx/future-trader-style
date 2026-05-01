import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useTrades } from '@/hooks/useTrades'
import { useAccounts } from '@/hooks/useAccounts'
import { useCapital } from '@/hooks/useCapital'
import { useHabits } from '@/hooks/useHabits'
import { useDiario } from '@/hooks/useDiario'
import { usePremarket } from '@/hooks/usePremarket'
import type { RiskSettings, UserPlan } from '@/lib/types'

// ── Context types ─────────────────────────────────────────────────
type AppContextType = {
  user: User | null
  loading: boolean
  plan: UserPlan
  riskSettings: RiskSettings
  setRiskSettings: (s: RiskSettings) => void
  trades:    ReturnType<typeof useTrades>
  accounts:  ReturnType<typeof useAccounts>
  capital:   ReturnType<typeof useCapital>
  habits:    ReturnType<typeof useHabits>
  diario:    ReturnType<typeof useDiario>
  premarket: ReturnType<typeof usePremarket>
}

const AppContext = createContext<AppContextType | null>(null)

const DEFAULT_RISK: RiskSettings = {
  maxLoss: 100,
  maxOps: 5,
  objetivo: 200,
  riskPct: 1,
}

// ── Provider ──────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan]       = useState<UserPlan>('free')
  const [riskSettings, setRiskSettingsState] = useState<RiskSettings>(() => {
    try {
      const s = localStorage.getItem('tj_risk')
      return s ? { ...DEFAULT_RISK, ...JSON.parse(s) } : DEFAULT_RISK
    } catch { return DEFAULT_RISK }
  })

  const trades    = useTrades(user?.id ?? null)
  const accounts  = useAccounts(user?.id ?? null)
  const capital   = useCapital(user?.id ?? null)
  const habits    = useHabits(user?.id ?? null)
  const diario    = useDiario(user?.id ?? null)
  const premarket = usePremarket(user?.id ?? null)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data once user is available
  useEffect(() => {
    if (!user) return
    Promise.all([
      trades.load(),
      accounts.load(),
      capital.load(),
      habits.load(),
      diario.load(),
    ])

    // Load plan
    supabase.from('suscripciones')
      .select('plan,estado')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.estado === 'active' || data?.estado === 'trialing') {
          setPlan((data.plan ?? 'free') as UserPlan)
        }
      })
      .catch(() => {})

    // Load risk settings from Supabase (overrides localStorage)
    supabase.from('configuracion')
      .select('valor')
      .eq('user_id', user.id)
      .eq('clave', 'riskSettings')
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.valor) setRiskSettingsState(prev => ({ ...prev, ...(data.valor as Partial<RiskSettings>) }))
      })
      .catch(() => {})
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setRiskSettings = (s: RiskSettings) => {
    setRiskSettingsState(s)
    localStorage.setItem('tj_risk', JSON.stringify(s))
    if (user) {
      supabase.from('configuracion').upsert({
        user_id: user.id,
        clave: 'riskSettings',
        valor: s,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,clave' }).catch(() => {})
    }
  }

  return (
    <AppContext.Provider value={{
      user, loading, plan, riskSettings, setRiskSettings,
      trades, accounts, capital, habits, diario, premarket,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useRequireAuth() {
  const { user, loading } = useApp()
  return { user, loading, isAuthenticated: !!user }
}
