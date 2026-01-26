-- Migration to add Spotify Playlist URL to user preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS spotify_playlist_url TEXT;
