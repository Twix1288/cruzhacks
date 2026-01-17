'use client'

import { useEffect, useState } from 'react'
import SmartMap from '@/components/map/SmartMap'
import ReportsList from '@/components/map/ReportsList'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/types'
import { GradientText } from '@/components/ui/GradientText'

export default function MapPage() {
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)

    useEffect(() => {
        const fetchUserInfo = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                setUserId(user.id)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()
                
                if (profile) {
                    setUserRole(profile.role as UserRole)
                }
            }
        }

        fetchUserInfo()
    }, [])

    return (
        <main className="min-h-screen flex flex-col relative">
            {/* Background */}
            <AnimatedBackground variant="gradient" intensity={0.2} />
            
            {/* Header */}
            <header className="relative z-10 p-6 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl">
                <h1 className="text-3xl font-bold">
                    <GradientText variant="emerald">Live Map</GradientText>
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                    {userRole === 'ranger' 
                        ? 'Monitor medium and high-risk invasive species threats'
                        : 'View and manage your environmental reports'}
                </p>
            </header>

            {/* Main Content - Vertically Stacked Layout */}
            <div className="flex flex-col gap-6 p-6 relative z-10">
                {/* Map Section - Fixed larger height */}
                <div 
                    className={`transition-all duration-300`}
                    style={{ height: isCameraOpen ? '900px' : '800px' }}
                >
                    <AnimatedBorder variant="glow" color="emerald" className="h-full w-full">
                        <div className="h-full w-full bg-zinc-900/50 rounded-lg overflow-hidden">
                            <SmartMap 
                                className="h-full w-full"
                                userRole={userRole}
                                userId={userId}
                                onCameraOpenChange={setIsCameraOpen}
                            />
                        </div>
                    </AnimatedBorder>
                </div>

                {/* Reports List Section - Hides when camera is open */}
                {!isCameraOpen && (
                    <div className="h-[500px]">
                        <AnimatedBorder variant="gradient" color="purple" className="h-full w-full">
                            <div className="h-full w-full bg-zinc-900/50 rounded-lg overflow-hidden">
                                <ReportsList userRole={userRole} userId={userId} />
                            </div>
                        </AnimatedBorder>
                    </div>
                )}
            </div>
            
            {/* Bubble Menu Navigation */}
            <BubbleMenu
                menuBg="#18181b"
                menuContentColor="#ffffff"
                items={[
                    { label: 'Home', href: '/', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
                    { label: 'Profile', href: '/profile', rotation: 10, hoverStyles: { bgColor: '#8b5cf6', textColor: '#fff' } },
                ]}
            />
        </main>
    )
}
