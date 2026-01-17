import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types';

// Use edge runtime for better performance
export const runtime = 'edge';

// Zod schema for the AI response
const analyzeDataSchema = z.object({
    species_name: z.string().describe('The identified plant or species name. Use "Unidentifiable" or "Unknown species" if the image does not contain a recognizable plant/species.'),
    is_invasive: z.boolean().describe('Whether this species is invasive in California. Set to false if unidentifiable.'),
    hazard_rating: z.enum(['safe', 'low', 'medium', 'high', 'critical', 'unknown']).describe('Fire hazard rating: safe, low, medium, high, critical, or unknown (use unknown if the image does not contain a plant/species or is unidentifiable)'),
    description: z.string().describe('Brief description of the species and its characteristics. If unidentifiable, describe what is visible in the image.'),
    confidence: z.number().min(0).max(1).describe('Confidence score from 0.0 to 1.0. Use lower scores (0.0-0.3) for unidentifiable or unclear images.'),
});

export async function POST(request: Request) {
    try {
        // Parse request body
        const body: AnalyzeRequest = await request.json();
        const { imageUrl, lat, long } = body;

        // Validate input
        if (!imageUrl || typeof lat !== 'number' || typeof long !== 'number') {
            return NextResponse.json<AnalyzeResponse>(
                {
                    success: false,
                    error: 'Invalid request: imageUrl, lat, and long are required',
                },
                { status: 400 }
            );
        }

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json<AnalyzeResponse>(
                {
                    success: false,
                    error: 'Unauthorized: Please sign in to submit reports',
                },
                { status: 401 }
            );
        }

        // AI Analysis using Gemini 1.5 Flash
        const systemPrompt = `You are a Park Ranger with expertise in Santa Cruz, California ecosystems. Analyze the provided image to:
1. Identify the plant/species name (use "Unidentifiable" or "Unknown species" if the image does not contain a recognizable plant/species, contains only non-plant objects, or is too unclear to identify)
2. Determine if it's an invasive species in Santa Cruz, California (set to false if unidentifiable)
3. Rate the fire hazard level: safe, low, medium, high, critical, or unknown (use "unknown" if the image does not contain a plant/species, is unidentifiable, or contains non-plant objects)
4. Provide a brief description of what you see in the image
5. Provide a confidence score from 0.0 to 1.0 for your identification (use lower scores 0.0-0.3 for unidentifiable images)

IMPORTANT: If the image does not contain a plant/species, is unidentifiable, or contains non-plant objects (animals, buildings, vehicles, etc.), you MUST:
- Set species_name to "Unidentifiable" or "Unknown species"
- Set hazard_rating to "unknown"
- Set is_invasive to false
- Set confidence to a low value (0.0-0.3)
- Describe what is actually visible in the image

Be precise and consider the Santa Cruz County invasive weeds list. Only identify actual plant species - do not make up names for unidentifiable objects.`;

        const result = await generateObject({
            model: google('gemini-flash-latest'),
            schema: analyzeDataSchema,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Please analyze this image of a plant/species found at coordinates ${lat}, ${long} in California.`,
                        },
                        {
                            type: 'image',
                            image: imageUrl,
                        },
                    ],
                },
            ],
        });


        const analysisData = result.object;
        const confidence =
            typeof analysisData.confidence === 'number'
                ? Math.min(Math.max(analysisData.confidence, 0), 1)
                : 0.75; // fallback


        // Insert report into database
        // Use PostGIS format: POINT(longitude latitude) for geography column
        // Supabase accepts WKT format for geography columns
        const { error: insertError } = await supabase
            .from('reports')
            .insert({
                user_id: user.id,
                species_name: analysisData.species_name,
                description: analysisData.description,
                hazard_rating: analysisData.hazard_rating,
                is_invasive: analysisData.is_invasive,
                confidence_score: confidence,
                image_url: imageUrl,
                // PostGIS geography format: POINT(longitude latitude)
                // Supabase will accept this WKT format for geography columns
                location: `POINT(${long} ${lat})`,
            });

        if (insertError) {
            console.error('Database insert error:', insertError);
            // If WKT format doesn't work, try using an RPC function with PostGIS
            // This is a fallback - the above should work with Supabase
            return NextResponse.json<AnalyzeResponse>(
                {
                    success: false,
                    error: `Failed to save report: ${insertError.message}`,
                },
                { status: 500 }
            );
        }

        // Return success response
        return NextResponse.json<AnalyzeResponse>({
            success: true,
            data: {
                species_name: analysisData.species_name,
                is_invasive: analysisData.is_invasive,
                hazard_rating: analysisData.hazard_rating,
                description: analysisData.description,
                confidence: confidence,
            },
        });
    } catch (error) {
        console.error('Analyze API error:', error);
        return NextResponse.json<AnalyzeResponse>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error during analysis',
            },
            { status: 500 }
        );
    }
}
