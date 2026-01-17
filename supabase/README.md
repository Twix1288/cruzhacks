# Database Schema Files Guide

## Overview
This directory contains SQL files for setting up and updating the CanopyCheck database schema.

## Files and When to Use Them

### 1. `complete_schema.sql` ⚠️ DESTRUCTIVE
**Use for:** Fresh installations or complete database resets

**What it does:**
- Drops and recreates all tables (DELETES ALL DATA)
- Creates enums, tables, functions, triggers, and RLS policies
- Complete fresh start

**⚠️ WARNING:** This will DELETE all existing data!

---

### 2. `migration.sql` ✅ SAFE FOR PRODUCTION
**Use for:** Updating existing databases WITHOUT losing data

**What it does:**
- Adds missing tables (achievements) if they don't exist
- Adds missing columns (xp_points) if they don't exist
- Creates/updates functions and triggers
- Updates RLS policies
- **Preserves all existing data**

**✅ Safe to run on production databases**

---

### 3. `rls_update.sql` ✅ QUICK UPDATE
**Use for:** Just updating RLS policies for role-based filtering

**What it does:**
- Updates the ranger policy to see medium/high/critical invasive species
- Ensures `is_ranger()` function exists
- Minimal changes, safe to run

**✅ Safe to run anytime**

---

### 4. `xp_system.sql` ✅ FEATURE ADDITION
**Use for:** Adding XP system and achievements to existing database

**What it does:**
- Creates achievements table
- Creates XP awarding functions
- Creates triggers for automatic XP
- Adds RLS policies for achievements

**✅ Safe to run if XP system not yet implemented**

---

### 5. `schema.sql` 📝 REFERENCE
**Use for:** Reference only - shows basic schema structure

**What it does:**
- Basic table definitions
- Basic RLS policies
- Reference documentation

**Note:** This is a simplified version for reference

---

## Recommended Migration Path

### For Existing Database (Your Current Situation):

1. **First, run:** `migration.sql`
   - This adds all missing features safely
   - Preserves your existing data
   - Sets up XP system, achievements, and proper RLS

2. **Then verify:** Check that everything works

3. **If RLS needs updating:** Run `rls_update.sql` (though migration.sql already includes this)

### For Fresh Installation:

1. **Run:** `complete_schema.sql`
   - Creates everything from scratch
   - Clean slate

---

## Current Database State

Based on your schema dump, you have:
- ✅ `profiles` table (exists)
- ✅ `reports` table (exists)
- ✅ `achievements` table (exists)
- ✅ `spatial_ref_sys` table (PostGIS system table)

**What you need:**
- ✅ XP system functions and triggers
- ✅ Updated RLS policies
- ✅ User creation trigger

**Solution:** Run `migration.sql` - it will add all missing pieces safely!

---

## Quick Start

```sql
-- For existing database (recommended):
-- Run: migration.sql

-- For fresh start:
-- Run: complete_schema.sql
```

---

## Verification

After running migration, verify:

```sql
-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';
```
