"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name, profile_picture_url")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setProfilePictureUrl(profile.profile_picture_url);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!userId || !displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let newProfilePictureUrl = profilePictureUrl;

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(fileName);

        newProfilePictureUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName.trim(),
          profile_picture_url: newProfilePictureUrl,
          profile_completed: true,
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      router.push("/games");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
        <div className="animate-pulse text-red-800 text-lg tracking-wide">Loading...</div>
      </div>
    );
  }

  const currentImageUrl = previewUrl || profilePictureUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-6 flex items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-20 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-1/3 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-red-100 relative overflow-hidden">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-transparent rounded-bl-full" />

          <div className="relative">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-serif font-bold text-red-900 mb-2 tracking-tight">Your Profile</h1>
              <p className="text-red-600/70 text-sm tracking-wide">Complete your profile to get started</p>
            </div>

            {/* Profile picture section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                {/* Image container */}
                <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-red-200 shadow-xl transition-all duration-500 group-hover:border-red-300 group-hover:shadow-2xl group-hover:scale-105">
                  {currentImageUrl ? (
                    <img
                      src={currentImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-200 via-orange-200 to-amber-200 flex items-center justify-center">
                      <svg className="w-20 h-20 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium tracking-wide">Change Photo</span>
                  </div>
                </div>

                {/* Upload button (invisible, triggers file input) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-full h-full rounded-full cursor-pointer opacity-0"
                  type="button"
                  aria-label="Upload profile picture"
                />
              </div>

              {/* Upload instructions */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 text-sm text-red-700 hover:text-red-900 font-medium tracking-wide transition-colors duration-200 underline decoration-red-300 hover:decoration-red-500 underline-offset-4"
                type="button"
              >
                {currentImageUrl ? "Change photo" : "Upload photo"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Display name input */}
            <div className="mb-8">
              <label htmlFor="displayName" className="block text-sm font-semibold text-red-900 mb-3 tracking-wide">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-5 py-4 text-lg bg-white border-2 border-red-200 rounded-2xl focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all duration-200 text-red-900 placeholder-red-300"
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-red-700 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl hover:from-red-700 hover:via-red-800 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg relative overflow-hidden group"
            >
              <span className="relative z-10">
                {saving ? "Saving..." : "Save Profile"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </div>
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-6">
          <p className="text-red-700/50 text-sm tracking-widest">有朋友了</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
