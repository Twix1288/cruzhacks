'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Shield, TreePine, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { TypeText } from '@/components/ui/TypeText'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { GradientText } from '@/components/ui/GradientText'

export default function LoginPage() {
    const router = useRouter()
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [role, setRole] = useState<'scout' | 'ranger'>('scout')
    const [focusedInput, setFocusedInput] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)

        // Determine which action to call
        const action = isLogin ? login : signup

        // Add role if signing up
        if (!isLogin) {
            formData.set('role', role)
        }

        try {
            const result = await action(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success(isLogin ? 'Welcome back, explorer.' : 'Welcome to the corps.')
                router.push('/')
            }
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error('Connection interrupted. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-black selection:bg-emerald-500/30">

            {/* Enhanced Ambient Background */}
            <AnimatedBackground variant="aurora" intensity={0.5} />
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-zinc-900/40 blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
            </div>

            <Card className="w-full max-w-md relative z-10 p-8 md:p-10 border-zinc-800/60 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">

                {/* Branding */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-900/20 mb-6 transform hover:scale-105 transition-transform duration-500">
                        {isLogin ? <TreePine className="text-white h-8 w-8" /> : (role === 'scout' ? <TreePine className="text-white h-8 w-8" /> : <Shield className="text-white h-8 w-8" />)}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        <GradientText variant="emerald">
                            {isLogin ? 'Welcome Back' : 'Initialize Session'}
                        </GradientText>
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {isLogin ? 'Enter your credentials to access the grid.' : 'Create an identity to begin monitoring.'}
                    </p>
                </div>

                {/* Role Selector (Signup Only) */}
                {!isLogin && (
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setRole('scout')}
                            className={cn(
                                "group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                                role === 'scout'
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                        >
                            <TreePine className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Scout</span>
                            {role === 'scout' && <div className="absolute inset-0 bg-emerald-400/5" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ranger')}
                            className={cn(
                                "group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden",
                                role === 'ranger'
                                    ? "bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                    : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-800"
                            )}
                        >
                            <Shield className="mb-2 h-6 w-6" />
                            <span className="text-sm font-medium">Ranger</span>
                            {role === 'ranger' && <div className="absolute inset-0 bg-orange-400/5" />}
                        </button>
                    </div>
                )}

                <form action={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="relative group">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                onFocus={() => setFocusedInput('username')}
                                onBlur={() => setFocusedInput(null)}
                                className="peer w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 pt-3 pb-3 text-white placeholder-transparent focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                                placeholder="Username"
                            />
                            <label
                                htmlFor="username"
                                className={cn(
                                    "absolute left-4 top-3 text-zinc-500 text-sm transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-emerald-500 bg-zinc-900 px-1 peer-focus:bg-transparent peer-focus:px-0",
                                    "peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-emerald-500"
                                )}
                            >
                                Username
                            </label>
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            onFocus={() => setFocusedInput('email')}
                            onBlur={() => setFocusedInput(null)}
                            className="peer w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 pt-3 pb-3 text-white placeholder-transparent focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            placeholder="Email"
                        />
                        <label
                            htmlFor="email"
                            className={cn(
                                "absolute left-4 top-3 text-zinc-500 text-sm transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-emerald-500 bg-zinc-900 px-1 peer-focus:bg-transparent peer-focus:px-0",
                                "peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-emerald-500"
                            )}
                        >
                            Email Address
                        </label>
                    </div>

                    <div className="relative group">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            required
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput(null)}
                            className="peer w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 pt-3 pb-3 text-white placeholder-transparent focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            placeholder="Password"
                        />
                        <label
                            htmlFor="password"
                            className={cn(
                                "absolute left-4 top-3 text-zinc-500 text-sm transition-all pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:top-[-10px] peer-focus:text-xs peer-focus:text-emerald-500 bg-zinc-900 px-1 peer-focus:bg-transparent peer-focus:px-0",
                                "peer-[:not(:placeholder-shown)]:top-[-10px] peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-emerald-500"
                            )}
                        >
                            Password
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full relative group overflow-hidden rounded-lg bg-white py-3.5 font-semibold text-black transition-all hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                <>
                                    {isLogin ? 'Access Dashboard' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </button>
                </form>

                {/* Footer Toggle */}
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                        {isLogin ? (
                            <span>Is this your first time? <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-500/100">Join the corps</span></span>
                        ) : (
                            <span>Already an agent? <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4 hover:decoration-emerald-500/100">Log in</span></span>
                        )}
                    </button>
                </div>

            </Card>

            {/* Bubble Menu Navigation - Minimal menu for unauthenticated users */}
            <BubbleMenu
                menuBg="#18181b"
                menuContentColor="#ffffff"
                items={[
                    { label: 'Home', href: '/', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
                ]}
            />
        </div>
    )
}
