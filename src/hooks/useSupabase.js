import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Create a custom hook for Supabase
export function useSupabase() {
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initializeSupabase = () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseAnonKey) {
          const errorMsg = 'Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables are set.'
          console.error(errorMsg)
          setError(errorMsg)
          setLoading(false)
          return null
        }

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          }
        })

        console.log('Supabase client initialized successfully via hook')
        setClient(supabaseClient)
        setLoading(false)
        return supabaseClient
      } catch (err) {
        console.error('Error initializing Supabase client:', err)
        setError(err.message)
        setLoading(false)
        return null
      }
    }

    initializeSupabase()
  }, [])

  return { supabase: client, loading, error }
}

// Create a singleton instance for direct imports
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
    console.log('Supabase singleton instance initialized successfully')
  } else {
    console.error('Missing Supabase configuration for singleton instance')
  }
} catch (error) {
  console.error('Error initializing Supabase singleton instance:', error)
}

export const supabase = supabaseInstance
