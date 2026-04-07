import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timed out, forcing loading to false");
        setLoading(false);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      setUser(user);
      if (user) {
        try {
          // Sync with SQLite API
          const profileData = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: (user.email?.toLowerCase() === 'edueloi.ee@gmail.com') ? 'admin' : 'developer'
          };

          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });

          // Fetch all users to find current profile (or just use the one we sent)
          const response = await fetch('/api/users');
          if (response.ok) {
            const users = await response.json();
            if (Array.isArray(users)) {
              const currentProfile = users.find((u: any) => u.uid === user.uid);
              setProfile(currentProfile || profileData);
            } else {
              setProfile(profileData);
            }
          } else {
            setProfile(profileData);
          }
        } catch (error) {
          console.error("Profile sync error:", error);
          setProfile({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            role: (user.email?.toLowerCase() === 'edueloi.ee@gmail.com') ? 'admin' : 'developer'
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
