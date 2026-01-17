# XP System & Achievements Implementation

## Overview
This XP system automatically awards experience points when users create reports and unlocks achievements based on milestones. The system is designed to be extensible for future conversion to money markers.

## Database Setup

### SQL File Location
Run the SQL file located at: `supabase/xp_system.sql`

### What It Creates

1. **Achievements Table**: Tracks user achievements
   - `id`: Unique achievement record ID
   - `user_id`: References the user
   - `achievement_key`: Achievement identifier (e.g., 'first_sighting')
   - `unlocked_at`: Timestamp when unlocked

2. **XP Awarding Function**: `award_xp_and_check_achievements()`
   - Awards XP to user profiles
   - Checks and unlocks achievements based on milestones
   - Returns JSON with new XP total and unlocked achievements

3. **Report Trigger**: `trigger_award_xp_on_report`
   - Automatically fires when a report is created
   - Calculates XP based on report quality
   - Awards XP and checks achievements

## XP Calculation Formula

### Base XP
- **50 XP** per report

### Bonuses
- **Confidence Bonus**: Up to +25 XP (based on confidence_score × 25)
- **Invasive Species Bonus**: +50 XP (when is_invasive = true)
- **Hazard Rating Bonus**:
  - Critical: +25 XP
  - High: +15 XP
  - Medium: +10 XP
  - Low/Safe: +0 XP

### Example
A report with:
- High confidence (0.9) = +22 XP
- Invasive species = +50 XP
- Critical hazard = +25 XP
- Base = +50 XP
- **Total: 147 XP**

## Achievements

### Report-Based Achievements
- **First Sighting** 🌱: Log your 1st plant
- **Explorer** 🗺️: Log 10 plants
- **Veteran Scout** 🏅: Log 50 plants

### Special Achievements
- **Invasive Hunter** 🎯: Detect your first invasive species
- **Fire Watch** 🔥: Identify a critical fire hazard

### XP Milestone Achievements
- **Century Club** 💯: Reach 100 XP
- **Master Scout** ⭐: Reach 500 XP
- **Legend** 👑: Reach 1000 XP

## How It Works

### Automatic XP Awarding
When a user creates a report via the `/api/analyze` endpoint:
1. Report is inserted into the `reports` table
2. Database trigger fires automatically
3. XP is calculated based on report quality
4. XP is added to user's profile
5. Achievements are checked and unlocked if conditions are met

### Dynamic Dashboard Display
The dashboard (`src/app/page.tsx`) now:
- Fetches user's current XP from profile
- Calculates XP progress percentage dynamically
- Fetches unlocked achievements from database
- Displays achievements with visual indicators (unlocked vs locked)
- Shows real-time XP progress bar

## Future: Money Marker Conversion

The XP system is designed to be easily convertible to money markers:
- XP is stored as `integer` in `profiles.xp_points`
- Can be converted at a fixed rate (e.g., 10 XP = $1)
- Achievements can unlock bonus multipliers
- All XP calculations happen server-side for security

## Testing

To test the system:
1. Create a report via the map interface
2. Check your XP increase in the dashboard
3. Verify achievements unlock at milestones
4. Check that XP progress bar updates dynamically

## Notes

- XP is awarded automatically via database trigger (no API changes needed)
- Achievements are checked server-side for security
- All XP calculations respect existing types and don't break current functionality
- The system is extensible for future features
