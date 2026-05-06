import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = 'BElgaKzoNK1zeX_X8GdutbbhNcGmpYoFvQvar9cyG77tZgYyYAxZZAIO5AnoValPitiJwEb5MTs74eoBFGfHtvI'

function urlBase64ToUint8Array(base64: string) {
  const pad = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications(userId: string | null) {
  const [supported,  setSupported]  = useState(false)
  const [granted,    setGranted]    = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    const ok = 'serviceWorker' in navigator && 'PushManager' in window
    setSupported(ok)
    if (ok) setGranted(Notification.permission === 'granted')
  }, [])

  const subscribe = useCallback(async () => {
    if (!userId || !supported) return false
    setLoading(true)
    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setGranted(perm === 'granted')
      if (perm !== 'granted') return false

      // Get SW registration
      const reg = await navigator.serviceWorker.ready

      // Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Save subscription to Supabase
      const subJson = sub.toJSON()
      // Use device-specific key to support multiple devices
      const deviceId = localStorage.getItem('device_id') || Math.random().toString(36).slice(2);
      localStorage.setItem('device_id', deviceId);
      await supabase.from('configuracion').upsert({
        user_id:    userId,
        clave:      `push_subscription_${deviceId}`,
        valor:      subJson,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,clave' })

      setSubscribed(true)
      return true
    } catch (err) {
      console.warn('Push subscribe failed:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [userId, supported])

  const unsubscribe = useCallback(async () => {
    if (!userId) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    await supabase.from('configuracion')
      .delete().eq('user_id', userId).eq('clave', 'push_subscription')
    setSubscribed(false)
  }, [userId])

  // Check if already subscribed
  useEffect(() => {
    if (!supported || !userId) return
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    )
  }, [supported, userId])

  return { supported, granted, subscribed, loading, subscribe, unsubscribe }
}
