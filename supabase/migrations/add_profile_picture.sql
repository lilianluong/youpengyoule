-- Add profile_picture_url field to user_profiles.
ALTER TABLE user_profiles ADD COLUMN profile_picture_url TEXT;

-- Add profile_completed field to track if user has set up their profile.
ALTER TABLE user_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;

-- Create storage bucket for profile pictures (public).
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);
