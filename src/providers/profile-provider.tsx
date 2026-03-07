"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./auth-provider";
import type { Profile } from "@/lib/types";

type ProfileContextType = {
  profiles: Profile[];
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  refreshProfiles: () => Promise<void>;
  loading: boolean;
};

const ProfileContext = createContext<ProfileContextType>({
  profiles: [],
  activeProfile: null,
  setActiveProfile: () => {},
  refreshProfiles: async () => {},
  loading: true,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setActiveProfileState(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const fetchedProfiles = (data as Profile[]) || [];
    setProfiles(fetchedProfiles);

    // Restore active profile from localStorage or use first one
    const savedId = localStorage.getItem("activeProfileId");
    const saved = fetchedProfiles.find((p) => p.id === savedId);
    const active = saved || fetchedProfiles.find((p) => p.is_active) || fetchedProfiles[0] || null;

    setActiveProfileState(active);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const setActiveProfile = (profile: Profile) => {
    setActiveProfileState(profile);
    localStorage.setItem("activeProfileId", profile.id);
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfile,
        refreshProfiles: fetchProfiles,
        loading,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
