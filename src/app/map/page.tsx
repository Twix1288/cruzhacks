'use client'

import { useEffect, useState } from 'react'
import SmartMap from '@/components/map/SmartMap'
import ReportsList from '@/components/map/ReportsList'
import ThreatListView from '@/components/ranger/ThreatListView'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { createClient } from '@/utils/supabase/client'
import { UserRole, Report } from '@/types'
import { GradientText } from '@/components/ui/GradientText'

export default function MapPage() {
    const [userRole, setUserRole] = useState<UserRole | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [isListView, setIsListView] = useState(false)
    const [reports, setReports] = useState<Report[]>([])

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

                    // For Rangers, fetch reports for ThreatListView
                    if (profile.role === 'ranger') {
                        const { data: reportsData } = await supabase
                            .from('reports')
                            .select('*')
                            .order('created_at', { ascending: false })

                        if (reportsData) {
                            setReports(reportsData as Report[])
                        }
                    }
                }
            }
        }

        fetchUserInfo()
    }, [])

    const handleReportsUpdate = async () => {
        if (userRole === 'ranger') {
            const supabase = createClient()
            const { data: reportsData } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })

            if (reportsData) {
                setReports(reportsData as Report[])
            }
        }
    }

    return (
        <main className="min-h-screen flex flex-col relative">
            {/* Background */}
            <AnimatedBackground variant="gradient" intensity={0.2} />
            
            {/* Header */}
            <header className="relative z-10 p-6 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            <GradientText variant="emerald">Live Map</GradientText>
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            {userRole === 'ranger'
                                ? 'Monitor medium and high-risk invasive species threats'
                                : 'View and manage your environmental reports'}
                        </p>
                    </div>

                    {/* List View Toggle for Rangers */}
                    {userRole === 'ranger' && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-400">Map View</span>
                            <button
                                onClick={() => setIsListView(!isListView)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    isListView ? 'bg-orange-500' : 'bg-zinc-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isListView ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className="text-sm text-zinc-400">List View</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content - Split Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 relative z-10">
                {/* Map Section - Left Half */}
                <div className="flex-1 min-h-[400px] lg:min-h-0">
                    <AnimatedBorder variant="glow" color="emerald" className="h-full">
                        <div className="h-full bg-zinc-900/50 rounded-lg overflow-hidden">
                            <SmartMap 
                                className="h-full w-full"
                                userRole={userRole}
                                userId={userId}
                            />
                        </div>
                    </AnimatedBorder>
                </div>

                {/* Reports List Section - Right Half */}
                <div className="flex-1 min-h-[400px] lg:min-h-0">
                    <AnimatedBorder variant="gradient" color="purple" className="h-full">
                        <div className="h-full bg-zinc-900/50 rounded-lg overflow-hidden p-4">
                            {userRole === 'ranger' && isListView ? (
                                <ThreatListView
                                    reports={reports}
                                    onReportsUpdate={handleReportsUpdate}
                                />
                            ) : (
                                <ReportsList userRole={userRole} userId={userId} />
                            )}
                        </div>
                    </AnimatedBorder>
                </div>
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
