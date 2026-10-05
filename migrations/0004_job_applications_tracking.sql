-- JOBWORKERS Database Migration 0004: Job Application Tracking Enhancement
-- Updates job_applications table for Phase 7C tracking workflow

-- Add new columns for enhanced tracking if they don't exist
ALTER TABLE job_applications ADD COLUMN notes TEXT;
ALTER TABLE job_applications ADD COLUMN external_id TEXT;
ALTER TABLE job_applications ADD COLUMN applied_via TEXT DEFAULT 'internal';
ALTER TABLE job_applications ADD COLUMN status_history TEXT;

-- Update CHECK constraint implicitly by accepting new status values through application logic
-- Existing statuses: pending, reviewed, accepted, rejected
-- New statuses for Phase 7C: applied, interview, offer, rejected
-- Application layer will map: applied→pending, interview→reviewed, offer→accepted, rejected→rejected
