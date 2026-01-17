import React from 'react';
// Utility for conditional classes
// Ensure proper import path. Check if utils/cn.ts exists.
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: 'glass' | 'solid' | 'outline';
}

export function Card({ children, className, variant = 'glass', ...props }: CardProps) {
    const baseStyles = "rounded-2xl p-6 transition-all duration-300";

    const variants = {
        glass: "glass-panel text-white hover:bg-zinc-800/40",
        solid: "bg-zinc-900 border border-zinc-800 text-white hover:border-zinc-700",
        outline: "border border-zinc-700 bg-transparent text-white hover:bg-zinc-900/30"
    };

    return (
        <div
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </div>
    );
}
