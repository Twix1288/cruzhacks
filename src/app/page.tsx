import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Map as MapIcon, Shield, TreePine, Award, Activity, ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react'
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

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Verify Session
  const { data: { user } } = await supabase.auth.getUser()

  // ---------------------------------------------------------
  // LANDING PAGE (Unauthenticated)
  // ---------------------------------------------------------
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-hidden font-sans">

        {/* Enhanced Animated Background */}
        <AnimatedBackground variant="aurora" intensity={0.6} />
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#ffffff', '#10b981']}
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
            className="h-full w-full"
          />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center p-6 pb-32">

          <div className="animate-fade-in space-y-8">
            <div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4 drop-shadow-sm">
                <GradientText variant="emerald" className="text-6xl md:text-8xl">
                  <TypeText
                    text="CanopyCheck"
                    speed={150}
                    delay={500}
                  />
                </GradientText>
              </h1>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light leading-relaxed text-zinc-300">
                AI-Powered Environmental Surveillance <br className="hidden md:block" />
                <GradientText variant="emerald" className="text-xl md:text-2xl">
                  for the Modern Age
                </GradientText>
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <a href="/login" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
                Enter Application <ArrowRight size={20} />
              </a>
            </div>

            {/* About Section with Diverse Card Styles */}
            <div className="mt-16 max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Main Feature Card with Gradient Border */}
                <div className="md:col-span-3">
                  <AnimatedBorder variant="gradient" color="emerald">
                  <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                      <GradientText variant="emerald">Protect Our Forests</GradientText>
                    </h2>
                    <p className="text-zinc-300 text-lg leading-relaxed max-w-3xl mx-auto">
                      CanopyCheck utilizes advanced computer vision and community reporting to track invasive species and monitor forest health in real-time. Join the corps of Scouts and Rangers today to preserve our ecosystem.
                    </p>
                  </div>
                </AnimatedBorder>
                </div>

                {/* Feature Cards with Different Styles */}
                <FloatingCard floatSpeed="slow">
                  <AnimatedBorder variant="glow" color="emerald" className="h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="text-5xl mb-4 text-center">🌲</div>
                      <h3 className="text-xl font-bold mb-2 text-white text-center">Real-Time Monitoring</h3>
                      <p className="text-zinc-400 text-sm text-center">Track invasive species as they appear in real-time across the forest.</p>
                    </div>
                  </AnimatedBorder>
                </FloatingCard>

                <FloatingCard floatSpeed="medium" className="delay-200">
                  <AnimatedBorder variant="neon" color="blue" className="h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="text-5xl mb-4 text-center">🤖</div>
                      <h3 className="text-xl font-bold mb-2 text-white text-center">AI-Powered Detection</h3>
                      <p className="text-zinc-400 text-sm text-center">Advanced computer vision identifies threats with high accuracy.</p>
                    </div>
                  </AnimatedBorder>
                </FloatingCard>

                <FloatingCard floatSpeed="slow" className="delay-400">
                  <AnimatedBorder variant="shimmer" color="purple" className="h-full">
                    <div className="p-6 h-full flex flex-col">
                      <div className="text-5xl mb-4 text-center">👥</div>
                      <h3 className="text-xl font-bold mb-2 text-white text-center">Community Driven</h3>
                      <p className="text-zinc-400 text-sm text-center">Scouts and Rangers work together to protect our environment.</p>
                    </div>
                  </AnimatedBorder>
                </FloatingCard>
              </div>
            </div>
          </div>
        </div>

        {/* Bubble Menu for Guest */}
        <BubbleMenu
          menuBg="#18181b"
          menuContentColor="#ffffff"
          items={[
            { label: 'Home', href: '/', rotation: 0, hoverStyles: { bgColor: '#ffffff', textColor: '#000' } },
            { label: 'Login', href: '/login', rotation: 10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } }
          ]}
        />
      </div>
    );
  }

  // ---------------------------------------------------------
  // DASHBOARD (Authenticated)
  // ---------------------------------------------------------

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user achievements (handle case where table might not exist)
  const { data: achievements, error: achievementsError } = await supabase
    .from('achievements')
    .select('achievement_key')
    .eq('user_id', user.id)
  
  // If achievements table doesn't exist, use empty array
  const achievementsData = achievementsError ? [] : (achievements || [])

  // Get report count for achievement checking
  const { count: reportCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

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
  
  // Calculate XP progress percentage
  const xpProgress = Math.min(((profile?.xp_points || 0) / 1000) * 100, 100)
  
  // Calculate level based on XP (every 200 XP = 1 level)
  const currentLevel = Math.floor((profile?.xp_points || 0) / 200) + 1
  const xpForCurrentLevel = (profile?.xp_points || 0) % 200
  const xpForNextLevel = 200
  
  // Calculate level progress
  const levelProgress = (xpForCurrentLevel / xpForNextLevel) * 100

  // 3. Server Action for Logout
  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

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
                ? "Systems active. Area surveillance protocols engaged."
                : "Ready to explore? The canopy is waiting for your reports."}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Current Status</span>
              <span className="flex items-center gap-2 font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online
              </span>
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
                    {isRanger ? "Sector Analysis" : "Start Observation"}
                  </GradientText>
                </h2>
                <p className="text-zinc-300 max-w-lg mb-6">
                  {isRanger
                    ? "Review latest heatmaps and flagged invasive species reports in your assigned sector."
                    : "Capture accurate data points to help preserve the ecosystem balance. Every scan counts."}
                </p>

                <a href="/map" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105">
                  <MapIcon size={18} />
                  Open Live Map
                </a>
              </div>
            </GlowCard>
          </div>

          {/* Stats Card - Enhanced XP Display */}
          <div className="md:col-span-4 space-y-6">
            <FloatingCard floatSpeed="medium">
              <AnimatedBorder variant="gradient" color="emerald" className="h-full">
                <div className="h-full flex flex-col justify-center items-center text-center p-8 relative overflow-hidden group">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Level Badge */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                <div className="relative p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/30 backdrop-blur-sm">
                  {isRanger ? (
                    <Shield size={32} className="text-orange-500 drop-shadow-lg" />
                  ) : (
                    <TreePine size={32} className="text-emerald-500 drop-shadow-lg" />
                  )}
                </div>
              </div>

              {/* Level Display */}
              <div className="mb-2">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles size={16} className="text-yellow-500 animate-pulse" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    Level {currentLevel}
                  </span>
                </div>
                <p className="text-sm text-zinc-500">{profile?.role?.toUpperCase() || 'SCOUT'}</p>
              </div>

              {/* XP Progress Bar - Enhanced */}
              <div className="w-full mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                    <TrendingUp size={12} className="text-emerald-500" />
                    XP Progress
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {xpForCurrentLevel} / {xpForNextLevel}
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
                    style={{ width: `${levelProgress}%` }}
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-emerald-400/50 blur-sm" />
                  </div>
                  
                  {/* Pulse effect at the end */}
                  {levelProgress > 0 && (
                    <div 
                      className="absolute top-0 w-1 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse"
                      style={{ left: `calc(${levelProgress}% - 2px)` }}
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
          </div>

          {/* Secondary Info Cards - Enhanced Achievements */}
          <div className="md:col-span-4">
            <GlowCard glowColor="purple" intensity="medium" className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                  <Award className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Achievements</h3>
                  <p className="text-xs text-zinc-500">
                    {unlockedKeys.size} of {Object.keys(achievementDefs).length} unlocked
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(achievementDefs).map(([key, achievement], index) => {
                  const isUnlocked = unlockedKeys.has(key)
                  const borderVariants: Array<'glow' | 'gradient' | 'neon' | 'shimmer'> = ['glow', 'gradient', 'neon', 'shimmer']
                  const borderColors: Array<'emerald' | 'purple' | 'blue' | 'orange'> = ['emerald', 'purple', 'blue', 'orange']
                  const variant = isUnlocked ? borderVariants[index % borderVariants.length] : undefined
                  const color = isUnlocked ? borderColors[index % borderColors.length] : 'emerald'
                  
                  if (!isUnlocked) {
                    return (
                      <div
                        key={key}
                        className="group relative flex items-center gap-3 p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/30 opacity-60 hover:opacity-80 hover:border-zinc-700/50 transition-all duration-300 cursor-pointer"
                      >
                        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-zinc-800/50 border border-zinc-700/50">
                          <span className="text-zinc-600">🔒</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-500">{achievement.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{achievement.description}</p>
                        </div>
                      </div>
                    )
                  }
                  
                  return (
                    <AnimatedBorder 
                      key={key}
                      variant={variant!} 
                      color={color}
                      className="group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                    >
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent">
                        {/* Achievement Icon */}
                        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <span className="relative z-10">{achievement.emoji}</span>
                          <Sparkles size={12} className="absolute text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                        </div>
                        
                        {/* Achievement Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                            {achievement.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{achievement.description}</p>
                        </div>
                        
                        {/* Unlocked indicator */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </AnimatedBorder>
                  )
                })}
                
                {Object.keys(achievementDefs).length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-600">🔒</div>
                    <div>
                      <p className="text-sm font-medium text-zinc-500">Keep Exploring</p>
                      <p className="text-xs text-zinc-500">Complete missions to unlock achievements</p>
                    </div>
                  </div>
                )}
              </div>
            </GlowCard>
          </div>

          <div className="md:col-span-8">
            <AnimatedBorder variant="dashed" color="blue" className="h-full flex items-center justify-center bg-zinc-950/30">
              <p className="text-zinc-500 text-sm">Recent Activity Stream Placeholder</p>
            </AnimatedBorder>
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

