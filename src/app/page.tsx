import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, Map as MapIcon, Shield, TreePine, Award, Activity, ArrowRight, Sparkles, TrendingUp, Zap, AlertTriangle, Check } from 'lucide-react'
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
import DashboardClient from '@/components/DashboardClient'

export default async function HomePage() {
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
  return <DashboardClient />
}

