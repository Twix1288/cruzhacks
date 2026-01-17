'use client'

import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { AnimatedBorder } from './AnimatedBorder'
import { GlowCard } from './GlowCard'

interface BentoGridProps {
  className?: string
  children: ReactNode
}

interface BentoCardProps {
  className?: string
  children: ReactNode
  span?: number
  rowSpan?: number
  borderVariant?: 'glow' | 'gradient' | 'pulse' | 'shimmer' | 'neon' | 'dashed' | 'none'
  borderColor?: 'emerald' | 'purple' | 'blue' | 'orange' | 'pink'
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-fr gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoCard({ 
  className, 
  children, 
  span = 1, 
  rowSpan = 1,
  borderVariant = 'glow',
  borderColor = 'emerald',
}: BentoCardProps) {
  const gridStyle = {
    gridColumn: `span ${span}`,
    gridRow: `span ${rowSpan}`,
  }

  if (borderVariant === 'none') {
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
          className
        )}
        style={gridStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 p-6 h-full flex flex-col">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div style={gridStyle}>
      <AnimatedBorder variant={borderVariant} color={borderColor} className={cn('h-full', className)}>
        <div className="group relative overflow-hidden rounded-lg bg-zinc-900/40 backdrop-blur-xl transition-all duration-300 h-full flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 p-6 h-full flex flex-col">
            {children}
          </div>
        </div>
      </AnimatedBorder>
    </div>
  )
}
