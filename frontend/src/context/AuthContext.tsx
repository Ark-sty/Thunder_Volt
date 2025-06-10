import React, { createContext, useContext, useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            // Handle specific Firebase error codes
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    throw new Error('Invalid email or password');
                case 'auth/too-many-requests':
                    throw new Error('Too many failed attempts. Please try again later.');
                default:
                    throw new Error('An error occurred. Please try again.');
            }
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw new Error('Failed to sign out');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider; 