'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { UserRole } from '@/types'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // 1. Get raw inputs
    const errorOrEmail = formData.get('email') as string
    const password = formData.get('password') as string

    // 2. Sign in via Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
        email: errorOrEmail,
        password,
    })

    // 3. Handle Error or Success
    if (error) {
        return { error: 'Invalid credentials. Please try again.' } // Return plain object for UI to handle
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // 1. Get raw inputs
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string
    const role = formData.get('role') as UserRole || 'scout'

    // 2. Sign up via Supabase Auth
    // We pass metadata so the Database Trigger (handle_new_user) can create the Profile row automatically.
    // This bypasses RLS issues.
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                role,
                avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
            }
        }
    })

    if (error) {
        console.error("Signup Error:", error.message, error)
        return { error: error.message }
    }

    // No manual insert needed! The Trigger does it.

    revalidatePath('/', 'layout')
    return { success: true }
}
