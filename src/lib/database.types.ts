// Auto-generated types matching existing Supabase schema
// Tables: operaciones, cuentas, habitos, diario, planes, configuracion,
//         capital_tracker, capital_ganancias, chat_history, ai_usage,
//         api_keys, charts, suscripciones

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      operaciones: {
        Row: {
          id: string
          user_id: string
          cuenta: string | null
          instrumento: string
          tipo: 'BUY' | 'SELL'
          fecha: string
          hora: string | null
          precio_entrada: number | null
          precio_salida: number | null
          resultado: number | null
          lotes: number | null
          rr: number | null
          sesion: string | null
          emocion: string | null
          confianza: number | null
          tags: string[] | null
          notas: string | null
          imagen_url: string | null
          estado: string | null
          estrategia: string | null
          setup: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['operaciones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['operaciones']['Insert']>
      }
      cuentas: {
        Row: {
          id: string
          user_id: string
          nombre: string
          broker: string | null
          tipo: string | null
          balance: number | null
          moneda: string | null
          activa: boolean | null
          notas: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cuentas']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cuentas']['Insert']>
      }
      habitos: {
        Row: {
          id: string
          user_id: string
          fecha: string
          sueno: number | null
          ejercicio: number | null
          meditacion: number | null
          alcohol: number | null
          habitos_extra: Json | null
          encuesta: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['habitos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['habitos']['Insert']>
      }
      diario: {
        Row: {
          id: string
          user_id: string
          fecha: string
          contenido: string | null
          emocion: string | null
          confianza: number | null
          imagen_url: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['diario']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['diario']['Insert']>
      }
      planes: {
        Row: {
          id: string
          user_id: string
          fecha: string
          sesgo: string | null
          niveles: string | null
          no_hacer: string | null
          notas: string | null
          max_operaciones: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['planes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['planes']['Insert']>
      }
      configuracion: {
        Row: {
          id: string
          user_id: string
          clave: string
          valor: Json
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['configuracion']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['configuracion']['Insert']>
      }
      capital_tracker: {
        Row: {
          id: string
          user_id: string
          tipo: string
          proveedor: string | null
          tamano: string | null
          coste: number
          estado: string | null
          fecha: string
          notas: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['capital_tracker']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['capital_tracker']['Insert']>
      }
      capital_ganancias: {
        Row: {
          id: string
          user_id: string
          inversion_id: string
          cantidad: number
          fecha: string
          tipo: string | null
          notas: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['capital_ganancias']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['capital_ganancias']['Insert']>
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_history']['Row'], 'id' | 'created_at'>
        Update: never
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          mes: string
          mensajes: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_usage']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['ai_usage']['Insert']>
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          token: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['api_keys']['Row'], 'id' | 'created_at'>
        Update: never
      }
      suscripciones: {
        Row: {
          id: string
          user_id: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          estado: string | null
          trial_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['suscripciones']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['suscripciones']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
