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
    const markers = useRef<mapboxgl.Marker[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [isScanOpen, setIsScanOpen] = useState(false);

    useEffect(() => {
        const fetchReports = async () => {
            const supabase = createClient();
            const { data, error } = await supabase.from('reports').select('*');
            if (error) {
                console.error('Error fetching reports:', error);
            } else {
                console.log('Reports fetched:', data);
                setReports(data || []);
            }
        };

        fetchReports();

        // Set up Realtime subscription
        const supabase = createClient();
        const channel = supabase
            .channel('reports_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reports',
                },
                (payload) => {
                    console.log('🔔 REALTIME EVENT RECEIVED:', payload);
                    const newReport = payload.new as Report;
                    setReports((prev) => {
                        console.log('Adding new report to state:', newReport);
                        return [...prev, newReport];
                    });
                }
            )
            .subscribe((status) => {
                console.log('🔌 REALTIME SUBSCRIPTION STATUS:', status);
            });

        return () => {
            console.log('Cleaning up Realtime subscription');
            supabase.removeChannel(channel);
        };
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
        if (!map.current) return;

        // Clear existing markers
        markers.current.forEach((marker) => marker.remove());
        markers.current = [];

        console.log(`Rendering ${reports.length} markers`);

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
                // Case 2: GeoJSON String or WKT
                else if (typeof report.location === 'string') {
                    // Check if it's WKT format (e.g., "POINT(-122.06 36.99)")
                    if (report.location.startsWith('POINT')) {
                        const matches = report.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
                        if (matches && matches.length === 3) {
                            coordinates = [parseFloat(matches[1]), parseFloat(matches[2])];
                        }
                    }
                    // Check if it's Postgres Point format (e.g., "(-122.06,36.99)")
                    else if (report.location.startsWith('(')) {
                        const matches = report.location.match(/\(([-\d.]+)[, ]+([-\d.]+)\)/);
                        if (matches && matches.length === 3) {
                            coordinates = [parseFloat(matches[1]), parseFloat(matches[2])];
                        }
                    }
                    // Check if it's WKB Hex format (PostGIS default)
                    // e.g., "0101000020E6100000..."
                    else if (/^[0-9A-Fa-f]+$/.test(report.location) && report.location.length >= 50) {
                        try {
                            const hex = report.location;
                            // We assume Little Endian (01) for standard PostGIS output on this architecture
                            // But we should check the first byte: 01 = Little Endian, 00 = Big Endian

                            // Simple parser for Point(4326) WKB
                            // Byte 0: Endianness
                            // Bytes 1-4: Type
                            // Bytes 5-8: SRID (if EWKB)
                            // Bytes 9-24: X, Y (doubles)

                            const buffer = new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16))).buffer;
                            const view = new DataView(buffer);
                            const littleEndian = view.getUint8(0) === 1;

                            // Skip Type (4 bytes) and SRID (4 bytes) -> Start at offset 9 for X
                            // Note: This assumes EWKB with SRID present (0101000020...)
                            // If standard WKB (0101000000...), coordinates start at offset 5.
                            // The type 0x20000001 indicates Point with SRID.

                            const type = view.getUint32(1, littleEndian);
                            let offset = 5;

                            if ((type & 0x20000000) !== 0) { // Has SRID flag
                                offset += 4; // Skip SRID
                            }

                            const x = view.getFloat64(offset, littleEndian);
                            const y = view.getFloat64(offset + 8, littleEndian);

                            coordinates = [x, y];
                        } catch (e) {
                            console.error('Failed to parse WKB hex:', e);
                        }
                    }
                    else {
                        // Try parsing as JSON string
                        try {
                            const parsed = JSON.parse(report.location);
                            if (parsed.coordinates) {
                                coordinates = parsed.coordinates;
                            }
                        } catch (e) {
                            console.error('Failed to parse location string:', report.location, e);
                        }
                    }
                }
            }

            if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
                const marker = new mapboxgl.Marker(el)
                    .setLngLat(coordinates as [number, number])
                    .setPopup(popup)
                    .addTo(map.current!);
                markers.current.push(marker);
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
                        <CameraView
                            onPhotoTaken={(file) => {
                                console.log('Photo taken:', file);
                            }}
                            onClose={() => {
                                setIsScanOpen(false);
                            }}
                        />
                    </div>
                </div>
            )}


        </div>
    );
}
