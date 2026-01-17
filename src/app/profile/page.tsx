import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Award, TrendingUp, Zap, Sparkles, Coins, ArrowLeft, Shield, TreePine, Clock, DollarSign } from 'lucide-react'
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

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Verify Session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user achievements (handle case where table might not exist)
  const { data: achievements, error: achievementsError } = await supabase
    .from('achievements')
    .select('achievement_key, unlocked_at')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })
  
  // If achievements table doesn't exist, use empty array
  const achievementsData = achievementsError ? [] : (achievements || [])

  // Get report count and stats
  const { count: reportCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: invasiveCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_invasive', true)

  const isRanger = profile?.role === 'ranger'

  // Achievement definitions
  const achievementDefs: Record<string, { emoji: string; name: string; description: string }> = {
    first_sighting: { emoji: '🌱', name: 'First Sighting', description: 'Logged your 1st plant' },
    explorer: { emoji: '🗺️', name: 'Explorer', description: 'Logged 10 plants' },
    veteran_scout: { emoji: '🏅', name: 'Veteran Scout', description: 'Logged 50 plants' },
    invasive_hunter: { emoji: '🎯', name: 'Invasive Hunter', description: 'Detected invasive species' },
    fire_watch: { emoji: '🔥', name: 'Fire Watch', description: 'Identified critical fire hazard' },
    century_club: { emoji: '💯', name: 'Century Club', description: 'Reached 100 XP' },
    master_scout: { emoji: '⭐', name: 'Master Scout', description: 'Reached 500 XP' },
    legend: { emoji: '👑', name: 'Legend', description: 'Reached 1000 XP' },
  }

  const unlockedKeys = new Set(achievementsData.map(a => a.achievement_key))

  // Calculate XP progress
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
        <header className="mt-12 mb-8 flex items-center gap-4">
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
        </header>

        {/* Stats Grid with Diverse Border Styles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-sm text-zinc-400">Total Reports</p>
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
                <p className="text-sm text-zinc-400">Invasive Species</p>
              </div>
            </AnimatedBorder>
          </FloatingCard>

          {/* Achievements - Gradient Border */}
          <FloatingCard floatSpeed="slow" className="delay-400">
            <AnimatedBorder variant="gradient" color="purple" className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                    <Award className="text-yellow-400" size={24} />
                  </div>
                  <span className="text-3xl font-bold">{unlockedKeys.size}</span>
                </div>
                <p className="text-sm text-zinc-400">Achievements</p>
              </div>
            </AnimatedBorder>
          </FloatingCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* XP & Level Card */}
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
                  {isRanger ? (
                    <Shield size={48} className="text-orange-500 drop-shadow-lg" />
                  ) : (
                    <TreePine size={48} className="text-emerald-500 drop-shadow-lg" />
                  )}
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

          {/* Achievements Card */}
          <GlowCard glowColor="purple" intensity="medium" className="p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                <Award className="text-yellow-500" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Achievements</h2>
                <p className="text-sm text-zinc-500">
                  {unlockedKeys.size} of {Object.keys(achievementDefs).length} unlocked
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {Object.entries(achievementDefs).map(([key, achievement]) => {
                const isUnlocked = unlockedKeys.has(key)
                const unlockedAt = achievementsData.find(a => a.achievement_key === key)?.unlocked_at
                
                return (
                  <div
                    key={key}
                    className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02]'
                        : 'bg-zinc-900/30 border-zinc-800/50 opacity-60'
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}
                    
                    <div
                      className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:scale-110 group-hover:rotate-3'
                          : 'bg-zinc-800/50 border border-zinc-700/50'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <span className="relative z-10">{achievement.emoji}</span>
                          <Sparkles size={14} className="absolute text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                        </>
                      ) : (
                        <span className="text-zinc-600">🔒</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition-colors ${
                        isUnlocked 
                          ? 'text-emerald-400 group-hover:text-emerald-300' 
                          : 'text-zinc-500'
                      }`}>
                        {achievement.name}
                      </p>
                      <p className="text-xs text-zinc-500">{achievement.description}</p>
                      {isUnlocked && unlockedAt && (
                        <p className="text-xs text-zinc-600 mt-1">
                          Unlocked {new Date(unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {isUnlocked && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </GlowCard>
        </div>

        {/* Money Conversion Info Card */}
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
