import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Map as MapIcon, Shield, TreePine, Award, Activity, ArrowRight } from 'lucide-react'
import BubbleMenu from '@/components/ui/BubbleMenu'
import { Card } from '@/components/ui/Card'
import Particles from '@/components/ui/Particles'

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

        {/* Particles Background */}
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
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 drop-shadow-sm">
                CanopyCheck
              </h1>
              <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed">
                AI-Powered Environmental Surveillance <br className="hidden md:block" /> for the Modern Age.
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <a href="/login" className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
                Enter Application <ArrowRight size={20} />
              </a>
            </div>

            {/* About Section (Simple) */}
            <div className="mt-16 max-w-3xl glass-panel p-8 md:p-10 rounded-3xl mx-auto backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-emerald-400">Protect Our Forests</h2>
              <p className="text-zinc-300 text-lg leading-relaxed">
                CanopyCheck utilizes advanced computer vision and community reporting to track invasive species and monitor forest health in real-time. Join the corps of Scouts and Rangers today to preserve our ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* Bubble Menu for Guest */}
        <BubbleMenu
          logo="CC"
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

  const isRanger = profile?.role === 'ranger'

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

      {/* Background Ambience */}
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
              <span className={isRanger ? "text-orange-500" : "text-emerald-500"}>
                {profile?.username || "Scout"}
              </span>
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up">

          {/* Main Action Card */}
          <div className="md:col-span-8">
            <Card className="h-full min-h-[300px] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1448375240586-dfd8f3793371?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700 z-0" />

              <div className="relative z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium border border-white/10">
                  <Activity size={12} className="text-emerald-400" />
                  Mission Control
                </span>
              </div>

              <div className="relative z-20">
                <h2 className="text-3xl font-bold mb-2">
                  {isRanger ? "Sector Analysis" : "Start Observation"}
                </h2>
                <p className="text-zinc-300 max-w-lg mb-6">
                  {isRanger
                    ? "Review latest heatmaps and flagged invasive species reports in your assigned sector."
                    : "Capture accurate data points to help preserve the ecosystem balance. Every scan counts."}
                </p>

                <a href="/map" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <MapIcon size={18} />
                  Open Live Map
                </a>
              </div>
            </Card>
          </div>

          {/* Stats Card */}
          <div className="md:col-span-4 space-y-6">
            <Card variant="outline" className="h-full flex flex-col justify-center items-center text-center p-8">
              <div className="mb-4 p-4 rounded-full bg-zinc-900 border border-zinc-800">
                {isRanger ? <Shield size={32} className="text-orange-500" /> : <TreePine size={32} className="text-emerald-500" />}
              </div>
              <h3 className="text-xl font-bold">{profile?.role?.toUpperCase() || 'SCOUT'}</h3>
              <p className="text-sm text-zinc-500 mb-6">Current Rank</p>

              <div className="w-full bg-zinc-900 rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-300 h-full w-[75%]" />
              </div>
              <div className="flex justify-between w-full text-xs text-zinc-400">
                <span>XP</span>
                <span>{profile?.xp_points || 0} / 1000</span>
              </div>
            </Card>
          </div>

          {/* Secondary Info Cards */}
          <div className="md:col-span-4">
            <Card className="h-full">
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-yellow-500" />
                <h3 className="font-semibold">Achievements</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs">🌱</div>
                  <div>
                    <p className="text-sm font-medium">First Sighting</p>
                    <p className="text-xs text-zinc-500">Logged 1st plant</p>
                  </div>
                </div>
                {/* Placeholder for more */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">🔒</div>
                  <div>
                    <p className="text-sm font-medium">Coming Soon</p>
                    <p className="text-xs text-zinc-500">Keep exploring</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-8">
            <Card variant="solid" className="h-full flex items-center justify-center border-dashed border-2 border-zinc-800 bg-zinc-950/30">
              <p className="text-zinc-500 text-sm">Recent Activity Stream Placeholder</p>
            </Card>
          </div>

        </div>
      </main>

      {/* Bubble Menu Navigation (Authenticated) */}
      <BubbleMenu
        logo={
          <div className="flex items-center justify-center w-full h-full bg-emerald-500 text-black font-bold text-xl rounded-full">
            CC
          </div>
        }
        menuBg="#18181b"
        menuContentColor="#ffffff"
        items={[
          { label: 'Map', href: '/map', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
        ]}
      />

    </div>
  )
}

