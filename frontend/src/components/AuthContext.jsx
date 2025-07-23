import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Funkcja do inicjalizacji nowego użytkownika w Firestore
  const initializeUser = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Tworzymy nowy dokument dla użytkownika, jeśli go nie ma
      await setDoc(userRef, {
        usageCount: 0,
        isPro: false,
        createdAt: new Date(),
      });
    }
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    // Nasłuchujemy zmian stanu uwierzytelnienia
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        // Użytkownik jest już zalogowany (anonimowo lub normalnie)
        initializeUser(user);
      } else {
        // Użytkownik nie jest zalogowany, więc logujemy go anonimowo
        try {
          const anonymousUser = await signInAnonymously(auth);
          initializeUser(anonymousUser.user);
        } catch (error) {
          console.error("Błąd logowania anonimowego:", error);
          setLoading(false);
        }
      }
    });

    // Sprzątanie po efekcie
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};