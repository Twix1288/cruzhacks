# Person 1: Ranger Dashboard & Permissions - Detailed Implementation Plan

## Overview
Create a dedicated ranger dashboard with threat management, report verification, and sector analysis capabilities. Rangers need specialized tools to manage and respond to environmental threats.

## Current State Analysis

### What Exists
- Basic role detection (`useUserRole` hook, `is_ranger()` function)
- RLS policies filter reports (rangers see medium/high/critical invasive species)
- Dashboard shows different text for rangers ("Sector Analysis")
- Map filtering works for rangers
- Profile page accessible to rangers

### What's Missing
- Dedicated `/ranger` dashboard route
- Report verification/resolution functionality
- Threat statistics and analytics
- Ranger-specific UI components
- Update permissions for rangers (can only read, not update reports)
- Heatmap/visualization tools
- Sector assignment system

## Implementation Tasks

### Phase 1: Database & Permissions Setup

#### Task 1.1: Add Ranger Update Permissions
**File:** `supabase/ranger_permissions.sql` (new)

```sql
-- Allow rangers to update report status (verify/resolve)
CREATE POLICY "Rangers can update reports" ON public.reports
FOR UPDATE
USING (is_ranger() = true)
WITH CHECK (is_ranger() = true);

-- Allow rangers to update status field specifically
-- This ensures rangers can only change status, not other fields
```

**Dependencies:** None
**Estimated Time:** 30 minutes

#### Task 1.2: Verify Report Status Enum
**File:** Check `supabase/complete_schema.sql`

Ensure `report_status` enum includes: 'pending', 'verified', 'resolved'
- Should already exist
- If missing, add to migration

**Dependencies:** None
**Estimated Time:** 15 minutes

---

### Phase 2: API Endpoints for Ranger Actions

#### Task 2.1: Create Report Verification Endpoint
**File:** `src/app/api/reports/verify/route.ts` (new)

**Functionality:**
- Accept report ID
- Verify user is ranger (server-side check)
- Update report status to 'verified'
- Return success/error

**Request:**
```typescript
POST /api/reports/verify
Body: { reportId: string }
```

**Response:**
```typescript
{ success: boolean, error?: string }
```

**Dependencies:** Task 1.1 (ranger permissions)
**Estimated Time:** 1 hour

#### Task 2.2: Create Report Resolution Endpoint
**File:** `src/app/api/reports/resolve/route.ts` (new)

**Functionality:**
- Accept report ID
- Verify user is ranger
- Update report status to 'resolved'
- Optional: Add resolution notes/comments

**Request:**
```typescript
POST /api/reports/resolve
Body: { reportId: string, notes?: string }
```

**Dependencies:** Task 1.1
**Estimated Time:** 1 hour

#### Task 2.3: Create Threat Statistics Endpoint
**File:** `src/app/api/ranger/stats/route.ts` (new)

**Functionality:**
- Aggregate threat statistics for rangers
- Count by hazard level
- Count by status (pending/verified/resolved)
- Recent threats (last 24h, 7d, 30d)
- Geographic distribution

**Response:**
```typescript
{
  totalThreats: number,
  byHazardLevel: { critical: number, high: number, medium: number },
  byStatus: { pending: number, verified: number, resolved: number },
  recentThreats: { last24h: number, last7d: number, last30d: number },
  topSpecies: Array<{ name: string, count: number }>
}
```

**Dependencies:** None (read-only)
**Estimated Time:** 1.5 hours

---

### Phase 3: Ranger Dashboard Page

#### Task 3.1: Create Ranger Dashboard Route
**File:** `src/app/ranger/page.tsx` (new)

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ Header: "Ranger Dashboard" + Logout     │
├─────────────────────────────────────────┤
│ Stats Cards (3-4 cards)                 │
│ - Total Threats                         │
│ - Critical Threats                      │
│ - Pending Verification                  │
│ - Resolved Today                        │
├─────────────────────────────────────────┤
│ Main Content Area                        │
│ ┌──────────────┬──────────────────────┐ │
│ │ Threat List  │ Threat Map Preview   │ │
│ │ (Scrollable) │ (Mini map)           │ │
│ └──────────────┴──────────────────────┘ │
└─────────────────────────────────────────┘
```

**Features:**
- Fetch threat statistics on load
- Display pending reports requiring action
- Quick action buttons (Verify/Resolve)
- Link to full map view
- Recent activity feed

**Dependencies:** Task 2.3 (stats endpoint)
**Estimated Time:** 3-4 hours

#### Task 3.2: Add Redirect Logic for Rangers
**File:** `src/app/page.tsx` (modify)

**Change:**
- Check if user is ranger
- If ranger, redirect to `/ranger` instead of showing scout dashboard
- Or show different content based on role

**Code location:** Around line 90-100 where `isRanger` is checked

**Dependencies:** None
**Estimated Time:** 30 minutes

---

### Phase 4: Ranger-Specific Components

#### Task 4.1: Threat List Component
**File:** `src/components/ranger/ThreatList.tsx` (new)

**Props:**
```typescript
interface ThreatListProps {
  threats: Report[];
  onVerify: (reportId: string) => void;
  onResolve: (reportId: string) => void;
  isLoading?: boolean;
}
```

**Features:**
- Display list of threats
- Show hazard level with color coding
- Show species name, location, timestamp
- Action buttons: Verify, Resolve, View Details
- Sortable/filterable (by hazard, date, status)
- Pagination or infinite scroll

**Dependencies:** Task 2.1, 2.2
**Estimated Time:** 2-3 hours

#### Task 4.2: Threat Statistics Cards
**File:** `src/components/ranger/ThreatStats.tsx` (new)

**Props:**
```typescript
interface ThreatStatsProps {
  stats: {
    totalThreats: number;
    byHazardLevel: Record<string, number>;
    byStatus: Record<string, number>;
    recentThreats: Record<string, number>;
  };
}
```

**Features:**
- Display key metrics in card format
- Color-coded by severity
- Trend indicators (up/down arrows)
- Clickable to filter threats

**Dependencies:** Task 2.3
**Estimated Time:** 1-2 hours

#### Task 4.3: Report Verification Component
**File:** `src/components/ranger/ReportVerification.tsx` (new)

**Props:**
```typescript
interface ReportVerificationProps {
  report: Report;
  onVerify: () => void;
  onResolve: (notes?: string) => void;
  onCancel: () => void;
}
```

**Features:**
- Modal/drawer for report details
- Display full report information
- Image preview
- Location on mini map
- Action buttons with confirmation
- Optional notes field for resolution

**Dependencies:** Task 2.1, 2.2
**Estimated Time:** 2 hours

#### Task 4.4: Threat Map Preview Component
**File:** `src/components/ranger/ThreatMapPreview.tsx` (new)

**Features:**
- Mini map showing threat locations
- Clustered markers for multiple threats
- Click to view full map
- Filter by hazard level
- Heatmap overlay option

**Dependencies:** Mapbox integration (already exists)
**Estimated Time:** 2-3 hours

---

### Phase 5: Navigation & Menu Updates

#### Task 5.1: Update BubbleMenu for Rangers
**File:** `src/components/ui/BubbleMenu.tsx` or individual pages

**Changes:**
- Add "Ranger Dashboard" menu item for rangers
- Show different menu items based on role
- Update menu on dashboard, map, profile pages

**Implementation:**
- Use `useUserRole` hook to detect role
- Conditionally render menu items
- Or pass role as prop to BubbleMenu

**Dependencies:** None
**Estimated Time:** 1 hour

#### Task 5.2: Update Dashboard Navigation
**Files:** 
- `src/app/page.tsx`
- `src/app/map/page.tsx`
- `src/app/profile/page.tsx`

**Changes:**
- Add "Ranger Dashboard" link for rangers
- Ensure consistent navigation across pages

**Dependencies:** Task 5.1
**Estimated Time:** 30 minutes

---

### Phase 6: Enhanced Features (Optional but Recommended)

#### Task 6.1: Sector Assignment System
**Files:**
- `supabase/add_sectors.sql` (new)
- `src/components/ranger/SectorFilter.tsx` (new)

**Database Changes:**
```sql
-- Add sector field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector text;

-- Add sector to reports (optional, for filtering)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS sector text;
```

**Features:**
- Assign rangers to geographic sectors
- Filter threats by sector
- Sector-based statistics

**Dependencies:** None
**Estimated Time:** 2-3 hours

#### Task 6.2: Threat Heatmap Visualization
**File:** `src/components/ranger/ThreatHeatmap.tsx` (new)

**Features:**
- Visual heatmap overlay on map
- Color intensity based on threat density
- Time-based filtering
- Export heatmap data

**Dependencies:** Mapbox, Task 3.1
**Estimated Time:** 3-4 hours

#### Task 6.3: Notification System
**Files:**
- `src/app/api/ranger/notifications/route.ts` (new)
- `src/components/ranger/NotificationCenter.tsx` (new)

**Features:**
- Real-time notifications for new critical threats
- Badge count on dashboard
- Notification history
- Email/push notifications (future)

**Dependencies:** Supabase Realtime
**Estimated Time:** 2-3 hours

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. **Day 1:** Task 1.1, 1.2 (Database permissions)
2. **Day 2:** Task 2.1, 2.2 (API endpoints)
3. **Day 3:** Task 2.3 (Stats endpoint)
4. **Day 4:** Task 3.1 (Dashboard page structure)
5. **Day 5:** Task 4.2 (Stats cards component)

### Week 2: Core Features
1. **Day 1:** Task 4.1 (Threat list component)
2. **Day 2:** Task 4.3 (Verification component)
3. **Day 3:** Task 3.2 (Redirect logic)
4. **Day 4:** Task 5.1, 5.2 (Navigation updates)
5. **Day 5:** Testing and bug fixes

### Week 3: Polish & Enhancements (Optional)
1. **Day 1-2:** Task 4.4 (Map preview)
2. **Day 3:** Task 6.1 (Sector system)
3. **Day 4-5:** Task 6.2 (Heatmap) or Task 6.3 (Notifications)

---

## Technical Specifications

### Database Schema Additions Needed

```sql
-- Already exists, verify:
-- report_status enum: 'pending', 'verified', 'resolved'
-- RLS policy for ranger SELECT (exists)
-- Need: RLS policy for ranger UPDATE (Task 1.1)
```

### API Route Structure

```
/api/reports/verify     → POST { reportId }
/api/reports/resolve    → POST { reportId, notes? }
/api/ranger/stats       → GET (returns aggregated stats)
/api/ranger/threats     → GET ?status=pending&hazard=critical (optional)
```

### Component Architecture

```
src/app/ranger/
  └── page.tsx (main dashboard)

src/components/ranger/
  ├── ThreatList.tsx
  ├── ThreatStats.tsx
  ├── ReportVerification.tsx
  ├── ThreatMapPreview.tsx (optional)
  └── NotificationCenter.tsx (optional)
```

---

## Testing Checklist

### Database
- [ ] Ranger can update report status
- [ ] Scout cannot update report status
- [ ] RLS policies prevent unauthorized access

### API Endpoints
- [ ] `/api/reports/verify` works for rangers
- [ ] `/api/reports/verify` rejects non-rangers
- [ ] `/api/reports/resolve` works correctly
- [ ] `/api/ranger/stats` returns accurate data

### UI Components
- [ ] Ranger dashboard loads correctly
- [ ] Threat list displays threats
- [ ] Verify/Resolve buttons work
- [ ] Stats cards show correct data
- [ ] Navigation includes ranger dashboard link

### Integration
- [ ] Rangers redirected to `/ranger` from main dashboard
- [ ] Map filtering still works for rangers
- [ ] Profile page accessible
- [ ] Menu appears on all pages

---

## Dependencies & Coordination

### Blocks Other Developers
- None (ranger features are additive)

### Blocked By
- None (can start immediately)

### Coordination Needed
- Person 3: Ensure menu includes "Ranger Dashboard" link
- Person 2: Verify 'unknown' reports don't break ranger views

---

## Success Criteria

1. Rangers have dedicated dashboard at `/ranger`
2. Rangers can verify and resolve reports
3. Threat statistics display accurately
4. Navigation is consistent across all pages
5. All ranger actions are properly secured with RLS

---

## Future Enhancements (Post-MVP)

1. **Advanced Analytics**
   - Trend analysis over time
   - Predictive threat modeling
   - Species distribution maps

2. **Communication Tools**
   - In-app messaging between rangers
   - Report assignment system
   - Team collaboration features

3. **Mobile Optimization**
   - Mobile-first ranger dashboard
   - Offline capability
   - Push notifications

4. **Reporting & Export**
   - Generate PDF reports
   - Export threat data (CSV/JSON)
   - Automated weekly summaries
