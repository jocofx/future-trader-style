// Notification preferences — stored in 'configuracion' table
// clave: 'notif_prefs' → valor: NotifPrefs

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type NotifPref = {
  email: boolean
  push:  boolean
  // For reminders: time of day HH:MM
  time?: string
}

export type NotifPrefs = {
  // ── Resumen ──
  resumen_diario:    NotifPref  // Daily summary at set time
  alerta_riesgo:     NotifPref  // Rule broken
  logros:            NotifPref  // Achievement unlocked
  premarket_diario:  NotifPref  // Pre-market reminder
  newsletter:        NotifPref  // Weekly newsletter
  // ── Recordatorios ──
  recordatorio_diario:    NotifPref  // Daily journal entry reminder
  recordatorio_habitos:   NotifPref  // Habits logging reminder
  recordatorio_premarket: NotifPref  // Pre-market checklist reminder
  recordatorio_cierre:    NotifPref  // End of day review reminder
}

export const DEFAULT_PREFS: NotifPrefs = {
  resumen_diario:         { email: true,  push: true,  time: "22:00" },
  alerta_riesgo:          { email: true,  push: true  },
  logros:                 { email: false, push: true  },
  premarket_diario:       { email: true,  push: false, time: "08:30" },
  newsletter:             { email: true,  push: false },
  recordatorio_diario:    { email: false, push: true,  time: "21:00" },
  recordatorio_habitos:   { email: false, push: true,  time: "20:00" },
  recordatorio_premarket: { email: false, push: true,  time: "08:00" },
  recordatorio_cierre:    { email: false, push: true,  time: "22:30" },
}

const CLAVE = 'notif_prefs'

export function useNotifPrefs(userId: string | null) {
  const [prefs, setPrefs]   = useState<NotifPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(false)
  const [pushGranted, setPushGranted] = useState<boolean>(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

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
      if (data?.valor) {
        setPrefs(prev => ({ ...prev, ...(data.valor as Partial<NotifPrefs>) }))
      }
    } catch (e) { console.warn('useNotifPrefs.load:', e) }
    finally { setLoading(false) }
  }, [userId])

  const save = async (newPrefs: NotifPrefs) => {
    if (!userId) return
    setPrefs(newPrefs)
    // Include timezone offset so scheduler can convert to UTC
    // getTimezoneOffset() returns minutes WEST of UTC (negative for UTC+)
    // We store as minutes EAST (positive for UTC+)
    const tzOffset = -new Date().getTimezoneOffset()
    await supabase.from('configuracion').upsert({
      user_id:    userId,
      clave:      CLAVE,
      valor:      { ...newPrefs, _tzOffset: tzOffset },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,clave' })
  }

  const requestPush = async () => {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') { setPushGranted(true); return true }
    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    setPushGranted(granted)
    return granted
  }

  const testPush = async (title: string, body: string) => {
    if (!pushGranted) return
    try {
      // Use Service Worker showNotification — works on iOS PWA
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification(title, {
          body,
          icon:    '/icon-192.png',
          badge:   '/icon-192.png',
          vibrate: [100, 50, 100],
        })
      } else {
        new Notification(title, { body, icon: '/icon-192.png' })
      }
    } catch (e) {
      console.warn('testPush failed:', e)
    }
  }

  // Schedule browser push reminders based on preferences
  useEffect(() => {
    if (!pushGranted) return
    const intervals: ReturnType<typeof setInterval>[] = []

    const checkTime = (time: string | undefined, callback: () => void) => {
      if (!time) return
      const [h, m] = time.split(':').map(Number)
      const now = new Date()
      const target = new Date()
      target.setHours(h, m, 0, 0)
      // If past today, schedule for tomorrow
      if (target <= now) target.setDate(target.getDate() + 1)
      const msUntil = target.getTime() - now.getTime()

      const timeout = setTimeout(() => {
        callback()
        // Then repeat every 24h
        const interval = setInterval(callback, 24 * 60 * 60 * 1000)
        intervals.push(interval)
      }, msUntil)

      return () => { clearTimeout(timeout) }
    }

    const cleanups: (() => void)[] = []

    if (prefs.recordatorio_diario.push) {
      const c = checkTime(prefs.recordatorio_diario.time, () =>
        navigator.serviceWorker.ready.then(r => r.showNotification('✍️ TradyncApp — Diario', { body: '¿Has escrito tu reflexión del día?', icon: '/icon-192.png' }))
      )
      if (c) cleanups.push(c)
    }
    if (prefs.recordatorio_habitos.push) {
      const c = checkTime(prefs.recordatorio_habitos.time, () =>
        navigator.serviceWorker.ready.then(r => r.showNotification('💪 TradyncApp — Hábitos', { body: '¿Has registrado tus hábitos de hoy?', icon: '/icon-192.png' }))
      )
      if (c) cleanups.push(c)
    }
    if (prefs.recordatorio_premarket.push) {
      const c = checkTime(prefs.recordatorio_premarket.time, () =>
        navigator.serviceWorker.ready.then(r => r.showNotification('📋 TradyncApp — Pre-Market', { body: '¿Has completado tu checklist pre-market?', icon: '/icon-192.png' }))
      )
      if (c) cleanups.push(c)
    }
    if (prefs.resumen_diario.push) {
      const c = checkTime(prefs.resumen_diario.time, () =>
        navigator.serviceWorker.ready.then(r => r.showNotification('📊 TradyncApp — Resumen', { body: 'Tu resumen de trading del día está listo.', icon: '/icon-192.png' }))
      )
      if (c) cleanups.push(c)
    }
    if (prefs.recordatorio_cierre.push) {
      const c = checkTime(prefs.recordatorio_cierre.time, () =>
        navigator.serviceWorker.ready.then(r => r.showNotification('🔔 TradyncApp — Cierre', { body: '¿Has revisado tus operaciones del día?', icon: '/icon-192.png' }))
      )
      if (c) cleanups.push(c)
    }

    return () => {
      cleanups.forEach(c => c())
      intervals.forEach(i => clearInterval(i))
    }
  }, [prefs, pushGranted])

  return { prefs, loading, pushGranted, load, save, requestPush, testPush }
}
