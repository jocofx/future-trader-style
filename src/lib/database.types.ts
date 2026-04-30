// Simplified database types - uses any for Insert/Update to avoid strict type conflicts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// Generic helper - avoids 'never' type issues with Supabase v2
type AnyRecord = Record<string, unknown>

export interface Database {
  public: {
    Tables: {
      operaciones:     { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      cuentas:         { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      habitos:         { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      diario:          { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      planes:          { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      configuracion:   { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      capital_tracker: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      capital_ganancias:{ Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      chat_history:    { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      ai_usage:        { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      api_keys:        { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      suscripciones:   { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      affiliates:      { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      affiliate_conversions: { Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
      affiliate_clicks:{ Row: AnyRecord; Insert: AnyRecord; Update: AnyRecord }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
