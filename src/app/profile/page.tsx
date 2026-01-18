'use client';

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { redirect } from 'next/navigation'
import { Award, TrendingUp, Zap, Sparkles, Coins, ArrowLeft, Shield, TreePine, Clock, DollarSign, AlertTriangle, Check } from 'lucide-react'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { TypeText } from '@/components/ui/TypeText'
import { AnimatedBackground } from '@/components/ui/AnimatedBackground'
import { BentoGrid, BentoCard } from '@/components/ui/BentoGrid'
import { AnimatedBorder } from '@/components/ui/AnimatedBorder'
import { GlowCard } from '@/components/ui/GlowCard'
import { FloatingCard } from '@/components/ui/FloatingCard'
import { GradientText } from '@/components/ui/GradientText'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [onDuty, setOnDuty] = useState(true)
  const [achievementsData, setAchievementsData] = useState<any[]>([])
  const [reportCount, setReportCount] = useState(0)
  const [invasiveCount, setInvasiveCount] = useState(0)
  const [activeThreats, setActiveThreats] = useState(0)
  const [resolvedToday, setResolvedToday] = useState(0)
  const [resolutionRate, setResolutionRate] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState<string | null>(null)
  const [isRanger, setIsRanger] = useState(false)

  const supabase = createClient()

  const fetchReportStats = async (isRanger: boolean) => {
    if (!user) return

    // Basic report count
    const { count: reports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    setReportCount(reports || 0)

    // Invasive count
    const { count: invasives } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_invasive', true)
    setInvasiveCount(invasives || 0)

    if (isRanger) {
      // Active threats (pending reports)
      const { count: activeCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      setActiveThreats(activeCount || 0)

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
      setResolvedToday(resolvedTodayCount || 0)

      // Total reports for resolution rate
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })

      const { count: resolvedReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')

      if (totalReports && totalReports > 0) {
        setResolutionRate(Math.round((resolvedReports || 0) / totalReports * 100))
      }

      // Average response time - placeholder for now
      setAvgResponseTime('14m')

    }
  }


  useEffect(() => {
    const initializeProfile = async () => {
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

      // Fetch achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('achievement_key, unlocked_at')
        .eq('user_id', authUser.id)
        .order('unlocked_at', { ascending: false })

      setAchievementsData(achievementsError ? [] : (achievements || []))

      // Fetch report stats
      await fetchReportStats(profileData?.role === 'ranger')
    }

    initializeProfile()
  }, [])


  // Achievement definitions - conditional based on role (computed in component)
  const achievementDefs = React.useMemo(() => isRanger ? {
    first_resolution: { emoji: '✅', name: 'First Resolution', description: 'Resolved your 1st threat' },
    sector_guardian: { emoji: '🛡️', name: 'Sector Guardian', description: 'Managed 10 threats' },
    crisis_manager: { emoji: '🚨', name: 'Crisis Manager', description: 'Resolved 50 threats' },
    invasive_eliminator: { emoji: '🎯', name: 'Invasive Eliminator', description: 'Managed invasive species threats' },
    fire_watch: { emoji: '🔥', name: 'Fire Watch', description: 'Identified critical fire hazard' },
    efficiency_expert: { emoji: '⚡', name: 'Efficiency Expert', description: 'Maintained 90%+ resolution rate' },
    veteran_ranger: { emoji: '⭐', name: 'Veteran Ranger', description: '5 years of service' },
    legend_ranger: { emoji: '👑', name: 'Legend Ranger', description: '1000+ reports resolved' },
  } : {
    first_sighting: { emoji: '🌱', name: 'First Sighting', description: 'Logged your 1st plant' },
    explorer: { emoji: '🗺️', name: 'Explorer', description: 'Logged 10 plants' },
    veteran_scout: { emoji: '🏅', name: 'Veteran Scout', description: 'Logged 50 plants' },
    invasive_hunter: { emoji: '🎯', name: 'Invasive Hunter', description: 'Detected invasive species' },
    fire_watch: { emoji: '🔥', name: 'Fire Watch', description: 'Identified critical fire hazard' },
    century_club: { emoji: '💯', name: 'Century Club', description: 'Reached 100 XP' },
    master_scout: { emoji: '⭐', name: 'Master Scout', description: 'Reached 500 XP' },
    legend: { emoji: '👑', name: 'Legend', description: 'Reached 1000 XP' },
  }, [isRanger])

  const unlockedKeys = new Set(achievementsData.map(a => a.achievement_key))

  // Calculate XP-related values for Scouts
  const xpProgress = Math.min(((profile?.xp_points || 0) / 1000) * 100, 100)
  const currentLevel = Math.floor((profile?.xp_points || 0) / 200) + 1
  const xpForCurrentLevel = (profile?.xp_points || 0) % 200
  const xpForNextLevel = 200
  const levelProgress = (xpForCurrentLevel / xpForNextLevel) * 100

  // Money conversion info (future feature)
  const xpToMoneyRate = 10 // 10 XP = $1 (example rate)
  const estimatedMoneyValue = (profile?.xp_points || 0) / xpToMoneyRate

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      {/* Enhanced Background Ambience */}
      <AnimatedBackground variant="aurora" intensity={0.5} />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-6xl p-6 pb-32">
        {/* Header */}
        <header className={`mt-12 mb-8 flex items-center justify-between gap-4 relative ${onDuty && isRanger ? 'before:absolute before:inset-0 before:bg-emerald-500/10 before:blur-xl before:rounded-lg before:-z-10' : ''}`}>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors border border-zinc-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                <GradientText variant="emerald">Profile & Stats</GradientText>
              </h1>
              <p className="mt-2 text-zinc-400">
                View your progress, achievements, and rewards
              </p>
            </div>
          </div>

          {/* Duty Status Toggle for Rangers */}
          {isRanger && (
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
                <span className={`relative flex h-2 w-2 ${onDuty ? 'animate-pulse' : ''}`}>
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
          )}
        </header>

        {/* Stats Grid with Diverse Border Styles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Total Reports - Glow Card */}
          <FloatingCard floatSpeed="slow">
            <GlowCard glowColor="blue" intensity="medium" className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <AnimatedBorder variant="glow" color="blue" className="p-3 rounded-lg">
                    <TrendingUp className="text-blue-400" size={24} />
                  </AnimatedBorder>
                  <span className="text-3xl font-bold">{reportCount || 0}</span>
                </div>
                <p className="text-sm text-zinc-400">{isRanger ? 'Threats Managed' : 'Total Reports'}</p>
              </div>
            </GlowCard>
          </FloatingCard>

          {/* Invasive Species - Neon Border */}
          <FloatingCard floatSpeed="medium" className="delay-200">
            <AnimatedBorder variant="neon" color="orange" className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                    <Shield className="text-red-400" size={24} />
                  </div>
                  <span className="text-3xl font-bold">{invasiveCount || 0}</span>
                </div>
                <p className="text-sm text-zinc-400">{isRanger ? 'Invasives Verified' : 'Invasive Species'}</p>
              </div>
            </AnimatedBorder>
          </FloatingCard>

        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* XP & Level Card or Sector Performance Card */}
          {isRanger ? (
            <FloatingCard floatSpeed="medium">
              <AnimatedBorder variant="gradient" color="emerald" className="h-full">
                <div className="p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                      <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Sector Performance</h2>
                      <p className="text-sm text-zinc-500">Operational metrics and response tracking</p>
                    </div>
                  </div>

                  {/* Centered content */}
                  <div className="text-center space-y-6">
                    {/* Shield Icon */}
                    <div className="relative mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                      <div className="relative p-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 backdrop-blur-sm">
                        <Shield size={48} className="text-orange-500 drop-shadow-lg" />
                      </div>
                    </div>

                    {/* RANGER Title */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles size={20} className="text-yellow-500 animate-pulse" />
                        <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                          RANGER
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500">PROFESSIONAL OPERATIONS</p>
                    </div>

                    {/* Radial Progress Circle for Sector Health */}
                    <div className="relative mb-6 flex justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-1000 ease-out"
                          style={{
                            background: `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${resolutionRate * 3.6}deg, transparent ${resolutionRate * 3.6}deg)`
                          }}
                        />
                        <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-emerald-400">{resolutionRate}%</div>
                            <div className="text-xs text-zinc-500">Sector Health</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="w-full max-w-sm mx-auto space-y-3">
                      {/* Active Threats */}
                      <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-orange-500" />
                          <span className="text-sm font-medium text-zinc-300">Active Threats</span>
                        </div>
                        <span className="text-lg font-bold text-orange-400">{activeThreats}</span>
                      </div>

                      {/* Avg. Response Time */}
                      <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-blue-500" />
                          <span className="text-sm font-medium text-zinc-300">Avg. Response Time</span>
                        </div>
                        <span className="text-lg font-bold text-blue-400">{avgResponseTime || '--'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                    </div>
                  </AnimatedBorder>
                </FloatingCard>
          ) : (
            <FloatingCard floatSpeed="medium">
              <AnimatedBorder variant="gradient" color="emerald" className="h-full">
                <div className="p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                    <Zap className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Experience Points</h2>
                    <p className="text-sm text-zinc-500">Your progress and level</p>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="relative mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 backdrop-blur-sm">
                    <TreePine size={48} className="text-emerald-500 drop-shadow-lg" />
                  </div>
                </div>

                {/* Level Display */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles size={20} className="text-yellow-500 animate-pulse" />
                    <span className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      Level {currentLevel}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500">{profile?.role?.toUpperCase() || 'SCOUT'}</p>
                </div>

                {/* XP Progress Bar */}
                <div className="w-full mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                      <TrendingUp size={12} className="text-emerald-500" />
                      Level Progress
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {xpForCurrentLevel} / {xpForNextLevel} XP
                    </span>
                  </div>

                  <div className="relative w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                      style={{ backgroundSize: '200% 100%' }}
                    />
                    <div
                      className="relative h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${levelProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-emerald-400/50 blur-sm" />
                    </div>
                    {levelProgress > 0 && (
                      <div
                        className="absolute top-0 w-1 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"
                        style={{ left: `calc(${levelProgress}% - 2px)` }}
                      />
                    )}
                  </div>
                </div>

                {/* Total XP */}
                <div className="pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Total XP</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {profile?.xp_points || 0} / 1000
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">XP until max level</span>
                    <span className="text-xs font-medium text-zinc-400">
                      {1000 - (profile?.xp_points || 0)} XP
                    </span>
                  </div>
                </div>
                </div>
                  </div>
                </AnimatedBorder>
              </FloatingCard>
          )}

        </div>

        {/* Money Conversion Info Card - Only for Scouts */}
        {!isRanger && (
        <AnimatedBorder variant="shimmer" color="purple" className="mt-6">
          <div className="p-8 bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="flex items-start gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
              <Coins className="text-purple-400" size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="text-purple-400" size={20} />
                <h2 className="text-2xl font-bold">XP to Money Conversion</h2>
                <span className="px-2 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-xs text-purple-400 font-medium">
                  Coming Soon
                </span>
              </div>
              <p className="text-zinc-400 mb-4">
                Your XP will soon be convertible to monetary rewards! This feature is currently in development.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Current XP Value</span>
                    <Clock className="text-zinc-500" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">
                    ${estimatedMoneyValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Estimated at {xpToMoneyRate} XP = $1
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Max Level Value</span>
                    <TrendingUp className="text-zinc-500" size={16} />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">$100.00</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    At 1000 XP maximum
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-400">
                  <strong>Note:</strong> Conversion rates and redemption methods are subject to change. 
                  More details will be announced when this feature launches. Keep earning XP to maximize your rewards!
                </p>
              </div>
            </div>
            </div>
          </div>
        </AnimatedBorder>
        )}
      </main>

      {/* Bubble Menu Navigation */}
      <BubbleMenu
        menuBg="#18181b"
        menuContentColor="#ffffff"
        items={[
          { label: 'Home', href: '/', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
          { label: 'Map', href: '/map', rotation: 10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
        ]}
      />
    </div>
  )
}
