'use client';

import React, { useState } from 'react';
import CameraView from '@/components/camera/CameraView';
import BubbleMenu from '@/components/ui/BubbleMenu';
import { TypeText } from '@/components/ui/TypeText';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { AnimatedBorder } from '@/components/ui/AnimatedBorder';
import { GradientText } from '@/components/ui/GradientText';

export default function ScanPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoTaken = (file: File) => {
    setPhotoFile(file);
    // Here you could potentially do something with the file immediately after it's taken,
    // like display a larger preview or enable an upload button.
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 relative">
      {/* Enhanced Background */}
      <AnimatedBackground variant="particles" intensity={0.4} />
      
      <AnimatedBorder variant="glow" color="emerald" className="mb-8 z-10 relative inline-block">
        <h1 className="text-4xl md:text-5xl font-bold px-6 py-3">
          <GradientText variant="emerald">
            Scan for Invasive Species
          </GradientText>
        </h1>
      </AnimatedBorder>
      <div className="relative z-10">
        <CameraView onPhotoTaken={handlePhotoTaken} />
      </div>
      
      {/* Bubble Menu Navigation */}
      <BubbleMenu
        menuBg="#18181b"
        menuContentColor="#ffffff"
        items={[
          { label: 'Home', href: '/', rotation: -10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
          { label: 'Map', href: '/map', rotation: 10, hoverStyles: { bgColor: '#10b981', textColor: '#000' } },
          { label: 'Profile', href: '/profile', rotation: -10, hoverStyles: { bgColor: '#8b5cf6', textColor: '#fff' } },
        ]}
      />
    </div>
  );
}


