'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface AnimatedBorderProps {
  children: ReactNode
  className?: string
  variant?: 'glow' | 'gradient' | 'pulse' | 'shimmer' | 'neon' | 'dashed'
  color?: 'emerald' | 'purple' | 'blue' | 'orange' | 'pink'
  thickness?: 'thin' | 'medium' | 'thick'
  onClick?: (e: React.MouseEvent) => void
}

const colorMap = {
  emerald: {
    glow: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    gradient: 'from-emerald-500 via-emerald-400 to-emerald-600',
    pulse: 'border-emerald-500',
    shimmer: 'border-emerald-500',
    neon: 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8),inset_0_0_10px_rgba(16,185,129,0.2)]',
    dashed: 'border-emerald-500/50',
  },
  purple: {
    glow: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    gradient: 'from-purple-500 via-pink-400 to-purple-600',
    pulse: 'border-purple-500',
    shimmer: 'border-purple-500',
    neon: 'border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.8),inset_0_0_10px_rgba(168,85,247,0.2)]',
    dashed: 'border-purple-500/50',
  },
  blue: {
    glow: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    gradient: 'from-blue-500 via-cyan-400 to-blue-600',
    pulse: 'border-blue-500',
    shimmer: 'border-blue-500',
    neon: 'border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8),inset_0_0_10px_rgba(59,130,246,0.2)]',
    dashed: 'border-blue-500/50',
  },
  orange: {
    glow: 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]',
    gradient: 'from-orange-500 via-red-400 to-orange-600',
    pulse: 'border-orange-500',
    shimmer: 'border-orange-500',
    neon: 'border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8),inset_0_0_10px_rgba(249,115,22,0.2)]',
    dashed: 'border-orange-500/50',
  },
  pink: {
    glow: 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    gradient: 'from-pink-500 via-rose-400 to-pink-600',
    pulse: 'border-pink-500',
    shimmer: 'border-pink-500',
    neon: 'border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.8),inset_0_0_10px_rgba(236,72,153,0.2)]',
    dashed: 'border-pink-500/50',
  },
}

const thicknessMap = {
  thin: 'border',
  medium: 'border-2',
  thick: 'border-4',
}

export function AnimatedBorder({
  children,
  className,
  variant = 'glow',
  color = 'emerald',
  thickness = 'medium',
  onClick,
}: AnimatedBorderProps) {
  if (variant === 'gradient') {
    return (
      <div 
        onClick={onClick}
        className={cn('relative rounded-xl overflow-hidden transition-all duration-300 p-[2px] flex flex-col', onClick && 'cursor-pointer', className)}
      >
        <div className={cn(
          'absolute inset-0 bg-gradient-to-r rounded-xl',
          colorMap[color].gradient,
          'animate-gradient-shift'
        )} />
        <div className="relative bg-zinc-900/95 backdrop-blur-sm rounded-lg flex-1 min-h-0">
          {children}
        </div>
      </div>
    )
  }

  if (variant === 'shimmer') {
    const baseClasses = cn(
      'relative rounded-xl overflow-hidden transition-all duration-300',
      thicknessMap[thickness],
      colorMap[color].shimmer,
      onClick && 'cursor-pointer',
      className
    )
    return (
      <div onClick={onClick} className={baseClasses}>
        <div className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-r',
          'from-transparent via-white/20 to-transparent',
          'animate-shimmer opacity-0 hover:opacity-100 transition-opacity'
        )} />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  const baseClasses = cn(
    'relative rounded-xl overflow-hidden transition-all duration-300',
    thicknessMap[thickness],
    variant === 'glow' && colorMap[color].glow,
    variant === 'pulse' && `${colorMap[color].pulse} animate-pulse`,
    variant === 'neon' && colorMap[color].neon,
    variant === 'dashed' && `border-dashed ${colorMap[color].dashed}`,
    onClick && 'cursor-pointer',
    className
  )

  return (
    <div onClick={onClick} className={baseClasses}>
      {children}
    </div>
  )
}
