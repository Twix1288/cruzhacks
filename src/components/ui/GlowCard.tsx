'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'emerald' | 'purple' | 'blue' | 'orange' | 'pink'
  intensity?: 'low' | 'medium' | 'high'
  hover?: boolean
  onClick?: () => void
}

const glowColors = {
  emerald: {
    low: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    medium: 'shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    high: 'shadow-[0_0_40px_rgba(16,185,129,0.6)]',
    hover: 'hover:shadow-[0_0_50px_rgba(16,185,129,0.8)]',
  },
  purple: {
    low: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    medium: 'shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    high: 'shadow-[0_0_40px_rgba(168,85,247,0.6)]',
    hover: 'hover:shadow-[0_0_50px_rgba(168,85,247,0.8)]',
  },
  blue: {
    low: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
    medium: 'shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    high: 'shadow-[0_0_40px_rgba(59,130,246,0.6)]',
    hover: 'hover:shadow-[0_0_50px_rgba(59,130,246,0.8)]',
  },
  orange: {
    low: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
    medium: 'shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    high: 'shadow-[0_0_40px_rgba(249,115,22,0.6)]',
    hover: 'hover:shadow-[0_0_50px_rgba(249,115,22,0.8)]',
  },
  pink: {
    low: 'shadow-[0_0_15px_rgba(236,72,153,0.2)]',
    medium: 'shadow-[0_0_25px_rgba(236,72,153,0.4)]',
    high: 'shadow-[0_0_40px_rgba(236,72,153,0.6)]',
    hover: 'hover:shadow-[0_0_50px_rgba(236,72,153,0.8)]',
  },
}

export function GlowCard({
  children,
  className,
  glowColor = 'emerald',
  intensity = 'medium',
  hover = true,
  onClick,
}: GlowCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl',
        'transition-all duration-300',
        glowColors[glowColor][intensity],
        hover && glowColors[glowColor].hover,
        hover && 'hover:scale-[1.02] hover:border-zinc-700/50',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Inner glow effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300',
          hover && 'hover:opacity-100',
          glowColor === 'emerald' && 'bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent',
          glowColor === 'purple' && 'bg-gradient-to-br from-purple-500/10 via-transparent to-transparent',
          glowColor === 'blue' && 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent',
          glowColor === 'orange' && 'bg-gradient-to-br from-orange-500/10 via-transparent to-transparent',
          glowColor === 'pink' && 'bg-gradient-to-br from-pink-500/10 via-transparent to-transparent',
        )}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
