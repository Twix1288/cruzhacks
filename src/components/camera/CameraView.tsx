
'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, X, Scan, Zap } from 'lucide-react';
// Ensure correct import path using the alias defined in tsconfig.json
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AnalyzeResponse } from '@/types';
import { cn } from '@/utils/cn';

interface CameraViewProps {
  onPhotoTaken: (file: File) => void;
  onClose?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onPhotoTaken, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse['data'] | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Client-side validation for file type and size to prevent invalid uploads.
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Only JPEG, PNG, and WebP images are allowed.');
        event.target.value = ''; // Clear the input
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Image size must be less than 5MB.');
        event.target.value = ''; // Clear the input
        return;
      }

      setSelectedFile(file);
      // Create a URL for the selected file to display a preview.
      setSelectedImageUrl(URL.createObjectURL(file));
      onPhotoTaken(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadPhoto = async () => {
    if (!selectedFile) {
      toast.error('No photo selected.');
      return;
    }

    setIsLoading(true); // Start loading state to prevent double submission

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload photos.');
        router.push('/login');
        setIsLoading(false); // Reset loading state on auth error
        return;
      }

      // Extract file extension dynamically to avoid hardcoding and support various image types.
      const fileExtension = selectedFile.name.split('.').pop();
      // Use a more web-friendly timestamp format (replace colons) to avoid potential file path issues.
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filePath = `${user.id}/${timestamp}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('reports')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Geolocation is a callback-based API. The isLoading state should not be reset
      // until the geolocation and subsequent analysis are complete or have failed.
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Trigger analysis
          const analyzeResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl, lat: latitude, long: longitude }),
          });

          const result: AnalyzeResponse = await analyzeResponse.json();

          if (result.success && result.data) {
            toast.success(`Report Submitted! Identified: ${result.data.species_name}`);
            setAnalysisResult(result.data);
          } else {
            toast.error(`Analysis failed: ${result.error}`);
          }
          setIsLoading(false); // Reset loading state after analysis success or failure
        },
        (geoError) => {
          toast.error(`Failed to get location: ${geoError.message}`);
          setIsLoading(false); // Reset loading state if geolocation fails
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Add options for better geolocation
      );

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Upload failed: ${message}`);
      setIsLoading(false); // Reset loading state on upload error
    }
  };

  if (analysisResult) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-full shadow-xl relative z-10">
            <Check className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white text-center font-sans tracking-tight">
          {analysisResult.species_name}
        </h2>

        <div className="w-full space-y-4 bg-zinc-900/60 backdrop-blur-md p-6 rounded-2xl border border-zinc-700/50 shadow-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-700/50">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Status</span>
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold",
              analysisResult.is_invasive ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
            )}>
              {analysisResult.is_invasive ? 'INVASIVE' : 'NATIVE'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-zinc-700/50">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Hazard Level</span>
            <span className={cn("font-bold capitalize",
              analysisResult.hazard_rating === 'critical' ? 'text-red-600' :
              analysisResult.hazard_rating === 'high' ? 'text-red-500' :
              analysisResult.hazard_rating === 'medium' ? 'text-orange-500' :
              analysisResult.hazard_rating === 'low' ? 'text-yellow-500' :
              analysisResult.hazard_rating === 'safe' ? 'text-green-500' :
              analysisResult.hazard_rating === 'unknown' ? 'text-gray-500' :
              'text-emerald-400'
            )}>
              {analysisResult.hazard_rating}
            </span>
          </div>

          <div className="pt-2">
            <p className="text-sm text-zinc-300 leading-relaxed font-light">
              {analysisResult.description}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onClose) onClose();
            else router.push('/map');
          }}
          className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          Return to Map
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center relative overflow-hidden bg-black rounded-2xl">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {/* Camera Viewport / Preview */}
      <div className="relative w-full aspect-[4/5] bg-zinc-900 overflow-hidden group">

        {/* Grid Overlay */}
        <div className="absolute inset-0 z-10 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Scanner Brackets */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-emerald-500 z-20" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-500 z-20" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-500 z-20" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-emerald-500 z-20" />

        {/* Scanning Line Animation */}
        {!selectedImageUrl && !isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20 animate-[scan_3s_ease-in-out_infinite]" />
        )}

        {selectedImageUrl ? (
          <img src={selectedImageUrl} alt="Selected" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Scan className="w-16 h-16 opacity-50" />
          </div>
        )}

        {/* Overlay Actions */}
        {selectedImageUrl && (
          <button
            onClick={() => {
              setSelectedFile(null);
              setSelectedImageUrl(null);
              setIsLoading(false);
            }}
            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors z-30"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 w-full bg-zinc-950 p-6 flex flex-col items-center justify-center gap-6">

        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4" />
            <p className="text-emerald-400 font-medium tracking-widest text-sm uppercase">Analyzing Biological Signature...</p>
          </div>
        ) : (
          <>
            {!selectedImageUrl ? (
              <button
                onClick={triggerFileInput}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-white transition-all hover:scale-110 active:scale-95"
              >
                <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-emerald-500 transition-all opacity-0 group-hover:opacity-100 scale-125" />
                <Camera size={32} className="text-black group-hover:text-emerald-600 transition-colors" />
              </button>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={triggerFileInput}
                  className="flex-1 py-4 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={uploadPhoto}
                  className="flex-[2] py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
                >
                  <Zap size={18} className="fill-white" />
                  Analyze Report
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default CameraView;


