
'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, Check } from 'lucide-react';
// Ensure correct import path using the alias defined in tsconfig.json
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AnalyzeResponse } from '@/types';

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
    // Removed the finally block to prevent premature resetting of isLoading, as geolocation
    // is an asynchronous callback that would not be awaited by the try-catch-finally.
  };

  if (analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-500/10 p-4 rounded-full">
          <Check className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">{analysisResult.species_name}</h2>

        <div className="w-full space-y-3 bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Invasive Status</span>
            <span className={`font-semibold ${analysisResult.is_invasive ? 'text-red-400' : 'text-emerald-400'}`}>
              {analysisResult.is_invasive ? 'Invasive' : 'Native/Non-invasive'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Hazard Rating</span>
            <span className={`font-semibold capitalize ${analysisResult.hazard_rating === 'critical' || analysisResult.hazard_rating === 'high' ? 'text-red-500' :
                analysisResult.hazard_rating === 'medium' ? 'text-orange-400' : 'text-emerald-400'
              }`}>
              {analysisResult.hazard_rating}
            </span>
          </div>
          <div className="pt-2 border-t border-zinc-700">
            <p className="text-sm text-zinc-300 leading-relaxed">{analysisResult.description}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onClose) onClose();
            else router.push('/map');
          }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-900/20"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isLoading} // Disable input while loading
      />

      {!selectedImageUrl ? (
        <button
          onClick={triggerFileInput}
          className="flex items-center justify-center p-4 bg-blue-500 text-white rounded-full shadow-lg"
          disabled={isLoading} // Disable button while loading
        >
          <Camera size={24} className="mr-2" />
          Take Photo
        </button>
      ) : (
        <div className="relative w-full max-w-md">
          <img src={selectedImageUrl} alt="Selected" className="w-full h-auto rounded-lg shadow-md" />
          <button
            onClick={() => {
              setSelectedFile(null);
              setSelectedImageUrl(null);
              // When clearing the selected image, ensure loading state is also reset if it was active.
              setIsLoading(false);
            }}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
            disabled={isLoading} // Disable button while loading
          >
            X
          </button>
          <button
            onClick={triggerFileInput}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center p-3 bg-green-500 text-white rounded-full shadow-lg"
            disabled={isLoading} // Disable button while loading
          >
            <Camera size={20} className="mr-2" />
            Retake Photo
          </button>
          <button
            onClick={uploadPhoto}
            className="mt-4 flex items-center justify-center p-3 bg-purple-600 text-white rounded-full shadow-lg w-full"
            disabled={isLoading} // Disable button while loading
          >
            {isLoading ? 'Analyzing...' : <><Upload size={20} className="mr-2" /> Upload and Analyze</>}
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraView;


