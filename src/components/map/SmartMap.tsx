'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClient } from '@/utils/supabase/client';
import { Report, UserRole } from '@/types';
import { Camera, X } from 'lucide-react';
import CameraView from '@/components/camera/CameraView';

interface SmartMapProps {
    className?: string
    onReportsChange?: (reports: Report[]) => void
    userRole?: UserRole | null
    userId?: string | null
    onCameraOpenChange?: (isOpen: boolean) => void
}

export default function SmartMap({ className, onReportsChange, userRole: propUserRole, userId: propUserId, onCameraOpenChange }: SmartMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(propUserRole || null);
    const [userId, setUserId] = useState<string | null>(propUserId || null);

    // Notify parent when camera opens/closes
    useEffect(() => {
        if (onCameraOpenChange) {
            onCameraOpenChange(isScanOpen);
        }
    }, [isScanOpen, onCameraOpenChange]);

    useEffect(() => {
        // If props are provided, use them; otherwise fetch
        if (propUserRole !== undefined) {
            setUserRole(propUserRole)
        }
        if (propUserId !== undefined) {
            setUserId(propUserId)
        }
        
        if (propUserRole === undefined || propUserId === undefined) {
            const fetchUserRole = async () => {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    setUserId(user.id);
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile) {
                        setUserRole(profile.role as UserRole);
                    }
                }
            };

            fetchUserRole();
        }
    }, [propUserRole, propUserId]);

    useEffect(() => {
        const fetchReports = async () => {
            const supabase = createClient();
            
            // RLS policies will automatically filter based on user role:
            // - Scouts: Only see their own reports (enforced by RLS)
            // - Rangers: Only see medium/high/critical hazard invasive species (enforced by RLS)
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching reports:', error);
            } else {
                console.log(`Fetched ${data?.length || 0} reports for ${userRole || 'unknown'} role`);
                console.log('Reports fetched:', data);
                
                // Additional client-side filtering as backup (RLS should handle this, but we verify)
                let filteredReports = data || [];
                
                if (userRole === 'scout' && userId) {
                    // Scouts only see their own reports
                    filteredReports = filteredReports.filter(r => r.user_id === userId);
                } else if (userRole === 'ranger') {
                    // Rangers only see medium/high/critical hazard invasive species
                    filteredReports = filteredReports.filter(r => 
                        r.is_invasive === true && 
                        ['medium', 'high', 'critical'].includes(r.hazard_rating)
                    );
                }
                
                // Filter out 'unknown' reports for rangers (they only see identified threats)
                if (userRole === 'ranger') {
                    filteredReports = filteredReports.filter(r => r.hazard_rating !== 'unknown');
                }
                
                setReports(filteredReports);
                if (onReportsChange) {
                    onReportsChange(filteredReports);
                }
            }
        };

        // Only fetch reports if we have user info
        if (userRole !== null) {
            fetchReports();
        }

        // Set up Realtime subscription (only if we have user role)
        if (userRole === null) return;

        const supabaseRealtime = createClient();
        const channel = supabaseRealtime
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
                    
                    // Apply role-based filtering to new reports
                    let shouldAdd = false;
                    
                    if (userRole === 'scout' && userId) {
                        // Scouts only see their own reports
                        shouldAdd = newReport.user_id === userId;
                    } else if (userRole === 'ranger') {
                        // Rangers only see medium/high/critical hazard invasive species (not unknown)
                        shouldAdd = newReport.is_invasive === true && 
                                   ['medium', 'high', 'critical'].includes(newReport.hazard_rating) &&
                                   newReport.hazard_rating !== 'unknown';
                    }
                    
                    if (shouldAdd) {
                        setReports((prev) => {
                            console.log('Adding new report to state:', newReport);
                            return [newReport, ...prev]; // Add to beginning
                        });
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔌 REALTIME SUBSCRIPTION STATUS:', status);
            });

        return () => {
            console.log('Cleaning up Realtime subscription');
            supabaseRealtime.removeChannel(channel);
        };
    }, [userRole, userId]);

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

        // Handle map resize when container size changes
        const resizeObserver = new ResizeObserver(() => {
            if (map.current) {
                map.current.resize();
            }
        });

        if (mapContainer.current) {
            resizeObserver.observe(mapContainer.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
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

            // Determine styling based on hazard level (priority: hazard_rating > is_invasive)
            // All hazard levels get their own color for clear visual distinction
            switch (report.hazard_rating) {
                case 'critical':
                    el.classList.add('marker-critical');
                    break;
                case 'high':
                    el.classList.add('marker-high');
                    break;
                case 'medium':
                    el.classList.add('marker-medium');
                    break;
                case 'low':
                    el.classList.add('marker-low');
                    break;
                case 'safe':
                    el.classList.add('marker-safe');
                    break;
                case 'unknown':
                    el.classList.add('marker-unknown');
                    break;
                default:
                    // Fallback: use invasive status if hazard not set
                    el.classList.add(report.is_invasive ? 'marker-yellow' : 'marker-blue');
            }

            // Determine hazard level color for popup
            const getHazardColor = (rating: string) => {
                switch (rating) {
                    case 'critical': return 'text-red-600';
                    case 'high': return 'text-red-500';
                    case 'medium': return 'text-orange-500';
                    case 'low': return 'text-yellow-500';
                    case 'safe': return 'text-green-500';
                    case 'unknown': return 'text-gray-500';
                    default: return 'text-gray-400';
                }
            };

            // Create Popup with enhanced information
            const popupContent = `
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-sm mb-2">${report.species_name}</h3>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">Hazard Level:</span>
            <span class="text-xs font-semibold capitalize ${getHazardColor(report.hazard_rating)}">${report.hazard_rating}</span>
          </div>
          ${report.is_invasive ? `
          <div class="mb-2">
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">INVASIVE</span>
          </div>
          ` : ''}
          ${report.confidence_score !== null ? `
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">Confidence:</span>
            <span class="text-xs font-medium">${Math.round(report.confidence_score * 100)}%</span>
          </div>
          ` : ''}
          ${report.image_url ? `<img src="${report.image_url}" alt="${report.species_name}" class="mt-2 w-full h-24 object-cover rounded" />` : ''}
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
        <div className={className || "w-full h-full relative"} style={{ minHeight: 0 }}>
            <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" style={{ minHeight: '400px' }} />

            {/* Floating Action Button */}
            <button
                onClick={() => setIsScanOpen(true)}
                className="absolute bottom-8 right-8 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors"
                aria-label="Open Camera"
            >
                <Camera className="h-6 w-6" />
            </button>

            {/* Camera Modal - Expanded */}
            {isScanOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="relative w-full h-full max-w-4xl max-h-[90vh] rounded-2xl bg-zinc-900 p-6 shadow-2xl border border-zinc-800 flex flex-col">
                        <button
                            onClick={() => setIsScanOpen(false)}
                            className="absolute right-4 top-4 z-10 text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800"
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <h2 className="mb-4 text-xl font-bold text-white">New Report</h2>
                        <div className="flex-1 min-h-0 overflow-auto">
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
                </div>
            )}


        </div>
    );
}
