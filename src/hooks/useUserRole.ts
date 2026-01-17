'use client'

import { createClient } from '@/utils/supabase/client'
import { UserProfile } from '@/types'
import { useEffect, useState } from 'react'

export function useUserRole() {
  const [role, setRole] = useState<UserProfile['role'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (data) {
          setRole(data.role)
        }
      }
      setLoading(false)
    }

    getRole()
  }, [])

  return { role, loading, isRanger: role === 'ranger', isScout: role === 'scout' }
}
