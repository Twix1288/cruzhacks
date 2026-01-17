'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@/utils/supabase/client';
import { Report } from '@/types';
import { Camera, X } from 'lucide-react';
import CameraView from '@/components/camera/CameraView';

export default function SmartMap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [reports, setReports] = useState<Report[]>([]);
    const [isScanOpen, setIsScanOpen] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from('reports').select('*');
            if (error) {
                console.error('Error fetching reports:', error);
            } else {
                setReports(data || []);
            }
        };

        fetchReports();
    }, []);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error('Mapbox token not found');
            return;
        }

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/outdoors-v12',
            center: [-122.06, 37.00], // Default to Santa Cruz area
            zoom: 13,
        });

        map.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                trackUserLocation: true,
                showUserHeading: true,
            })
        );
    }, []);

    useEffect(() => {
        if (!map.current || reports.length === 0) return;

        reports.forEach((report) => {
            // Create marker element
            const el = document.createElement('div');
            el.className = 'marker';

            // Determine styling
            if (report.hazard_rating === 'high' || report.hazard_rating === 'critical') {
                el.classList.add('marker-red');
            } else if (report.is_invasive) {
                el.classList.add('marker-yellow');
            } else {
                el.classList.add('marker-blue');
            }

            // Create Popup
            const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-sm">${report.species_name}</h3>
          <p class="text-xs text-gray-500 capitalize">${report.hazard_rating}</p>
          ${report.image_url ? `<img src="${report.image_url}" alt="${report.species_name}" class="mt-1 w-full h-24 object-cover rounded" />` : ''}
        </div>
      `;

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

            // Extract coordinates from PostGIS location
            let coordinates: [number, number] | null = null;

            if (report.location) {
                // Case 1: GeoJSON Object
                if (typeof report.location === 'object' && report.location.coordinates) {
                    coordinates = report.location.coordinates;
                }
                // Case 2: GeoJSON String
                else if (typeof report.location === 'string') {
                    try {
                        const parsed = JSON.parse(report.location);
                        if (parsed.coordinates) {
                            coordinates = parsed.coordinates;
                        }
                    } catch (e) {
                        console.error('Failed to parse location string:', e);
                    }
                }
            }

            if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
                new mapboxgl.Marker(el)
                    .setLngLat(coordinates as [number, number])
                    .setPopup(popup)
                    .addTo(map.current!);
            }
        });
    }, [reports]);

    return (
        <div className="w-full h-[calc(100vh-64px)] relative">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Floating Action Button */}
            <button
                onClick={() => setIsScanOpen(true)}
                className="absolute bottom-8 right-8 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
                aria-label="Open Camera"
            >
                <Camera className="h-6 w-6" />
            </button>

            {/* Camera Modal */}
            {isScanOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-lg rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-zinc-800">
                        <button
                            onClick={() => setIsScanOpen(false)}
                            className="absolute right-4 top-4 text-zinc-400 hover:text-white"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="mb-4 text-xl font-bold text-white">New Report</h2>
                        <CameraView onPhotoTaken={(file) => {
                            console.log('Photo taken:', file);
                            // Optionally close modal here, or let CameraView handle the flow
                            // setIsScanOpen(false); 
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
}
