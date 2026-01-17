'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

interface AnimatedBackgroundProps {
  className?: string
  variant?: 'aurora' | 'gradient' | 'particles' | 'waves'
  intensity?: number
}

export function AnimatedBackground({
  className,
  variant = 'aurora',
  intensity = 0.5,
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (variant !== 'particles' || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
    }> = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
      })
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(16, 185, 129, ${intensity * 0.3})`
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [variant, intensity])

  if (variant === 'particles') {
    return (
      <canvas
        ref={canvasRef}
        className={cn('absolute inset-0 pointer-events-none', className)}
      />
    )
  }

  if (variant === 'aurora') {
    return (
      <div
        className={cn(
          'absolute inset-0 overflow-hidden pointer-events-none',
          className
        )}
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    )
  }

  if (variant === 'gradient') {
    return (
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-zinc-900 to-blue-900/20 pointer-events-none',
          className
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
      </div>
    )
  }

  if (variant === 'waves') {
    return (
      <div
        className={cn(
          'absolute inset-0 overflow-hidden pointer-events-none',
          className
        )}
      >
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="rgba(16,185,129,0.1)"
            className="animate-wave"
          />
          <path
            d="M0,80 Q300,40 600,80 T1200,80 L1200,120 L0,120 Z"
            fill="rgba(59,130,246,0.1)"
            className="animate-wave"
            style={{ animationDelay: '1s' }}
          />
        </svg>
      </div>
    )
  }

  return null
}
