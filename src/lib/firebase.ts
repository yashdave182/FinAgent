// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCS95PURecjhaLyyEc7RSYfR63YiN2kzec",
  authDomain: "finagent-fdc80.firebaseapp.com",
  projectId: "finagent-fdc80",
  storageBucket: "finagent-fdc80.firebasestorage.app",
  messagingSenderId: "613182907538",
  appId: "1:613182907538:web:5fb81003908baccecbf24b",
  measurementId: "G-CLXYJVNRSP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName: string,
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create user profile in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
      user_id: result.user.uid,
      email: email,
      full_name: fullName,
      created_at: new Date(),
      monthly_income: 0,
      existing_emi: 0,
      mock_credit_score: 650,
      segment: "New to Credit",
    });

    return result.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore functions
export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      ...data,
      updated_at: new Date(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const getUserLoans = async (userId: string) => {
  try {
    const loansQuery = query(
      collection(db, "loan_applications"),
      where("user_id", "==", userId),
    );
    const querySnapshot = await getDocs(loansQuery);
    const loans: any[] = [];
    querySnapshot.forEach((doc) => {
      loans.push({ id: doc.id, ...doc.data() });
    });
    return loans;
  } catch (error) {
    console.error("Error getting user loans:", error);
    throw error;
  }
};

export type { User };
