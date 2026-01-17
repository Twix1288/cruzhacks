'use client';

import React, { useState } from 'react';
import CameraView from '@/src/components/camera/CameraView';

export default function ScanPage() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handlePhotoTaken = (file: File) => {
    setPhotoFile(file);
    // Here you could potentially do something with the file immediately after it's taken,
    // like display a larger preview or enable an upload button.
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Scan for Invasive Species</h1>
      <CameraView onPhotoTaken={handlePhotoTaken} />
    </div>
  );
}


