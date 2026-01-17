// ==========================================
// 1. ENUMS (Matches Database Types)
// ==========================================

// The 5 levels of fire/bio threat
export type HazardLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

// The status of a report in the system
export type ReportStatus = 'pending' | 'verified' | 'resolved';

// User Roles for Row Level Security
export type UserRole = 'scout' | 'ranger';

// ==========================================
// 2. DATABASE TABLES (The "Source of Truth")
// ==========================================

export interface UserProfile {
    id: string; // UUID from auth.users
    username: string | null;
    avatar_url: string | null;
    role: UserRole;
    xp_points: number;
    updated_at: string;
}

export interface Report {
    id: string; // UUID
    user_id: string; // The Scout who found it
    created_at: string; // ISO Timestamp

    // AI Analysis Data
    species_name: string;
    description: string | null;
    hazard_rating: HazardLevel;
    is_invasive: boolean;
    confidence_score: number | null; // 0.0 to 1.0
    image_url: string;

    // Geospatial Data
    // Note: PostGIS returns this as a GeoJSON object or string depending on your query.
    // We use 'any' here to prevent TypeScript errors, but in the Map component,
    // we treat it as { type: 'Point', coordinates: [long, lat] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    location: any;
    location_name: string | null; // e.g., "Near Porter Caves"

    status: ReportStatus;
}

// ==========================================
// 3. API RESPONSES (For Person 2 & 4)
// ==========================================

// What the Camera (Frontend) sends to the AI (Backend)
export interface AnalyzeRequest {
    imageUrl: string;
    lat: number;
    long: number;
}

// What the AI (Backend) sends back to the Camera
export interface AnalyzeResponse {
    success: boolean;
    data?: {
        species_name: string;
        is_invasive: boolean;
        hazard_rating: HazardLevel;
        description: string;
        confidence: number;
    };
    error?: string;
}