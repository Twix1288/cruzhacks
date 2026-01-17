export type HazardLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'pending' | 'verified' | 'resolved';
export type UserRole = 'scout' | 'ranger';
export interface Report {
   id: string;
   user_id: string;
   created_at: string;
   species_name: string;
   description: string | null;
   hazard_rating: HazardLevel;
   is_invasive: boolean;
   confidence_score: number | null;
   image_url: string;
   location: any; // PostGIS Point
   location_name: string | null;
   status: ReportStatus;
}
export interface AnalyzeRequest {
   imageUrl: string;
   lat: number;
   long: number;
}
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