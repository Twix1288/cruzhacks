'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { useRouter } from 'next/navigation'
// import { useActionState } from 'react' // Next.js 15 / React 19 hook if available, otherwise use plain wrapper
import { toast } from 'sonner'
import { Loader2, Shield, TreePine } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<'scout' | 'ranger'>('scout')

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)

        // Determine which action to call
        const action = isLogin ? login : signup

        // Add role if signing up (though input hidden field also works, explicit is safer)
        if (!isLogin) {
            formData.set('role', role)
        }

        try {
            const result = await action(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success('Welcome aboard!')
                router.push('/')
            }
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error('Something went wrong. Check the console for details.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-zinc-900/50 p-8 border border-zinc-800 backdrop-blur-sm">

                {/* Header */}
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        {isLogin ? 'Welcome back' : 'Join the Corps'}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        {isLogin ? 'Sign in to access your dashboard' : 'Create an account to start monitoring'}
                    </p>
                </div>

                {/* Role Toggles (Signup Only) */}
                {!isLogin && (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setRole('scout')}
                            className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${role === 'scout'
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <TreePine className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Scout</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ranger')}
                            className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${role === 'ranger'
                                ? 'border-orange-500 bg-orange-500/10 text-orange-500'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <Shield className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Ranger</span>
                        </button>
                    </div>
                )}

                {/* Form */}
                <form action={handleSubmit} className="mt-8 space-y-6">
                    <input type="hidden" name="role" value={role} />

                    <div className="space-y-4 rounded-md shadow-sm">
                        {!isLogin && (
                            <div>
                                <label htmlFor="username" className="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="relative block w-full rounded-md border-0 bg-zinc-950 py-3 px-3 text-white ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                    placeholder="Username"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-md border-0 bg-zinc-950 py-3 px-3 text-white ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                required
                                className="relative block w-full rounded-md border-0 bg-zinc-950 py-3 px-3 text-white ring-1 ring-inset ring-zinc-800 placeholder:text-zinc-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md bg-white px-3 py-3 text-sm font-semibold text-black hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'Sign in' : 'Create account')}
                        </button>
                    </div>
                </form>

                {/* Toggle */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-medium text-emerald-500 hover:text-emerald-400"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}
