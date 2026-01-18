'use client';

import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, Map as MapIcon, Shield, TreePine, Award, Activity, ArrowRight, Sparkles, TrendingUp, Zap, AlertTriangle, Check } from 'lucide-react'
import { signOut } from '@/app/actions'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { Card } from '@/components/ui/Card'
import Particles from '@/components/ui/Particles'
import { TypeText } from '@/components/ui/TypeText'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { BentoGrid, BentoCard } from '@/components/ui/BentoGrid'
import { GradientText } from '@/components/ui/GradientText'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { GlowCard } from '@/components/ui/GlowCard'
import { FloatingCard } from '@/components/ui/FloatingCard'

export default function DashboardClient() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ username?: string; role?: string; xp_points?: number } | null>(null)
  const [isRanger, setIsRanger] = useState(false)
  const [onDuty, setOnDuty] = useState(true)
  const [liveFeed, setLiveFeed] = useState<Array<{ id: string; species: string; location: string; user: string; timestamp: string }>>([])
  const [priorityAlerts, setPriorityAlerts] = useState<Array<{ id: string; species_name?: string; location_name?: string; hazard_rating?: string }>>([])
  const [sectorMetrics, setSectorMetrics] = useState({
    activeThreats: 0,
    resolvedToday: 0,
    resolutionRate: 0,
    avgResponseTime: null
  })

  const supabase = createClient()

  const fetchDashboardData = async () => {
    if (!user) return

    // Active threats
    const { count: activeCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Resolved today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: resolvedTodayCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('updated_at', today.toISOString())
      .lt('updated_at', tomorrow.toISOString())

    // Total reports for resolution rate
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    const { count: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    const resolutionRate = totalReports ? Math.round((resolvedReports || 0) / totalReports * 100) : 0

    setSectorMetrics({
      activeThreats: activeCount || 0,
      resolvedToday: resolvedTodayCount || 0,
      resolutionRate,
      avgResponseTime: null
    })
  }

  const fetchPriorityAlerts = async () => {
    const { data: alerts } = await supabase
      .from('reports')
      .select('*')
      .in('hazard_rating', ['high', 'critical'])
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3)

    setPriorityAlerts(alerts || [])
  }

  const handleResolveAlert = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId)

    if (!error) {
      await fetchPriorityAlerts()
      await fetchDashboardData()
    }
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        redirect('/login')
        return
      }

      setUser(authUser)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setProfile(profileData)
      setIsRanger(profileData?.role === 'ranger')

      // Fetch initial data
      await fetchDashboardData()
      await fetchPriorityAlerts()
    }

    initializeDashboard()
  }, [])

  // Realtime subscription for live feed
  useEffect(() => {
    if (!onDuty) return

    const channel = supabase
      .channel('reports_feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports'
      }, (payload) => {
        const newReport = payload.new
        setLiveFeed(prev => [{
          id: newReport.id,
          species: newReport.species_name,
          location: newReport.location_name,
          user: 'Field Agent', // You might want to fetch user info
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]) // Keep only last 10 items
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onDuty])

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">

      {/* Enhanced Background Ambience */}
      <AnimatedBackground variant="gradient" intensity={0.4} />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl p-6 pb-32">

        {/* Header Section */}
        <header className="mt-12 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
              {greeting}, <br />
              <GradientText variant={isRanger ? "orange" : "emerald"}>
                {profile?.username || "Scout"}
              </GradientText>
            </h1>
            <p className="mt-2 text-zinc-400 max-w-md">
              {isRanger
                ? "Command Center active. All systems operational."
                : "Ready to explore? The canopy is waiting for your reports."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Duty Status</span>
              <button
                onClick={() => setOnDuty(!onDuty)}
                className={`flex items-center gap-2 font-medium px-3 py-1 rounded-full transition-all ${
                  onDuty
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {onDuty ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  )}
                </span>
                {onDuty ? 'Active Duty' : 'Off Duty'}
              </button>
            </div>

            <form action={signOut}>
              <button className="p-3 rounded-full bg-zinc-900/50 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-zinc-800">
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </header>

        {/* Dashboard Grid with Bento Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">

          {/* Main Action Card with Glow Effect */}
          <div className="md:col-span-8">
            <GlowCard glowColor="emerald" intensity="high" className="h-full min-h-[300px] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1448375240586-dfd8f3793371?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 z-0" />

              <div className="relative z-20 p-6">
                <AnimatedBorder variant="glow" color="emerald" className="inline-block">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium">
                    <Activity size={12} className="text-emerald-400" />
                    Mission Control
                  </span>
                </AnimatedBorder>
              </div>

              <div className="relative z-20 p-6">
                <h2 className="text-3xl font-bold mb-2">
                  <GradientText variant="emerald">
                    {isRanger ? "Command Center" : "Start Observation"}
                  </GradientText>
                </h2>
                <p className="text-zinc-300 max-w-lg mb-6">
                  {isRanger
                    ? "Monitor sector threats, coordinate responses, and maintain ecological security protocols."
                    : "Capture accurate data points to help preserve the ecosystem balance. Every scan counts."}
                </p>

                <a href="/map" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105">
                  <MapIcon size={18} />
                  Open Live Map
                </a>
              </div>
            </GlowCard>
          </div>

          {/* Stats Card - Sector Health for Rangers, XP Display for Scouts */}
          <div className="md:col-span-4 space-y-6">
            {isRanger ? (
              /* Sector Performance Component for Rangers */
              <FloatingCard floatSpeed="medium">
                <AnimatedBorder variant="gradient" color="emerald" className="h-full">
                  <div className="h-full flex flex-col justify-center items-center text-center p-6 relative overflow-hidden group">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Title */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-emerald-400">Sector Performance</h3>
                      <p className="text-sm text-zinc-500">Operational Metrics</p>
                    </div>

                    {/* Radial Progress Circle for Resolution Rate */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-1000 ease-out"
                          style={{
                            background: `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${sectorMetrics.resolutionRate * 3.6}deg, transparent ${sectorMetrics.resolutionRate * 3.6}deg)`
                          }}
                        />
                        <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-emerald-400">{sectorMetrics.resolutionRate}%</div>
                            <div className="text-xs text-zinc-500">Resolved</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stat Labels */}
                    <div className="w-full space-y-3">
                      {/* Active Hazards */}
                      <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-500" />
                          <span className="text-sm font-medium text-zinc-300">Active Hazards</span>
                        </div>
                        <span className="text-lg font-bold text-orange-400">{sectorMetrics.activeThreats}</span>
                      </div>

                      {/* Threats Resolved */}
                      <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-sm font-medium text-zinc-300">Threats Resolved</span>
                        </div>
                        <span className="text-lg font-bold text-emerald-400">{sectorMetrics.resolvedToday}</span>
                      </div>
                    </div>
                  </div>
                </AnimatedBorder>
              </FloatingCard>
            ) : (
              /* Enhanced XP Display for Scouts */
              <FloatingCard floatSpeed="medium">
                <AnimatedBorder variant="gradient" color="emerald" className="h-full">
                  <div className="h-full flex flex-col justify-center items-center text-center p-8 relative overflow-hidden group">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Level Badge */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                      <div className="relative p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 backdrop-blur-sm">
                        <TreePine size={32} className="text-emerald-500 drop-shadow-lg" />
                      </div>
                    </div>

                    {/* Level Display */}
                    <div className="mb-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Sparkles size={16} className="text-yellow-500 animate-pulse" />
                        <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                          Level {Math.floor((profile?.xp_points || 0) / 200) + 1}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">SCOUT</p>
                    </div>

                    {/* XP Progress Bar - Enhanced */}
                    <div className="w-full mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                          <TrendingUp size={12} className="text-emerald-500" />
                          XP Progress
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {(profile?.xp_points || 0) % 200} / 200
                        </span>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="relative w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                        {/* Shimmer effect */}
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                          style={{
                            backgroundSize: '200% 100%',
                          }}
                        />

                        {/* Progress fill with gradient */}
                        <div
                          className="relative h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          style={{ width: `${((profile?.xp_points || 0) % 200) / 200 * 100}%` }}
                        >
                          {/* Glow effect */}
                          <div className="absolute inset-0 bg-emerald-400/50 blur-sm" />
                        </div>

                        {/* Pulse effect at the end */}
                        {((profile?.xp_points || 0) % 200) > 0 && (
                          <div
                            className="absolute top-0 w-1 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"
                            style={{ left: `calc(${((profile?.xp_points || 0) % 200) / 200 * 100}% - 2px)` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Total XP Display */}
                    <div className="w-full pt-3 border-t border-zinc-800/50">
                      <div className="flex items-center justify-center gap-2">
                        <Zap size={14} className="text-yellow-500" />
                        <span className="text-sm font-semibold text-zinc-300">
                          {profile?.xp_points || 0} Total XP
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {1000 - (profile?.xp_points || 0)} XP until max level
                      </p>
                    </div>
                  </div>
                </AnimatedBorder>
              </FloatingCard>
            )}
          </div>

          {/* Priority Alerts Card */}
          <div className="md:col-span-4">
            <GlowCard glowColor="orange" intensity="medium" className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-red-400">Priority Alerts</h3>
                  <p className="text-xs text-zinc-500">
                    Critical threats requiring immediate attention
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {priorityAlerts.length > 0 ? priorityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="group relative flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/5 via-red-500/3 to-transparent hover:border-red-500/50 transition-all duration-300"
                  >
                    {/* Alert Icon */}
                    <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                      <AlertTriangle size={16} className="text-red-400 animate-pulse" />
                    </div>

                    {/* Alert Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-400 group-hover:text-red-300 transition-colors">
                        {alert.species_name || 'Unknown Species'}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {alert.location_name || 'Unknown Location'} • {alert.hazard_rating?.toUpperCase()}
                      </p>
                    </div>

                    {/* Resolve Button */}
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check size={12} />
                      Resolve
                    </button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Check className="w-12 h-12 text-green-500 mb-3 opacity-50" />
                    <p className="text-sm font-medium text-zinc-300 mb-1">All Clear</p>
                    <p className="text-xs text-zinc-500">No critical alerts at this time</p>
                  </div>
                )}
              </div>
            </GlowCard>
          </div>

          {/* Live Field Feed */}
          <div className="md:col-span-8">
            <GlowCard glowColor="emerald" intensity="low" className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                  <Activity className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-emerald-400">Live Field Feed</h3>
                  <p className="text-xs text-zinc-500">
                    Real-time environmental monitoring updates
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {liveFeed.length > 0 ? liveFeed.map((feedItem, index) => (
                  <div
                    key={feedItem.id || index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/30 border-l-4 border-emerald-500/60 backdrop-blur-sm hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">
                        <span className="font-semibold text-emerald-400">{feedItem.species}</span>
                        {' detected at '}
                        <span className="text-zinc-300">{feedItem.location}</span>
                        {' by '}
                        <span className="text-zinc-400">{feedItem.user}</span>
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(feedItem.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-sm font-medium text-zinc-400 mb-1">
                      {onDuty ? 'Monitoring Active' : 'Feed Paused'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {onDuty ? 'Waiting for field updates...' : 'Resume duty to see live updates'}
                    </p>
                  </div>
                )}
              </div>
            </GlowCard>
          </div>

        </div>
      </main>

      {/* Bubble Menu Navigation (Authenticated) */}
      <BubbleMenu
        menuBg="#18181b"
        menuContentColor="#ffffff"
        items={[
          { label: 'Map', href: '/map', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
          { label: 'Profile', href: '/profile', rotation: 10, hoverStyles: { bgColor: '#8b5cf6', textColor: '#fff' } },
        ]}
      />

    </div>
  )
}
